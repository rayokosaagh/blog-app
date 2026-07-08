"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LIST, getCategoryDef } from "@/lib/gadgets/categories";

interface GadgetProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initial?: {
    slug: string;
    name: string;
    brand: string;
    image?: string | null;
    priceFrom?: number | null;
    published: boolean;
    categorySlug: string;
    specs: Record<string, any>;
  };
}

export default function GadgetProductForm({ mode, productId, initial }: GadgetProductFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initial?.categorySlug ?? CATEGORY_LIST[0]?.slug ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [priceFrom, setPriceFrom] = useState(initial?.priceFrom?.toString() ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [specs, setSpecs] = useState<Record<string, any>>(initial?.specs ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false); // drives the success screen
  const [uploading, setUploading] = useState(false);

  const def = getCategoryDef(category);

  function updateSpec(key: string, value: any) {
    setSpecs((prev) => ({ ...prev, [key]: value }));
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

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // non-JSON error body
      }

      if (!res.ok) {
        setError(data?.error ?? "Image upload failed");
        return;
      }

      setImage(data.url);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
      // allow re-selecting the same file later
      e.target.value = "";
    }
  }

  // Auto-generate a slug from the name if the user hasn't typed one manually (create mode only)
  function handleNameChange(value: string) {
    setName(value);
    if (mode === "create") {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      slug,
      name,
      brand,
      image: image || null,
      priceFrom: priceFrom || null,
      category,
      specs,
      published,
    };

    try {
      const res = await fetch(
        mode === "create" ? "/api/gadgets/products" : `/api/gadgets/products/${productId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // non-JSON error body (e.g. crashed before responding)
      }

      if (!res.ok) {
        setError(data?.error ?? `Something went wrong (${res.status})`);
        return;
      }

      setSaved(true);
      router.refresh();

      setTimeout(() => {
        router.push("/dashboard/gadgets");
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Success screen — same pattern as the banners page
  if (saved) {
    return (
      <div className="flex items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl p-12 text-center max-w-md scale-95 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-zinc-50 mb-3">
            {mode === "create" ? "Product Added!" : "Product Updated!"}
          </h2>
          <p className="text-gray-600 dark:text-zinc-400 text-lg">
            "{name}" has been {mode === "create" ? "added" : "updated"} successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic fields */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm dark:border dark:border-zinc-800 space-y-4">
        <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">Basic Info</h2>

        <div>
          <label className="block text-sm text-zinc-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSpecs({}); // clear specs — a different category has different fields
            }}
            disabled={mode === "edit"} // switching category post-creation would orphan specs; keep it simple
            className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
          >
            {CATEGORY_LIST.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">Brand</label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
              className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-500 mb-1">Slug (used in URLs)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            disabled={mode === "edit"}
            className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2 disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-500 mb-1">Product Image</label>

          {image ? (
            <div className="relative group w-full h-48">
              <img
                src={image}
                alt="Preview"
                className="w-full h-48 object-cover rounded-2xl border border-zinc-200 dark:border-zinc-700"
              />
              <button
                type="button"
                onClick={() => setImage("")}
                className="absolute top-3 right-3 bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-700 transition-transform active:scale-90"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-all">
              <div className="text-center">
                <p className="text-5xl mb-3">🖼️</p>
                <p className="font-medium text-zinc-700 dark:text-zinc-300">
                  {uploading ? "Uploading..." : "Click to upload a product image"}
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

          <div className="mt-2">
            <label className="block text-xs text-zinc-400 mb-1">Or paste an image URL directly</label>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2 text-sm"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-500 mb-1">Starting Price</label>
          <input
            type="number"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
            placeholder="250000"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published (visible in comparisons)
        </label>
      </div>

      {/* Dynamic spec groups — this is the part driven entirely by the registry */}
      {def?.groups.map((group) => (
        <div key={group.title} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm dark:border dark:border-zinc-800 space-y-4">
          <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50">{group.title}</h2>
          <div className="grid grid-cols-2 gap-4">
            {group.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-zinc-500 mb-1">
                  {field.label} {field.unit && `(${field.unit})`}
                </label>

                {field.type === "boolean" ? (
                  <select
                    value={specs[field.key] ?? ""}
                    onChange={(e) => updateSpec(field.key, e.target.value === "true")}
                    className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
                  >
                    <option value="">—</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : field.type === "select" ? (
                  <select
                    value={specs[field.key] ?? ""}
                    onChange={(e) => updateSpec(field.key, e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
                  >
                    <option value="">—</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "multiline" ? (
                  <textarea
                    value={specs[field.key] ?? ""}
                    onChange={(e) => updateSpec(field.key, e.target.value)}
                    rows={3}
                    className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
                  />
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    value={specs[field.key] ?? ""}
                    onChange={(e) =>
                      updateSpec(field.key, field.type === "number" ? Number(e.target.value) : e.target.value)
                    }
                    className="w-full border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-lg p-2"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={saving || uploading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-60"
      >
        {saving ? "Saving..." : mode === "create" ? "Add Product" : "Save Changes"}
      </button>
    </form>
  );
}