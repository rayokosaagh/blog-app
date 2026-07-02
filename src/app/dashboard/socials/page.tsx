"use client";

import { useState, useEffect } from "react";

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
type ActionType = "added" | "updated" | "deleted" | null;

export default function SocialsPage() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successAction, setSuccessAction] = useState<ActionType>(null);
  const [deletedPlatform, setDeletedPlatform] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [socialToDelete, setSocialToDelete] = useState<{ id: string; platform: string } | null>(null);

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
    setSuccessAction(null);
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
    setSuccessAction(null);
    setView("edit");
  }

  function goBack() {
    setView("list");
    setEditingSocial(null);
    setError("");
  }

  function openDeleteModal(id: string, platform: string) {
    setSocialToDelete({ id, platform });
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!socialToDelete) return;

    try {
      const res = await fetch(`/api/socials/${socialToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      
      setDeletedPlatform(socialToDelete.platform);
      setSuccessAction("deleted");
      await loadSocials();
    } catch {
      alert("Failed to delete social link");
    } finally {
      setShowDeleteModal(false);
      setSocialToDelete(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.platform || !form.url || !form.iconSvg) {
      setError("Platform, URL, and Icon SVG are required");
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
      setSuccessAction(action);
      await loadSocials();

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

  // Success Message
  if (successAction) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="bg-white rounded-2xl shadow p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {successAction === "added" && "Social Link Added!"}
            {successAction === "updated" && "Social Link Updated!"}
            {successAction === "deleted" && "Social Link Deleted!"}
          </h2>
          <p className="text-gray-600">
            {successAction === "deleted" 
              ? `"${deletedPlatform}" has been removed.` 
              : `"${form.platform}" has been ${successAction} successfully.`}
          </p>
        </div>
      </div>
    );
  }

  // Delete Confirmation Modal
  if (showDeleteModal && socialToDelete) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4">
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🗑️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Social Link?</h2>
            <p className="text-gray-600">
              Are you sure you want to delete <strong>"{socialToDelete.platform}"</strong>?
            </p>
            <p className="text-red-600 text-sm mt-2">This action cannot be undone.</p>
          </div>

          <div className="border-t flex">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSocialToDelete(null);
              }}
              className="flex-1 py-4 text-gray-600 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-4 bg-red-600 text-white font-medium hover:bg-red-700"
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
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {view === "edit" ? "Edit Social Link" : "Add New Social Link"}
          </h1>
          <p className="text-gray-500 mt-1">
            {view === "edit" ? "Update existing social link" : "Create a new social media link"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
              <input
                type="text"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                placeholder="YouTube"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://youtube.com/@yourchannel"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-14 h-11 border border-gray-300 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 font-mono text-sm"
                  placeholder="#3b82f6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Text</label>
              <input
                type="text"
                value={form.actionText}
                onChange={(e) => setForm({ ...form, actionText: e.target.value })}
                placeholder="Follow / Subscribe"
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Icon SVG Code</label>
              <textarea
                value={form.iconSvg}
                onChange={(e) => setForm({ ...form, iconSvg: e.target.value })}
                rows={6}
                placeholder='<svg ...></svg>'
                className="w-full border border-gray-300 rounded-xl px-4 py-3 font-mono text-sm"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <label htmlFor="active" className="text-sm font-medium text-gray-700">
                Active (visible on website)
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 font-medium"
              >
                {saving ? "Saving..." : view === "edit" ? "Update Link" : "Add Social Link"}
              </button>
              <button
                type="button"
                onClick={goBack}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Links</h1>
          <p className="text-gray-500 mt-1">Manage your social media profiles</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition font-medium"
        >
          + Add New Link
        </button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-gray-500">Loading...</p>
      ) : socials.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <p className="text-5xl mb-4">🔗</p>
          <p className="text-xl font-medium text-gray-600">No social links yet</p>
          <button onClick={openAdd} className="mt-4 text-blue-600 hover:underline">
            Add your first link
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {socials
            .sort((a, b) => a.order - b.order)
            .map((social) => (
              <div key={social.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 flex items-center justify-center text-2xl"
                      style={{ color: social.color }}
                      dangerouslySetInnerHTML={{ __html: social.iconSvg }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg text-gray-900">{social.platform}</h3>
                        <span className={`text-xs px-3 py-1 rounded-full ${social.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {social.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-blue-600 truncate mt-1">{social.url}</p>
                      {social.actionText && <p className="text-sm text-gray-600 mt-1">{social.actionText}</p>}
                    </div>
                  </div>
                </div>

                <div className="border-t p-4 flex gap-2">
                  <button
                    onClick={() => openEdit(social)}
                    className="flex-1 py-3 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(social.id, social.platform)}
                    className="flex-1 py-3 text-sm bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}