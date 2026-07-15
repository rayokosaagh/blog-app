// src/components/dashboard/DashboardUI.tsx
"use client";

import { motion } from "framer-motion";
import { Trash2, CheckCircle2, X } from "lucide-react";

export const inputClass =
  "w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-60";

export const labelClass = "block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5";

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-blue-500" : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function StatusPill({
  active,
  activeLabel = "Active",
  inactiveLabel = "Inactive",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md ${
        active ? "bg-emerald-500/90 text-white" : "bg-zinc-500/80 text-white"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function DeleteModal({
  title,
  itemName,
  deleting,
  onCancel,
  onConfirm,
}: {
  title: string;
  itemName: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={() => !deleting && onCancel()}
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
            {title}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            This will permanently remove{" "}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{itemName}</span>. This
            action can't be undone.
          </p>
        </div>
        <div className="border-t border-zinc-100 dark:border-zinc-800 flex">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-3.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-3.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-900 rounded-xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 shadow-lg p-4 flex items-center gap-3 max-w-sm"
    >
      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
      <p className="text-sm text-zinc-700 dark:text-zinc-200">{message}</p>
      <button
        onClick={onClose}
        className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}