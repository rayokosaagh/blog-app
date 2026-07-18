"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil } from "lucide-react";
import TagIcon from "./TagIcon";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  icon: string;
  colorMode: "AUTO" | "KEEP_ORIGINAL" | "FORCE_MONO";
}

interface TagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export default function TagPicker({ selectedTagIds, onChange }: TagPickerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [creating, setCreating] = useState(false);
  const [addError, setAddError] = useState("");
  const [newColorMode, setNewColorMode] = useState<"AUTO" | "KEEP_ORIGINAL" | "FORCE_MONO">("AUTO");
  const [editColorMode, setEditColorMode] = useState<"AUTO" | "KEEP_ORIGINAL" | "FORCE_MONO">("AUTO");

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<Tag | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  // Edit success modal
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [editedTagName, setEditedTagName] = useState("");

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchTags();
  }, []);

  async function fetchTags() {
    try {
      const res = await fetch("/api/tags");
      const data = await res.json();
      setTags(data);
    } catch (err) {
      console.error("Failed to load tags", err);
    } finally {
      setLoading(false);
    }
  }

  // Show selected tags first, in the order they were selected, then the rest.
  const orderedTags = useMemo(() => {
    const byId = new Map(tags.map((t) => [t.id, t]));
    const selected = selectedTagIds
      .map((id) => byId.get(id))
      .filter((t): t is Tag => Boolean(t));
    const unselected = tags.filter((t) => !selectedTagIds.includes(t.id));
    return [...selected, ...unselected];
  }, [tags, selectedTagIds]);

  function toggleTag(id: string) {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  }

  function openAddModal() {
    setNewName("");
    setNewIcon("");
    setNewColorMode("AUTO");
    setAddError("");
    setShowAddModal(true);
  }

  async function handleCreateTag(e?: React.FormEvent) {
    e?.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setAddError("");
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, icon: newIcon, colorMode: newColorMode }),
      });
      const tag = await res.json();

      if (!res.ok) {
        setAddError(tag.error || "Failed to create tag");
        return;
      }

      setTags((prev) =>
        prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]
      );
      onChange([...selectedTagIds, tag.id]);
      setShowAddModal(false);
      setNewName("");
      setNewIcon("");
    } catch (err) {
      setAddError("Failed to create tag");
    } finally {
      setCreating(false);
    }
  }

  function openEditModal(tag: Tag) {
    setTagToEdit(tag);
    setEditName(tag.name);
    setEditIcon(tag.icon);
    setEditColorMode(tag.colorMode ?? "AUTO");
    setEditError("");
    setShowEditModal(true);
  }

  async function handleEditTag(e?: React.FormEvent) {
    e?.preventDefault();
    if (!tagToEdit || !editName.trim()) return;

    setEditing(true);
    setEditError("");
    try {
      const res = await fetch(`/api/tags/${tagToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, icon: editIcon, colorMode: editColorMode }),
      });
      const updated = await res.json();

      if (!res.ok) {
        setEditError(updated.error || "Failed to update tag");
        return;
      }

      setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setShowEditModal(false);
      setTagToEdit(null);
      setEditedTagName(updated.name);
      setShowEditSuccessModal(true);
    } catch (err) {
      setEditError("Failed to update tag");
    } finally {
      setEditing(false);
    }
  }

  function openDeleteModal(tag: Tag) {
    setTagToDelete(tag);
    setDeleteError("");
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!tagToDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/tags/${tagToDelete.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete tag");
        return;
      }

      setTags((prev) => prev.filter((t) => t.id !== tagToDelete.id));
      onChange(selectedTagIds.filter((t) => t !== tagToDelete.id));
      setShowDeleteModal(false);
      setTagToDelete(null);
    } catch (err) {
      setDeleteError("Failed to delete tag");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">Tags</label>
        <button
          type="button"
          onClick={openAddModal}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          + Add Tag
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading tags...</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-1">
          <AnimatePresence initial={false}>
            {orderedTags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <motion.span
                  key={tag.id}
                  layout
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className={`group relative flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium border ${
                    selected
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="flex items-center gap-1.5"
                  >
                    <motion.span
                      layout
                      className="inline-flex w-4 h-4 [&>svg]:w-full [&>svg]:h-full"
                    >
                      <TagIcon icon={tag.icon} className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full" colorMode={tag.colorMode} />
                    </motion.span>
                    <span>{tag.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(tag)}
                    title={`Edit "${tag.name}" tag`}
                    className={`flex items-center justify-center w-5 h-5 rounded-full transition-colors ${
                      selected
                        ? "hover:bg-white/20 text-white/80 hover:text-white"
                        : "hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(tag)}
                    title={`Delete "${tag.name}" tag`}
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-xs leading-none transition-colors ${
                      selected
                        ? "hover:bg-white/20 text-white/80 hover:text-white"
                        : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                    }`}
                  >
                    ✕
                  </button>
                </motion.span>
              );
            })}
          </AnimatePresence>
          {tags.length === 0 && (
            <p className="text-sm text-gray-400">No tags yet — click "+ Add Tag" to create one.</p>
          )}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-1">
        Click a tag to select it, the pencil to edit it, or ✕ to delete it everywhere.
      </p>

      {/* Delete Modal */}
      {showDeleteModal && tagToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🗑️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Delete Tag?</h2>
              <p className="text-gray-600 text-center mt-3">
                Are you sure you want to delete <strong>"{tagToDelete.name}"</strong>? This removes it from every post, not just this one.
              </p>
              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-2xl mt-4 text-sm text-center">
                  {deleteError}
                </div>
              )}
            </div>
            <div className="border-t flex">
              <button
                onClick={() => { setShowDeleteModal(false); setTagToDelete(null); }}
                disabled={deleting}
                className="flex-1 py-5 text-gray-600 font-medium hover:bg-gray-100 active:scale-95 transition-all rounded-bl-3xl disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-5 bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all rounded-br-3xl disabled:opacity-70"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add New Tag</h2>

              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">
                  {addError}
                </div>
              )}

              <div
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <TagIcon icon={newIcon || "🏷️"} className="inline-flex w-8 h-8 [&>svg]:w-full [&>svg]:h-full" colorMode={newColorMode} />
                    </div>
                    <textarea
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      placeholder="🏷️ or <svg>...</svg>"
                      rows={3}
                      className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Paste an emoji (🚀) or raw SVG markup (&lt;svg&gt;...&lt;/svg&gt;) as the icon.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New tag name"
                    className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Icon color handling
                  </label>
                  <select
                    value={newColorMode}
                    onChange={(e) => setNewColorMode(e.target.value as typeof newColorMode)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AUTO">Auto (recommended)</option>
                    <option value="KEEP_ORIGINAL">Keep original colors always</option>
                    <option value="FORCE_MONO">Force single color (theme text color)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => handleCreateTag()}
                    disabled={creating || !newName.trim()}
                    className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-medium active:scale-[0.985] transition-all disabled:opacity-70"
                  >
                    {creating ? "Adding..." : "Add Tag"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    disabled={creating}
                    className="flex-1 py-3.5 rounded-2xl font-medium text-gray-600 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && tagToEdit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Edit Tag</h2>

              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl mb-6">
                  {editError}
                </div>
              )}

              <div
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
                    e.preventDefault();
                    handleEditTag();
                  }
                }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <TagIcon icon={editIcon || "🏷️"} className="inline-flex w-8 h-8 [&>svg]:w-full [&>svg]:h-full" colorMode={editColorMode} />
                    </div>
                    <textarea
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      placeholder="🏷️ or <svg>...</svg>"
                      rows={3}
                      className="flex-1 border border-gray-300 rounded-2xl px-4 py-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Paste an emoji (🚀) or raw SVG markup (&lt;svg&gt;...&lt;/svg&gt;) as the icon.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Tag name"
                    className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    required
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Icon color handling
                  </label>
                  <select
                    value={editColorMode}
                    onChange={(e) => setEditColorMode(e.target.value as typeof editColorMode)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AUTO">Auto (recommended)</option>
                    <option value="KEEP_ORIGINAL">Keep original colors always</option>
                    <option value="FORCE_MONO">Force single color (theme text color)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => handleEditTag()}
                    disabled={editing || !editName.trim()}
                    className="flex-1 bg-blue-600 text-white py-3.5 rounded-2xl font-medium active:scale-[0.985] transition-all disabled:opacity-70"
                  >
                    {editing ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setTagToEdit(null); }}
                    disabled={editing}
                    className="flex-1 py-3.5 rounded-2xl font-medium text-gray-600 hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Success Modal */}
      {showEditSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden scale-95 animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 text-center">Tag Updated</h2>
              <p className="text-gray-600 text-center mt-3">
                <strong>"{editedTagName}"</strong> was updated successfully.
              </p>
            </div>
            <div className="border-t">
              <button
                onClick={() => setShowEditSuccessModal(false)}
                className="w-full py-5 text-gray-700 font-semibold hover:bg-gray-100 active:scale-95 transition-all rounded-b-3xl"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}