"use client";

import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import KeyHighlightsCard from "./KeyHighlightsCard";

const MOUNT_SELECTOR = "[data-key-highlights-mount]";
const DATA_SCRIPT_SELECTOR = "script[data-key-highlights-json]";

/**
 * Boots <KeyHighlightsCard /> into every server-rendered "Key highlights"
 * placeholder on the page. Renders `null` itself — mount this once anywhere
 * in the article page, it doesn't need to be a direct parent of the
 * placeholders. See AlsoReadMount.tsx for the full rationale (same pattern).
 */
export default function KeyHighlightsMount() {
  useEffect(() => {
    const roots: Root[] = [];

    const mountAll = () => {
      const nodes = document.querySelectorAll<HTMLElement>(MOUNT_SELECTOR);
      nodes.forEach((node) => {
        if (node.dataset.mounted === "true") return;

        const script = node.querySelector<HTMLScriptElement>(DATA_SCRIPT_SELECTOR);
        if (!script?.textContent) return;

        let items: string[] = [];
        try {
          items = JSON.parse(script.textContent);
        } catch {
          return;
        }

        node.dataset.mounted = "true";
        node.innerHTML = "";

        const root = createRoot(node);
        roots.push(root);
        root.render(<KeyHighlightsCard items={items} />);
      });
    };

    mountAll();

    const observer = new MutationObserver(() => mountAll());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      roots.forEach((root) => {
        queueMicrotask(() => root.unmount());
      });
    };
  }, []);

  return null;
}