"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Reorder, AnimatePresence, motion, useDragControls } from "framer-motion";
import {
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Layers,
  ListChecks,
} from "lucide-react";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";
import Modal from "@/components/dashboard/Modal";
import { SuccessToast } from "@/components/dashboard/DashboardUI";

interface CategoryOption { slug: string; name: string }
interface ProductLite { id: string; name: string; brand: string; image?: string | null; categoryId: string; category: { slug: string; name: string } }
interface ComparisonItem {
  id: string;
  category: { name: string; slug: string };
  productA: { id: string; name: string; image?: string | null };
  productB: { id: string; name: string; image?: string | null };
  active: boolean;
  order: number;
  /** Editor-written summary shown on /compare for this exact pair. */
  verdictA?: string | null;
  verdictB?: string | null;
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

/**
 * A single reorderable comparison row. Drag is started only from the grip
 * handle (dragListener disabled) so the toggle/delete buttons never trigger an
 * accidental drag, and reordering rides a spring for a smooth, weighty feel.
 * Note: the item uses `transition-colors` (NOT `transition-all`) — a CSS
 * transition on `transform` would fight framer-motion's drag/layout transforms
 * and is the main cause of the clunky feel.
 */
function ComparisonRow({
  item,
  onDragEnd,
  onToggle,
  onDelete,
  onSaveVerdicts,
}: {
  item: ComparisonItem;
  onDragEnd: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onSaveVerdicts: (verdictA: string, verdictB: string) => Promise<void>;
}) {
  const controls = useDragControls();
  const [editing, setEditing] = useState(false);
  const [verdictA, setVerdictA] = useState(item.verdictA ?? "");
  const [verdictB, setVerdictB] = useState(item.verdictB ?? "");
  const [saving, setSaving] = useState(false);

  const hasVerdict = Boolean(item.verdictA || item.verdictB);

  async function save() {
    setSaving(true);
    try {
      await onSaveVerdicts(verdictA, verdictB);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 550, damping: 42, mass: 0.7 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 14px 30px -10px rgba(0,0,0,0.3)", zIndex: 40 }}
      className="relative p-3 bg-zinc-50/60 dark:bg-zinc-800/40 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 hover:ring-zinc-300 dark:hover:ring-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          aria-label="Drag to reorder"
          className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 transition-colors"
        >
          <GripVertical size={18} />
        </button>

        <DiagonalThumb item={item} />

        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {item.category.name}
          </span>
          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-50 truncate">
            {item.productA.name} <span className="text-zinc-400 font-normal">vs</span>{" "}
            {item.productB.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          title={hasVerdict ? "Edit summary" : "Write a summary"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors flex-shrink-0 ${
            hasVerdict
              ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          }`}
        >
          <ListChecks size={15} />
          <span className="hidden sm:inline">{hasVerdict ? "Summary" : "Add summary"}</span>
        </button>

        <div className="flex items-center gap-2 flex-shrink-0">
          {item.active ? (
            <Eye size={16} className="text-green-500" />
          ) : (
            <EyeOff size={16} className="text-zinc-400" />
          )}
          <ActiveToggle active={item.active} onToggle={onToggle} />
        </div>

        <button
          onClick={onDelete}
          className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
          title="Remove"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Shown as the summary above the spec table on /compare, for this
            exact pair. Leave a box empty and that side falls back to a summary
            derived from the specs.
          </p>

          {[
            { label: item.productA.name, value: verdictA, set: setVerdictA },
            { label: item.productB.name, value: verdictB, set: setVerdictB },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Summary — {f.label}
              </label>
              <textarea
                rows={2}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder="Leads on battery life and charging speed, but gives up ground on the camera."
                className="w-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
              />
            </div>
          ))}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save summary"}
            </button>
            <button
              type="button"
              onClick={() => {
                setVerdictA(item.verdictA ?? "");
                setVerdictB(item.verdictB ?? "");
                setEditing(false);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Reorder.Item>
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

  /**
   * Not optimistic, unlike the active toggle: the server trims and nulls
   * blank input, so the row has to reflect what was actually stored or the
   * next open would show whitespace the DB doesn't have.
   */
  async function handleSaveVerdicts(
    item: ComparisonItem,
    verdictA: string,
    verdictB: string
  ) {
    try {
      const res = await fetch(`/api/gadgets/comparisons/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verdictA, verdictB }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorModalMessage(data?.error ?? "Failed to save the summary");
        return;
      }

      const { comparison } = await res.json();
      setComparisons((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, verdictA: comparison.verdictA, verdictB: comparison.verdictB }
            : c
        )
      );
    } catch {
      setErrorModalMessage("Failed to save the summary. Please try again.");
    }
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
    <div className="space-y-6">
      {/* Add new comparison */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2
              className="font-bold text-base text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Add comparison
            </h2>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Product A</label>
              <select
                value={productAId}
                onChange={(e) => setProductAId(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              >
                <option value="">Select...</option>
                {categoryProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.brand} {p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Product B</label>
              <select
                value={productBId}
                onChange={(e) => setProductBId(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              >
                <option value="">Select...</option>
                {categoryProducts.map((p) => (
                  <option key={p.id} value={p.id}>{p.brand} {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {categoryProducts.length < 2 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              This category needs at least 2 published products before you can add a comparison.
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || categoryProducts.length < 2}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            {saving ? "Saving..." : "Add to latest comparisons"}
          </button>
        </div>
      </div>

      {/* Existing comparisons — drag to reorder */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2
              className="font-bold text-base text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Currently featured
            </h2>
          </div>
          {comparisons.length > 1 && (
            <span className="text-xs text-zinc-400 hidden sm:inline">Drag to reorder — top shows first</span>
          )}
        </div>

        {comparisons.length === 0 ? (
          <p className="p-8 text-sm text-zinc-400 text-center">No comparisons added yet.</p>
        ) : (
          <Reorder.Group
            axis="y"
            values={comparisons}
            onReorder={handleReorder}
            className="p-3 flex flex-col gap-2"
          >
            <AnimatePresence initial={false}>
              {comparisons.map((c) => (
                <ComparisonRow
                  key={c.id}
                  item={c}
                  onDragEnd={handleDragEnd}
                  onToggle={() => handleToggleActive(c)}
                  onDelete={() => openDeleteModal(c)}
                  onSaveVerdicts={(verdictA, verdictB) =>
                    handleSaveVerdicts(c, verdictA, verdictB)
                  }
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>

      {/* Delete confirm modal */}
      <ConfirmDialog
        open={!!comparisonToDelete}
        title="Remove comparison?"
        message={
          comparisonToDelete ? (
            <>
              Remove{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">
                {comparisonToDelete.productA.name} vs {comparisonToDelete.productB.name}
              </strong>{" "}
              from the homepage?
            </>
          ) : undefined
        }
        confirmLabel="Yes, remove"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setComparisonToDelete(null)}
      />

      {/* Success toast */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessToast
            message="The comparison has been removed from the homepage."
            onClose={() => setShowSuccess(false)}
          />
        )}
      </AnimatePresence>

      {/* Error modal */}
      <Modal
        open={!!errorModalMessage}
        onClose={() => setErrorModalMessage("")}
        title="Something went wrong"
        accent="rose"
        size="sm"
        footer={
          <button
            type="button"
            onClick={() => setErrorModalMessage("")}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Got it
          </button>
        }
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{errorModalMessage}</p>
      </Modal>
    </div>
  );
}