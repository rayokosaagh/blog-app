"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Clock } from "lucide-react";

interface Tile {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  createdAt: Date;
  kind: "trending" | "latest";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
};

/**
 * A single brutalist story tile. Heavy border + hard offset shadow + press
 * (per NEO-BRUTALISM-GUIDE §2–4): a full-colour image with a dark caption
 * plate and a Trending/New badge, pressing toward its shadow and zooming
 * the photo slightly on hover.
 */
function StoryTile({ t }: { t: Tile }) {
  const isTrending = t.kind === "trending";
  const KindIcon = isTrending ? Flame : Clock;
  const kindLabel = isTrending ? "Trending" : "New";

  return (
    <Link
      href={`/blog/${t.slug}`}
      className="group relative block h-full w-full overflow-hidden rounded-none border-2 border-border-heavy bg-border shadow-brutal-sm brutal-press"
    >
      {/* Image */}
      {t.featuredImage ? (
        <img
          src={t.featuredImage}
          alt={t.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-accent-tint text-3xl">
          📝
        </div>
      )}

      {/* Dark caption plate over the image */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <span
        className={`absolute left-2 top-2 inline-flex items-center gap-1 border-2 border-border-heavy px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shadow-brutal-sm ${
          isTrending ? "bg-accent text-on-accent" : "bg-accent-2 text-on-accent-2"
        }`}
      >
        <KindIcon className="h-3 w-3" fill={isTrending ? "currentColor" : "none"} />
        {kindLabel}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-white">
          {t.title}
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/70">
          {formatDate(t.createdAt)}
        </p>
      </div>
    </Link>
  );
}

/**
 * A row of story tiles under the hero spotlight — two-up on mobile, four
 * across on desktop.
 */
export default function TopStoryTilesList({ tiles }: { tiles: Tile[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
    >
      {tiles.map((t) => (
        <motion.div key={t.id} variants={itemVariants} className="aspect-[4/3] min-w-0">
          <StoryTile t={t} />
        </motion.div>
      ))}
    </motion.div>
  );
}
