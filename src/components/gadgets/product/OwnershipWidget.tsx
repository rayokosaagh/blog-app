"use client";

import { useState, useTransition } from "react";
import { Heart, PackageCheck, History } from "lucide-react";

type OwnershipStatus = "WANT" | "HAVE" | "HAD";

interface OwnershipWidgetProps {
  productId: string;
  initialCounts: Record<OwnershipStatus, number>;
  initialUserStatus: OwnershipStatus | null;
  /** Pass false to render a disabled/sign-in-prompt state for logged-out users. */
  isSignedIn: boolean;
}

const OPTIONS: { status: OwnershipStatus; label: string; icon: typeof Heart }[] = [
  { status: "WANT", label: "I want it", icon: Heart },
  { status: "HAVE", label: "I have it", icon: PackageCheck },
  { status: "HAD", label: "I had it", icon: History },
];

export default function OwnershipWidget({
  productId,
  initialCounts,
  initialUserStatus,
  isSignedIn,
}: OwnershipWidgetProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [userStatus, setUserStatus] = useState(initialUserStatus);
  const [isPending, startTransition] = useTransition();

  function handleClick(status: OwnershipStatus) {
    if (!isSignedIn || isPending) return;

    // Optimistic update
    const prevCounts = counts;
    const prevStatus = userStatus;
    const clearing = userStatus === status;

    const next = { ...counts };
    if (prevStatus) next[prevStatus] = Math.max(0, next[prevStatus] - 1);
    if (!clearing) next[status] = next[status] + 1;

    setCounts(next);
    setUserStatus(clearing ? null : status);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/gadgets/products/${productId}/ownership`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        setCounts(data.counts);
        setUserStatus(data.userStatus);
      } catch {
        // Roll back on failure
        setCounts(prevCounts);
        setUserStatus(prevStatus);
      }
    });
  }

  return (
    <div className="grid grid-cols-3 border-2 border-border-heavy divide-x-2 divide-border">
      {OPTIONS.map(({ status, label, icon: Icon }) => {
        const isActive = userStatus === status;
        return (
          <button
            key={status}
            type="button"
            disabled={!isSignedIn}
            onClick={() => handleClick(status)}
            title={isSignedIn ? undefined : "Sign in to vote"}
            className={`brutal-press flex flex-col items-center justify-center gap-1.5 px-3 py-5 text-center transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive
                ? "bg-accent-2 text-on-accent-2"
                : "bg-background text-foreground hover:bg-accent-tint"
            }`}
          >
            <Icon size={22} />
            <span className="text-xs font-extrabold uppercase tracking-wide">{label}</span>
            <span
              className={`text-[11px] font-bold ${
                isActive ? "text-on-accent-2" : "text-muted-foreground"
              }`}
            >
              {counts[status]} {counts[status] === 1 ? "user" : "users"}
            </span>
          </button>
        );
      })}
    </div>
  );
}