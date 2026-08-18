"use client";

/**
 * Local reading history — what you opened, and how far you got.
 *
 * Deliberately localStorage rather than a table keyed to a user: almost every
 * reader here is anonymous, and "continue reading" is worth most to exactly
 * the people who never sign in. `Post.views` already records the server-side
 * signal; this is the private, per-device half.
 *
 * Exposed as a `useSyncExternalStore` store (see `createLocalStore`) so the
 * rail can read it without a mount-time setState, and so two tabs don't fight
 * over the same key.
 */

import { createLocalStore } from "./localStore";

export interface ReadingEntry {
  slug: string;
  title: string;
  image: string | null;
  /** Primary tag, for the label on the card. */
  tag: string | null;
  /** Epoch ms of the most recent visit. */
  at: number;
  /** 0–1, how far down the article the reader got. */
  progress: number;
}

const STORAGE_KEY = "reading-history-v1";
const MAX_ENTRIES = 40;

/**
 * Below this a reader hasn't really started (a bounce, or a mis-click), and
 * above it they've finished — neither belongs in "continue reading".
 */
export const RESUME_MIN = 0.05;
export const RESUME_MAX = 0.9;

// Reference-stable server snapshot — see createLocalStore.
const EMPTY: ReadingEntry[] = [];

function parse(raw: string | null): ReadingEntry[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .filter(
        (e): e is ReadingEntry =>
          e && typeof e.slug === "string" && typeof e.title === "string"
      )
      .map((e) => ({ ...e, progress: typeof e.progress === "number" ? e.progress : 0 }))
      .sort((a, b) => b.at - a.at);
  } catch {
    return EMPTY; // corrupt storage — history is not worth throwing over
  }
}

export const historyStore = createLocalStore(STORAGE_KEY, parse, EMPTY);

export function readHistory(): ReadingEntry[] {
  if (typeof window === "undefined") return EMPTY;
  return historyStore.getSnapshot();
}

function write(entries: ReadingEntry[]) {
  historyStore.set(entries.slice(0, MAX_ENTRIES));
}

/**
 * Records a visit, or updates the one already stored for this slug.
 *
 * Progress only ever moves forward. Someone who reads to the end and then
 * scrolls back up to re-check the spec table hasn't un-read the article, and
 * treating that as 20% would put a finished piece back in "continue reading".
 */
export function recordVisit(entry: Omit<ReadingEntry, "at" | "progress"> & { progress?: number }) {
  const existing = readHistory();
  const prev = existing.find((e) => e.slug === entry.slug);

  const next: ReadingEntry = {
    slug: entry.slug,
    title: entry.title,
    image: entry.image,
    tag: entry.tag,
    at: Date.now(),
    progress: Math.max(prev?.progress ?? 0, entry.progress ?? 0),
  };

  write([next, ...existing.filter((e) => e.slug !== entry.slug)]);
}

export function updateProgress(slug: string, progress: number) {
  const existing = readHistory();
  const idx = existing.findIndex((e) => e.slug === slug);
  if (idx === -1) return;
  if (progress <= existing[idx].progress) return; // forward-only, as above
  existing[idx] = { ...existing[idx], progress, at: Date.now() };
  write(existing);
}

export function clearHistory() {
  historyStore.set(EMPTY);
}

/** Started but unfinished, newest first — what "Continue reading" shows. */
export function resumable(entries: ReadingEntry[] = readHistory()): ReadingEntry[] {
  return entries.filter((e) => e.progress >= RESUME_MIN && e.progress < RESUME_MAX);
}
