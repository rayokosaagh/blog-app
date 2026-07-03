"use client";

import { useEffect, useRef } from "react";

interface ViewTrackerProps {
  postId: string;
}

export default function ViewTracker({ postId }: ViewTrackerProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {
      // Ignore failures — view tracking is non-critical.
    });
  }, [postId]);

  return null;
}