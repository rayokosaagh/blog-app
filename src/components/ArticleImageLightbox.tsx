"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut, Download, Link2, Check, RotateCcw } from "lucide-react";

export default function ArticleImageLightbox({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const posStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const imgs = Array.from(container.querySelectorAll("img"));
    const cleanups: Array<() => void> = [];

    imgs.forEach((img) => {
      if (img.closest('a[rel*="sponsored"]')) return;

      img.classList.add("cursor-zoom-in");
      const onClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveSrc(img.getAttribute("src"));
      };
      img.addEventListener("click", onClick);
      cleanups.push(() => img.removeEventListener("click", onClick));
    });

    return () => cleanups.forEach((fn) => fn());
  }, [children]);

  const closeLightbox = useCallback(() => {
    setActiveSrc(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setCopied(false);
  }, []);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.5, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleDownload = useCallback(async () => {
    if (!activeSrc) return;
    try {
      const res = await fetch(activeSrc);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = activeSrc.split("/").pop()?.split("?")[0] || "image";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab if fetch fails (e.g. CORS).
      window.open(activeSrc, "_blank");
    }
  }, [activeSrc]);

  const handleCopyLink = useCallback(async () => {
    if (!activeSrc) return;
    const absoluteUrl = new URL(activeSrc, window.location.href).toString();
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API may be unavailable; silently ignore.
    }
  }, [activeSrc]);

  // Keyboard shortcuts + scroll lock
  useEffect(() => {
    if (!activeSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-" || e.key === "_") zoomOut();
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeSrc, closeLightbox, zoomIn, zoomOut, resetZoom]);

  // Wheel-to-zoom
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    },
    [zoomIn, zoomOut]
  );

  // Drag-to-pan when zoomed in
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
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({ x: posStart.current.x + dx, y: posStart.current.y + dy });
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const modal = (
    <AnimatePresence>
      {activeSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLightbox}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
        >
          {/* Image stage — fixed-size card frame */}
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[80vh] rounded-2xl bg-neutral-900/60 border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center"
          >
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              onWheel={onWheel}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={onPointerUp}
              style={{ cursor: scale > 1 ? (isDragging.current ? "grabbing" : "grab") : "default" }}
            >
              <motion.img
                src={activeSrc}
                alt=""
                draggable={false}
                className="max-w-full max-h-full object-contain select-none"
                animate={{
                  scale,
                  x: position.x,
                  y: position.y,
                }}
                transition={{ type: "tween", duration: 0.12 }}
              />
            </div>

            {/* Zoom percentage badge */}
            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-white/70 text-xs font-medium tabular-nums backdrop-blur-sm">
              {Math.round(scale * 100)}%
            </div>
          </motion.div>

          {/* Floating toolbar card */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-2xl bg-neutral-900/80 border border-white/10 shadow-xl backdrop-blur-md p-1.5"
          >
            <ToolbarButton onClick={zoomOut} label="Zoom out" disabled={scale <= 1}>
              <ZoomOut className="w-4.5 h-4.5" />
            </ToolbarButton>
            <ToolbarButton onClick={resetZoom} label="Reset zoom" disabled={scale === 1}>
              <RotateCcw className="w-4.5 h-4.5" />
            </ToolbarButton>
            <ToolbarButton onClick={zoomIn} label="Zoom in" disabled={scale >= 4}>
              <ZoomIn className="w-4.5 h-4.5" />
            </ToolbarButton>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <ToolbarButton onClick={handleCopyLink} label="Copy link">
              {copied ? <Check className="w-4.5 h-4.5 text-emerald-400" /> : <Link2 className="w-4.5 h-4.5" />}
            </ToolbarButton>
            <ToolbarButton onClick={handleDownload} label="Download">
              <Download className="w-4.5 h-4.5" />
            </ToolbarButton>

            <div className="w-px h-5 bg-white/10 mx-1" />

            <ToolbarButton onClick={closeLightbox} label="Close">
              <X className="w-4.5 h-4.5" />
            </ToolbarButton>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div ref={containerRef}>{children}</div>
      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}

function ToolbarButton({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="relative flex items-center justify-center w-9 h-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}