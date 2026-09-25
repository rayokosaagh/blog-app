"use client";

import { useState, useTransition } from "react";
import { Heart, PackageCheck, History } from "lucide-react";
import AuthRequiredNotice from "@/components/auth/AuthRequiredNotice";

type OwnershipStatus = "WANT" | "HAVE" | "HAD";

interface OwnershipWidgetProps {
  productId: string;
  initialCounts: Record<OwnershipStatus, number>;
  initialUserStatus: OwnershipStatus | null;
  /** False for logged-out visitors: a click explains sign-in instead of voting. */
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
  const [needsAuth, setNeedsAuth] = useState(false);
  // The button clicked, so the sign-in notice opens under it, not mid-widget.
  const [noticeAnchor, setNoticeAnchor] = useState<HTMLElement | null>(null);

  function handleClick(status: OwnershipStatus, button: HTMLElement) {
    if (!isSignedIn) {
      setNoticeAnchor(button);
      setNeedsAuth(true);
      return;
    }
    if (isPending) return;

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
    // Buttons stay enabled when signed out (a greyed-out control with a hover
    // tooltip told nobody on touch why it didn't work); the click opens the
    // sign-in notice under the widget instead.
    <div className="relative">
      {/* overflow-hidden: the modern theme rounds this frame, and the square
          segment backgrounds otherwise painted over its corners. The segments
          don't take brutal-press — that lifts a standalone card, and lifting
          one cell of a framed control pushed it out through the border. The
          tint is the hover feedback. */}
      <div className="grid grid-cols-3 overflow-hidden border-2 border-border-heavy divide-x-2 divide-border">
        {OPTIONS.map(({ status, label, icon: Icon }) => {
          const isActive = userStatus === status;
          return (
            <button
              key={status}
              type="button"
              onClick={(e) => handleClick(status, e.currentTarget)}
              className={`flex flex-col items-center justify-center gap-1.5 px-3 py-5 text-center transition-colors duration-100 ${
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
      <AuthRequiredNotice
        open={needsAuth}
        onClose={() => setNeedsAuth(false)}
        action="mark gadgets you want, have or had"
        align="center"
        anchor={noticeAnchor}
      />
    </div>
  );
}