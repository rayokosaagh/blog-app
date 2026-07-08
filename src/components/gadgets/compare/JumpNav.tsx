// src/components/gadgets/compare/JumpNav.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowIcon, GroupIcon } from "./icons";
import { SpecGroupLike } from "./types";

// Lives inside the sticky header so it stays visible (and clickable) while
// scrolling through a long spec table. Tracks whether the horizontal tag
// strip has more content off to the left/right so the arrow buttons only
// show up when there's actually somewhere to scroll to.
export default function JumpNav({
  groups,
  activeGroupTitle,
  onJump,
}: {
  groups: SpecGroupLike[];
  activeGroupTitle: string | null;
  onJump: (title: string) => void;
}) {
  const jumpNavRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateJumpNavScroll = () => {
    const el = jumpNavRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  function scrollJumpNav(direction: "left" | "right") {
    const el = jumpNavRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  // Recalculate arrow-button visibility whenever the visible group list
  // changes (filtering, category switch, etc. all reflow the tag strip).
  useEffect(() => {
    updateJumpNavScroll();
  }, [groups]);

  if (groups.length === 0) return null;

  return (
    <div className="hidden sm:flex items-center gap-1 pt-3">
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scrollJumpNav("left")}
            aria-label="Scroll spec tags left"
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full bg-border/30 text-muted-foreground hover:bg-accent/10 hover:text-accent"
          >
            <ArrowIcon direction="left" className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <nav
        ref={jumpNavRef}
        onScroll={updateJumpNavScroll}
        className="flex gap-2 overflow-x-auto text-sm scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {groups.map((g) => {
          const isActiveTag = activeGroupTitle === g.title;
          return (
            <motion.a
              key={g.title}
              href={`#${g.title.toLowerCase()}`}
              onClick={(e) => {
                e.preventDefault();
                onJump(g.title);
              }}
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.96 }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1.5 ${
                isActiveTag
                  ? "bg-accent text-white shadow-[0_2px_10px_rgba(37,99,235,0.35)]"
                  : "bg-border/30 text-muted-foreground hover:bg-accent/10 hover:text-accent"
              }`}
            >
              <GroupIcon title={g.title} className="h-3.5 w-3.5 shrink-0" />
              {g.title}
            </motion.a>
          );
        })}
      </nav>

      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scrollJumpNav("right")}
            aria-label="Scroll spec tags right"
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full bg-border/30 text-muted-foreground hover:bg-accent/10 hover:text-accent"
          >
            <ArrowIcon direction="right" className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}