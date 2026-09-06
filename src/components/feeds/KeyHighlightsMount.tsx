"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createRoot, type Root } from "react-dom/client";
import KeyHighlightsCard from "./KeyHighlightsCard";

const MOUNT_SELECTOR = "[data-key-highlights-mount]";
const DATA_SCRIPT_SELECTOR = "script[data-key-highlights-json]";

const nodeRoots = new WeakMap<HTMLElement, Root>();

export default function KeyHighlightsMount() {
  const pathname = usePathname();

  useEffect(() => {
    const mountAll = () => {
      const nodes = document.querySelectorAll<HTMLElement>(MOUNT_SELECTOR);
      nodes.forEach((node) => {
        if (nodeRoots.has(node)) return;

        const script = node.querySelector<HTMLScriptElement>(DATA_SCRIPT_SELECTOR);
        if (!script?.textContent) return;

        let items: string[] = [];
        try {
          items = JSON.parse(script.textContent);
        } catch {
          return;
        }

        node.innerHTML = "";
        const root = createRoot(node);
        nodeRoots.set(node, root);
        root.render(<KeyHighlightsCard items={items} />);
      });
    };

    mountAll();

    // The article HTML is injected after hydration in places, so watch for
    // placeholders arriving late.
    const observer = new MutationObserver(() => mountAll());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}