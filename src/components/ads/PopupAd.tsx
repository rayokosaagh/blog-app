"use client";
// src/components/PopupAd.tsx

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

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
    }, 350);
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
          ✕
        </button>

        {ad.linkUrl ? (
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="popup-ad-image-wrapper"
            onClick={handleClose}
          >
            {/* Entrance zoom-in lives on this wrapper */}
            <div className="popup-ad-image-mount">
              {/* This inner div natively accepts styled-jsx and handles the hover zoom */}
              <div className="popup-ad-image-scale">
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
            <span className="popup-ad-cta-overlay">{ad.linkText}</span>
          </a>
        ) : (
          <div className="popup-ad-image-wrapper">
            <div className="popup-ad-image-mount">
              <div className="popup-ad-image-scale">
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
          </div>
        )}
      </div>

      <style jsx>{`
        .popup-ad-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(5px);
          z-index: 998;
        }

        .popup-ad-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 999;
          background: #111;
          border-radius: 20px;
          width: min(560px, calc(100vw - 32px));
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
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
          background: #111;
          overflow: hidden;
          cursor: pointer;
        }

        .popup-ad-image-mount {
          position: absolute;
          inset: 0;
          animation: zoomIn 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        /* NEW: Added this layer to handle the hover transition cleanly */
        .popup-ad-image-scale {
          position: absolute;
          inset: 0;
          transition: transform 0.4s ease;
        }

        .popup-ad-image-wrapper:hover .popup-ad-image-scale {
          transform: scale(1.08);
        }

        /* Used :global() to ensure styled-jsx pierces the Next.js component */
        :global(.popup-ad-image) {
          object-fit: cover;
          object-position: center;
        }

        .popup-ad-cta-overlay {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 13px 30px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          color: #111;
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.95rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          z-index: 5;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .popup-ad-image-wrapper:hover .popup-ad-cta-overlay {
          transform: translateX(-50%) scale(1.05);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }

        .popup-ad-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          z-index: 10;
        }

        .popup-fade-in { animation: fadeIn 0.4s ease forwards; }
        .popup-fade-out { animation: fadeOut 0.35s ease forwards; }

        .popup-pop-in {
          animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .popup-pop-out {
          animation: popOut 0.35s ease forwards;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }

        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.75); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        @keyframes popOut {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to { opacity: 0; transform: translate(-50%, -48%) scale(0.9); }
        }

        @keyframes zoomIn {
          from { transform: scale(1.15); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>,
    document.body
  );
}