"use client";
// src/components/PopupAd.tsx

import { useEffect, useState } from "react";
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
    const fetchAd = async () => {
      try {
        const res = await fetch("/api/popup-ads?active=true");
        if (!res.ok) return;
        const ads: PopupAd[] = await res.json();

        const adsWithImages = ads.filter((a) => a.imageUrl);
        if (adsWithImages.length === 0) return;

        const randomAd = adsWithImages[Math.floor(Math.random() * adsWithImages.length)];
        setAd(randomAd);
        setTimeout(() => setVisible(true), 600);
      } catch (err) {
        console.error("Failed to fetch popup ad:", err);
      }
    };

    fetchAd();
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      setAd(null);
    }, 260);
  };

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
            onClick={handleClose}
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