"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X } from "lucide-react";

interface PopupAd {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkText: string;
}

/* --- Frequency capping ---
 * The homepage is a hub users return to between articles, so mounting alone is
 * a terrible reason to show a modal — reading four posts would mean four
 * interruptions, each one after the user already dismissed it.
 *
 * Two independent gates:
 *   sessionStorage  one popup per browser session, whatever happens.
 *   localStorage    per-ad memory of an explicit dismissal or a conversion,
 *                   keyed by ad id so a NEW campaign is never suppressed by
 *                   the user's response to an old one.
 * Both are wrapped in try/catch: Safari private mode throws on write, and an
 * ad is never worth breaking the homepage over.
 */
const SEEN_PREFIX = "popupAd:seen:";
const SESSION_KEY = "popupAd:shownThisSession";
const DISMISS_SUPPRESS_MS = 7 * 24 * 60 * 60 * 1000;
/** Fallback trigger for users who never scroll. */
const DWELL_TRIGGER_MS = 20_000;
/** Scroll trigger, as a fraction of viewport height. */
const SCROLL_TRIGGER_RATIO = 0.5;

type SeenRecord = { dismissedAt?: number; converted?: boolean };

function readSeen(id: string): SeenRecord {
  try {
    const raw = window.localStorage.getItem(SEEN_PREFIX + id);
    return raw ? (JSON.parse(raw) as SeenRecord) : {};
  } catch {
    return {};
  }
}

function writeSeen(id: string, patch: SeenRecord) {
  try {
    window.localStorage.setItem(
      SEEN_PREFIX + id,
      JSON.stringify({ ...readSeen(id), ...patch })
    );
  } catch {
    /* storage unavailable — degrade to the session gate only */
  }
}

function isSuppressed(id: string): boolean {
  const rec = readSeen(id);
  if (rec.converted) return true;
  if (rec.dismissedAt && Date.now() - rec.dismissedAt < DISMISS_SUPPRESS_MS) return true;
  return false;
}

function shownThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markShownThisSession() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export default function PopupAd() {
  const [ad, setAd] = useState<PopupAd | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portals need a real DOM node, which only exists client-side after mount.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let dwellTimer: ReturnType<typeof setTimeout> | undefined;
    let onScroll: (() => void) | undefined;

    const clearTriggers = () => {
      if (dwellTimer) clearTimeout(dwellTimer);
      if (onScroll) window.removeEventListener("scroll", onScroll);
      dwellTimer = undefined;
      onScroll = undefined;
    };

    const fetchAd = async () => {
      try {
        // Global cap first — cheapest check, and skips the request entirely.
        if (shownThisSession()) return;

        const res = await fetch("/api/popup-ads?active=true");
        if (!res.ok) return;
        const ads: PopupAd[] = await res.json();

        // Filter out suppressed ads BEFORE picking, so dismissing one campaign
        // doesn't cost the user a different one they've never been shown.
        const eligible = ads.filter((a) => a.imageUrl && !isSuppressed(a.id));
        if (eligible.length === 0 || cancelled) return;

        const chosen = eligible[Math.floor(Math.random() * eligible.length)];
        setAd(chosen);

        // Wait for a sign of engagement rather than firing on load: a modal
        // shown before the user has read a single headline is the variant
        // people resent most (and the one Google flags as an intrusive
        // interstitial on mobile).
        const reveal = () => {
          if (cancelled) return;
          clearTriggers();
          markShownThisSession();
          setVisible(true);
        };

        dwellTimer = setTimeout(reveal, DWELL_TRIGGER_MS);
        onScroll = () => {
          if (window.scrollY > window.innerHeight * SCROLL_TRIGGER_RATIO) reveal();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
      } catch (err) {
        console.error("Failed to fetch popup ad:", err);
      }
    };

    fetchAd();

    return () => {
      cancelled = true;
      clearTriggers();
    };
  }, []);

  const handleClose = () => {
    // An explicit dismissal is the strongest signal the user can give; record
    // it so the same ad stays gone for a week rather than 15 seconds.
    if (ad) writeSeen(ad.id, { dismissedAt: Date.now() });
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      setAd(null);
    }, 260);
  };

  // Clicking through is a conversion — there is no reason to ever show this
  // particular ad to this user again.
  const handleConvert = () => {
    if (ad) writeSeen(ad.id, { converted: true });
    handleClose();
  };

  // Modal hygiene this dialog was missing. It declares role="dialog"
  // aria-modal="true" but left the page behind it scrollable, and offered no
  // Escape key — so the only way out was hitting the small close button, and
  // the content kept moving underneath the overlay. Held in a ref because
  // handleClose is re-created every render; depending on it directly would
  // re-run this effect (and re-lock the body) on every render.
  const closeRef = useRef(handleClose);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Synced in an effect, not during render: writing to a ref while rendering is
  // unsafe under concurrent rendering (and react-hooks/refs flags it).
  useEffect(() => {
    closeRef.current = handleClose;
  });

  useEffect(() => {
    if (!mounted || !visible || !ad) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /* --- Focus management ---
     * The dialog had aria-modal and a scroll lock but never took focus, so it
     * opened "behind" the keyboard: focus stayed on the page underneath, Tab
     * walked through content the modal was covering, and a screen reader was
     * never moved into the dialog it had just been told was modal. aria-modal
     * is a promise to assistive tech, not a mechanism — the trap below is what
     * actually keeps it.
     *
     * getClientRects(), not offsetParent, for the visibility filter: the modal
     * is position:fixed, and offsetParent is null for fixed subtrees. */
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.getClientRects().length > 0);

    // The close button is first in the DOM, so this lands on "dismiss" —
    // the right default for something the user did not ask for.
    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = !!dialogRef.current?.contains(active);

      // Wrap at both ends, and pull focus back in if it escaped the dialog.
      if (e.shiftKey && (active === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      // Put the user back where they were, not at the top of the document.
      previouslyFocused?.focus?.();
    };
  }, [mounted, visible, ad]);

  if (!mounted || !visible || !ad) return null;

  // Rendered via portal directly under <body>, deliberately outside the
  // page-transition wrapper. That wrapper animates `filter`/`transform`,
  // which turns it into a containing block for `position: fixed`
  // descendants — without the portal, this modal would be positioned
  // relative to that animated div instead of the viewport, causing it to
  // drift off-center and scroll with the page.
  return createPortal(
    <>
      <div
        className={`popup-ad-backdrop ${closing ? "popup-fade-out" : "popup-fade-in"}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-ad-title"
        className={`popup-ad-modal ${closing ? "popup-pop-out" : "popup-pop-in"}`}
      >
        <h2 id="popup-ad-title" className="sr-only">
          {ad.title}
        </h2>

        <button
          onClick={handleClose}
          className="popup-ad-close"
          aria-label="Close advertisement"
        >
          <X size={18} />
        </button>

        {ad.linkUrl ? (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="popup-ad-image-wrapper"
            onClick={handleConvert}
          >
            {/* Entrance fade/rise lives on this wrapper */}
            <div className="popup-ad-image-mount">
              <Image
                src={ad.imageUrl!}
                alt={ad.title}
                fill
                className="popup-ad-image"
                sizes="(max-width: 768px) 100vw, 560px"
                priority
              />
            </div>
            <span className="popup-ad-cta-overlay">{ad.linkText}</span>
          </a>
        ) : (
          <div className="popup-ad-image-wrapper">
            <div className="popup-ad-image-mount">
              <Image
                src={ad.imageUrl!}
                alt={ad.title}
                fill
                className="popup-ad-image"
                sizes="(max-width: 768px) 100vw, 560px"
                priority
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .popup-ad-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          z-index: 998;
        }

        .popup-ad-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 999;
          background: var(--card);
          border: 4px solid var(--border-heavy);
          border-radius: 0;
          width: min(560px, calc(100vw - 32px));
          max-height: 90vh;
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .popup-ad-image-wrapper {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 4 / 5;
          background: var(--card);
          overflow: hidden;
          cursor: pointer;
        }

        .popup-ad-image-mount {
          position: absolute;
          inset: 0;
          animation: revealIn 0.4s ease-out forwards;
        }

        :global(.popup-ad-image) {
          object-fit: cover;
          object-position: center;
        }

        .popup-ad-cta-overlay {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 11px 26px;
          background: var(--accent-2);
          color: var(--on-accent-2);
          border: 2px solid var(--border-heavy);
          border-radius: 0;
          font-weight: 800;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          box-shadow: var(--shadow-sm);
          z-index: 5;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .popup-ad-image-wrapper:hover .popup-ad-cta-overlay {
          transform: translate(calc(-50% + 2px), 2px);
          box-shadow: 0 0 0 0 var(--shadow-color);
        }

        .popup-ad-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          background: var(--card);
          border: 2px solid var(--border-heavy);
          border-radius: 0;
          color: var(--foreground);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: background-color 100ms ease, color 100ms ease;
        }

        .popup-ad-close:hover {
          background: var(--accent-2);
          color: var(--on-accent-2);
        }

        /* Modern theme: soften the brutalist framing to match the rest of the
           site — borderless rounded modal, circular close button, pill CTA with
           no outline (a filled accent element reads cleaner borderless). These
           are scoped to [data-theme='modern'] via :global(), so the brutalist
           look (4px border, square corners) is left exactly as-is.

           The modal drops its border entirely rather than hairlining it:
           --border-heavy resolves to the soft --border in modern, which is a
           near-white #e5e7eb in light mode. With the image running edge to
           edge that reads as a white ring around the photo. The radius and
           soft shadow already separate the modal from the backdrop. */
        :global([data-theme='modern']) .popup-ad-modal {
          border: none;
          border-radius: var(--radius);
        }
        :global([data-theme='modern']) .popup-ad-close {
          border-width: 1px;
          border-radius: 999px;
        }
        :global([data-theme='modern']) .popup-ad-cta-overlay {
          border-color: transparent;
          border-radius: 999px;
        }

        .popup-fade-in { animation: fadeIn 0.2s ease forwards; }
        .popup-fade-out { animation: fadeOut 0.2s ease forwards; }

        /* Translate + opacity only — no scale, no overshoot. A spring-style
           bounce here is exactly the kind of soft/organic motion the system
           replaces with a plain, decisive tween. */
        .popup-pop-in {
          animation: popIn 0.25s ease-out forwards;
        }
        .popup-pop-out {
          animation: popOut 0.2s ease-in forwards;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -46%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }

        @keyframes popOut {
          from { opacity: 1; transform: translate(-50%, -50%); }
          to { opacity: 0; transform: translate(-50%, -46%); }
        }

        @keyframes revealIn {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
}