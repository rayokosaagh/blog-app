"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "./ConfirmDialog";

interface DeleteButtonProps {
  /** DELETE is sent here, e.g. `/api/posts/abc123`. */
  endpoint: string;
  /** Name shown in the confirm prompt (e.g. the post title). */
  itemLabel?: string;
  /** Noun used in the title, e.g. "Post". */
  itemType?: string;
  onDeleted?: () => void;
}

export default function DeleteButton({
  endpoint,
  itemLabel,
  itemType = "item",
  onDeleted,
}: DeleteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        let message = "Failed to delete";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {
          message = `${message} (${res.status} ${res.statusText})`;
        }
        setError(message);
        return;
      }
      setOpen(false);
      onDeleted?.();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors"
      >
        Delete
      </button>

      <ConfirmDialog
        open={open}
        title={`Delete ${itemType}`}
        message={
          error ? (
            <span className="text-rose-600 dark:text-rose-400">{error}</span>
          ) : itemLabel ? (
            <>
              This will permanently remove{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {itemLabel}
              </span>
              . This action can&apos;t be undone.
            </>
          ) : undefined
        }
        itemName={itemLabel}
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => {
          setOpen(false);
          setError("");
        }}
      />
    </>
  );
}
