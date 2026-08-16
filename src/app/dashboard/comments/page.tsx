"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Search,
  ChevronDown,
  CheckCircle2,
  Flag,
  ExternalLink,
} from "lucide-react";
import ConfirmDialog from "@/components/dashboard/ConfirmDialog";

type Status = "PENDING" | "APPROVED" | "REJECTED";

interface CommentRow {
  id: string;
  content: string;
  createdAt: string;
  status: Status;
  author: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  };
  post: {
    id: string;
    title: string;
    slug: string;
  };
}

const STATUS_FILTERS: { value: "ALL" | Status; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_BADGE: Record<Status, string> = {
  PENDING: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  APPROVED: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  REJECTED: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function CommentsModerationPage() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("PENDING");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<CommentRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch("/api/comments/moderation");
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || "Failed to load comments");
        return;
      }
      setComments(data.comments ?? []);
      setFetchError("");
    } catch {
      setFetchError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        c.content.toLowerCase().includes(term) ||
        c.author.name?.toLowerCase().includes(term) ||
        c.post.title.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [comments, searchTerm, statusFilter]);

  const pendingCount = comments.filter((c) => c.status === "PENDING").length;

  function flashToast(message: string) {
    setToast(message);
    setTimeout(() => setToast((t) => (t === message ? "" : t)), 1800);
  }

  async function setStatus(comment: CommentRow, status: Status) {
    setPendingActionId(comment.id);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        flashToast(data.error || "Failed to update comment");
        return;
      }
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, status } : c)));
      flashToast(status === "APPROVED" ? "Comment approved" : "Comment rejected");
    } catch {
      flashToast("Failed to update comment");
    } finally {
      setPendingActionId(null);
    }
  }

  async function confirmDelete() {
    if (!commentToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${commentToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        flashToast(data.error || "Failed to delete comment");
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentToDelete.id));
      flashToast("Comment deleted");
    } catch {
      flashToast("Failed to delete comment");
    } finally {
      setDeleting(false);
      setCommentToDelete(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Comments
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {filteredComments.length} of {comments.length} comments
                {pendingCount > 0 && (
                  <>
                    {" · "}
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {pendingCount} pending review
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by content, author, or post..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative sm:w-56" ref={dropdownRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 flex justify-between items-center hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <span>{STATUS_FILTERS.find((f) => f.value === statusFilter)?.label}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showStatusDropdown && (
            <div className="absolute right-0 mt-2 w-full bg-white dark:bg-zinc-800 rounded-xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-700 py-1.5 z-50">
              {STATUS_FILTERS.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setShowStatusDropdown(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    statusFilter === option.value
                      ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm">
          {fetchError}
        </div>
      )}

      {toast && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Comment</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Post</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Date</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-sm text-zinc-400">
                    No comments found
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => {
                  const busy = pendingActionId === comment.id;
                  return (
                    <tr key={comment.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors align-top">
                      <td className="p-4 max-w-sm">
                        <div className="flex items-center gap-2 mb-1">
                          {comment.status === "PENDING" && (
                            <Flag className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                            {comment.author.name ?? "Unknown"}
                          </p>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </td>
                      <td className="p-4 text-sm">
                        <Link
                          href={`/blog/${comment.post.slug}`}
                          target="_blank"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-1"
                        >
                          <span className="line-clamp-1 max-w-[16ch]">{comment.post.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </Link>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${STATUS_BADGE[comment.status]}`}
                        >
                          {comment.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(comment.createdAt).toDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          {comment.status !== "APPROVED" && (
                            <button
                              onClick={() => setStatus(comment, "APPROVED")}
                              disabled={busy}
                              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {comment.status !== "REJECTED" && (
                            <button
                              onClick={() => setStatus(comment, "REJECTED")}
                              disabled={busy}
                              className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => setCommentToDelete(comment)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!commentToDelete}
        title="Delete comment?"
        message={
          commentToDelete ? (
            <>
              This permanently removes this comment and any replies to it. This action can&apos;t
              be undone.
            </>
          ) : undefined
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setCommentToDelete(null)}
      />
    </div>
  );
}
