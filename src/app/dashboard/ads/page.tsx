"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  FileText,
  AppWindow,
  Search,
  ChevronDown,
  Plus,
  ImagePlus,
  X,
  Trash2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Pencil,
  ArrowLeft,
  MonitorPlay,
} from "lucide-react";
import { mediaTypeFromUrl } from "@/lib/mediaType";
import {
  inputClass,
  labelClass,
  Toggle,
  StatusPill,
  DeleteModal,
  SuccessToast,
} from "@/components/dashboard/DashboardUI";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ad {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
  position: number;
}

interface PopupAd {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkText: string;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

type View = "list" | "add" | "edit";
type ActionType = "added" | "updated" | "deleted" | null;

// Shared style tokens & UI (Toggle, StatusPill, DeleteModal, SuccessToast,
// inputClass, labelClass) now come from @/components/dashboard/DashboardUI.

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState<"inline" | "popup" | "spotlight">("inline");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <Megaphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Ads
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage your blog advertisements
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("inline")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "inline"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          <FileText className="h-4 w-4" />
          Inline ads
        </button>
        <button
          onClick={() => setActiveTab("popup")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "popup"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          <AppWindow className="h-4 w-4" />
          Popup ads
        </button>
        <button
          onClick={() => setActiveTab("spotlight")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "spotlight"
              ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          <MonitorPlay className="h-4 w-4" />
          Spotlight ads
        </button>
      </div>

      {activeTab === "inline" && <InlineAdsTab />}
      {activeTab === "popup" && <PopupAdsTab />}
      {activeTab === "spotlight" && <SpotlightAdsTab />}
    </div>
  );
}

// ─── Inline Ads Tab ───────────────────────────────────────────────────────────

function InlineAdsTab() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [adToDelete, setAdToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({ title: "", image: "", link: "", active: true, position: 0 });

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    try {
      const res = await fetch("/api/ads");
      const data = await res.json();
      setAds(Array.isArray(data) ? data : []);
    } catch {
      setAds([]);
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

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ad.link.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE" && ad.active) ||
        (activeFilter === "INACTIVE" && !ad.active);
      return matchesSearch && matchesFilter;
    });
  }, [ads, searchTerm, activeFilter]);

  function openAdd() {
    setEditingAd(null);
    setForm({ title: "", image: "", link: "", active: true, position: ads.length });
    setError("");
    setView("add");
  }

  function openEdit(ad: Ad) {
    setEditingAd(ad);
    setForm({ title: ad.title, image: ad.image, link: ad.link, active: ad.active, position: ad.position });
    setError("");
    setView("edit");
  }

  function goBack() {
    setView("list");
    setEditingAd(null);
    setError("");
  }

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
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingAd ? `/api/ads/${editingAd.id}` : "/api/ads";
      const method = editingAd ? "PATCH" : "POST";
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
      const action = editingAd ? "updated" : "added";
      await loadAds();
      setView("list");
      setToast(`"${form.title}" was ${action}.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!adToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ads/${adToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete ad");
        setAdToDelete(null);
        return;
      }
      const title = adToDelete.title;
      setAdToDelete(null);
      await loadAds();
      setToast(`"${title}" was deleted.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Failed to delete ad");
      setAdToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(ad: Ad) {
    setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)));
    try {
      await fetch(`/api/ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ad, active: !ad.active }),
      });
    } catch {
      // revert on failure
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: ad.active } : a)));
    }
  }

  // Add / Edit form
  if (view === "add" || view === "edit") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Inline ads
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2
              className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {view === "edit" ? "Edit inline ad" : "New inline ad"}
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
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Samsung Galaxy ad"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Target link</label>
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
                <label className={labelClass}>Position</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  min={0}
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Ad appears after this paragraph number.
                </p>
              </div>

              <div>
                <label className={labelClass}>Ad image</label>
                {form.image ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-rose-600 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin mb-1.5" />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-zinc-400 mb-1.5" />
                    )}
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {uploading ? "Uploading…" : "Click to upload ad image"}
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
                    Shown in blog posts when on.
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
                  {saving ? "Saving…" : view === "edit" ? "Save changes" : "Add ad"}
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

  // List view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {filteredAds.length} of {ads.length} {ads.length === 1 ? "ad" : "ads"} · appear inside blog
          post content
        </p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add inline ad
        </button>
      </div>

      {/* Search & filter */}
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
              {activeFilter === "ALL" && "All ads"}
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
                  { value: "ALL", label: "All ads" },
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
          <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading ads…</p>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">No inline ads found</p>
          <button
            onClick={openAdd}
            className="text-blue-500 hover:text-blue-600 text-sm font-semibold mt-2"
          >
            Add your first ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAds.map((ad, i) => (
              <motion.div
                key={ad.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden"
              >
                <div className="relative h-36">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <StatusPill active={ad.active} />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md">
                    Position #{ad.position}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                    {ad.title}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 mt-1 truncate">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {ad.link}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <Toggle checked={ad.active} onChange={() => toggleActive(ad)} />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {ad.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(ad)}
                        className="text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setAdToDelete({ id: ad.id, title: ad.title })}
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
        {adToDelete && (
          <DeleteModal
            title="Delete advertisement?"
            itemName={adToDelete.title}
            deleting={deleting}
            onCancel={() => setAdToDelete(null)}
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

// ─── Popup Ads Tab ─────────────────────────────────────────────────────────────

function PopupAdsTab() {
  const [ads, setAds] = useState<PopupAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingAd, setEditingAd] = useState<PopupAd | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [adToDelete, setAdToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    linkText: "Learn More",
    isActive: true,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadAds();
  }, []);

  async function loadAds() {
    try {
      const res = await fetch("/api/popup-ads");
      const data = await res.json();
      setAds(Array.isArray(data) ? data : []);
    } catch {
      setAds([]);
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

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ad.description && ad.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "ACTIVE" && ad.isActive) ||
        (activeFilter === "INACTIVE" && !ad.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [ads, searchTerm, activeFilter]);

  function openAdd() {
    setEditingAd(null);
    setForm({
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      linkText: "Learn More",
      isActive: true,
      startDate: "",
      endDate: "",
    });
    setError("");
    setView("add");
  }

  function openEdit(ad: PopupAd) {
    setEditingAd(ad);
    setForm({
      title: ad.title,
      description: ad.description || "",
      imageUrl: ad.imageUrl || "",
      linkUrl: ad.linkUrl || "",
      linkText: ad.linkText,
      isActive: ad.isActive,
      startDate: ad.startDate ? ad.startDate.slice(0, 10) : "",
      endDate: ad.endDate ? ad.endDate.slice(0, 10) : "",
    });
    setError("");
    setView("edit");
  }

  function goBack() {
    setView("list");
    setEditingAd(null);
    setError("");
  }

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
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingAd ? `/api/popup-ads/${editingAd.id}` : "/api/popup-ads";
      const method = editingAd ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }
      const action = editingAd ? "updated" : "added";
      await loadAds();
      setView("list");
      setToast(`"${form.title}" was ${action}.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!adToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/popup-ads/${adToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete popup ad");
        setAdToDelete(null);
        return;
      }
      const title = adToDelete.title;
      setAdToDelete(null);
      await loadAds();
      setToast(`"${title}" was deleted.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Failed to delete popup ad");
      setAdToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(ad: PopupAd) {
    setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, isActive: !a.isActive } : a)));
    try {
      await fetch(`/api/popup-ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !ad.isActive }),
      });
    } catch {
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, isActive: ad.isActive } : a)));
    }
  }

  // Add / Edit form
  if (view === "add" || view === "edit") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Popup ads
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2
              className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {view === "edit" ? "Edit popup ad" : "New popup ad"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {view === "edit" ? "Update popup ad details" : "Appears on the homepage when visitors arrive"}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Big summer sale"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Button text</label>
                  <input
                    type="text"
                    value={form.linkText}
                    onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                    placeholder="Learn More"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short message shown in the popup"
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Destination URL</label>
                  <input
                    type="url"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    placeholder="https://example.com"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Ad image</label>
                  {form.imageUrl ? (
                    <div className="relative h-[42px] rounded-xl overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imageUrl: "" })}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full h-[42px] border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4 text-zinc-400" />
                      )}
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                        {uploading ? "Uploading…" : "Upload image"}
                      </span>
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>End date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Active</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Shown on the homepage when on.
                  </p>
                </div>
                <Toggle
                  checked={form.isActive}
                  onChange={() => setForm({ ...form, isActive: !form.isActive })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : view === "edit" ? "Save changes" : "Add popup ad"}
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

  // List view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {filteredAds.length} of {ads.length} {ads.length === 1 ? "ad" : "ads"} · appear on the
          homepage when visitors arrive
        </p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add popup ad
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title or description..."
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
              {activeFilter === "ALL" && "All popup ads"}
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
                  { value: "ALL", label: "All popup ads" },
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
          <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading popup ads…</p>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <AppWindow className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">No popup ads found</p>
          <button
            onClick={openAdd}
            className="text-blue-500 hover:text-blue-600 text-sm font-semibold mt-2"
          >
            Add your first popup ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAds.map((ad, i) => (
              <motion.div
                key={ad.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden"
              >
                <div className="relative h-36">
                  {ad.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                      <AppWindow className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <StatusPill active={ad.isActive} />
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                    {ad.title}
                  </h3>
                  {ad.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {ad.description}
                    </p>
                  )}
                  {ad.linkUrl && (
                    <p className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 mt-1.5 truncate">
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {ad.linkUrl}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <Toggle checked={ad.isActive} onChange={() => toggleActive(ad)} />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {ad.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(ad)}
                        className="text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setAdToDelete({ id: ad.id, title: ad.title })}
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
        {adToDelete && (
          <DeleteModal
            title="Delete popup ad?"
            itemName={adToDelete.title}
            deleting={deleting}
            onCancel={() => setAdToDelete(null)}
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

// ─── Spotlight Ads Tab ─────────────────────────────────────────────────────────

interface SpotlightAd {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: string;
  link: string;
  active: boolean;
  position: number;
}

function SpotlightAdsTab() {
  const [ads, setAds] = useState<SpotlightAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingAd, setEditingAd] = useState<SpotlightAd | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [adToDelete, setAdToDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({ title: "", mediaUrl: "", link: "", active: true, position: 0 });

  const [header, setHeader] = useState("");
  const [cardTitle, setCardTitle] = useState("");
  const [headerSaving, setHeaderSaving] = useState(false);

  useEffect(() => {
    loadAds();
  }, []);

  useEffect(() => {
    fetch("/api/settings/ui")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.spotlightAdsHeader != null) setHeader(d.spotlightAdsHeader);
        if (d?.spotlightAdsTitle != null) setCardTitle(d.spotlightAdsTitle);
      })
      .catch(() => {});
  }, []);

  async function saveHeaderSettings() {
    setHeaderSaving(true);
    try {
      const res = await fetch("/api/settings/ui", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotlightAdsHeader: header, spotlightAdsTitle: cardTitle }),
      });
      if (res.ok) {
        setToast("Card header updated.");
        setTimeout(() => setToast(null), 2500);
      }
    } catch {
      /* ignore */
    } finally {
      setHeaderSaving(false);
    }
  }

  async function loadAds() {
    try {
      const res = await fetch("/api/spotlight-ads");
      const data = await res.json();
      setAds(Array.isArray(data) ? data : []);
    } catch {
      setAds([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAds = useMemo(
    () =>
      ads.filter(
        (ad) =>
          ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ad.link.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [ads, searchTerm]
  );

  function openAdd() {
    setEditingAd(null);
    setForm({ title: "", mediaUrl: "", link: "", active: true, position: ads.length });
    setError("");
    setView("add");
  }

  function openEdit(ad: SpotlightAd) {
    setEditingAd(ad);
    setForm({ title: ad.title, mediaUrl: ad.mediaUrl, link: ad.link, active: ad.active, position: ad.position });
    setError("");
    setView("edit");
  }

  function goBack() {
    setView("list");
    setEditingAd(null);
    setError("");
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
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
      setForm((prev) => ({ ...prev, mediaUrl: data.url }));
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editingAd ? `/api/spotlight-ads/${editingAd.id}` : "/api/spotlight-ads";
      const method = editingAd ? "PATCH" : "POST";
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
      const action = editingAd ? "updated" : "added";
      await loadAds();
      setView("list");
      setToast(`"${form.title}" was ${action}.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!adToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/spotlight-ads/${adToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Failed to delete ad");
        setAdToDelete(null);
        return;
      }
      const title = adToDelete.title;
      setAdToDelete(null);
      await loadAds();
      setToast(`"${title}" was deleted.`);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Failed to delete ad");
      setAdToDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function toggleActive(ad: SpotlightAd) {
    setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)));
    try {
      await fetch(`/api/spotlight-ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ad, active: !ad.active }),
      });
    } catch {
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: ad.active } : a)));
    }
  }

  const formIsVideo = !!form.mediaUrl && mediaTypeFromUrl(form.mediaUrl) === "video";

  // Add / Edit form
  if (view === "add" || view === "edit") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Spotlight ads
        </button>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2
              className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {view === "edit" ? "Edit spotlight ad" : "New spotlight ad"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Rotates beside the gadgets section on the homepage. Supports image, GIF or video.
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
                  placeholder="Summer gadget sale"
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Target link</label>
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
                <label className={labelClass}>Position</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                  min={0}
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                  Lower numbers rotate first.
                </p>
              </div>

              <div>
                <label className={labelClass}>Media (image, GIF or video)</label>
                {form.mediaUrl ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                    {formIsVideo ? (
                      <video src={form.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full backdrop-blur-md">
                      {formIsVideo ? "Video" : "Image"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, mediaUrl: "" })}
                      className="absolute top-2.5 right-2.5 bg-black/60 hover:bg-rose-600 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin mb-1.5" />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-zinc-400 mb-1.5" />
                    )}
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      {uploading ? "Uploading…" : "Click to upload media"}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      Image/GIF up to 5MB · MP4/WebM up to 20MB
                    </p>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/ogg"
                      onChange={handleMediaUpload}
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
                    Shown in the homepage rotation when on.
                  </p>
                </div>
                <Toggle checked={form.active} onChange={() => setForm({ ...form, active: !form.active })} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving || uploading || !form.mediaUrl}
                  className="inline-flex items-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "Saving…" : view === "edit" ? "Save changes" : "Add spotlight ad"}
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

  // List view
  return (
    <div className="space-y-6">
      {/* Card header settings — eyebrow label + title */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Eyebrow label</label>
            <input
              type="text"
              value={header}
              onChange={(e) => setHeader(e.target.value)}
              placeholder="Handpicked for you"
              maxLength={40}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="Deals worth a look"
              maxLength={50}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 mt-4">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Shown at the top of the spotlight card on the homepage. Leave a field empty to hide it.
          </p>
          <button
            onClick={saveHeaderSettings}
            disabled={headerSaving}
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
          >
            {headerSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {headerSaving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {filteredAds.length} of {ads.length} {ads.length === 1 ? "ad" : "ads"} · rotate beside the
          gadgets section on the homepage
        </p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add spotlight ad
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by title or link..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading spotlight ads…</p>
        </div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-16 text-center">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <MonitorPlay className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">No spotlight ads found</p>
          <button
            onClick={openAdd}
            className="text-blue-500 hover:text-blue-600 text-sm font-semibold mt-2"
          >
            Add your first spotlight ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredAds.map((ad, i) => (
              <motion.div
                key={ad.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden"
              >
                <div className="relative h-36 bg-zinc-100 dark:bg-zinc-800">
                  {ad.mediaType === "video" ? (
                    <video src={ad.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 left-3">
                    <StatusPill active={ad.active} />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full backdrop-blur-md">
                    {ad.mediaType === "video" ? "Video" : "Image"} · #{ad.position}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50 truncate">
                    {ad.title}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 mt-1 truncate">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {ad.link}
                  </p>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <Toggle checked={ad.active} onChange={() => toggleActive(ad)} />
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {ad.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(ad)}
                        className="text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setAdToDelete({ id: ad.id, title: ad.title })}
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
        {adToDelete && (
          <DeleteModal
            title="Delete spotlight ad?"
            itemName={adToDelete.title}
            deleting={deleting}
            onCancel={() => setAdToDelete(null)}
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