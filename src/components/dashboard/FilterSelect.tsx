"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Dropdown for dashboard filter bars, in the dashboard's own zinc/blue theme
 * (the look the gadgets, comments and users filters always had).
 *
 * A custom listbox rather than a styled <select>: the trigger of a native
 * select can be themed, but its option list is drawn by the OS and ignores
 * the dashboard entirely. Focus stays on the trigger while open (select-only
 * combobox pattern), so arrow keys, Home/End, Enter/Space and Escape work
 * without moving focus into the list.
 */
export default function FilterSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  align = "left",
  side = "bottom",
}: {
  value: string;
  onChange: (next: string) => void;
  options: FilterOption[];
  ariaLabel: string;
  className?: string;
  /** Which edge the panel lines up with — "right" for controls at the end of a row. */
  align?: "left" | "right";
  /** Open upward for controls near the bottom of the page, like a pager. */
  side?: "bottom" | "top";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Keep the keyboard-highlighted option visible in a long, scrolling list.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-opt-${i}`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(active) : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-zinc-50 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:bg-zinc-800/50 dark:text-zinc-200 ${
          open
            ? "border-blue-500"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: side === "top" ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 max-h-72 w-max min-w-full max-w-72 overflow-y-auto rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700 ${
              align === "right" ? "right-0" : "left-0"
            } ${side === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
          >
            {options.map((opt, i) => {
              const isSelected = i === selectedIndex;
              const isActive = i === active;
              return (
                <li
                  key={opt.value}
                  id={optionId(i)}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  // Keep focus on the trigger so the keyboard handler stays live.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`cursor-pointer truncate px-4 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                      : isActive
                      ? "bg-zinc-50 text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
