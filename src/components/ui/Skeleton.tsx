/**
 * Shared loading placeholder for every route's `loading.tsx`.
 *
 * bg-border rather than a pinned gray: it is the same fill HeroSpotlight and
 * TopStoryTilesList use behind images, so it tracks the theme instead of going
 * invisible in dark mode. No border radius — the design is square-cornered, and
 * the modern-theme compat layer in globals.css rounds the `surface-*` utilities
 * on its own.
 *
 * aria-hidden throughout: the skeleton conveys nothing to a screen reader, and
 * the surrounding `loading.tsx` carries the role="status" / aria-busy instead.
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-border ${className}`} aria-hidden="true" />;
}
