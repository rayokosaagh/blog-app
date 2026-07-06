"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { GripVertical, Trash2, Eye, EyeOff } from "lucide-react";

interface CategoryOption { slug: string; name: string }
interface ProductLite { id: string; name: string; brand: string; image?: string | null; categoryId: string; category: { slug: string; name: string } }
interface ComparisonItem {
  id: string;
  category: { name: string; slug: string };
  productA: { id: string; name: string; image?: string | null };
  productB: { id: string; name: string; image?: string | null };
  active: boolean;
  order: number;
}

// ─── Diagonal split product thumbnail ─────────────────────────
function DiagonalThumb({ item }: { item: ComparisonItem }) {
  return (
    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
      {item.productA.image ? (
        <img
          src={item.productA.image}
          alt={item.productA.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
      )}
      {item.productB.image ? (
        <img
          src={item.productB.image}
          alt={item.productB.name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-rose-100 dark:bg-rose-900/30"
          style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
        />
      )}
      {/* diagonal divider line */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, transparent calc(50% - 1px), rgba(255,255,255,0.6) 50%, transparent calc(50% + 1px))",
        }}
      />
    </div>
  );
}

// ─── iOS-style animated toggle switch ─────────────────────────
function ActiveToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
        active ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
        style={{ marginLeft: active ? "26px" : "4px" }}
      />
    </button>
  );
}

