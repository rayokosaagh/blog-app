"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createRoot, type Root } from "react-dom/client";
import AlsoReadCard from "./AlsoReadCard";
import type { AlsoReadLink } from "./AlsoRead";

const MOUNT_SELECTOR = "[data-also-read-mount]";
const DATA_SCRIPT_SELECTOR = "script[data-also-read-json]";

const nodeRoots = new WeakMap<HTMLElement, Root>();

export default function AlsoReadMount() {
  const pathname = usePathname();

  useEffect(() => {
    const mountAll = () => {
      const nodes = document.querySelectorAll<HTMLElement>(MOUNT_SELECTOR);
      nodes.forEach((node) => {
        if (nodeRoots.has(node)) return;

        const script = node.querySelector<HTMLScriptElement>(DATA_SCRIPT_SELECTOR);
        if (!script?.textContent) return;

        let links: AlsoReadLink[] = [];
        try {
          links = JSON.parse(script.textContent);
        } catch {
          return;
        }

        node.innerHTML = "";
        const root = createRoot(node);
        nodeRoots.set(node, root);
        root.render(<AlsoReadCard links={links} />);
      });
    };

    mountAll();

    const observer = new MutationObserver(() => mountAll());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}