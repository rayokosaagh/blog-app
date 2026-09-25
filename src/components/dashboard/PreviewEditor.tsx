"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { isValidHex, normalizeHex, contrastRatio } from "@/lib/color";

/**
 * Click-to-edit for the appearance previews. Elements in a preview become
 * targets; clicking one opens a small editor anchored under it, bound to the
 * same form state as the controls beside the preview. Nothing here saves —
 * edits ride the panel's existing Save button.
 */

/** Where the editor sits, in the preview container's own coordinates. */
export type Anchor = {
  top: number;
  left: number;
  containerWidth: number;
  containerHeight: number;
};

// Below this preview width, targets wrap tightly enough that a panel under
// the clicked one would cover its neighbours — so it docks under the whole
// preview instead.
const DOCK_BELOW_WIDTH = 480;

// Hover/focus/open affordance. Outline rather than border so it never shifts
// the layout being previewed. Width is set per state: in Tailwind v4 a bare
// `outline-2` also turns a solid outline on.
export const TARGET_CLASS =
  "cursor-pointer outline-offset-2 outline-amber-500 hover:outline-2 hover:outline-dashed focus-visible:outline-2 focus-visible:outline-dashed data-[active]:outline-2 data-[active]:outline-dashed";

export function usePreviewEditor<K extends string>(onOpen?: (key: K) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [editing, setEditing] = useState<{ key: K; anchor: Anchor } | null>(null);

  function open(key: K, el: HTMLElement) {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;
    const r = el.getBoundingClientRect();
    openerRef.current = el;
    setEditing({
      key,
      anchor: {
        top: r.bottom - box.top,
        left: r.left - box.left,
        containerWidth: box.width,
        containerHeight: box.height,
      },
    });
    onOpen?.(key);
  }

  /** Close; `restoreFocus` hands focus back to the element that opened it. */
  function close(restoreFocus = false) {
    setEditing(null);
    if (restoreFocus) openerRef.current?.focus();
  }

  /** Props that make an element a target. `highlighted` forces the outline. */
  function target(key: K, label: string, highlighted = false) {
    const active = editing?.key === key;
    return {
      role: "button" as const,
      tabIndex: 0,
      title: `Edit ${label}`,
      "aria-label": `Edit ${label}`,
      "aria-expanded": active,
      "data-preview-target": "",
      "data-active": active || highlighted ? "" : undefined,
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        // Targets nest (a badge inside a card) — the innermost one wins.
        e.stopPropagation();
        if (active) close();
        else open(key, e.currentTarget);
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        open(key, e.currentTarget);
      },
    };
  }

  return { containerRef, editing, close, target };
}

export function PreviewEditPopover({
  anchor,
  title,
  hint,
  width = 288,
  onClose,
  children,
}: {
  anchor: Anchor;
  title: string;
  hint?: string;
  width?: number;
  onClose: (restoreFocus?: boolean) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Element | null;
      if (!t || ref.current?.contains(t)) return;
      // A press on another target re-anchors via its own click handler.
      if (t.closest("[data-preview-target]")) return;
      onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose(true);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Keep the panel inside the preview horizontally; it may hang below it.
  // Narrow previews dock it under the whole preview, full width.
  const docked = anchor.containerWidth < DOCK_BELOW_WIDTH;
  const w = docked ? anchor.containerWidth : Math.min(width, anchor.containerWidth - 16);
  const left = docked ? 0 : Math.max(8, Math.min(anchor.left, anchor.containerWidth - w - 8));
  const top = docked ? anchor.containerHeight : anchor.top;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className="absolute z-30 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      style={{ top: top + 8, left, width: w }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
          {hint && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => onClose(true)}
          aria-label="Close editor"
          className="shrink-0 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Swatch + hex field. Stores what's typed, like the pickers beside it. */
export function PopoverColorField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const valid = isValidHex(value);
  return (
    <div className="flex items-center gap-2">
      <label
        className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
        style={{ backgroundColor: valid ? value : "transparent" }}
      >
        <input
          type="color"
          value={valid ? normalizeHex(value) : "#000000"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label="Pick color"
        />
      </label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-label="Hex color"
        autoFocus
        className={`min-w-0 flex-1 rounded-lg border bg-transparent px-2.5 py-1.5 font-mono text-xs uppercase text-zinc-900 outline-none disabled:opacity-50 dark:text-zinc-100 ${
          valid
            ? "border-zinc-200 focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
            : "border-red-400 focus:border-red-500"
        }`}
      />
    </div>
  );
}

// WCAG AA for normal-size text; the accent fills carry 9–14px labels.
const MIN_READABLE_CONTRAST = 4.5;

/**
 * Text colour on an accent fill: "Auto" (contrast-derived) until the admin
 * picks one. Shows the live contrast ratio against the fill and warns — but
 * doesn't block — below AA.
 */
export function PopoverTextColorField({
  value,
  auto,
  fill,
  onChange,
}: {
  /** The override, or null for auto. */
  value: string | null;
  /** What auto resolves to, shown while no override is set. */
  auto: string;
  fill: string;
  onChange: (hex: string | null) => void;
}) {
  const effective = value ?? auto;
  const ratio = contrastRatio(isValidHex(effective) ? effective : auto, fill);
  const readable = ratio !== null && ratio >= MIN_READABLE_CONTRAST;

  return (
    <div>
      <div className="flex items-center gap-2">
        <label
          className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
          style={{ backgroundColor: fill }}
        >
          {/* The swatch shows the text ON the fill, which is the thing being judged. */}
          <span
            className="absolute inset-0 flex items-center justify-center text-sm font-extrabold"
            style={{ color: isValidHex(effective) ? effective : auto }}
          >
            Aa
          </span>
          <input
            type="color"
            value={isValidHex(effective) ? normalizeHex(effective) : normalizeHex(auto)}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Pick text color"
          />
        </label>
        {value === null ? (
          <span className="min-w-0 flex-1 rounded-lg border border-dashed border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
            Auto · <span className="font-mono uppercase">{auto}</span>
          </span>
        ) : (
          <>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              aria-label="Text hex color"
              className={`min-w-0 flex-1 rounded-lg border bg-transparent px-2.5 py-1.5 font-mono text-xs uppercase text-zinc-900 outline-none dark:text-zinc-100 ${
                isValidHex(value)
                  ? "border-zinc-200 focus:border-zinc-400 dark:border-zinc-700 dark:focus:border-zinc-500"
                  : "border-red-400 focus:border-red-500"
              }`}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Auto
            </button>
          </>
        )}
      </div>
      {ratio !== null && (
        <p
          className={`mt-1.5 text-xs ${
            readable ? "text-zinc-500 dark:text-zinc-400" : "text-amber-600 dark:text-amber-400"
          }`}
        >
          Contrast {ratio.toFixed(1)}:1
          {readable ? " · readable" : " · hard to read at small sizes"}
        </p>
      )}
    </div>
  );
}
