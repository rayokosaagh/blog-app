"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

type Tone = "danger" | "warning";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body text. If `itemName` is given, a default "permanently remove X" line is shown. */
  message?: ReactNode;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const TONES: Record<Tone, { bar: string; iconWrap: string; icon: typeof Trash2; confirm: string }> = {
  danger: {
    bar: "bg-rose-500",
    iconWrap: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400",
    icon: Trash2,
    confirm: "bg-rose-500 hover:bg-rose-600",
  },
  warning: {
    bar: "bg-amber-500",
    iconWrap: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: AlertTriangle,
    confirm: "bg-amber-500 hover:bg-amber-600",
  },
};

/**
 * The single confirm/delete prompt for the whole dashboard — replaces the many
 * hand-rolled delete modals and window.confirm calls. Same visual language as
 * the rest of the admin (rounded-2xl, accent strip, split footer).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  itemName,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const t = TONES[tone];
  const Icon = t.icon;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !loading && onClose()}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 shadow-xl"
          >
            <div className={`h-1 ${t.bar}`} />
            <div className="p-6">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${t.iconWrap}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h2
                className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h2>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {message ?? (
                  <>
                    This will permanently remove{" "}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {itemName}
                    </span>
                    . This action can&apos;t be undone.
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-zinc-100 dark:border-zinc-800 flex">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2 ${t.confirm}`}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Working…" : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
