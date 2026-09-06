"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Toggle, StatusPill, DeleteModal, SuccessToast, inputClass, labelClass } from "@/components/dashboard/DashboardUI";

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  iconSvg: string;
  actionText: string;
  color: string;
  order: number;
  isActive: boolean;
}

type View = "list" | "add" | "edit";

export default function SocialsPage() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [socialToDelete, setSocialToDelete] = useState<{ id: string; platform: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    platform: "",
    url: "",
    iconSvg: "",
    actionText: "Follow",
    color: "#3b82f6",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    loadSocials();
  }, []);

  async function loadSocials() {
    try {
      const res = await fetch("/api/socials");
      const data = await res.json();
      setSocials(Array.isArray(data) ? data : []);
    } catch {
      setSocials([]);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingSocial(null);
    setForm({
      platform: "",
      url: "",
      iconSvg: "",
      actionText: "Follow",
      color: "#3b82f6",
      order: socials.length,
      isActive: true,
    });
    setError("");
    setView("add");
  }

  function openEdit(social: SocialLink) {
    setEditingSocial(social);
    setForm({
      platform: social.platform,
      url: social.url,
      iconSvg: social.iconSvg,
      actionText: social.actionText || "Follow",
      color: social.color || "#3b82f6",
      order: social.order,
      isActive: social.isActive,
    });
    setError("");
    setView("edit");
  }

  function goBack() {
    setView("list");
    setEditingSocial(null);
    setError("");
  }

  async function confirmDelete() {
    if (!socialToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/socials/${socialToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete social link");
        setSocialToDelete(null);
        return;
      }
      const platform = socialToDelete.platform;
      setSocialToDelete(null);
      await loadSocials();
      setToast(`"${platform}" was deleted.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Failed to delete social link");
      setSocialToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.platform || !form.url || !form.iconSvg) {
      setError("Platform, URL, and icon SVG are required");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = editingSocial ? `/api/socials/${editingSocial.id}` : "/api/socials";
      const method = editingSocial ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: form.platform,
          url: form.url,
          iconSvg: form.iconSvg,
          actionText: form.actionText,
          color: form.color,
          order: Number(form.order),
          isActive: form.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      const action = editingSocial ? "updated" : "added";
      await loadSocials();
      setView("list");
      setToast(`"${form.platform}" was ${action}.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (view === "add" || view === "edit") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Social links
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2
              className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {view === "edit" ? "Edit social link" : "Add social link"}
            </h2>
          </div>

          <div className="p-6 space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl"
                >
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-zinc-200 dark:ring-zinc-700 flex items-center justify-center shrink-0 [&_svg]:w-6 [&_svg]:h-6"
                  style={{ color: form.color }}
                  dangerouslySetInnerHTML={{ __html: form.iconSvg || "" }}
                />
                <div>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                    Live preview
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Updates as you edit the icon and color.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Platform name</label>
                <input
                  type="text"
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  placeholder="YouTube"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://youtube.com/@yourchannel"
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Brand color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-11 h-[42px] border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 shrink-0"
                    />
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className={`${inputClass} font-mono text-xs`}
                      style={{ fontFamily: "var(--font-mono)" }}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Action text</label>
                  <input
                    type="text"
                    value={form.actionText}
                    onChange={(e) => setForm({ ...form, actionText: e.target.value })}
                    placeholder="Follow"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Display order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  min={0}
                />
              </div>

              <div>
                <label className={labelClass}>Icon SVG code</label>
                <textarea
                  value={form.iconSvg}
                  onChange={(e) => setForm({ ...form, iconSvg: e.target.value })}
                  rows={5}
                  placeholder="<svg ...></svg>"
                  className={`${inputClass} font-mono text-xs resize-none`}
                  style={{ fontFamily: "var(--font-mono)" }}
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Active</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Visible on the site when on.
                  </p>
                </div>
                <Toggle checked={form.isActive} onChange={() => setForm({ ...form, isActive: !form.isActive })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : view === "edit" ? "Save changes" : "Add link"}
                </button>
                <button
                  type="button"
                  onClick={goBack}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Social links
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Manage your social media profiles
              </p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add link</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading…</p>
        </div>
      ) : socials.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">No social links yet</p>
          <button onClick={openAdd} className="text-blue-500 hover:text-blue-600 text-sm font-semibold mt-2">
            Add your first link
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {[...socials]
              .sort((a, b) => a.order - b.order)
              .map((social, i) => (
                <motion.div
                  key={social.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden"
                >
                  <div className="p-5 flex items-start gap-4">
                    <div
                      className="w-11 h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 ring-1 ring-zinc-200 dark:ring-zinc-700 flex items-center justify-center shrink-0 [&_svg]:w-5 [&_svg]:h-5"
                      style={{ color: social.color }}
                      dangerouslySetInnerHTML={{ __html: social.iconSvg }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                          {social.platform}
                        </h3>
                        <StatusPill active={social.isActive} />
                      </div>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 mt-1 truncate"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        {social.url}
                      </a>
                      {social.actionText && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          Button label: {social.actionText}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 flex">
                    <button
                      onClick={() => openEdit(social)}
                      className="flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <div className="w-px bg-zinc-100 dark:bg-zinc-800" />
                    <button
                      onClick={() => setSocialToDelete({ id: social.id, platform: social.platform })}
                      className="flex-1 py-3 flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {socialToDelete && (
          <DeleteModal
            title="Delete social link?"
            itemName={socialToDelete.platform}
            deleting={deleting}
            onCancel={() => setSocialToDelete(null)}
            onConfirm={confirmDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <SuccessToast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}