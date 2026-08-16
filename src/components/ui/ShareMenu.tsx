"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, Check, Link2, MoreHorizontal } from "lucide-react";
import {
  SHARE_CHANNELS,
  INSTAGRAM_HOVER_SURFACE,
  InstagramIcon,
  copyShareLink,
  openShareWindow,
  pageShareUrl,
  shareToInstagram,
  shareRestingClasses,
  SHARE_BUTTON_BASE,
  SHARE_FOCUS,
} from "@/components/ui/shareChannels";

/**
 * Share control: one themed trigger plus a popover of channels. Used where a
 * full inline row doesn't fit — currently the product hero's title bar.
 *
 * The panel is portalled to <body>, and has to be: globals.css styles
 * `[data-theme='modern'] .hero-titlebar :where(h1, button)` with a colour at
 * (0,2,1) specificity, which outranks any Tailwind utility — rendering the
 * panel inside the title bar would repaint every brand icon on hover.
 */
interface ShareMenuProps {
  /** Used as the post/tweet text. The URL comes from window.location. */
  title: string;
  /** Extra classes for the trigger button. */
  className?: string;
}

export default function ShareMenu({ title, className = "" }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (noteTimer.current) clearTimeout(noteTimer.current);
    },
    []
  );

  // No SSR guard needed below: the panel only exists once `open` is true, which
  // requires a click, so everything past that point is client-only.
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const flash = useCallback((msg: string) => {
    setNote(msg);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 2400);
  }, []);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
  }, []);

  // The panel is position:fixed, so it must follow the trigger on scroll/resize
  // rather than drift away from it.
  useEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, place]);

  // Same ghost treatment as the inline row and BookmarkButton, so all three
  // read as one family rather than three different button languages.
  const ghost = `${SHARE_BUTTON_BASE} ${SHARE_FOCUS} ${shareRestingClasses("surface")}`;
  const iconBtn = ghost;
  const rowBtn = `${ghost} w-full justify-start text-xs font-bold hover:border-accent hover:text-accent`;

  const panel =
    open && pos ? (
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Share this page"
        className="fixed z-[70] w-[252px] surface-border border-border-heavy dark:border-foreground/40 bg-card text-foreground shadow-brutal p-3"
        style={{ top: pos.top, right: pos.right }}
      >
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
          Share
        </p>

        <div className="flex flex-wrap gap-2">
          {SHARE_CHANNELS.map(({ name, Icon, hoverSurface, buildUrl }) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                openShareWindow(buildUrl, title);
                setOpen(false);
              }}
              aria-label={`Share on ${name}`}
              title={name}
              className={`${iconBtn} ${hoverSurface}`}
            >
              <Icon />
            </button>
          ))}

          <button
            type="button"
            onClick={async () => {
              const ok = await shareToInstagram();
              flash(ok ? "Link copied — paste it into your story or DM" : "Open Instagram and paste the link");
              setOpen(false);
            }}
            aria-label="Copy link for Instagram"
            title="Instagram — copies the link to paste"
            className={`${iconBtn} ${INSTAGRAM_HOVER_SURFACE}`}
          >
            <InstagramIcon />
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={async () =>
              flash((await copyShareLink()) ? "Link copied" : "Couldn't copy — select the address bar instead")
            }
            className={rowBtn}
          >
            {note === "Link copied" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            Copy link
          </button>

          {canNativeShare && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.share({ title, url: pageShareUrl() });
                  setOpen(false);
                } catch {
                  // Sheet dismissed — not an error.
                }
              }}
              className={rowBtn}
            >
              <MoreHorizontal className="h-4 w-4" />
              More apps…
            </button>
          )}
        </div>

        {note && (
          <p aria-live="polite" className="mt-2 text-[11px] leading-snug text-muted-foreground">
            {note}
          </p>
        )}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Share this page"
        className={`shrink-0 inline-flex items-center gap-1.5 surface-pill-w border-transparent p-2 transition-colors duration-100 hover:border-border-heavy hover:bg-accent-2 hover:text-on-accent-2 ${SHARE_FOCUS} ${className}`}
      >
        {note && !open ? <Check size={18} /> : <Share2 size={18} />}
      </button>
      {panel ? createPortal(panel, document.body) : null}
    </>
  );
}
