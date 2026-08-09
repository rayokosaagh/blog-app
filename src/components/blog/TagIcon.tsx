import { isSvgIcon, isTagColor, sanitizeSvgForTheme, TagColorMode } from "@/lib/sanitizeSvg";

interface TagIconProps {
  icon: string;
  className?: string;
  // Nullable so Prisma rows can be spread straight in without massaging.
  colorMode?: TagColorMode | null;
  /** Brand color for the tag, used when colorMode is CUSTOM (e.g. Android green). */
  color?: string | null;
}

export default function TagIcon({
  icon,
  className,
  colorMode: rawColorMode,
  color,
}: TagIconProps) {
  const colorMode: TagColorMode = rawColorMode ?? "AUTO";
  // Only honour CUSTOM when there's a usable hex to honour it with; otherwise
  // fall back to FORCE_MONO — the same flattened shape, rendered in the
  // theme's text color instead of an unstyled one.
  const custom = colorMode === "CUSTOM" && isTagColor(color);
  const effectiveMode: TagColorMode =
    colorMode === "CUSTOM" && !custom ? "FORCE_MONO" : colorMode;

  if (isSvgIcon(icon)) {
    const wrapperClass = className ?? "inline-flex w-4 h-4 [&>svg]:w-full [&>svg]:h-full";

    // A custom color is theme-independent by definition, so the light/dark
    // pair below isn't needed — render once and let currentColor carry it.
    if (custom) {
      return (
        <span
          className={wrapperClass}
          style={{ color: color as string }}
          dangerouslySetInnerHTML={{
            __html: sanitizeSvgForTheme(icon, "light", "CUSTOM"),
          }}
        />
      );
    }

    return (
      <span className={`relative ${wrapperClass}`}>
        <span
          className="absolute inset-0 dark:hidden [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: sanitizeSvgForTheme(icon, "light", effectiveMode) }}
        />
        <span
          className="hidden absolute inset-0 dark:block [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: sanitizeSvgForTheme(icon, "dark", effectiveMode) }}
        />
      </span>
    );
  }

  // Emoji glyphs carry their own color and ignore `color`, but a plain-text
  // icon ("A", "★") will take it.
  return (
    <span className={className} style={custom ? { color: color as string } : undefined}>
      {icon}
    </span>
  );
}
