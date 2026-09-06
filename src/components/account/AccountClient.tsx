"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark, MessageCircle, Loader2, CheckCircle2, Upload } from "lucide-react";

interface Account {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  _count: { bookmarks: number; comments: number };
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  EDITOR: "Staff",
  READER: "Reader",
};

function formatJoinDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(date)
  );
}

export default function AccountClient() {
  const { update: updateSession } = useSession();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchAccount() {
      try {
        const res = await fetch("/api/account", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          setFetchError(data.error || "Failed to load account");
          return;
        }
        setAccount(data);
        setName(data.name ?? "");
        setImage(data.image ?? null);
      } catch {
        setFetchError("Failed to load account");
      } finally {
        setLoading(false);
      }
    }
    fetchAccount();
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setImage(data.url);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const dirty = account && (name.trim() !== (account.name ?? "") || image !== account.image);

  async function handleSave() {
    if (!name.trim()) {
      setError("Name can't be empty");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), image }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save changes");
        return;
      }
      setAccount(data);
      // Push the change into the JWT session so the navbar avatar/name
      // update immediately, without needing a re-login.
      await updateSession({ name: data.name, image: data.image });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-card border-2 border-border-heavy rounded-none shadow-brutal px-6 py-8 md:px-8 animate-pulse">
        <div className="h-6 w-40 bg-muted border-2 border-border-heavy" />
        <div className="h-24 w-24 mt-6 bg-muted border-2 border-border-heavy" />
      </div>
    );
  }

  if (fetchError || !account) {
    return (
      <div className="bg-card border-2 border-border-heavy rounded-none shadow-brutal px-6 py-8 md:px-8">
        <p className="text-danger font-bold text-sm">{fetchError || "Something went wrong."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-border-heavy rounded-none shadow-brutal px-6 py-8 md:px-8">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage how you appear across comments and the site.
        </p>

        <div className="border-t-2 border-border-heavy mt-5 mb-6" />

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="w-24 h-24 border-2 border-border-heavy overflow-hidden bg-muted">
              {image ? (
                <img loading="lazy" decoding="async" src={image} alt={name || "Profile"} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent flex items-center justify-center text-on-accent text-3xl font-extrabold">
                  {name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-bold px-3 py-1.5 border-2 border-border-heavy shadow-brutal-sm brutal-press bg-card inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Upload size={12} />
              )}
              {uploading ? "Uploading…" : "Change photo"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-4 min-w-0">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full bg-muted border-2 border-border rounded-none px-3 py-2 text-sm text-foreground focus:outline-none focus:border-border-heavy focus:shadow-brutal-sm transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wide text-muted-foreground mb-1.5">
                Email
              </label>
              <div className="w-full bg-muted border-2 border-border rounded-none px-3 py-2 text-sm text-muted-foreground">
                {account.email}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tied to your sign-in provider — can&apos;t be changed here.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-1 border-2 border-border-heavy bg-accent text-on-accent">
                {ROLE_LABEL[account.role] ?? account.role}
              </span>
              <span className="text-xs text-muted-foreground">
                Member since {formatJoinDate(account.createdAt)}
              </span>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-danger font-bold text-xs"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || saving}
                className="px-4 py-2 border-2 border-border-heavy text-sm font-extrabold bg-accent text-on-accent disabled:opacity-40 disabled:cursor-not-allowed shadow-brutal-sm brutal-press inline-flex items-center gap-1.5"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
              <AnimatePresence>
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-bold text-foreground inline-flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} className="text-accent" />
                    Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border-2 border-border-heavy rounded-none shadow-brutal px-6 py-6 md:px-8">
        <h2 className="h-eyebrow text-muted-foreground mb-4">
          Your activity
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/bookmarks"
            className="flex items-center gap-3 border-2 border-border-heavy shadow-brutal-sm brutal-press bg-background p-4"
          >
            <div className="w-10 h-10 border-2 border-border-heavy bg-accent-tint flex items-center justify-center shrink-0">
              <Bookmark size={18} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-foreground leading-none">
                {account._count.bookmarks}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Bookmarks</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 border-2 border-border-heavy bg-background p-4">
            <div className="w-10 h-10 border-2 border-border-heavy bg-accent-tint flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-black text-foreground leading-none">
                {account._count.comments}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Comments posted</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