export default function ComparisonManager({
  categories,
  products,
  initialComparisons,
}: {
  categories: CategoryOption[];
  products: ProductLite[];
  initialComparisons: ComparisonItem[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState(categories[0]?.slug ?? "");
  const [productAId, setProductAId] = useState("");
  const [productBId, setProductBId] = useState("");
  const [comparisons, setComparisons] = useState<ComparisonItem[]>(
    [...initialComparisons].sort((a, b) => a.order - b.order)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [comparisonToDelete, setComparisonToDelete] = useState<ComparisonItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  // Keep a ref of the latest order so drag-end handlers always persist
  // the freshest array, not a stale closure.
  const comparisonsRef = useRef(comparisons);
  useEffect(() => {
    comparisonsRef.current = comparisons;
  }, [comparisons]);

  const categoryProducts = useMemo(
    () => products.filter((p) => p.category.slug === category),
    [products, category]
  );

  function handleCategoryChange(slug: string) {
    setCategory(slug);
    setProductAId("");
    setProductBId("");
  }

  async function handleSave() {
    setError("");
    if (!productAId || !productBId) {
      setError("Select both products");
      return;
    }
    if (productAId === productBId) {
      setError("Choose two different products");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/gadgets/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productAId, productBId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setComparisons((prev) => [...prev, data.comparison]);
      setProductAId("");
      setProductBId("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  // Persist new drag order to the server
  async function persistOrder(items: ComparisonItem[]) {
    try {
      const res = await fetch("/api/gadgets/comparisons/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: items.map((c) => c.id) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorModalMessage(data?.error ?? "Failed to save the new order");
      }
    } catch {
      setErrorModalMessage("Failed to save the new order. Please try again.");
    }
  }

  function handleReorder(newOrder: ComparisonItem[]) {
    setComparisons(newOrder);
  }

  function handleDragEnd() {
    persistOrder(comparisonsRef.current);
  }

  async function handleToggleActive(item: ComparisonItem) {
    // Optimistic update
    setComparisons((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, active: !c.active } : c))
    );

    try {
      const res = await fetch(`/api/gadgets/comparisons/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });

      if (!res.ok) {
        // revert on failure
        setComparisons((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, active: item.active } : c))
        );
        const data = await res.json().catch(() => null);
        setErrorModalMessage(data?.error ?? "Failed to update status");
      }
    } catch {
      setComparisons((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, active: item.active } : c))
      );
      setErrorModalMessage("Something went wrong. Please try again.");
    }
  }

  function openDeleteModal(item: ComparisonItem) {
    setComparisonToDelete(item);
  }

  async function confirmDelete() {
    if (!comparisonToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gadgets/comparisons/${comparisonToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorModalMessage(data?.error ?? "Failed to delete comparison");
        setComparisonToDelete(null);
        return;
      }

      setComparisons((prev) => prev.filter((c) => c.id !== comparisonToDelete.id));
      setComparisonToDelete(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1600);
    } catch {
      setErrorModalMessage("Something went wrong. Please try again.");
      setComparisonToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Add new comparison */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm dark:border dark:border-zinc-800 space-y-4">
        <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">Add Comparison</h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-zinc-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Product A</label>
            <select
              value={productAId}
              onChange={(e) => setProductAId(e.target.value)}
              className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
            >
              <option value="">Select...</option>
              {categoryProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.brand} {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Product B</label>
            <select
              value={productBId}
              onChange={(e) => setProductBId(e.target.value)}
              className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
            >
              <option value="">Select...</option>
              {categoryProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.brand} {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {categoryProducts.length < 2 && (
          <p className="text-sm text-amber-600">
            This category needs at least 2 published products before you can add a comparison.
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || categoryProducts.length < 2}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {saving ? "Saving..." : "Add to Latest Comparisons"}
        </button>
      </div>

      {/* Existing comparisons — drag to reorder */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm dark:border dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">Currently Featured</h2>
          {comparisons.length > 1 && (
            <span className="text-xs text-zinc-400">Drag to reorder — top shows first on homepage</span>
          )}
        </div>

        {comparisons.length === 0 ? (
          <p className="p-6 text-sm text-zinc-400">No comparisons added yet.</p>
        ) : (
          <Reorder.Group
            axis="y"
            values={comparisons}
            onReorder={handleReorder}
            className="p-3 space-y-2"
          >
            <AnimatePresence initial={false}>
              {comparisons.map((c) => (
                <Reorder.Item
                  key={c.id}
                  value={c}
                  onDragEnd={handleDragEnd}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-4 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="text-zinc-300 dark:text-zinc-600 flex-shrink-0" size={18} />

                  <DiagonalThumb item={c} />

                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {c.category.name}
                    </span>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
                      {c.productA.name} <span className="text-zinc-400 font-normal">vs</span> {c.productB.name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.active ? (
                      <Eye size={16} className="text-green-500" />
                    ) : (
                      <EyeOff size={16} className="text-zinc-400" />
                    )}
                    <ActiveToggle active={c.active} onToggle={() => handleToggleActive(c)} />
                  </div>

                  <button
                    onClick={() => openDeleteModal(c)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {comparisonToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            >
              <div className="p-10">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🗑️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 text-center">
                  Remove Comparison?
                </h2>
                <p className="text-gray-600 dark:text-zinc-400 text-center mt-3">
                  Remove{" "}
                  <strong>
                    {comparisonToDelete.productA.name} vs {comparisonToDelete.productB.name}
                  </strong>{" "}
                  from the homepage?
                </p>
              </div>
              <div className="border-t dark:border-zinc-800 flex">
                <button
                  onClick={() => setComparisonToDelete(null)}
                  disabled={deleting}
                  className="flex-1 py-5 text-gray-600 dark:text-zinc-300 font-medium hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors rounded-bl-3xl active:scale-95 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-5 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors rounded-br-3xl active:scale-95 disabled:opacity-60"
                >
                  {deleting ? "Removing..." : "Yes, Remove"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success screen */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-12 text-center max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <span className="text-4xl">✅</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 mb-2">Removed!</h2>
              <p className="text-gray-600 dark:text-zinc-400">
                The comparison has been taken off the homepage.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error modal */}
      <AnimatePresence>
        {errorModalMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            >
              <div className="p-10">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-50 text-center">
                  Something Went Wrong
                </h2>
                <p className="text-gray-600 dark:text-zinc-400 text-center mt-3">{errorModalMessage}</p>
              </div>
              <div className="border-t dark:border-zinc-800">
                <button
                  onClick={() => setErrorModalMessage("")}
                  className="w-full py-5 text-gray-900 dark:text-zinc-50 font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors rounded-b-3xl active:scale-95"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}