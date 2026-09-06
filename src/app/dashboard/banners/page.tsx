"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GalleryHorizontal,
  Search,
  ChevronDown,
  Plus,
  ImagePlus,
  X,
  Trash2,
  Pencil,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Toggle, StatusPill, DeleteModal, SuccessToast, inputClass, labelClass } from "@/components/dashboard/DashboardUI";
import { useFileDrop, DROP_ACTIVE_CLASS } from "@/components/dashboard/useFileDrop";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  cta: string | null;
  featuredLabel: string | null;
  image: string;
  link: string;
  active: boolean;
  order: number;
}

type View = "list" | "add" | "edit";

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [bannerToDelete, setBannerToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({ title: "", description: "", badge: "", cta: "", featuredLabel: "", image: "", link: "", active: true, order: 0 });

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      const res = await fetch("/api/banners");
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      const matchesSearch =
        banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        banner.link.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE" && banner.active) ||
        (activeFilter === "INACTIVE" && !banner.active);
      return matchesSearch && matchesFilter;
    });
  }, [banners, searchTerm, activeFilter]);

  function openAdd() {
    setEditingBanner(null);
    setForm({ title: "", description: "", badge: "", cta: "", featuredLabel: "", image: "", link: "", active: true, order: banners.length });
    setError("");
    setView("add");
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setForm({ title: banner.title, description: banner.description ?? "", badge: banner.badge ?? "", cta: banner.cta ?? "", featuredLabel: banner.featuredLabel ?? "", image: banner.image, link: banner.link, active: banner.active, order: banner.order });
    setError("");
    setView("edit");
  }

  function goBack() {
    setView("list");
    setEditingBanner(null);
    setError("");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadBannerImage(file);
    e.target.value = "";
  }

  async function uploadBannerImage(file: File) {
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
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const bannerDrop = useFileDrop({
    onFiles: (files) => uploadBannerImage(files[0]),
    disabled: uploading,
    onReject: setError,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingBanner ? `/api/banners/${editingBanner.id}` : "/api/banners";
      const method = editingBanner ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }
      const action = editingBanner ? "updated" : "added";
      await loadBanners();
      setView("list");
      setToast(`"${form.title}" was ${action}.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(banner: Banner) {
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)));
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !banner.active }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, active: banner.active } : b)));
      setError("Failed to update status");
    }
  }

  async function confirmDelete() {
    if (!bannerToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/banners/${bannerToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete banner");
        setBannerToDelete(null);
        return;
      }
      const title = bannerToDelete.title;
      setBannerToDelete(null);
      await loadBanners();
      setToast(`"${title}" was deleted.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Failed to delete banner");
      setBannerToDelete(null);
    } finally {
      setDeleting(false);
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
          Banners
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2
              className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {view === "edit" ? "Edit banner" : "New banner"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {view === "edit" ? "Update banner details" : "Create a new carousel banner"}
            </p>
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
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputClass} min-h-[88px] resize-y`}
                  rows={3}
                  placeholder="Short blurb shown beside the hero image on the homepage."
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Appears in the title card next to the banner. Keep it to a sentence or two.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelClass}>Tag label</label>
                  <input
                    type="text"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className={inputClass}
                    placeholder="Top Story"
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                    Small tag above the headline. Defaults to “Top Story”.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Button label</label>
                  <input
                    type="text"
                    value={form.cta}
                    onChange={(e) => setForm({ ...form, cta: e.target.value })}
                    className={inputClass}
                    placeholder="Read more"
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                    Call-to-action button text. Defaults to “Read more”.
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Featured flag</label>
                  <input
                    type="text"
                    value={form.featuredLabel}
                    onChange={(e) => setForm({ ...form, featuredLabel: e.target.value })}
                    className={inputClass}
                    placeholder="Featured"
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                    Corner flag overlaid on the banner image. Defaults to “Featured”.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Link</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://example.com"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Order</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  min={0}
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Lower number = higher priority in the carousel.
                </p>
              </div>

              <div>
                <label className={labelClass}>Banner image</label>
                {form.image ? (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                      className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-rose-600 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label
                    {...bannerDrop.dropProps}
                    className={`flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      bannerDrop.isDragging
                        ? DROP_ACTIVE_CLASS
                        : "border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5"
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin mb-2" />
                    ) : (
                      <ImagePlus
                        className={`h-6 w-6 mb-2 ${
                          bannerDrop.isDragging ? "text-blue-500" : "text-zinc-400"
                        }`}
                      />
                    )}
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 pointer-events-none">
                      {uploading
                        ? "Uploading…"
                        : bannerDrop.isDragging
                          ? "Drop to upload"
                          : "Drag a banner image here, or click to browse"}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Active</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Shown in the carousel when on.
                  </p>
                </div>
                <Toggle checked={form.active} onChange={() => setForm({ ...form, active: !form.active })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : view === "edit" ? "Save changes" : "Add banner"}
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
              <GalleryHorizontal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Banners
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {filteredBanners.length} of {banners.length} banners
              </p>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add banner</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title or link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="relative sm:w-52" ref={dropdownRef}>
          <button
            onClick={() => setShowFilterDropdown((s) => !s)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 flex justify-between items-center hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <span>
              {activeFilter === "ALL" && "All banners"}
              {activeFilter === "ACTIVE" && "Active only"}
              {activeFilter === "INACTIVE" && "Inactive only"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 ml-2 transition-transform ${
                showFilterDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {showFilterDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-full bg-white dark:bg-zinc-800 rounded-xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-700 py-1.5 z-50"
              >
                {[
                  { value: "ALL", label: "All banners" },
                  { value: "ACTIVE", label: "Active only" },
                  { value: "INACTIVE", label: "Inactive only" },
                ].map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      setActiveFilter(option.value as "ALL" | "ACTIVE" | "INACTIVE");
                      setShowFilterDropdown(false);
                    }}
                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                      activeFilter === option.value
                        ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10"
                        : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                    }`}
                  >
                    {option.label}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading banners…</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <GalleryHorizontal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {banners.length === 0 ? "No banners yet" : "No banners match your filters"}
          </p>
          <button onClick={openAdd} className="text-blue-500 hover:text-blue-600 text-sm font-semibold mt-2">
            Add your first banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredBanners.map((banner, i) => (
              <motion.div
                key={banner.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden"
              >
                <div className="relative h-44">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <StatusPill active={banner.active} />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md">
                    Order {banner.order}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                    {banner.title}
                  </h3>
                  <Link
                    href={banner.link}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 mt-1 truncate"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {banner.link}
                  </Link>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <Toggle checked={banner.active} onChange={() => toggleActive(banner)} />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {banner.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(banner)}
                        className="text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setBannerToDelete({ id: banner.id, title: banner.title })}
                        className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {bannerToDelete && (
          <DeleteModal
            title="Delete banner?"
            itemName={bannerToDelete.title}
            deleting={deleting}
            onCancel={() => setBannerToDelete(null)}
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