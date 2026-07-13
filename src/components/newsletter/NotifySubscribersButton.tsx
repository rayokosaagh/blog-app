"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface NotifySubscribersButtonProps {
  postId: string;
  postTitle?: string;
}

export default function NotifySubscribersButton({
  postId,
  postTitle,
}: NotifySubscribersButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  // document.body only exists on the client, so we wait until after mount
  // before portalling the modal there (avoids SSR/hydration errors)
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleNotify() {
    setSending(true);
    try {
      const res = await fetch("/api/newsletter/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setResult({ ok: false, message: data.error || "Failed to send." });
        return;
      }

      setResult({ ok: true, message: data.message || "Subscribers notified." });
    } catch {
      setResult({ ok: false, message: "Something went wrong." });
    } finally {
      setSending(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    // reset after the close animation/tick so the modal doesn't flash content while closing
    setTimeout(() => setResult(null), 200);
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-sm text-blue-600 hover:underline font-medium"
      >
        Notify
      </button>

      {mounted && showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-4">
            {result ? (
              <>
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    result.ok ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <span className="text-2xl">{result.ok ? "✅" : "⚠️"}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                  {result.ok ? "Subscribers Notified" : "Failed to Notify"}
                </h2>
                <p className="text-gray-500 text-center mb-6">{result.message}</p>
                <button
                  onClick={closeModal}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📬</span>
                </div>

                <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                  Notify Subscribers
                </h2>
                <p className="text-gray-500 text-center mb-2">
                  Send an email about this post to all confirmed subscribers
                </p>
                {postTitle && (
                  <p className="text-gray-900 font-medium text-center mb-6">
                    "{postTitle}"
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={closeModal}
                    disabled={sending}
                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNotify}
                    disabled={sending}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    {sending ? "Sending..." : "Yes, Notify"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}