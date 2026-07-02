"use client";

import { useState, useEffect, useRef } from "react";

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

  if (toc.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0a1322]/95 backdrop-blur-3xl backdrop-saturate-150 border-t border-white/40 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] 2xl:hidden">
        <div className="absolute top-0 left-0 h-[3px] bg-gray-100/60 dark:bg-white/10 w-full">
          <div className="h-full bg-blue-600 transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3"><div className="flex flex-col">
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

      {/* Slide-Up Overlay */}
      <div className={`fixed inset-0 z-[60] 2xl:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
        {/* Outer div owns the slide transform only — backdrop-blur must live
            on an untransformed element or it silently stops rendering and
            only the background tint shows through. */}
        <div className={`absolute bottom-0 left-0 right-0 max-h-[75vh] transition-transform duration-300 ${isOpen ? "translate-y-0" : "translate-y-full"}`}>
        <div className="bg-white/95 dark:bg-[#0c233f]/95 backdrop-blur-3xl backdrop-saturate-150 border-t border-white/40 dark:border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.4)] rounded-t-3xl max-h-[75vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/40 dark:border-white/10">
            <h3 className="font-bold text-gray-900 dark:text-white">In this article</h3>
            <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-white bg-white/50 dark:bg-white/10 backdrop-blur-md rounded-full">✕</button>
          </div>
          <div className="overflow-y-auto px-6 py-4 pb-12">
            <ul className="space-y-1">
              {toc.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a href={`#${item.id}`} onClick={() => { setActiveId(item.id); setIsOpen(false); }}
                      className={`block rounded-xl px-4 py-3 text-sm transition-colors ${isActive ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold" : "text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5"}`}>
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}