"use client";

import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import AlsoReadCard from "./AlsoReadCard";
import type { AlsoReadLink } from "./AlsoRead";

const MOUNT_SELECTOR = "[data-also-read-mount]";
const DATA_SCRIPT_SELECTOR = "script[data-also-read-json]";

/**
 * Boots <AlsoReadCard /> into every server-rendered "Also read" placeholder
 * on the page. Renders `null` itself — mount this once anywhere in the
 * article page (e.g. right next to the article content), it doesn't need
 * to be a direct parent of the placeholders.
 *
 * Placeholders come from dangerouslySetInnerHTML content, so React never
 * reconciles them — they're plain DOM nodes sitting there after hydration,
 * safe to take over with a separate root. A MutationObserver re-runs the
 * scan in case content streams in after this effect's first pass.
 */
export default function AlsoReadMount() {
  useEffect(() => {
    const roots: Root[] = [];

    const mountAll = () => {
      const nodes = document.querySelectorAll<HTMLElement>(MOUNT_SELECTOR);
      nodes.forEach((node) => {
        if (node.dataset.mounted === "true") return;

        const script = node.querySelector<HTMLScriptElement>(DATA_SCRIPT_SELECTOR);
        if (!script?.textContent) return;

        let links: AlsoReadLink[] = [];
        try {
          links = JSON.parse(script.textContent);
        } catch {
          return;
        }

        node.dataset.mounted = "true";

        // Remove the static fallback card (and the JSON <script>) before
        // handing the node to React — otherwise the fallback's own card
        // styling sits nested inside AlsoReadCard's identical styling.
        node.innerHTML = "";

        const root = createRoot(node);
        roots.push(root);
        root.render(<AlsoReadCard links={links} />);
      });
    };

    mountAll();

    const observer = new MutationObserver(() => mountAll());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      // Defer unmounts a tick so we never call root.unmount() while React
      // is mid-render/commit on an ancestor (avoids a dev-mode warning).
      roots.forEach((root) => {
        queueMicrotask(() => root.unmount());
      });
    };
  }, []);

  return null;
}