"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
  order: number;
}

type View = "list" | "add" | "edit";
type ActionType = "added" | "updated" | "deleted" | null;

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [successAction, setSuccessAction] = useState<ActionType>(null);
  const [deletedTitle, setDeletedTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<{ id: string; title: string } | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    title: "",
    image: "",
    link: "",
    active: true,
    order: 0,
  });

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    setForm({ title: "", image: "", link: "", active: true, order: 0 });
    setError("");
    setSuccessAction(null);
    setView("add");
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      image: banner.image,
      link: banner.link,
      active: banner.active,
      order: banner.order,
    });
    setError("");
    setSuccessAction(null);
    setView("edit");
  }

  function goBack() {
    setView("list");
    setEditingBanner(null);
    setError("");
    setSuccessAction(null);
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
      setSuccessAction(action);
      await loadBanners();

      setTimeout(() => {
        setView("list");
        setSuccessAction(null);
      }, 1800);
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(banner: Banner) {
    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !banner.active }),
      });

      if (!res.ok) {
        alert("Failed to update status");
        return;
      }
      await loadBanners();
    } catch {
      alert("Something went wrong");
    }
  }

  function openDeleteModal(id: string, title: string) {
    setBannerToDelete({ id, title });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!bannerToDelete) return;
    try {
      const res = await fetch(`/api/banners/${bannerToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Failed to delete banner");
        return;
      }

      setDeletedTitle(bannerToDelete.title);
      setSuccessAction("deleted");
      await loadBanners();

      setTimeout(() => {
        setSuccessAction(null);
        setDeletedTitle("");
        setView("list");
      }, 1800);
    } catch {
      alert("Something went wrong");
    } finally {
      setShowDeleteModal(false);
      setBannerToDelete(null);
    }
  }

  // Success Screen with animation
  if (successAction) {
    return (
      <div className="flex items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-md scale-95 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {successAction === "added" && "Banner Added!"}
            {successAction === "updated" && "Banner Updated!"}
            {successAction === "deleted" && "Banner Deleted!"}
          </h2>
          <p className="text-gray-600 text-lg">
            {successAction === "deleted"
              ? `"${deletedTitle}" has been removed successfully.`
              : `"${form.title}" has been ${successAction} successfully.`}
          </p>
        </div>
      </div>
    );
  }

  // Delete Modal with better animation
  if (showDeleteModal && bannerToDelete) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
          <div className="p-10">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🗑️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">Delete Banner?</h2>
            <p className="text-gray-600 text-center mt-3">
              Are you sure you want to delete <strong>"{bannerToDelete.title}"</strong>?
            </p>
            <p className="text-sm text-red-600 text-center mt-2">This action cannot be undone.</p>
          </div>
          <div className="border-t flex">
            <button
              onClick={() => { setShowDeleteModal(false); setBannerToDelete(null); }}
              className="flex-1 py-5 text-gray-600 font-medium hover:bg-gray-100 transition-colors rounded-bl-3xl active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-5 bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors rounded-br-3xl active:scale-95"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add / Edit Form
  if (view === "add" || view === "edit") {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {view === "edit" ? "Edit Banner" : "New Banner"}
          </h1>
          <p className="text-gray-500 mt-1">
            {view === "edit" ? "Update banner details" : "Create a new carousel banner"}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form fields remain the same */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
              <input
                type="url"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                min={0}
              />
              <p className="text-xs text-gray-500 mt-1">Lower number = higher priority in carousel</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
              {form.image ? (
                <div className="relative group">
                  <img src={form.image} alt="Preview" className="w-full h-48 object-cover rounded-2xl" />
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                    className="absolute top-3 right-3 bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-700 transition-transform active:scale-90"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-3xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                  <div className="text-center">
                    <p className="text-5xl mb-3">🖼️</p>
                    <p className="font-medium text-gray-700">
                      {uploading ? "Uploading..." : "Click to upload banner image"}
                    </p>
                  </div>
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active (show in carousel)
              </label>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-medium hover:bg-blue-700 active:scale-[0.985] transition-all disabled:opacity-70"
              >
                {saving ? "Saving..." : view === "edit" ? "Save Changes" : "Add Banner"}
              </button>
              <button 
                type="button" 
                onClick={goBack} 
                className="flex-1 py-3.5 rounded-2xl font-medium text-gray-600 hover:bg-gray-100 transition-all active:scale-95"
              >
                Cancel
              </button>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-500 mt-1">
            {filteredBanners.length} of {banners.length} banners
          </p>
        </div>
        <button 
          onClick={openAdd} 
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all font-medium shadow-sm"
        >
          + Add Banner
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <input
            type="text"
            placeholder="Search by title or link..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</div>
        </div>

        <div className="sm:w-56 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="w-full border border-gray-300 rounded-3xl px-6 py-4 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-left flex items-center justify-between text-gray-900"
          >
            <span>
              {activeFilter === "ALL" && "All Banners"}
              {activeFilter === "ACTIVE" && "Active Only"}
              {activeFilter === "INACTIVE" && "Inactive Only"}
            </span>
            <span className={`transition-transform duration-300 ${showFilterDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>

          {showFilterDropdown && (
            <div className="absolute mt-3 w-full bg-white rounded-3xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              {[
                { value: "ALL", label: "All Banners" },
                { value: "ACTIVE", label: "Active Only" },
                { value: "INACTIVE", label: "Inactive Only" },
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setActiveFilter(option.value as "ALL" | "ACTIVE" | "INACTIVE");
                    setShowFilterDropdown(false);
                  }}
                  className={`px-6 py-3.5 hover:bg-gray-100 cursor-pointer transition-colors ${
                    activeFilter === option.value ? "bg-blue-50 text-blue-700 font-medium" : ""
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading banners...</p>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-16 text-center text-gray-500 animate-in fade-in">
          <p className="text-6xl mb-4">🖼️</p>
          <p className="text-xl font-medium">No banners found</p>
          <button onClick={openAdd} className="text-blue-600 hover:underline mt-4">Add your first banner</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBanners.map((banner, index) => (
            <div
              key={banner.id}
              className="group bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="relative overflow-hidden">
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute top-4 left-4">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium backdrop-blur-md ${
                    banner.active ? "bg-green-500/90 text-white" : "bg-gray-500/90 text-white"
                  }`}>
                    {banner.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md">
                  Order: {banner.order}
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-xl mb-1 line-clamp-2">{banner.title}</h3>
                <Link href={banner.link} target="_blank" className="text-blue-600 text-sm hover:underline block truncate">
                  {banner.link}
                </Link>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 ${
                      banner.active 
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" 
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {banner.active ? "Deactivate" : "Activate"}
                  </button>
                  <button 
                    onClick={() => openEdit(banner)} 
                    className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-2xl text-sm font-medium hover:bg-blue-200 transition-all active:scale-95"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => openDeleteModal(banner.id, banner.title)} 
                    className="flex-1 py-3 bg-red-100 text-red-700 rounded-2xl text-sm font-medium hover:bg-red-200 transition-all active:scale-95"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}