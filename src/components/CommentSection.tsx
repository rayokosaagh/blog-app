"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import type { Session } from "next-auth";
import Link from "next/link";
import { Smile, Loader2, MessageCircle, Reply as ReplyIcon, Trash2 } from "lucide-react";

interface CommentAuthor {
  id: string;
  name: string | null;
  image: string | null;
  role: string;
}

interface CommentNode {
  id: string;
  content: string;
  createdAt: string;
  postId: string;
  parentId: string | null;
  author: CommentAuthor;
  replies: CommentNode[];
}

const EMOJIS = [
  "😀", "😂", "🥰", "👍", "👎", "🎉", "🔥", "💯",
  "🙌", "🤔", "😮", "😢", "🙏", "👏", "✨", "💡",
  "😅", "😍", "🥳", "😴", "❤️", "❓", "❗", "😎",
];

const spring = { type: "spring" as const, stiffness: 400, damping: 32 };
const softSpring = { type: "spring" as const, stiffness: 300, damping: 28 };

function formatRelativeTime(date: string) {
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function countAll(nodes: CommentNode[]): number {
  return nodes.reduce((sum, n) => sum + 1 + countAll(n.replies), 0);
}

function insertReply(nodes: CommentNode[], parentId: string, newNode: CommentNode): CommentNode[] {
  return nodes.map((n) => {
    if (n.id === parentId) return { ...n, replies: [...n.replies, newNode] };
    if (n.replies.length > 0) return { ...n, replies: insertReply(n.replies, parentId, newNode) };
    return n;
  });
}

function removeComment(nodes: CommentNode[], id: string): CommentNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, replies: removeComment(n.replies, id) }));
}

