"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Right-aligned action buttons rendered in a bordered footer. */
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  /** Set false to prevent closing on backdrop click (e.g. while saving). */
  dismissable?: boolean;
  /** Accent strip color at the very top of the panel. */
  accent?: "blue" | "rose" | "none";
}

const ACCENT_BAR: Record<NonNullable<ModalProps["accent"]>, string> = {
  blue: "h-1 bg-blue-500",
  rose: "h-1 bg-rose-500",
  none: "",
};

/**
 * The one dashboard dialog. A translucent backdrop + centered card matching the
 * dashboard's rounded-2xl / ring-1 language, with Escape-to-close, scroll lock,
 * and an optional accent strip, title, and footer. Use ConfirmDialog for
 * delete/confirm prompts; use this directly for add/edit forms.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissable = true,
  accent = "none",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, dismissable]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => dismissable && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 shadow-xl`}
          >
            {accent !== "none" && <div className={ACCENT_BAR[accent]} />}

            {(title || description) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="min-w-0">
                  {title && (
                    <h2
                      className="text-base font-bold text-zinc-900 dark:text-zinc-50"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="shrink-0 -mr-1.5 -mt-1 rounded-lg p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="px-6 py-5">{children}</div>

            {footer && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
