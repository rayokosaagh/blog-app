import Link from "next/link";
import TagIcon from "@/components/blog/TagIcon";
import { isSvgIcon } from "@/lib/sanitizeSvg";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  icon: string;
  colorMode?: "AUTO" | "KEEP_ORIGINAL" | "FORCE_MONO";
  _count: { products: number };
}

interface ProductTagRailProps {
  tags: TagItem[];
}

export default function ProductTagRail({ tags }: ProductTagRailProps) {
  if (tags.length === 0) {
    return (
      <div className="bg-background border-2 border-border-heavy rounded-none p-8 text-center text-muted-foreground">
        No tags yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {tags.map((t) => {
        const iconIsSvg = isSvgIcon(t.icon);
        return (
          <Link
            key={t.id}
            href={`/tag/${t.slug}`}
            className="group aspect-square flex flex-col items-center justify-center gap-2 bg-background border-2 border-border-heavy rounded-none p-3 text-center shadow-brutal-sm brutal-press hover:bg-accent-2 hover:text-on-accent-2 transition-colors duration-100"
          >
            <div className="w-1/2 aspect-square flex items-center justify-center shrink-0">
             <TagIcon
  icon={t.icon}
  colorMode={t.colorMode}
  className={
    iconIsSvg
      ? "w-full h-full text-foreground group-hover:text-on-accent-2 [&>svg]:w-full [&>svg]:h-full"
      : "w-full h-full flex items-center justify-center text-accent-2 group-hover:text-on-accent-2 [&>svg]:w-full [&>svg]:h-full"
  }
/>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wide line-clamp-1">
              {t.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}