/** Animated count that flips digits when the number changes, like a small odometer. */
function AnimatedCount({ value }: { value: number }) {
  return (
    <span className="relative inline-flex items-center overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="inline-block tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function EmojiButton({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: open ? 15 : 0, color: open ? "rgb(37 99 235)" : undefined }}
        transition={spring}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        aria-label="Insert emoji"
      >
        <Smile size={18} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={spring}
            className="absolute bottom-full right-0 mb-2 w-56 grid grid-cols-6 gap-1 p-2 bg-card border border-border rounded-xl shadow-xl z-20 origin-bottom-right"
          >
            {EMOJIS.map((e, i) => (
              <motion.button
                key={e}
                type="button"
                onClick={() => {
                  onSelect(e);
                  setOpen(false);
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.012, ...spring }}
                whileHover={{ scale: 1.3, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className="text-lg rounded-lg hover:bg-foreground/5 p-1 transition-colors"
              >
                {e}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Composer({
  placeholder,
  submitLabel,
  autoFocus,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + emoji);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() || posting) return;
    setPosting(true);
    setError("");
    try {
      await onSubmit(content.trim());
      setContent("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  const showActions = content.trim().length > 0;
  const nearLimit = content.length > 1800;

  return (
    <div>
      <motion.div
        animate={{
          borderColor: focused ? "rgba(37, 99, 235, 0.5)" : "rgba(0,0,0,0)",
          boxShadow: focused ? "0 0 0 4px rgba(37, 99, 235, 0.08)" : "0 0 0 0px rgba(37, 99, 235, 0)",
        }}
        transition={{ duration: 0.2 }}
        className="relative bg-muted rounded-xl border border-border"
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          maxLength={2000}
          rows={3}
          className="w-full bg-transparent resize-y min-h-[84px] px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none rounded-xl"
        />
        <div className="absolute bottom-2.5 right-2.5">
          <EmojiButton onSelect={insertEmoji} />
        </div>
      </motion.div>

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={softSpring}
            className="flex items-center justify-between overflow-hidden"
          >
            <motion.span
              animate={{ color: nearLimit ? "rgb(220 38 38)" : undefined }}
              className="text-xs text-muted-foreground pt-2 tabular-nums"
            >
              {content.length}/2000
            </motion.span>
            <div className="flex gap-2 pt-2">
              {onCancel && (
                <motion.button
                  type="button"
                  onClick={onCancel}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </motion.button>
              )}
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={!content.trim() || posting}
                whileHover={{ scale: posting ? 1 : 1.03 }}
                whileTap={{ scale: posting ? 1 : 0.96 }}
                className="px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {posting ? (
                    <motion.span
                      key="posting"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Loader2 size={14} className="animate-spin" />
                      {submitLabel}ing…
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {submitLabel}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-red-600 text-xs mt-1.5"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  session,
  onReply,
  onDelete,
  isNew,
}: {
  comment: CommentNode;
  depth: number;
  session: Session | null;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isNew?: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isOwner = session?.user?.id === comment.author.id;
  const isAdmin = session?.user?.role === "ADMIN";
  const canDelete = isOwner || isAdmin;
  const indented = Math.min(depth, 4) > 0;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8, transition: { duration: 0.15 } }}
      transition={softSpring}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={indented ? "mt-4 pl-4 border-l border-border" : "mt-6"}
    >
      <motion.div
        className="flex gap-3 rounded-xl -mx-2 px-2 py-1.5"
        animate={{
          backgroundColor: isNew
            ? "rgba(37, 99, 235, 0.06)"
            : hovered
            ? "rgba(0, 0, 0, 0.015)"
            : "rgba(0, 0, 0, 0)",
        }}
        transition={{ duration: isNew ? 1.2 : 0.2 }}
      >
        <motion.div
          whileHover={{ scale: 1.06 }}
          transition={spring}
          className="w-9 h-9 rounded-full overflow-hidden bg-muted ring-1 ring-border shrink-0"
        >
          {comment.author.image ? (
            <img
              src={comment.author.image}
              alt={comment.author.name || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {comment.author.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">
              {comment.author.name || "Anonymous"}
            </span>
            {comment.author.role === "ADMIN" && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-blue-600 text-white">
                Admin
              </span>
            )}
            {comment.author.role === "EDITOR" && (
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-foreground/10 text-muted-foreground">
                Staff
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>

          <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words leading-relaxed">
            {comment.content}
          </p>

          <motion.div
            animate={{ opacity: hovered || replying || confirmingDelete ? 1 : 0.7 }}
            className="flex items-center gap-3 mt-1.5"
          >
            {session && (
              <motion.button
                type="button"
                onClick={() => setReplying((r) => !r)}
                whileHover={{ scale: 1.05, x: 1 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ReplyIcon size={12} />
                Reply
              </motion.button>
            )}
            {canDelete && (
              <AnimatePresence mode="wait" initial={false}>
                {confirmingDelete ? (
                  <motion.span
                    key="confirm"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-xs flex items-center gap-2 overflow-hidden whitespace-nowrap"
                  >
                    <span className="text-muted-foreground">Delete comment?</span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Yes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="text-muted-foreground hover:underline"
                    >
                      No
                    </button>
                  </motion.span>
                ) : (
                  <motion.button
                    key="trigger"
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs font-medium text-muted-foreground hover:text-red-600 transition-colors inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    Delete
                  </motion.button>
                )}
              </AnimatePresence>
            )}
          </motion.div>

          <AnimatePresence>
            {replying && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -6 }}
                transition={softSpring}
                className="mt-3 overflow-hidden"
              >
                <Composer
                  placeholder={`Reply to ${comment.author.name || "this comment"}...`}
                  submitLabel="Reply"
                  autoFocus
                  onCancel={() => setReplying(false)}
                  onSubmit={async (content) => {
                    await onReply(comment.id, content);
                    setReplying(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {comment.replies.length > 0 && (
            <div>
              <AnimatePresence initial={false}>
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    session={session}
                    onReply={onReply}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CommentSection({ postId }: { postId: string }) {
  const { data: session, status } = useSession();
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [justPostedId, setJustPostedId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setError("Couldn't load comments right now.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const totalCount = countAll(comments);

  async function postComment(content: string, parentId: string | null) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content, parentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to post comment");

    const newNode: CommentNode = { ...data, replies: [] };
    setComments((prev) => (parentId ? insertReply(prev, parentId, newNode) : [...prev, newNode]));
    setJustPostedId(newNode.id);
    setTimeout(() => setJustPostedId((id) => (id === newNode.id ? null : id)), 1200);
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete comment");
    setComments((prev) => removeComment(prev, id));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-2xl shadow-xl px-6 py-8 md:px-8"
    >
      <div className="flex items-center gap-2">
        <MessageCircle size={22} className="text-blue-600" />
        <h2 className="text-2xl font-bold text-foreground">Conversation</h2>
      </div>
      <div className="border-b border-border mt-4 mb-4" />

      <p className="text-sm text-muted-foreground leading-relaxed">
        We&apos;d love to hear your thoughts! Let&apos;s keep it respectful and on-topic. Any
        inappropriate remarks may be removed. Happy commenting!{" "}
        <Link
          href="/privacy-policy"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          Privacy Policy
        </Link>
      </p>

      <p className="text-sm font-medium text-foreground mt-4 mb-4">
        {loading ? (
          "…"
        ) : (
          <>
            <AnimatedCount value={totalCount} /> comment{totalCount === 1 ? "" : "s"}
          </>
        )}
      </p>

      {status === "loading" ? null : session ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Composer
            placeholder="What do you think?"
            submitLabel="Post"
            onSubmit={(content) => postComment(content, null)}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted rounded-xl border border-border p-5 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <p className="text-sm text-muted-foreground">Sign in to join the conversation.</p>
          <div className="flex gap-2 shrink-0">
            <motion.button
              type="button"
              onClick={() => signIn("google")}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-card border border-border hover:bg-foreground/5 transition-colors"
            >
              Continue with Google
            </motion.button>
            <motion.button
              type="button"
              onClick={() => signIn("github")}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-card border border-border hover:bg-foreground/5 transition-colors"
            >
              Continue with GitHub
            </motion.button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-600 text-sm mt-3"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="mt-6 space-y-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="flex gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            >
              <motion.div
                className="w-9 h-9 rounded-full bg-muted shrink-0"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
              />
              <div className="flex-1 space-y-2 pt-0.5">
                <motion.div
                  className="h-3 w-32 rounded bg-muted"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                />
                <motion.div
                  className="h-3 w-full max-w-sm rounded bg-muted"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 + 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-muted-foreground py-10"
        >
          Be the first to share your thoughts-start the conversation!
        </motion.p>
      ) : (
        <LayoutGroup>
          <div className="mt-2">
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  session={session}
                  onReply={(parentId, content) => postComment(content, parentId)}
                  onDelete={deleteComment}
                  isNew={comment.id === justPostedId}
                />
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      )}
    </motion.div>
  );
}