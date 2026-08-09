"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createRoot, type Root } from "react-dom/client";
import ProsConsCard, { type ProsConsData } from "./ProsConsCard";

const MOUNT_SELECTOR = "[data-pros-cons-mount]";
const DATA_SCRIPT_SELECTOR = "script[data-pros-cons-json]";

const nodeRoots = new WeakMap<HTMLElement, Root>();

export default function ProsConsMount() {
  const pathname = usePathname();

  useEffect(() => {
    const mountAll = () => {
      document.querySelectorAll<HTMLElement>(MOUNT_SELECTOR).forEach((node) => {
        if (nodeRoots.has(node)) return;

        const script = node.querySelector<HTMLScriptElement>(DATA_SCRIPT_SELECTOR);
        if (!script?.textContent) return;

        let data: ProsConsData;
        try {
          data = JSON.parse(script.textContent);
        } catch {
          return;
        }
        if (!Array.isArray(data?.pros) || !Array.isArray(data?.cons)) return;

        node.innerHTML = "";
        const root = createRoot(node);
        nodeRoots.set(node, root);
        root.render(<ProsConsCard pros={data.pros} cons={data.cons} />);
      });
    };

    mountAll();

    // The article HTML is injected after hydration in places, so watch for
    // placeholders arriving late — same as KeyHighlightsMount.
    const observer = new MutationObserver(() => mountAll());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
