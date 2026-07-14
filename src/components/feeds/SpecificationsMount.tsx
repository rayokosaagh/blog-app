"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createRoot, type Root } from "react-dom/client";
import SpecificationsCard from "./SpecificationsCard";

const MOUNT_SELECTOR = "[data-specifications-mount]";
const DATA_SCRIPT_SELECTOR = "script[data-specifications-json]";

const nodeRoots = new WeakMap<HTMLElement, Root>();

interface SpecificationsPayload {
  title: string;
  items: { label: string; value: string }[];
}

export default function SpecificationsMount() {
  const pathname = usePathname();

  useEffect(() => {
    const mountAll = () => {
      const nodes = document.querySelectorAll<HTMLElement>(MOUNT_SELECTOR);
      nodes.forEach((node) => {
        if (nodeRoots.has(node)) return;

        const script = node.querySelector<HTMLScriptElement>(DATA_SCRIPT_SELECTOR);
        if (!script?.textContent) return;

        let payload: SpecificationsPayload | null = null;
        try {
          payload = JSON.parse(script.textContent);
        } catch {
          return;
        }
        if (!payload || !Array.isArray(payload.items)) return;

        node.innerHTML = "";
        const root = createRoot(node);
        nodeRoots.set(node, root);
        root.render(
          <SpecificationsCard title={payload.title} items={payload.items} />
        );
      });
    };

    mountAll();
    const observer = new MutationObserver(() => mountAll());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}