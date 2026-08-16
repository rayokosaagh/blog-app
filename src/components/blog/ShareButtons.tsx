"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import {
  SHARE_CHANNELS,
  INSTAGRAM_HOVER_SURFACE,
  INSTAGRAM_HOVER_PHOTO,
  InstagramIcon,
  copyShareLink,
  openShareWindow,
  shareToInstagram,
  channelHover,
  shareRestingClasses,
  SHARE_BUTTON_BASE,
  SHARE_FOCUS,
  type ShareTone,
} from "@/components/ui/shareChannels";

interface ShareButtonsProps {
  title: string;
  /**
   * Which surface the row sits on. The post hero is a photo overlay, where the
   * theme's foreground/border tokens resolve to near-black in light mode and
   * the icons disappear — pass "onPhoto" there.
   */
  tone?: ShareTone;
  /**
   * Channel names to leave out, by `name`. The hero drops Telegram to keep the
   * row from crowding the author line; the in-article copy carries the full set.
   */
  omit?: readonly string[];
  /** Small "Share" caption before the row. Off on the hero, where space is tight. */
  showLabel?: boolean;
  className?: string;
}

/**
 * Inline share row, styled to match BookmarkButton — ghost buttons that take a
 * coloured outline on hover rather than a fill, so the two sit side by side in
 * the post header as one set of controls.
 *
 * The URL is read from window.location at click time rather than rebuilt from a
 * slug: the old version hardcoded `/blog/${slug}`, so it produced wrong links
 * anywhere off the blog route and forced every caller to thread a slug through.
 */
export default function ShareButtons({
  title,
  tone = "surface",
  omit = [],
  showLabel = false,
  className = "",
}: ShareButtonsProps) {
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function flash(msg: string) {
    setNote(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(null), 2400);
  }

  const channels = SHARE_CHANNELS.filter((c) => !omit.includes(c.name));
  const copied = note === "Link copied";
  const resting = shareRestingClasses(tone);
  // `className` belongs to the row, not to each button — folding it into the
  // buttons let a caller's layout utilities (e.g. `hidden sm:inline-flex`)
  // collide with the base display class inside twMerge.
  const btn = (hover: string) => twMerge(SHARE_BUTTON_BASE, SHARE_FOCUS, resting, hover);

  return (
    <div className={twMerge("inline-flex items-center gap-0.5", className)}>
      {showLabel && (
        <span
          className={`mr-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${
            tone === "onPhoto" ? "text-on-photo/75" : "text-muted-foreground"
          }`}
        >
          Share
        </span>
      )}

      {channels.map((channel) => {
        const { name, Icon, buildUrl } = channel;
        return (
          <button
            key={name}
            type="button"
            onClick={() => openShareWindow(buildUrl, title)}
            aria-label={`Share on ${name}`}
            title={name}
            className={btn(channelHover(channel, tone))}
          >
            <Icon />
          </button>
        );
      })}

      <button
        type="button"
        onClick={async () => {
          const ok = await shareToInstagram();
          flash(ok ? "Link copied — paste it into your story or DM" : "Open Instagram and paste the link");
        }}
        aria-label="Copy link for Instagram"
        title="Instagram — copies the link to paste"
        className={btn(tone === "onPhoto" ? INSTAGRAM_HOVER_PHOTO : INSTAGRAM_HOVER_SURFACE)}
      >
        <InstagramIcon />
      </button>

      <button
        type="button"
        onClick={async () => flash((await copyShareLink()) ? "Link copied" : "Couldn't copy the link")}
        aria-label={copied ? "Link copied" : "Copy link"}
        title="Copy link"
        className={btn(
          // The copy action isn't a brand, so it borrows the bookmark's own
          // treatment: the theme accent on both border and glyph.
          "hover:border-accent hover:text-accent"
        )}
      >
        {copied ? <Check className="h-5 w-5" strokeWidth={2} /> : <Link2 className="h-5 w-5" strokeWidth={2} />}
      </button>

      {/* The visible confirmation is the tick swap above; this is the spoken
          one, kept out of the layout so the hero row can't reflow. */}
      <span aria-live="polite" className="sr-only">
        {note ?? ""}
      </span>
    </div>
  );
}
