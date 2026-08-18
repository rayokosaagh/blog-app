"use client";

import { useEffect, useRef } from "react";
import { recordVisit, updateProgress } from "@/lib/readingHistory";

/**
 * Records this article in the local reading history and keeps its scroll
 * progress up to date.
 *
 * Mounted alongside ViewTracker on the article page. That one increments the
 * server-side counter; this one is the private per-device record that feeds
 * "Continue reading". Renders nothing.
 */
export default function ReadingHistoryTracker({
  slug,
  title,
  image,
  tag,
}: {
  slug: string;
  title: string;
  image: string | null;
  tag: string | null;
}) {
  // Progress is written on a timer rather than on every scroll frame: this is
  // a localStorage read-modify-write, and running it at 60fps during a flick
  // scroll is the kind of jank that shows up on mid-range phones.
  const progressRef = useRef(0);

  useEffect(() => {
    recordVisit({ slug, title, image, tag });
  }, [slug, title, image, tag]);

  useEffect(() => {
    const measure = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      // A page shorter than the viewport can't be scrolled, so opening it at
      // all is as far as anyone can get — count it read rather than 0%.
      progressRef.current =
        scrollable <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / scrollable));
    };

    const flush = () => updateProgress(slug, progressRef.current);

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    const timer = setInterval(flush, 5000);

    // Covers the tab being closed or backgrounded, which is how most reading
    // sessions actually end — `beforeunload` alone is unreliable on mobile.
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      flush();
      window.removeEventListener("scroll", measure);
      document.removeEventListener("visibilitychange", onHidden);
      clearInterval(timer);
    };
  }, [slug]);

  return null;
}
