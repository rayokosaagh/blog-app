"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import AnimatedPostCard from "@/components/blog/AnimatedPostCard";

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
          <h1 className="text-3xl font-extrabold text-foreground">Your Bookmarks</h1>
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
            className="w-full rounded-none border-2 border-border-heavy shadow-brutal-sm px-5 py-3.5 bg-card focus:outline-none focus:bg-accent-tint transition-colors duration-100 text-foreground placeholder-muted-foreground"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">🔍</div>
        </div>
      )}

      {/* Bookmarks List */}
      <div className="space-y-4">
        {filteredBookmarks.length === 0 ? (
          <AnimatedPostCard index={0}>
            <div className="bg-card border-2 border-border-heavy rounded-none shadow-brutal p-12 text-center text-muted-foreground">
              <p className="text-5xl mb-4">🔖</p>
              <p className="text-lg font-bold">
                {bookmarks.length === 0 ? "No bookmarks yet" : "No bookmarks match your search"}
              </p>
              {bookmarks.length === 0 && (
                <Link href="/blog" className="text-accent font-bold hover:underline mt-2 inline-block">
                  Browse posts
                </Link>
              )}
            </div>
          </AnimatedPostCard>
        ) : (
          filteredBookmarks.map((post, index) => (
            <AnimatedPostCard key={post.bookmarkId} index={index}>
              <div className="bg-card border-2 border-border-heavy rounded-none shadow-brutal overflow-hidden flex">
                {/* Featured Image */}
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-48 h-36 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-48 h-36 bg-accent-tint flex items-center justify-center flex-shrink-0">
                    <span className="text-4xl">📝</span>
                  </div>
                )}

                {/* Post Info */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-foreground">{post.title}</h2>
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
                        className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors duration-100"
                      >
                        View →
                      </Link>
                      <button
                        onClick={() => requestRemove(post.id, post.title)}
                        disabled={removingId === post.id}
                        className="text-sm text-danger hover:underline font-bold disabled:opacity-50 cursor-pointer"
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-[200] bg-foreground/50"
              onClick={() => setConfirmModal({ open: false, postId: "", title: "" })}
            />

            <div className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-sm pointer-events-auto"
              >
                <div className="relative bg-card border-2 border-border-heavy rounded-none shadow-brutal-lg p-6">
                  <button
                    onClick={() => setConfirmModal({ open: false, postId: "", title: "" })}
                    aria-label="Close"
                    className="absolute top-3 right-3 p-1.5 rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors duration-100"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative flex flex-col items-center text-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-none border-2 border-border-heavy bg-accent-2">
                      <AlertTriangle className="h-6 w-6 text-on-accent-2" />
                    </div>
                    <div>
                      <p className="font-extrabold text-foreground">
                        Remove this bookmark?
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "{confirmModal.title}" will be removed from your bookmarks.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full mt-3">
                      <button
                        onClick={() => setConfirmModal({ open: false, postId: "", title: "" })}
                        className="flex-1 px-4 py-2.5 rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press bg-card text-sm font-bold text-foreground cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmRemove}
                        className="flex-1 px-4 py-2.5 rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press bg-danger text-on-danger text-sm font-bold cursor-pointer"
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
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-[200] bg-foreground/50"
              onClick={() => setRemovedModal({ open: false, title: "" })}
            />

            <div className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-sm pointer-events-auto"
              >
                <div className="relative bg-card border-2 border-border-heavy rounded-none shadow-brutal-lg p-6">
                  <button
                    onClick={() => setRemovedModal({ open: false, title: "" })}
                    aria-label="Close"
                    className="absolute top-3 right-3 p-1.5 rounded-none border-2 border-transparent text-muted-foreground hover:text-on-accent-2 hover:bg-accent-2 hover:border-border-heavy transition-colors duration-100"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="relative flex flex-col items-center text-center gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-none border-2 border-border-heavy bg-card">
                      <CheckCircle2 className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <p className="font-extrabold text-foreground">
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