"use client";

import { useState, useEffect, useMemo, useRef } from "react";

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

type Tab = "inline" | "popup";
type View = "list" | "add" | "edit";
type ActionType = "added" | "updated" | "deleted" | null;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("inline");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ads</h1>
        <p className="text-gray-500 mt-1">Manage your blog advertisements</p>
      </div>

      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("inline")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "inline"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>📄</span>
          Inline Ads
        </button>
        <button
          onClick={() => setActiveTab("popup")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "popup"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>🪟</span>
          Popup Ads
        </button>
      </div>

      {activeTab === "inline" ? <InlineAdsTab /> : <PopupAdsTab />}
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
  const [successAction, setSuccessAction] = useState<ActionType>(null);
  const [deletedTitle, setDeletedTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adToDelete, setAdToDelete] = useState<{ id: string; title: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: "",
    image: "",
    link: "",
    active: true,
    position: 0,
  });

  useEffect(() => { loadAds(); }, []);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) || ad.link.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "ALL" || (activeFilter === "ACTIVE" && ad.active) || (activeFilter === "INACTIVE" && !ad.active);
      return matchesSearch && matchesFilter;
    });
  }, [ads, searchTerm, activeFilter]);

  function openAdd() {
    setEditingAd(null);
    setForm({ title: "", image: "", link: "", active: true, position: ads.length });
    setError("");
    setSuccessAction(null);
    setView("add");
  }

  function openEdit(ad: Ad) {
    setEditingAd(ad);
    setForm({ title: ad.title, image: ad.image, link: ad.link, active: ad.active, position: ad.position });
    setError("");
    setSuccessAction(null);
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
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Upload failed"); return; }
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
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
      setSuccessAction(action);
      await loadAds();
      setTimeout(() => { setView("list"); setSuccessAction(null); }, 1800);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal(id: string, title: string) {
    setAdToDelete({ id, title });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!adToDelete) return;
    try {
      const res = await fetch(`/api/ads/${adToDelete.id}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to delete ad"); return; }
      setDeletedTitle(adToDelete.title);
      setSuccessAction("deleted");
      await loadAds();
      setTimeout(() => { setSuccessAction(null); setDeletedTitle(""); }, 1800);
    } catch {
      alert("Failed to delete ad");
    } finally {
      setShowDeleteModal(false);
      setAdToDelete(null);
    }
  }

  // Success Screen
  if (successAction) {
    return (
      <div className="flex items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md scale-95 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {successAction === "added" && "Ad Added!"}
            {successAction === "updated" && "Ad Updated!"}
            {successAction === "deleted" && "Ad Deleted!"}
          </h2>
          <p className="text-gray-600 text-lg">
            {successAction === "deleted" ? `"${deletedTitle}" has been removed successfully.` : `"${form.title}" has been ${successAction} successfully.`}
          </p>
        </div>
      </div>
    );
  }

  // Delete Modal
  if (showDeleteModal && adToDelete) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
          <div className="p-10">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🗑️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">Delete Advertisement?</h2>
            <p className="text-gray-600 text-center mt-3">Are you sure you want to delete <strong>"{adToDelete.title}"</strong>?</p>
            <p className="text-sm text-red-600 text-center mt-2">This action cannot be undone.</p>
          </div>
          <div className="border-t flex">
            <button onClick={() => { setShowDeleteModal(false); setAdToDelete(null); }} className="flex-1 py-5 text-gray-600 font-medium hover:bg-gray-100 active:scale-95 transition-all rounded-bl-3xl">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-5 bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all rounded-br-3xl">Yes, Delete</button>
          </div>
        </div>
      </div>
    );
  }

  // Add / Edit Form (unchanged)
  if (view === "add" || view === "edit") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {view === "edit" ? "Edit Inline Ad" : "New Inline Ad"}
          </h2>
          <p className="text-gray-500 mt-1">
            {view === "edit" ? "Update ad details" : "Add a new inline ad"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Your original form - completely untouched */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Samsung Galaxy Ad" className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Link</label>
              <input type="url" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://example.com" className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" min={0} />
              <p className="text-xs text-gray-400 mt-1">Ad appears after this paragraph number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ad Image</label>
              {form.image ? (
                <div className="relative">
                  <img src={form.image} alt="Ad preview" className="w-full h-28 object-cover rounded-2xl" />
                  <button type="button" onClick={() => setForm({ ...form, image: "" })} className="absolute top-3 right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700">✕</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-3xl cursor-pointer hover:bg-blue-50 transition-all">
                  <div className="text-center">
                    <p className="text-4xl mb-2">🖼️</p>
                    <p className="font-medium text-gray-700">{uploading ? "Uploading..." : "Click to upload ad image"}</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="inline-active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 text-blue-600 rounded border-gray-300" />
              <label htmlFor="inline-active" className="text-sm font-medium text-gray-700">Active (show in blog posts)</label>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={saving || uploading} className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-medium active:scale-[0.985] transition-all disabled:opacity-70">
                {saving ? "Saving..." : view === "edit" ? "Save Changes" : "Add Ad"}
              </button>
              <button type="button" onClick={goBack} className="flex-1 py-3.5 rounded-2xl font-medium text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List View with Liquid Animations
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {filteredAds.length} of {ads.length} {ads.length === 1 ? "ad" : "ads"} · Inline ads appear inside blog post content
        </p>
        <button onClick={openAdd} className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all font-medium shadow-sm">+ Add Inline Ad</button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <input type="text" placeholder="Search by title or link..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
        </div>

        <div className="sm:w-56 relative" ref={dropdownRef}>
          <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="w-full border border-gray-300 rounded-3xl px-6 py-4 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-left flex items-center justify-between text-gray-900">
            <span>{activeFilter === "ALL" && "All Ads"}{activeFilter === "ACTIVE" && "Active Only"}{activeFilter === "INACTIVE" && "Inactive Only"}</span>
            <span className={`transition-transform duration-300 ${showFilterDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>

          {showFilterDropdown && (
            <div className="absolute mt-3 w-full bg-white rounded-3xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {[
                { value: "ALL", label: "All Ads" },
                { value: "ACTIVE", label: "Active Only" },
                { value: "INACTIVE", label: "Inactive Only" },
              ].map((option) => (
                <div key={option.value} onClick={() => { setActiveFilter(option.value as "ALL" | "ACTIVE" | "INACTIVE"); setShowFilterDropdown(false); }} className={`px-6 py-3.5 hover:bg-gray-100 cursor-pointer transition-colors ${activeFilter === option.value ? "bg-blue-50 text-blue-700 font-medium" : ""}`}>
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading ads...</p></div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-16 text-center animate-in fade-in">
          <p className="text-6xl mb-4">📢</p>
          <p className="text-xl font-medium">No inline ads found</p>
          <button onClick={openAdd} className="text-blue-600 hover:underline mt-4">Add your first ad</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAds.map((ad, index) => (
            <div key={ad.id} className="group bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="relative overflow-hidden h-40">
                <img src={ad.image} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute top-4 left-4">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-md ${ad.active ? "bg-green-500/90 text-white" : "bg-gray-500/90 text-white"}`}>
                    {ad.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md">Position #{ad.position}</div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-lg mb-1 line-clamp-2">{ad.title}</h3>
                <p className="text-blue-600 text-sm truncate">{ad.link}</p>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { fetch(`/api/ads/${ad.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...ad, active: !ad.active }) }).then(() => loadAds()); }} className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 ${ad.active ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                    {ad.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => openEdit(ad)} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-2xl text-sm font-medium hover:bg-blue-200 transition-all active:scale-95">Edit</button>
                  <button onClick={() => openDeleteModal(ad.id, ad.title)} className="flex-1 py-3 bg-red-100 text-red-700 rounded-2xl text-sm font-medium hover:bg-red-200 transition-all active:scale-95">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [successAction, setSuccessAction] = useState<ActionType>(null);
  const [deletedTitle, setDeletedTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adToDelete, setAdToDelete] = useState<{ id: string; title: string } | null>(null);

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

  useEffect(() => { loadAds(); }, []);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch = ad.title.toLowerCase().includes(searchTerm.toLowerCase()) || (ad.description && ad.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesFilter = activeFilter === "ALL" || (activeFilter === "ACTIVE" && ad.isActive) || (activeFilter === "INACTIVE" && !ad.isActive);
      return matchesSearch && matchesFilter;
    });
  }, [ads, searchTerm, activeFilter]);

  function openAdd() {
    setEditingAd(null);
    setForm({ title: "", description: "", imageUrl: "", linkUrl: "", linkText: "Learn More", isActive: true, startDate: "", endDate: "" });
    setError("");
    setSuccessAction(null);
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
    setSuccessAction(null);
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
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Upload failed"); return; }
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
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
      setSuccessAction(action);
      await loadAds();
      setTimeout(() => { setView("list"); setSuccessAction(null); }, 1800);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteModal(id: string, title: string) {
    setAdToDelete({ id, title });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!adToDelete) return;
    try {
      const res = await fetch(`/api/popup-ads/${adToDelete.id}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to delete popup ad"); return; }
      setDeletedTitle(adToDelete.title);
      setSuccessAction("deleted");
      await loadAds();
      setTimeout(() => { setSuccessAction(null); setDeletedTitle(""); }, 1800);
    } catch {
      alert("Failed to delete popup ad");
    } finally {
      setShowDeleteModal(false);
      setAdToDelete(null);
    }
  }

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  // Success Screen
  if (successAction) {
    return (
      <div className="flex items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md scale-95 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {successAction === "added" && "Popup Ad Added!"}
            {successAction === "updated" && "Popup Ad Updated!"}
            {successAction === "deleted" && "Popup Ad Deleted!"}
          </h2>
          <p className="text-gray-600 text-lg">
            {successAction === "deleted" ? `"${deletedTitle}" has been removed successfully.` : `"${form.title}" has been ${successAction} successfully.`}
          </p>
        </div>
      </div>
    );
  }

  // Delete Modal
  if (showDeleteModal && adToDelete) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
          <div className="p-10">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🗑️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">Delete Popup Ad?</h2>
            <p className="text-gray-600 text-center mt-3">Are you sure you want to delete <strong>"{adToDelete.title}"</strong>?</p>
            <p className="text-sm text-red-600 text-center mt-2">This action cannot be undone.</p>
          </div>
          <div className="border-t flex">
            <button onClick={() => { setShowDeleteModal(false); setAdToDelete(null); }} className="flex-1 py-5 text-gray-600 font-medium hover:bg-gray-100 active:scale-95 transition-all rounded-bl-3xl">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-5 bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all rounded-br-3xl">Yes, Delete</button>
          </div>
        </div>
      </div>
    );
  }

  // Add / Edit Form (FULL ORIGINAL - UNCHANGED)
  if (view === "add" || view === "edit") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {view === "edit" ? "Edit Popup Ad" : "New Popup Ad"}
          </h2>
          <p className="text-gray-500 mt-1">
            {view === "edit" ? "Update popup ad details" : "Create a new popup that appears on the homepage"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Big Summer Sale" className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                <input type="text" value={form.linkText} onChange={(e) => setForm({ ...form, linkText: e.target.value })} placeholder="Learn More" className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short message shown in the popup" rows={3} className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination URL</label>
                <input type="url" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://example.com" className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Image</label>
                {form.imageUrl ? (
                  <div className="relative h-[46px]">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                    <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700">✕</button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full h-[46px] border-2 border-dashed border-gray-300 rounded-3xl cursor-pointer hover:bg-blue-50 transition-all">
                    <span className="text-lg">🖼️</span>
                    <span className="text-sm font-medium text-gray-600">{uploading ? "Uploading..." : "Upload image"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="popup-active" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-5 h-5 text-blue-600 rounded border-gray-300" />
              <label htmlFor="popup-active" className="text-sm font-medium text-gray-700">Active (show on homepage)</label>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" disabled={saving || uploading} className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-medium active:scale-[0.985] transition-all disabled:opacity-70">
                {saving ? "Saving..." : view === "edit" ? "Save Changes" : "Add Popup Ad"}
              </button>
              <button type="button" onClick={goBack} className="flex-1 py-3.5 rounded-2xl font-medium text-gray-600 hover:bg-gray-100 active:scale-95 transition-all">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List View with Liquid Animations
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {filteredAds.length} of {ads.length} {ads.length === 1 ? "ad" : "ads"} · Popup ads appear on the homepage when visitors arrive
        </p>
        <button onClick={openAdd} className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all font-medium shadow-sm">+ Add Popup Ad</button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <input type="text" placeholder="Search by title or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full border border-gray-300 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 text-gray-900 placeholder-gray-400" />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">🔍</div>
        </div>

        <div className="sm:w-56 relative" ref={dropdownRef}>
          <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="w-full border border-gray-300 rounded-3xl px-6 py-4 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-left flex items-center justify-between text-gray-900">
            <span>{activeFilter === "ALL" && "All Popup Ads"}{activeFilter === "ACTIVE" && "Active Only"}{activeFilter === "INACTIVE" && "Inactive Only"}</span>
            <span className={`transition-transform duration-300 ${showFilterDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>

          {showFilterDropdown && (
            <div className="absolute mt-3 w-full bg-white rounded-3xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {[
                { value: "ALL", label: "All Popup Ads" },
                { value: "ACTIVE", label: "Active Only" },
                { value: "INACTIVE", label: "Inactive Only" },
              ].map((option) => (
                <div key={option.value} onClick={() => { setActiveFilter(option.value as "ALL" | "ACTIVE" | "INACTIVE"); setShowFilterDropdown(false); }} className={`px-6 py-3.5 hover:bg-gray-100 cursor-pointer transition-colors ${activeFilter === option.value ? "bg-blue-50 text-blue-700 font-medium" : ""}`}>
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading popup ads...</p></div>
      ) : filteredAds.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-16 text-center animate-in fade-in">
          <p className="text-6xl mb-4">🪟</p>
          <p className="text-xl font-medium">No popup ads found</p>
          <button onClick={openAdd} className="text-blue-600 hover:underline mt-4">Add your first popup ad</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAds.map((ad, index) => (
            <div key={ad.id} className="group bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="relative overflow-hidden h-40">
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl bg-gradient-to-br from-gray-100 to-gray-200">🪟</div>
                )}
                <div className="absolute top-4 left-4">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-md ${ad.isActive ? "bg-green-500/90 text-white" : "bg-gray-500/90 text-white"}`}>
                    {ad.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-lg mb-1 line-clamp-2">{ad.title}</h3>
                {ad.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{ad.description}</p>}
                {ad.linkUrl && <p className="text-blue-600 text-sm truncate">{ad.linkUrl}</p>}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => { fetch(`/api/popup-ads/${ad.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !ad.isActive }) }).then(() => loadAds()); }} className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 ${ad.isActive ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                    {ad.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => openEdit(ad)} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-2xl text-sm font-medium hover:bg-blue-200 transition-all active:scale-95">Edit</button>
                  <button onClick={() => openDeleteModal(ad.id, ad.title)} className="flex-1 py-3 bg-red-100 text-red-700 rounded-2xl text-sm font-medium hover:bg-red-200 transition-all active:scale-95">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}