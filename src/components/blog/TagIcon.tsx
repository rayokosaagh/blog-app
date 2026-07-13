import { isSvgIcon, sanitizeSvg } from "@/lib/sanitizeSvg";

interface TagIconProps {
  icon: string;
  className?: string;
}

export default function TagIcon({ icon, className }: TagIconProps) {
  if (isSvgIcon(icon)) {
    return (
      <span
        className={className ?? "inline-flex w-4 h-4 [&>svg]:w-full [&>svg]:h-full"}
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(icon) }}
      />
    );
  }

  return <span className={className}>{icon}</span>;
}