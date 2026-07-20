// src/components/dashboard/DashboardUI.tsx
"use client";

import { motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

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

/**
 * Back-compat wrapper — existing callers mount this conditionally with the old
 * props. It now delegates to the shared {@link ConfirmDialog} so every delete
 * prompt in the dashboard shares one implementation and look.
 */
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
    <ConfirmDialog
      open
      title={title}
      itemName={itemName}
      loading={deleting}
      onConfirm={onConfirm}
      onClose={onCancel}
    />
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