"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImagePlus,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CATEGORY_LIST, getCategoryDef } from "@/lib/gadgets/categories";
import TagPicker from "@/components/blog/TagPicker";
import ColorVariantsEditor from "@/components/gadgets/ColorVariantsEditor";
import StickyFormActions from "@/components/dashboard/StickyFormActions";
import type { ProductColor } from "@/lib/gadgets/colors";

interface GadgetProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initial?: {
    slug: string;
    name: string;
    brand: string;
    image?: string | null;
    images?: string[] | null;
    colors?: ProductColor[] | null;
    priceFrom?: number | null;
    published: boolean;
    categorySlug: string;
    specs: Record<string, any>;
    tagIds?: string[];   // ← add this
  };
}

const inputClass =
  "w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed";

const labelClass = "block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5";

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2
          className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

export default function GadgetProductForm({ mode, productId, initial }: GadgetProductFormProps) {
  const router = useRouter();
  const [category, setCategory] = useState(initial?.categorySlug ?? CATEGORY_LIST[0]?.slug ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [colors, setColors] = useState<ProductColor[]>(initial?.colors ?? []);
  const [colorsUploading, setColorsUploading] = useState(false);
  const [priceFrom, setPriceFrom] = useState(initial?.priceFrom?.toString() ?? "");
  const [published, setPublished] = useState(initial?.published ?? true);
  const [specs, setSpecs] = useState<Record<string, any>>(initial?.specs ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
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
      e.target.value = "";
    }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setGalleryUploading(true);
    setError("");
    const uploaded: string[] = [];
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // non-JSON error body
        }
        if (!res.ok) {
          setError(data?.error ?? "Image upload failed");
          break;
        }
        uploaded.push(data.url);
      }
      if (uploaded.length) setImages((prev) => [...prev, ...uploaded]);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setGalleryUploading(false);
      e.target.value = "";
    }
  }

  function removeGalleryImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveGalleryImage(idx: number, dir: -1 | 1) {
    setImages((prev) => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

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
  images,
  colors,
  priceFrom: priceFrom || null,
  category,
  specs,
  published,
  tagIds,   // ← add this
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
        // non-JSON error body
      }

      if (!res.ok) {
        const base = data?.error ?? `Something went wrong (${res.status})`;
        setError(data?.detail ? `${base}: ${data.detail}` : base);
        return;
      }

      setSaved(true);
      router.refresh();

      setTimeout(() => {
        router.push("/dashboard/gadgets");
      }, 1200);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl pb-24">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm px-4 py-3 rounded-xl"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Basic info */}
        <FormCard title="Basic info">
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSpecs({});
              }}
              disabled={mode === "edit"}
              className={inputClass}
            >
              {CATEGORY_LIST.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            {mode === "edit" && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
                Category can't be changed after creation.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="e.g. Galaxy S25 Ultra"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                placeholder="e.g. Samsung"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              disabled={mode === "edit"}
              placeholder="used-in-urls"
              className={`${inputClass} font-mono text-xs`}
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>

          <div>
            <label className={labelClass}>Product image</label>

            {image ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-rose-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors">
                <div className="text-center">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-2 animate-spin" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
                  )}
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    {uploading ? "Uploading…" : "Click to upload an image"}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    PNG or JPG, up to a few MB
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

            <div className="mt-2.5">
              <label className="block text-xs text-zinc-400 dark:text-zinc-500 mb-1">
                Or paste an image URL
              </label>
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={`${inputClass} text-xs`}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Starting price</label>
            <input
              type="number"
              value={priceFrom}
              onChange={(e) => setPriceFrom(e.target.value)}
              className={inputClass}
              placeholder="250000"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Published</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                Visible in comparisons when on.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={published}
              onClick={() => setPublished((p) => !p)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                published ? "bg-blue-500" : "bg-zinc-200 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`inline-block h-4.5 w-4.5 h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${
                  published ? "translate-x-[22px]" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </FormCard>

        {/* Gallery */}
        <FormCard title="Gallery">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1">
            Extra photos shown in the carousel on the product page, alongside the main image.
          </p>

          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative group aspect-square rounded-xl overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    aria-label="Remove image"
                    className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => moveGalleryImage(i, -1)}
                      disabled={i === 0}
                      aria-label="Move earlier"
                      className="bg-black/60 hover:bg-black text-white rounded w-6 h-6 flex items-center justify-center disabled:opacity-30"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryImage(i, 1)}
                      disabled={i === images.length - 1}
                      aria-label="Move later"
                      className="bg-black/60 hover:bg-black text-white rounded w-6 h-6 flex items-center justify-center disabled:opacity-30"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-colors">
            <div className="text-center">
              {galleryUploading ? (
                <Loader2 className="h-6 w-6 text-blue-500 mx-auto mb-2 animate-spin" />
              ) : (
                <ImagePlus className="h-6 w-6 text-zinc-400 mx-auto mb-2" />
              )}
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                {galleryUploading ? "Uploading…" : "Click to add gallery images"}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                You can select multiple files
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
              disabled={galleryUploading}
            />
          </label>
        </FormCard>

        {/* Color variants */}
        <FormCard title="Colors">
          <ColorVariantsEditor
            value={colors}
            onChange={setColors}
            onBusyChange={setColorsUploading}
            onError={setError}
          />
        </FormCard>

        <FormCard title="Tags">
  <TagPicker selectedTagIds={tagIds} onChange={setTagIds} />
</FormCard>

        {/* Dynamic spec groups */}
        {def?.groups.map((group) => (
          <FormCard key={group.title} title={group.title}>
            <div className="grid grid-cols-2 gap-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className={labelClass}>
                    {field.label} {field.unit && <span className="font-normal">({field.unit})</span>}
                  </label>

                  {field.type === "boolean" ? (
                    <select
                      value={specs[field.key] ?? ""}
                      onChange={(e) => updateSpec(field.key, e.target.value === "true")}
                      className={inputClass}
                    >
                      <option value="">—</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : field.type === "select" ? (
                    <select
                      value={specs[field.key] ?? ""}
                      onChange={(e) => updateSpec(field.key, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">—</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "multiline" ? (
                    <textarea
                      value={specs[field.key] ?? ""}
                      onChange={(e) => updateSpec(field.key, e.target.value)}
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  ) : (
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={specs[field.key] ?? ""}
                      onChange={(e) =>
                        updateSpec(
                          field.key,
                          field.type === "number" ? Number(e.target.value) : e.target.value
                        )
                      }
                      className={inputClass}
                    />
                  )}
                </div>
              ))}
            </div>
          </FormCard>
        ))}

        {/* Sticky action bar */}
        <StickyFormActions
          saving={saving}
          disabled={uploading || galleryUploading || colorsUploading}
          submitLabel={mode === "create" ? "Add product" : "Save changes"}
          onCancel={() => router.push("/dashboard/gadgets")}
        />
      </form>

      {/* Success toast */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 bg-white dark:bg-zinc-900 rounded-xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 shadow-lg p-4 flex items-center gap-3 max-w-sm"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-zinc-700 dark:text-zinc-200">
              <span className="font-medium">{name}</span>{" "}
              {mode === "create" ? "was added" : "was updated"}.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}