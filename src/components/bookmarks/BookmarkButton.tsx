"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this post"}
      className={`inline-flex items-center gap-1.5 rounded-none border-2 px-2 py-1 transition-colors duration-100 disabled:opacity-60 ${
        bookmarked
          ? "border-border-heavy bg-accent-2 text-on-accent-2"
          : "border-transparent text-muted-foreground hover:border-border-heavy hover:bg-accent-2 hover:text-on-accent-2"
      } ${className}`}
    >
      <Bookmark
        className="h-5 w-5"
        strokeWidth={2}
        fill={bookmarked ? "currentColor" : "none"}
      />
      {showLabel && <span className="text-sm font-bold">{bookmarked ? "Bookmarked" : "Bookmark"}</span>}
    </button>
  );
}