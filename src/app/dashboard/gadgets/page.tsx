"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  ChevronDown,
  Plus,
  Layers,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  published: boolean;
  image?: string | null;
  category: { name: string; slug: string };
  tags?: { id: string; name: string; slug: string }[];
}

export default function GadgetsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [deletedName, setDeletedName] = useState<string | null>(null);

  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function loadProducts() {
    try {
      const res = await fetch("/api/gadgets/products");
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => map.set(p.category.slug, p.category.name));
    return Array.from(map.entries());
  }, [products]);

  const selectedCategoryLabel = useMemo(() => {
    if (selectedCategory === "all") return "All categories";
    return categories.find(([slug]) => slug === selectedCategory)?.[1] ?? "All categories";
  }, [selectedCategory, categories]);

  // Unique tags across all products, for the tag filter dropdown.
  const availableTags = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    for (const p of products) {
      for (const t of p.tags ?? []) map.set(t.slug, { name: t.name, slug: t.slug });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || p.category.slug === selectedCategory;
      const matchesTag = selectedTag === "all" || (p.tags ?? []).some((t) => t.slug === selectedTag);
      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [products, searchTerm, selectedCategory, selectedTag]);

  async function confirmDelete() {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gadgets/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        let message = "Failed to delete product";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {
          message = `${message} (${res.status} ${res.statusText})`;
        }
        setProductToDelete(null);
        setErrorMessage(message);
        return;
      }

      const name = productToDelete.name;
      setProductToDelete(null);
      await loadProducts();
      setDeletedName(name);
      setTimeout(() => setDeletedName(null), 2200);
    } catch {
      setProductToDelete(null);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Gadgets
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {filteredProducts.length} of {products.length} products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/dashboard/gadgets/comparisons"
              className="inline-flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Comparisons</span>
            </Link>
            <Link
              href="/dashboard/gadgets/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add product</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative sm:w-52" ref={dropdownRef}>
          <button
            onClick={() => setShowCategoryDropdown((s) => !s)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 flex justify-between items-center hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <span className="truncate">{selectedCategoryLabel}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 ml-2 transition-transform ${
                showCategoryDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showCategoryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-full max-h-72 overflow-y-auto bg-white dark:bg-zinc-800 rounded-xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-700 py-1.5 z-50"
              >
                <div
                  onClick={() => {
                    setSelectedCategory("all");
                    setShowCategoryDropdown(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    selectedCategory === "all"
                      ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  }`}
                >
                  All categories
                </div>
                {categories.map(([slug, name]) => (
                  <div
                    key={slug}
                    onClick={() => {
                      setSelectedCategory(slug);
                      setShowCategoryDropdown(false);
                    }}
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors truncate ${
                      selectedCategory === slug
                        ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10"
                        : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                    }`}
                  >
                    {name}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {availableTags.length > 0 && (
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all sm:w-52"
          >
            <option value="all">All tags</option>
            {availableTags.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading products…</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-16 text-center"
              >
                <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  No products found
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                  Try a different search term or category.
                </p>
              </motion.div>
            ) : (
              filteredProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="text-zinc-400" size={20} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {p.name}
                    </p>
                    <p
                      className="text-xs text-zinc-500 dark:text-zinc-500 mt-1"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {p.brand}
                    </p>
                  </div>

                  <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    {p.category.name}
                  </span>

                  <span
                    className={`hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${
                      p.published
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {p.published ? "Published" : "Draft"}
                  </span>

                  <div className="flex items-center gap-4 shrink-0">
                    <Link
                      href={`/dashboard/gadgets/${p.id}/edit`}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => setProductToDelete({ id: p.id, name: p.name })}
                      className="text-sm text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        )}
      </div>

      <AnimatePresence>
        {productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !deleting && setProductToDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 max-w-sm w-full overflow-hidden"
            >
              <div className="h-1 bg-rose-500" />
              <div className="p-6">
                <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                  <Trash2 className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h2
                  className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Delete product?
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  This will permanently remove{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {productToDelete.name}
                  </span>
                  . This action can't be undone.
                </p>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800 flex">
                <button
                  onClick={() => setProductToDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-3.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setErrorMessage(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 max-w-sm w-full overflow-hidden"
            >
              <div className="h-1 bg-amber-500" />
              <div className="p-6">
                <div className="w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2
                  className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Couldn't delete product
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">{errorMessage}</p>
              </div>
              <div className="border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setErrorMessage(null)}
                  className="w-full py-3.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletedName && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-900 rounded-xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 shadow-lg p-4 flex items-center gap-3 max-w-sm"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-zinc-700 dark:text-zinc-200">
              <span className="font-medium">{deletedName}</span> was deleted.
            </p>
            <button
              onClick={() => setDeletedName(null)}
              className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}