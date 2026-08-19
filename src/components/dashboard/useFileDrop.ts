"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// Aliased so the DOM's global `DragEvent` stays available for the window listener.
import type { DragEvent as ReactDragEvent } from "react";

/**
 * Drag-and-drop for the dashboard's image fields.
 *
 * Every upload field in the dashboard posts to `/api/upload`, which accepts the
 * types below and nothing else. Filtering here means an unusable file is
 * rejected with a readable message instead of a bare 400 from the route.
 */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"] as const;
export const MEDIA_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES] as const;

/** Mirrors the size caps enforced by `/api/upload`. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

function isVideo(file: File) {
  return (VIDEO_TYPES as readonly string[]).includes(file.type);
}

/**
 * Teaching people to drag files onto the page makes a *miss* expensive: a file
 * dropped outside a zone is opened by the browser as a navigation, which throws
 * away everything unsaved in the form. Any mounted drop zone suppresses that.
 * Refcounted so the listeners survive until the last zone unmounts.
 */
let strayDropGuards = 0;
function swallow(e: DragEvent) {
  // Only files — leaving text/link drags alone keeps native inputs usable.
  if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
}
function useStrayDropGuard() {
  useEffect(() => {
    if (strayDropGuards++ === 0) {
      window.addEventListener("dragover", swallow);
      window.addEventListener("drop", swallow);
    }
    return () => {
      if (--strayDropGuards === 0) {
        window.removeEventListener("dragover", swallow);
        window.removeEventListener("drop", swallow);
      }
    };
  }, []);
}

export interface UseFileDropOptions {
  /** Called with the accepted files. Receives at most one unless `multiple`. */
  onFiles: (files: File[]) => void | Promise<void>;
  /** Ignore drops entirely — pass the field's `uploading` flag here. */
  disabled?: boolean;
  /** Keep every dropped file rather than just the first. */
  multiple?: boolean;
  /** Defaults to images only; pass `MEDIA_TYPES` for fields that take video. */
  accept?: readonly string[];
  /** Surfaced when a drop is rejected — wire to the field's error setter. */
  onReject?: (message: string) => void;
}

export interface FileDropZone {
  /** True while an acceptable drag is over the zone — drive the ring/tint off this. */
  isDragging: boolean;
  /** Spread onto the element that should accept drops. */
  dropProps: {
    onDragEnter: (e: ReactDragEvent) => void;
    onDragOver: (e: ReactDragEvent) => void;
    onDragLeave: (e: ReactDragEvent) => void;
    onDrop: (e: ReactDragEvent) => void;
  };
}

export function useFileDrop({
  onFiles,
  disabled = false,
  multiple = false,
  accept = IMAGE_TYPES,
  onReject,
}: UseFileDropOptions): FileDropZone {
  const [isDragging, setDragging] = useState(false);

  // dragenter/dragleave also fire for descendants, so a zone with children
  // would flicker off the moment the pointer crossed one. Counting enters and
  // leaves keeps the highlight on until the pointer truly exits the zone.
  const depth = useRef(0);

  useStrayDropGuard();

  const reset = useCallback(() => {
    depth.current = 0;
    setDragging(false);
  }, []);

  const hasFiles = (e: ReactDragEvent) => e.dataTransfer?.types?.includes("Files");

  const onDragEnter = useCallback(
    (e: ReactDragEvent) => {
      if (disabled || !hasFiles(e)) return;
      e.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    [disabled]
  );

  const onDragOver = useCallback(
    (e: ReactDragEvent) => {
      if (disabled || !hasFiles(e)) return;
      // Without this the browser handles the drop itself and navigates away.
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [disabled]
  );

  const onDragLeave = useCallback(
    (e: ReactDragEvent) => {
      if (disabled || !hasFiles(e)) return;
      e.preventDefault();
      depth.current -= 1;
      if (depth.current <= 0) reset();
    },
    [disabled, reset]
  );

  const onDrop = useCallback(
    (e: ReactDragEvent) => {
      if (disabled || !hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      reset();

      const dropped = Array.from(e.dataTransfer.files ?? []);
      if (dropped.length === 0) return;

      const wrongType = dropped.filter((f) => !accept.includes(f.type));
      const tooBig = dropped.filter(
        (f) => f.size > (isVideo(f) ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)
      );
      const ok = dropped.filter((f) => !wrongType.includes(f) && !tooBig.includes(f));

      if (wrongType.length > 0) {
        const takesVideo = accept.includes("video/mp4");
        onReject?.(
          `${wrongType.length === 1 ? `"${wrongType[0].name}" is` : `${wrongType.length} files are`}` +
            ` not a supported format — use JPG, PNG, GIF or WebP${takesVideo ? ", or MP4/WebM/OGG video" : ""}.`
        );
      } else if (tooBig.length > 0) {
        onReject?.(
          `${tooBig.length === 1 ? `"${tooBig[0].name}" is` : `${tooBig.length} files are`}` +
            ` too large — images max 5MB, videos max 20MB.`
        );
      }

      if (ok.length === 0) return;
      void onFiles(multiple ? ok : [ok[0]]);
    },
    [disabled, accept, multiple, onFiles, onReject, reset]
  );

  return { isDragging, dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}

/**
 * Ring + tint applied to a zone while a file hovers it. Shared so every field
 * in the dashboard gives the same feedback.
 */
export const DROP_ACTIVE_CLASS =
  "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10 ring-2 ring-blue-500/30";
