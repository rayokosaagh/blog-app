import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface FurtherReadingProps {
  href: string;
  title: string;
  eyebrow?: string;
}

export default function FurtherReading({ href, title, eyebrow = "Next up" }: FurtherReadingProps) {
  return (
    <div className="not-prose relative my-8">
      {/* Stacked depth layers */}
      <div className="absolute top-2 left-2 right-[-8px] bottom-0 bg-muted/60 rounded-2xl" />
      <div className="absolute top-1 left-1 right-[-4px] bottom-0 bg-muted/80 rounded-2xl" />

      <Link
        href={href}
        className="group relative flex items-center justify-between gap-4 bg-card border border-border rounded-2xl px-5 py-4 sm:px-6 transition-all duration-200 hover:border-accent/50 hover:shadow-md"
      >
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {eyebrow}
          </div>
          <div className="text-[15px] font-semibold text-foreground truncate">
            {title}
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-accent shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
      </Link>
    </div>
  );
}