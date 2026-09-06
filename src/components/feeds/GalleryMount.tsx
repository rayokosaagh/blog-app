"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createRoot, type Root } from "react-dom/client";
import ImageCarousel from "@/components/ui/ImageCarousel";

const MOUNT_SELECTOR = "[data-gallery-mount]";
const DATA_SCRIPT_SELECTOR = "script[data-gallery-json]";

const nodeRoots = new WeakMap<HTMLElement, Root>();

// Scans for [gallery] placeholders emitted by parseGalleryBlock and boots a
// real <ImageCarousel /> into each — mirrors KeyHighlightsMount.
export default function GalleryMount() {
  const pathname = usePathname();

  useEffect(() => {
    const mountAll = () => {
      const nodes = document.querySelectorAll<HTMLElement>(MOUNT_SELECTOR);
      nodes.forEach((node) => {
        if (nodeRoots.has(node)) return;

        const script = node.querySelector<HTMLScriptElement>(DATA_SCRIPT_SELECTOR);
        if (!script?.textContent) return;

        let images: string[] = [];
        try {
          images = JSON.parse(script.textContent);
        } catch {
          return;
        }
        if (!Array.isArray(images) || images.length === 0) return;

        node.innerHTML = "";
        const root = createRoot(node);
        nodeRoots.set(node, root);
        root.render(<ImageCarousel images={images} />);
      });
    };

    mountAll();

    // The article HTML is injected after hydration in places, so watch for
    // placeholders arriving late — same as KeyHighlightsMount.
    const observer = new MutationObserver(() => mountAll());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
