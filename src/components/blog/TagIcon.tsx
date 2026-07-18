import { isSvgIcon, sanitizeSvgForTheme, TagColorMode } from "@/lib/sanitizeSvg";

interface TagIconProps {
  icon: string;
  className?: string;
  colorMode?: TagColorMode;
}

export default function TagIcon({ icon, className, colorMode = "AUTO" }: TagIconProps) {
  if (isSvgIcon(icon)) {
    const wrapperClass = className ?? "inline-flex w-4 h-4 [&>svg]:w-full [&>svg]:h-full";
    return (
      <span className={`relative ${wrapperClass}`}>
        <span
          className="absolute inset-0 dark:hidden [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: sanitizeSvgForTheme(icon, "light", colorMode) }}
        />
        <span
          className="hidden absolute inset-0 dark:block [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: sanitizeSvgForTheme(icon, "dark", colorMode) }}
        />
      </span>
    );
  }

  return <span className={className}>{icon}</span>;
}