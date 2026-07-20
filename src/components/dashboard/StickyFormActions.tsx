"use client";

import { Loader2 } from "lucide-react";

interface StickyFormActionsProps {
  /** Shows a spinner + saving label and disables both buttons. */
  saving?: boolean;
  /** Extra disable condition (e.g. an in-progress upload) without the spinner. */
  disabled?: boolean;
  submitLabel: string;
  savingLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  /**
   * If the submit button lives outside its <form>, pass the form id so the
   * button still submits it. Omit when the bar is rendered inside the form.
   */
  formId?: string;
}

/**
 * The one sticky Save/Cancel control for every dashboard create/edit form.
 * Just the two buttons, pinned to the bottom-right of the viewport — no
 * full-width strip. The wrapper is click-through so only the buttons capture
 * clicks. Place it inside the <form> (default) so Save submits it, or pass
 * `formId` when it sits outside the form.
 */
export default function StickyFormActions({
  saving = false,
  disabled = false,
  submitLabel,
  savingLabel = "Saving…",
  cancelLabel = "Cancel",
  onCancel,
  formId,
}: StickyFormActionsProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-30 flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="pointer-events-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 backdrop-blur px-5 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 shadow-lg transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-60"
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={saving || disabled}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-600 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? savingLabel : submitLabel}
      </button>
    </div>
  );
}
