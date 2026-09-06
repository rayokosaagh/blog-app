"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Link2,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface LightboxProps {
  /** The image to show. `null` closes the lightbox. */
  src: string | null;
  onClose: () => void;
  /** Optional navigation — when provided, prev/next arrows + counter appear. */
  onPrev?: () => void;
  onNext?: () => void;
  counter?: string;
  title?: string;
}

const icon = "h-[18px] w-[18px]";
// Base for the accent nav buttons — colour is applied by the caller so it
// isn't fighting a bg utility here (Tailwind picks the later-defined class,
// not the later one in the string).
const chip =
  "flex items-center justify-center rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press";

/**
 * Shared neo-brutalist image lightbox: heavy borders, hard shadows, sharp
 * corners. Zoom (buttons / wheel / +,-,0), drag-to-pan, download, copy-link,
 * and optional prev/next navigation. Used by ArticleImageLightbox (single
 * image) and ImageCarousel (gallery with navigation).
 */
export default function Lightbox({ src, onClose, onPrev, onNext, counter, title }: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  // Portal is client-only (document.body isn't available during SSR).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.5, 4)), []);
  const zoomOut = useCallback(
    () =>
      setScale((s) => {
        const next = Math.max(s - 0.5, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      }),
    []
  );
  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Reset zoom/pan on close and on navigation (rather than via a src-watching
  // effect), so a freshly-shown image always starts at 100%.
  const close = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCopied(false);
    onClose();
  }, [onClose]);
  const prev = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onPrev?.();
  }, [onPrev]);
  const next = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onNext?.();
  }, [onNext]);

  const handleDownload = useCallback(async () => {
    if (!src) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = src.split("/").pop()?.split("?")[0] || "image";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  }, [src]);

  const handleCopyLink = useCallback(async () => {
    if (!src) return;
    try {
      await navigator.clipboard.writeText(new URL(src, window.location.href).toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable — ignore.
    }
  }, [src]);

  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-" || e.key === "_") zoomOut();
      else if (e.key === "0") resetZoom();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, close, zoomIn, zoomOut, resetZoom, next, prev]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    },
    [zoomIn, zoomOut]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (scale <= 1) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      posStart.current = { ...position };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [scale, position]
  );
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPosition({
      x: posStart.current.x + (e.clientX - dragStart.current.x),
      y: posStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);
  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const hasNav = Boolean(onPrev || onNext);

  const modal = (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-md sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={title || "Image viewer"}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-[80vh] w-full max-w-5xl items-center justify-center overflow-hidden rounded-none border-2 border-border-heavy bg-card shadow-brutal-lg"
          >
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{ cursor: scale > 1 ? "grab" : "default" }}
            >
              <motion.img
                key={src}
                src={src}
                alt={title || ""}
                draggable={false}
                className="max-h-full max-w-full select-none object-contain"
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1, scale, x: position.x, y: position.y }}
                transition={{ type: "tween", duration: 0.12 }}
              />
            </div>

            <div className="absolute left-3 top-3 rounded-none border-2 border-border-heavy bg-foreground px-2 py-0.5 text-xs font-extrabold tabular-nums text-background">
              {Math.round(scale * 100)}%
            </div>

            {counter && (
              <div className="absolute right-3 top-3 rounded-none border-2 border-border-heavy bg-foreground px-2 py-0.5 text-xs font-extrabold tabular-nums text-background">
                {counter}
              </div>
            )}

            {hasNav && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous image"
                  className={`${chip} absolute left-3 top-1/2 h-11 w-11 -translate-y-1/2 bg-accent text-on-accent`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next image"
                  className={`${chip} absolute right-3 top-1/2 h-11 w-11 -translate-y-1/2 bg-accent text-on-accent`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-none border-2 border-border-heavy bg-card p-1.5 shadow-brutal"
          >
            <ToolbarButton onClick={zoomOut} label="Zoom out" disabled={scale <= 1}>
              <ZoomOut className={icon} />
            </ToolbarButton>
            <ToolbarButton onClick={resetZoom} label="Reset zoom" disabled={scale === 1}>
              <RotateCcw className={icon} />
            </ToolbarButton>
            <ToolbarButton onClick={zoomIn} label="Zoom in" disabled={scale >= 4}>
              <ZoomIn className={icon} />
            </ToolbarButton>

            <span className="mx-1 h-5 w-0.5 bg-border-heavy" aria-hidden="true" />

            <ToolbarButton onClick={handleCopyLink} label="Copy link">
              {copied ? <Check className={`${icon} text-accent`} /> : <Link2 className={icon} />}
            </ToolbarButton>
            <ToolbarButton onClick={handleDownload} label="Download">
              <Download className={icon} />
            </ToolbarButton>

            <span className="mx-1 h-5 w-0.5 bg-border-heavy" aria-hidden="true" />

            <ToolbarButton onClick={close} label="Close">
              <X className={icon} />
            </ToolbarButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(modal, document.body) : null;
}

function ToolbarButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-accent hover:text-on-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}
