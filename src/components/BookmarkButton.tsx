"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked: boolean;
  className?: string;
  showLabel?: boolean;
}

export default function BookmarkButton({
  postId,
  initialBookmarked,
  className = "",
  showLabel = false,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    // optimistic update
    const next = !bookmarked;
    setBookmarked(next);

    startTransition(async () => {
      try {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        });

        if (!res.ok) throw new Error("Request failed");

        const data = await res.json();
        setBookmarked(data.bookmarked);
      } catch (err) {
        console.error("Failed to toggle bookmark:", err);
        // revert on failure
        setBookmarked(!next);
      }
    });
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isPending}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
      className={`inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
        bookmarked
          ? "text-[#6f42c1] dark:text-white"
          : "text-gray-500 dark:text-gray-300 hover:text-[#6f42c1] dark:hover:text-white"
      } ${className}`}
    >
      <Bookmark
        className="h-5 w-5"
        strokeWidth={2}
        fill={bookmarked ? "currentColor" : "none"}
      />
      {showLabel && <span className="text-sm font-medium">{bookmarked ? "Bookmarked" : "Bookmark"}</span>}
    </motion.button>
  );
}