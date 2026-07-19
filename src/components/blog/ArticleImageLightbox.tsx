"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Lightbox from "@/components/ui/Lightbox";

/**
 * Makes every <img> inside the article body open in the shared neo-brutalist
 * <Lightbox /> (zoom / pan / download / copy). This component only wires up the
 * click handling; all the viewing UI lives in Lightbox.
 */
export default function ArticleImageLightbox({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);

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

  const close = useCallback(() => setActiveSrc(null), []);

  return (
    <>
      <div ref={containerRef}>{children}</div>
      <Lightbox src={activeSrc} onClose={close} />
    </>
  );
}
