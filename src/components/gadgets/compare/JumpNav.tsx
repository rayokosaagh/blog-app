// src/components/gadgets/compare/JumpNav.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowIcon, GroupIcon } from "./icons";
import { SpecGroupLike } from "./types";

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
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
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

  useEffect(() => {
    updateJumpNavScroll();
  }, [groups]);

  // Keep the highlighted tag in view as the active group changes —
  // whether the change came from a click (onJump) or from scrolling the
  // table (the scroll-spy effect in GadgetCompareClient). Scrolls only
  // the strip itself, not the page.
  useEffect(() => {
    const container = jumpNavRef.current;
    const link = activeLinkRef.current;
    if (!container || !link) return;
    const linkLeft = link.offsetLeft;
    const linkRight = linkLeft + link.offsetWidth;
    const viewLeft = container.scrollLeft;
    const viewRight = viewLeft + container.clientWidth;
    if (linkLeft < viewLeft || linkRight > viewRight) {
      container.scrollTo({
        left: linkLeft - container.clientWidth / 2 + link.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [activeGroupTitle]);

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
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={() => scrollJumpNav("left")}
            aria-label="Scroll spec tags left"
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors duration-100"
          >
            <ArrowIcon direction="left" className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <nav ref={jumpNavRef} onScroll={updateJumpNavScroll} className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide">
        {groups.map((g) => {
          const isActiveTag = activeGroupTitle === g.title;
          return (
            <a
              key={g.title}
              ref={isActiveTag ? activeLinkRef : undefined}
              href={`#${g.title.toLowerCase()}`}
              onClick={(e) => {
                e.preventDefault();
                onJump(g.title);
              }}
              className={`tag-pill brutal-press whitespace-nowrap ${
                isActiveTag
                  ? "bg-accent-2 text-on-accent-2"
                  : "bg-card text-muted-foreground hover:bg-accent-tint hover:text-foreground"
              }`}
            >
              <GroupIcon title={g.title} className="h-3.5 w-3.5 shrink-0" />
              {g.title}
            </a>
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
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={() => scrollJumpNav("right")}
            aria-label="Scroll spec tags right"
            className="shrink-0 h-7 w-7 flex items-center justify-center rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors duration-100"
          >
            <ArrowIcon direction="right" className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}