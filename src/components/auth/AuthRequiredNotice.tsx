"use client";

import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Lock, X } from "lucide-react";
import { loginHref } from "@/lib/loginRedirect";

const GAP = 8; // px between the trigger and the popover
const EDGE = 16; // px the popover keeps from the viewport edges

type Align = "left" | "right" | "center";

interface AuthRequiredNoticeProps {
  open: boolean;
  onClose: () => void;
  /** Finishes "You need to be signed in to …", e.g. "bookmark posts". */
  action: string;
  /** Which edge of the trigger's wrapper the popover lines up with. */
  align?: Align;
  /**
   * Element to open against, when it isn't the whole wrapper — e.g. the one
   * button clicked in a row of them. Defaults to the wrapper.
   */
  anchor?: HTMLElement | null;
}

const noopSubscribe = () => () => {};

/**
 * Small popover shown when a signed-out visitor uses something that needs an
 * account. Render it inside a wrapper around the trigger; it opens just below
 * that wrapper (above, if there's no room). Closes on ×, Escape or a click
 * outside.
 *
 * Portalled to <body> with fixed positioning, measured from the wrapper: the
 * post page's bookmark button sits inside the hero image, whose
 * `overflow: hidden` clipped an in-flow popover to a sliver. Nothing up the
 * tree can clip or out-stack it this way.
 *
 * "Register" goes to /login as well: the site has no separate sign-up — a
 * reader's account is created the first time they continue with Google or
 * GitHub — so the copy says that rather than promising a form that isn't there.
 * Both links bring the visitor back to this page afterwards.
 */
export default function AuthRequiredNotice({
  open,
  onClose,
  action,
  align = "left",
  anchor,
}: AuthRequiredNoticeProps) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // true on the client, false during SSR/hydration — no portal target before.
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);

  // Place the popover against `anchor`, else its wrapper (the marker's parent).
  // Written to the node directly, before paint, and again on scroll/resize so
  // it tracks the trigger; capture catches scrolling inside nested containers.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const target = anchor ?? markerRef.current?.parentElement;
      const el = noticeRef.current;
      if (!target || !el) return;
      const r = target.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let left = align === "right" ? r.right - w : align === "center" ? r.left + r.width / 2 - w / 2 : r.left;
      left = Math.min(Math.max(left, EDGE), window.innerWidth - w - EDGE);
      const below = r.bottom + GAP;
      const fitsBelow = below + h <= window.innerHeight - EDGE;
      const top = fitsBelow || r.top - GAP - h < EDGE ? below : r.top - GAP - h;
      el.style.left = `${Math.round(left)}px`;
      el.style.top = `${Math.round(top)}px`;
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, align, anchor]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onPointer = (e: MouseEvent) => {
      if (noticeRef.current && !noticeRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose]);

  // Only computed once open, i.e. after a click — window is always there.
  const href = open ? loginHref(window.location.pathname + window.location.search) : "/login";

  return (
    <>
      {/* Zero-size marker: its parent is the wrapper the popover anchors to. */}
      <span ref={markerRef} hidden />
      {isClient &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={noticeRef}
                role="status"
                aria-live="polite"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                // Under the sticky site header (z-[100]) so it slides beneath
                // it on scroll rather than over it.
                className="fixed left-0 top-0 z-[90] w-72 max-w-[calc(100vw-2rem)] rounded-none border-2 border-border-heavy bg-card p-4 text-left shadow-brutal"
              >
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Dismiss"
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-none text-muted-foreground transition-colors duration-100 hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <p className="flex items-start gap-2 pr-6 text-sm font-bold text-foreground">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span>You need to be signed in to {action}.</span>
                </p>

                <Link
                  href={href}
                  className="mt-3 inline-flex items-center rounded-none border-2 border-border-heavy bg-accent px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-on-accent shadow-brutal-sm brutal-press"
                >
                  Sign in
                </Link>

                <p className="mt-3 text-xs text-muted-foreground">
                  Not registered?{" "}
                  <Link href={href} className="font-bold text-accent underline underline-offset-2">
                    Continue with Google or GitHub
                  </Link>{" "}
                  to create a free account.
                </p>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
