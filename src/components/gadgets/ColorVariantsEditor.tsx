"use client";

import { useEffect, useRef, useState } from "react";
import { Pipette, Plus, X, ImagePlus, Loader2, GripVertical } from "lucide-react";
import type { ProductColor } from "@/lib/gadgets/colors";
import { normalizeHex } from "@/lib/gadgets/colors";
import { useFileDrop, DROP_ACTIVE_CLASS } from "@/components/dashboard/useFileDrop";

interface Props {
  value: ProductColor[];
  onChange: (next: ProductColor[]) => void;
  /** Bubble upload state up so the parent form can disable Save while busy. */
  onBusyChange?: (busy: boolean) => void;
  onError?: (msg: string) => void;
}

const inputClass =
  "w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all";

export default function ColorVariantsEditor({ value, onChange, onBusyChange, onError }: Props) {
  const [supportsEyeDropper, setSupportsEyeDropper] = useState(false);
  // Track uploads per row so each slot shows its own spinner.
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    setSupportsEyeDropper(typeof window !== "undefined" && "EyeDropper" in window);
  }, []);

  function update(idx: number, patch: Partial<ProductColor>) {
    onChange(value.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function add() {
    onChange([...value, { name: "", hex: "#3b82f6", image: null }]);
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[idx], next[j]] = [next[j], next[idx]];
    onChange(next);
  }

  async function pickWithEyeDropper(idx: number) {
    // Chromium-only screen color picker. Feature-detected above.
    const EyeDropperCtor = (window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
    if (!EyeDropperCtor) return;
    try {
      const result = await new EyeDropperCtor().open();
      update(idx, { hex: normalizeHex(result.sRGBHex) });
    } catch {
      // user pressed Escape — ignore
    }
  }

  async function uploadImage(idx: number, file: File) {
    setUploadingIdx(idx);
    onBusyChange?.(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      let data: { url?: string; error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        // non-JSON error body
      }
      if (!res.ok || !data?.url) {
        onError?.(data?.error ?? "Image upload failed");
        return;
      }
      update(idx, { image: data.url });
    } catch {
      onError?.("Image upload failed. Please try again.");
    } finally {
      setUploadingIdx(null);
      onBusyChange?.(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400 dark:text-zinc-500 -mt-1">
        Color variants shown as swatches on the product page. Add a photo of the device in each
        color — it previews when a shopper hovers the swatch. Drop an image anywhere on a row to
        attach it to that color.
      </p>

      {value.length > 0 && (
        <div className="space-y-3">
          {value.map((color, idx) => (
            <ColorRow
              key={idx}
              color={color}
              idx={idx}
              isFirst={idx === 0}
              isLast={idx === value.length - 1}
              uploading={uploadingIdx === idx}
              supportsEyeDropper={supportsEyeDropper}
              onUpdate={update}
              onRemove={remove}
              onMove={move}
              onPick={pickWithEyeDropper}
              onUpload={uploadImage}
              onReject={onError}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add color
      </button>
    </div>
  );
}

function ColorRow({
  color,
  idx,
  isFirst,
  isLast,
  uploading,
  supportsEyeDropper,
  onUpdate,
  onRemove,
  onMove,
  onPick,
  onUpload,
  onReject,
}: {
  color: ProductColor;
  idx: number;
  isFirst: boolean;
  isLast: boolean;
  uploading: boolean;
  supportsEyeDropper: boolean;
  onUpdate: (idx: number, patch: Partial<ProductColor>) => void;
  onRemove: (idx: number) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
  onPick: (idx: number) => void;
  onUpload: (idx: number, file: File) => void;
  onReject?: (msg: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  // The 40px thumbnail is far too small to aim a dragged file at, so the whole
  // row accepts the drop and routes it to this color's image.
  const drop = useFileDrop({
    onFiles: (files) => onUpload(idx, files[0]),
    disabled: uploading,
    onReject,
  });

  return (
    <div
      {...drop.dropProps}
      className={`relative flex flex-wrap items-center gap-3 rounded-xl ring-1 p-3 transition-colors ${
        drop.isDragging
          ? DROP_ACTIVE_CLASS
          : "ring-zinc-200/70 dark:ring-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30"
      }`}
    >
      {drop.isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-blue-500/80 text-xs font-semibold text-white pointer-events-none">
          Drop photo for {color.name?.trim() || "this color"}
        </div>
      )}
      <div className="flex flex-col text-zinc-300 dark:text-zinc-600">
        <button
          type="button"
          onClick={() => onMove(idx, -1)}
          disabled={isFirst}
          aria-label="Move up"
          className="hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-300 leading-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden ring-1 ring-zinc-300 dark:ring-zinc-600">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(color.hex) ? color.hex : "#cccccc"}
          onChange={(e) => onUpdate(idx, { hex: e.target.value })}
          aria-label="Pick color"
          className="absolute -inset-2 h-14 w-14 cursor-pointer border-0 bg-transparent p-0"
        />
      </div>

      <input
        value={color.name}
        onChange={(e) => onUpdate(idx, { name: e.target.value })}
        placeholder="Color name (e.g. Titanium Blue)"
        className={`${inputClass} flex-1 min-w-[8rem]`}
      />

      <input
        value={color.hex}
        onChange={(e) => onUpdate(idx, { hex: e.target.value })}
        placeholder="#3b82f6"
        className={`${inputClass} w-28 font-mono text-xs`}
        style={{ fontFamily: "var(--font-mono)" }}
      />

      {supportsEyeDropper && (
        <button
          type="button"
          onClick={() => onPick(idx)}
          aria-label="Pick color from screen"
          title="Pick color from screen"
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:ring-blue-400 transition-colors"
        >
          <Pipette className="h-4 w-4" />
        </button>
      )}

      {color.image ? (
        <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden ring-1 ring-zinc-300 dark:ring-zinc-600 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={color.image} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onUpdate(idx, { image: null })}
            aria-label="Remove color image"
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 text-white opacity-0 hover:opacity-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Upload color image"
          title="Upload a photo of this color"
          className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ring-dashed ring-zinc-300 dark:ring-zinc-600 text-zinc-400 hover:text-blue-500 hover:ring-blue-400 transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(idx, file);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => onRemove(idx)}
        aria-label="Remove color"
        className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
