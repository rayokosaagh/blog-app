"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import AnimatedPostCard from "@/components/AnimatedPostCard";

interface BookmarkedPost {
  bookmarkId: string;
  id: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  createdAt: string;
  author: {
    name: string | null;
  };
}

export default function BookmarksClient() {
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; postId: string; title: string }>({
    open: false,
    postId: "",
    title: "",
  });
  const [removedModal, setRemovedModal] = useState<{ open: boolean; title: string }>({
    open: false,
    title: "",
  });

  useEffect(() => {
    async function fetchBookmarks() {
      try {
        const res = await fetch("/api/bookmarks");
        const data = await res.json();
        const mapped: BookmarkedPost[] = Array.isArray(data.bookmarks)
          ? data.bookmarks.map((b: any) => ({
              bookmarkId: b.id,
              id: b.post.id,
              title: b.post.title,
              slug: b.post.slug,
              featuredImage: b.post.featuredImage,
              createdAt: b.post.createdAt,
              author: { name: b.post.author?.name ?? null },
            }))
          : [];
        setBookmarks(mapped);
      } catch (error) {
        console.error("Failed to load bookmarks");
      } finally {
        setLoading(false);
      }
    }
    fetchBookmarks();
  }, []);

  // Auto-dismiss the success modal after a few seconds
  useEffect(() => {
    if (!removedModal.open) return;
    const timer = setTimeout(() => {
      setRemovedModal({ open: false, title: "" });
    }, 2500);
    return () => clearTimeout(timer);
  }, [removedModal.open]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bookmarks, searchTerm]);

  // Step 1: user clicks "Remove Bookmark" — open confirmation modal
  const requestRemove = (postId: string, postTitle: string) => {
    setConfirmModal({ open: true, postId, title: postTitle });
  };

  // Step 2: user confirms — actually call the API
  const confirmRemove = async () => {
    const { postId, title } = confirmModal;
    setConfirmModal({ open: false, postId: "", title: "" });
    setRemovingId(postId);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (data.bookmarked === false) {
        setBookmarks((prev) => prev.filter((p) => p.id !== postId));
        setRemovedModal({ open: true, title });
      }
    } catch (error) {
      console.error("Failed to remove bookmark");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading bookmarks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Bookmarks</h1>
          <p className="text-muted-foreground mt-1">
            {filteredBookmarks.length} of {bookmarks.length} saved posts
          </p>
        </div>
      </div>

      {/* Search */}
      {bookmarks.length > 0 && (
        <div className="flex-1 relative group">
          <input
            type="text"
            placeholder="Search bookmarks by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-border rounded-2xl px-5 py-3.5 bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-foreground placeholder-muted-foreground"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">🔍</div>
        </div>
      )}

      {/* Bookmarks List */}
      <div className="space-y-4">
        {filteredBookmarks.length === 0 ? (
          <AnimatedPostCard index={0}>
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              <p className="text-5xl mb-4">🔖</p>
              <p className="text-lg font-medium">
                {bookmarks.length === 0 ? "No bookmarks yet" : "No bookmarks match your search"}
              </p>
              {bookmarks.length === 0 && (
                <Link href="/blog" className="text-blue-600 hover:underline mt-2 inline-block">
                  Browse posts
                </Link>
              )}
            </div>
          </AnimatedPostCard>
        ) : (
          filteredBookmarks.map((post, index) => (
            <AnimatedPostCard key={post.bookmarkId} index={index}>
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex">
                {/* Featured Image */}
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-48 h-36 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-48 h-36 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center flex-shrink-0">
                    <span className="text-4xl">📝</span>
                  </div>
                )}

                {/* Post Info */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{post.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {post.author.name || "Unknown"}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.createdAt).toDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      >
                        View →
                      </Link>
                      <button
                        onClick={() => requestRemove(post.id, post.title)}
                        disabled={removingId === post.id}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium disabled:opacity-50 cursor-pointer"
                      >
                        {removingId === post.id ? "Removing..." : "Remove Bookmark"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedPostCard>
          ))
        )}
      </div>

      {/* Confirmation Modal — ask before removing */}
      <AnimatePresence>
        {confirmModal.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
              onClick={() => setConfirmModal({ open: false, postId: "", title: "" })}
            />

            <div className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative w-full max-w-sm pointer-events-auto"
              >
                <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#0c233f]/95 backdrop-blur-3xl backdrop-saturate-150 border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-white/5 to-transparent opacity-80 dark:from-white/10 dark:via-white/0" />

                  <button
                    onClick={() => setConfirmModal({ open: false, postId: "", title: "" })}
                    aria-label="Close"
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative flex flex-col items-center text-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-500/10">
                      <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Remove this bookmark?
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "{confirmModal.title}" will be removed from your bookmarks.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full mt-3">
                      <button
                        onClick={() => setConfirmModal({ open: false, postId: "", title: "" })}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-white/50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmRemove}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Success Modal — bookmark removed */}
      <AnimatePresence>
        {removedModal.open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
              onClick={() => setRemovedModal({ open: false, title: "" })}
            />

            <div className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative w-full max-w-sm pointer-events-auto"
              >
                <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#0c233f]/95 backdrop-blur-3xl backdrop-saturate-150 border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-white/5 to-transparent opacity-80 dark:from-white/10 dark:via-white/0" />

                  <button
                    onClick={() => setRemovedModal({ open: false, title: "" })}
                    aria-label="Close"
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-white/10 text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative flex flex-col items-center text-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/10">
                      <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Bookmark removed
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "{removedModal.title}" was successfully removed from your bookmarks.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}