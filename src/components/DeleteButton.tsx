"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  endpoint: string;
  itemLabel?: string;
  itemType?: string;
  onDeleted?: () => void;
}

export default function DeleteButton({
  endpoint,
  itemLabel,
  itemType = "Item",
  onDeleted,
}: DeleteButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
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
        alert(message);
        return;
      }

      setShowModal(false);
      onDeleted?.();
      router.refresh();
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-red-600 hover:underline"
      >
        Delete
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete {itemType}
            </h2>
            <p className="text-gray-500 text-center mb-2">
              Are you sure you want to delete
            </p>
            {itemLabel && (
              <p className="text-gray-900 font-medium text-center mb-6">
                "{itemLabel}"
              </p>
            )}
            <p className="text-red-500 text-sm text-center mb-6">
              This action cannot be undone.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={deleting}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}