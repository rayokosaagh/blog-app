// src/components/gadgets/compare/ProductSearchBox.tsx
"use client";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductLite } from "./types";

export interface ProductSearchBoxHandle {
  focus: () => void;
}

// Filters the already-fetched `options` list client-side (so thumbnails
// are free — no extra network round trip), shows a dropdown with images,
// and calls onPick(slug) when a result is clicked.
const ProductSearchBox = forwardRef<
  ProductSearchBoxHandle,
  {
    options: ProductLite[];
    onPick: (slug: string) => void;
    placeholder: string;
  }
>(function ProductSearchBox({ options, onPick, placeholder }, ref) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      setOpen(true);
      inputRef.current?.focus();
    },
  }));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter(
          (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
        )
      : options;
    return list.slice(0, 8);
  }, [query, options]);

  return (
    <div ref={wrapRef} className="relative z-30 mt-3">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full text-xs bg-background border border-border rounded-md p-1.5 outline-none focus:ring-2 focus:ring-accent/40"
      />
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-30 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-lg text-left"
          >
            {results.map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(p.slug);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-2 py-1.5 hover:bg-border/20 text-xs"
                >
                  {p.image ? (
                    <img loading="lazy" decoding="async"
                      src={p.image}
                      alt=""
                      className="h-7 w-7 object-contain rounded bg-white p-0.5 ring-1 ring-black/5 dark:ring-white/10 shrink-0"
                    />
                  ) : (
                    <span className="h-7 w-7 rounded bg-border/30 shrink-0" />
                  )}
                  <span className="truncate text-foreground">
                    {p.brand} {p.name}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
        {open && query && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-30 mt-1 w-full rounded-lg border border-border bg-card shadow-lg text-xs text-muted-foreground p-2"
          >
            No products match "{query}".
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ProductSearchBox;