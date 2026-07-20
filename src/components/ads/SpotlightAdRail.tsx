"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { gifDurationMs } from "@/lib/gifDuration";

export type SpotlightAd = {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: string; // "image" | "video"
  link: string;
};

const IMAGE_MS = 6000; // static image dwell time
const GIF_FALLBACK_MS = 8000; // used if a GIF's duration can't be read
const VIDEO_SAFETY_MS = 60000; // fallback if a video never fires `ended`

function isGif(url: string) {
  return /\.gif(\?|#|$)/i.test(url);
}

// Auto-rotating sponsored card that fills the homepage gadget-section right
// rail. Neo-brutalist frame; renders image/gif or video. Each slide plays fully
// before advancing — videos wait for `ended`, GIFs play one full loop — and
// there are NO navigation controls (only a mute toggle for video). Height is
// driven by its container so it matches the category component beside it.
export default function SpotlightAdRail({
  ads,
  header,
  title,
}: {
  ads: SpotlightAd[];
  header: string;
  title: string;
}) {
  const [current, setCurrent] = useState(0);
  const [progressMs, setProgressMs] = useState(IMAGE_MS);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion();
  const count = ads.length;

  const next = useCallback(() => setCurrent((p) => (p + 1) % count), [count]);

  // Advance timing depends on the current slide's media type.
  useEffect(() => {
    if (count <= 1) return;
    const ad = ads[current % count];
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = (ms: number) => {
      timer = setTimeout(() => {
        if (!cancelled) next();
      }, ms);
    };

    if (ad.mediaType === "video") {
      // The <video onEnded> drives the advance; keep a safety net in case
      // autoplay is blocked or `ended` never fires.
      timer = setTimeout(() => !cancelled && next(), VIDEO_SAFETY_MS);
    } else if (isGif(ad.mediaUrl)) {
      setProgressMs(GIF_FALLBACK_MS);
      gifDurationMs(ad.mediaUrl)
        .then((d) => {
          if (cancelled) return;
          const ms = d && d > 300 ? d : GIF_FALLBACK_MS;
          setProgressMs(ms);
          schedule(ms);
        })
        .catch(() => !cancelled && schedule(GIF_FALLBACK_MS));
    } else {
      setProgressMs(IMAGE_MS);
      schedule(IMAGE_MS);
    }

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, count]);

  // Keep the live video's muted property in sync with the toggle.
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted, current]);

  if (count === 0) return null;

  const ad = ads[current % count];
  const isVideo = ad.mediaType === "video";

  // Horizontal "scroll" like the site carousel (always forward).
  const variants = {
    enter: { x: "100%", opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  };

  return (
    <div className="flex h-full w-full min-h-[320px] flex-col overflow-hidden rounded-none border-2 border-border-heavy bg-card shadow-brutal">
      {/* Header — eyebrow + title (both editable from the dashboard).
          Left accent stripe keeps it feeling on-brand without the loud fill. */}
      <div className="flex items-stretch border-b-2 border-border-heavy bg-card">
        <div className="w-1.5 shrink-0 bg-accent-2" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 px-4 py-3.5">
          {header && (
            <span className="inline-flex w-fit max-w-full items-center border-2 border-border-heavy bg-accent-3 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-on-accent-3 shadow-brutal-sm">
              <span className="truncate">{header}</span>
            </span>
          )}
          {title && (
            <h3 className="truncate text-[15px] font-extrabold leading-tight tracking-tight text-foreground">
              {title}
            </h3>
          )}
        </div>
      </div>

      {/* Media */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-border">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={ad.id}
            variants={reduced ? undefined : variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Link
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="block h-full w-full"
            >
              {isVideo ? (
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el) el.muted = muted;
                  }}
                  src={ad.mediaUrl}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted={muted}
                  playsInline
                  loop={count === 1}
                  onEnded={count > 1 ? next : undefined}
                  onLoadedMetadata={(e) => {
                    if (count > 1) {
                      const d = e.currentTarget.duration;
                      if (isFinite(d) && d > 0) setProgressMs(d * 1000);
                    }
                  }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ad.mediaUrl} alt={ad.title} className="h-full w-full object-cover" />
              )}

              {/* Title plate */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3">
                <span className="line-clamp-2 text-sm font-bold leading-snug text-white">
                  {ad.title}
                </span>
              </div>
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Mute / unmute — sibling of the link so it doesn't trigger navigation */}
        {isVideo && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMuted((m) => !m);
            }}
            aria-label={muted ? "Unmute video" : "Mute video"}
            className="brutal-press absolute bottom-2 right-2 z-20 flex h-8 w-8 items-center justify-center border-2 border-border-heavy bg-card text-foreground shadow-brutal-sm"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        )}

        {/* Non-interactive progress bar (no nav controls) */}
        {count > 1 && !reduced && (
          <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-white/25">
            <motion.div
              key={`${current}-${progressMs}`}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: progressMs / 1000, ease: "linear" }}
              className="h-full bg-accent"
            />
          </div>
        )}
      </div>
    </div>
  );
}
