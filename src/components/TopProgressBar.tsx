"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export default function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start the bar the moment someone clicks an internal link — well before
  // the route actually resolves, which is what makes it feel instant.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
      } catch {
        return;
      }

      setVisible(true);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Route resolved -> snap the bar to 100% then fade it out.
  useEffect(() => {
    if (!visible) return;
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setVisible(false), 180);
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2.5px] z-[100] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 origin-left"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } }}
        />
      )}
    </AnimatePresence>
  );
}