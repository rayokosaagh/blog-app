"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface TocItem {
  text: string;
  id: string;
  level: "h1" | "h2" | "h3" | "h4";
}

interface MobileNavProps {
  toc: TocItem[];
}

export default function MobileNav({ toc }: MobileNavProps) {
  const [progress, setProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Portals must only run client-side, after mount, since document.body
  // isn't available during SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Calculate Reading Progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      const scrollableDistance = documentHeight - windowHeight;
      const currentProgress = (scrollTop / scrollableDistance) * 100;

      setProgress(Math.min(100, Math.max(0, currentProgress)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track Active Section
  useEffect(() => {
    if (toc.length === 0) return;
    const headingEls = toc.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (headingEls.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        const isAtBottom = window.innerHeight + Math.round(window.scrollY) >= document.documentElement.scrollHeight - 50;
        if (visible.length > 0 && !isAtBottom) {
          setActiveId(visible[0].target.id);
        } else if (isAtBottom) {
          setActiveId(toc[toc.length - 1].id);
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );
    headingEls.forEach((el) => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, [toc]);

  // Lock scroll while the side panel is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (toc.length === 0) return null;

  const panel = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] 2xl:hidden bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sliding panel — transform lives on this untransformed-safe wrapper only */}
      <div
        className={`fixed top-0 right-0 z-[201] h-full w-full max-w-sm 2xl:hidden transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative h-full bg-white/95 dark:bg-[#0c233f]/95 backdrop-blur-3xl backdrop-saturate-150 border-l border-white/60 dark:border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.15)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.4)] flex flex-col">
          {/* specular sheen, matches ProfileSidebar language */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-white/5 to-transparent opacity-80 dark:from-white/10 dark:via-white/0" />

          <div className="relative flex items-center justify-between px-5 py-4 border-b border-white/40 dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              In this article
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close contents panel"
              className="p-2 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 hover:text-[#6f42c1] dark:hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative flex-1 overflow-y-auto px-3 py-3">
            <ul className="space-y-1">
              {toc.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => { setActiveId(item.id); setIsOpen(false); }}
                      className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold"
                          : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10"
                      }`}
                    >
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0a1322]/95 backdrop-blur-3xl backdrop-saturate-150 border-t border-white/40 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] 2xl:hidden">
        <div className="absolute top-0 left-0 h-[3px] bg-gray-100/60 dark:bg-white/10 w-full">
          <div className="h-full bg-blue-600 transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex flex-col">
            {/* The progress bar line above handles the visual cue, so we remove the text here */}
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-white/50 dark:bg-white/10 backdrop-blur-md hover:bg-white/70 dark:hover:bg-white/20 text-gray-800 dark:text-white px-4 py-2 rounded-full text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
            Contents
          </button>
        </div>
      </div>

      {mounted && createPortal(panel, document.body)}
    </>
  );
}