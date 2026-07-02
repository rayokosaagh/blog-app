"use client";

import { useState, useEffect } from "react";
import TagIcon from "./TagIcon";

export interface Tag {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface TagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export default function TagPicker({ selectedTagIds, onChange }: TagPickerProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  function toggleTag(id: string) {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, icon: newIcon }),
      });
      const tag = await res.json();

      if (!res.ok) {
        alert(tag.error || "Failed to create tag");
        return;
      }

      setTags((prev) =>
        prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]
      );
      onChange([...selectedTagIds, tag.id]);
      setNewName("");
      setNewIcon("");
    } catch (err) {
      alert("Failed to create tag");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTag(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete the "${name}" tag? This removes it from every post, not just this one.`
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete tag");
        return;
      }

      setTags((prev) => prev.filter((t) => t.id !== id));
      onChange(selectedTagIds.filter((t) => t !== id));
    } catch (err) {
      alert("Failed to delete tag");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Tags
      </label>

      {loading ? (
        <p className="text-sm text-gray-400">Loading tags...</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <span
                key={tag.id}
                className={`group relative flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
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
                  <TagIcon icon={tag.icon} className="inline-flex w-4 h-4 [&>svg]:w-full [&>svg]:h-full" />
                  <span>{tag.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag.id, tag.name)}
                  disabled={deletingId === tag.id}
                  title={`Delete "${tag.name}" tag`}
                  className={`flex items-center justify-center w-5 h-5 rounded-full text-xs leading-none transition-colors disabled:opacity-50 ${
                    selected
                      ? "hover:bg-white/20 text-white/80 hover:text-white"
                      : "hover:bg-red-50 text-gray-400 hover:text-red-600"
                  }`}
                >
                  {deletingId === tag.id ? "…" : "✕"}
                </button>
              </span>
            );
          })}
          {tags.length === 0 && (
            <p className="text-sm text-gray-400">No tags yet — create one below.</p>
          )}
        </div>
      )}

      {/* Inline create new tag */}
      <div className="flex items-start gap-2 border-t border-gray-100 pt-3">
        <div className="flex flex-col items-center gap-1">
          <textarea
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            placeholder="🏷️ or <svg>...</svg>"
            rows={2}
            className="w-32 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
          />
          <div className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-md bg-gray-50">
            <TagIcon icon={newIcon || "🏷️"} className="inline-flex w-5 h-5 [&>svg]:w-full [&>svg]:h-full" />
          </div>
        </div>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New tag name"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        <button
          type="button"
          onClick={handleCreateTag}
          disabled={creating || !newName.trim()}
          className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
        >
          {creating ? "Adding..." : "Add"}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Paste an emoji (🚀) or raw SVG markup (&lt;svg&gt;...&lt;/svg&gt;) as the icon, then click Add. Click a tag to select it, or the ✕ to delete it everywhere.
      </p>
    </div>
  );
}