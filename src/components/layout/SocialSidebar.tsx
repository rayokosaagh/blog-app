import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AtSign, ArrowUpRight } from "lucide-react";

export default async function SocialSidebar() {
  const socials = await prisma.socialLink.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    // Same shell as the Poll card it sits beside — themeable surface
    // utilities so it reads blocky in brutalist and soft/rounded in modern.
    <div className="bg-card surface-border shadow-brutal px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      {/* Header — "@" is the mark people actually associate with social
          accounts (it's how every handle is written), so it leads rather than
          sitting in a side chip. A share-graph or people icon reads as
          "share" / "community" instead. */}
      <div className="flex items-center gap-2">
        <AtSign size={22} strokeWidth={2.75} className="text-accent" />
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Socials</h2>
      </div>

      {/* Internal divider — thin, not the heavy structural border */}
      <div className="border-t-2 border-border mt-4 mb-4" />

      <div className="space-y-3">
        {socials.length === 0 ? (
          <div className="surface-border border-dashed px-4 py-8 text-center text-sm font-semibold text-muted-foreground">
            No links posted yet
          </div>
        ) : (
          socials.map((social) => (
            /*
              Each row is keyed to its own platform color via --social-color:
              the icon sits in a tinted chip of that brand color, and the whole
              row (chip fill, chip border, label, action) deepens into it on
              hover. Every colour is derived with color-mix from the one stored
              hex, so it works on both the light and dark surface without
              per-brand tuning, and stays inside the theme system — widths,
              radii, and shadows still come from the surface-* utilities, so the
              row is a hard-edged block in brutalist and a soft card in modern.
            */
            <Link
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group/row flex items-center gap-3 p-3 surface-border bg-card shadow-brutal-sm brutal-press transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--social-color)_8%,transparent)]"
              style={{ "--social-color": social.color } as React.CSSProperties}
            >
              {/*
                Icon chip. `[&_svg]:fill-current/stroke-current` forces the raw
                icon markup to render in currentColor instead of whatever
                fill/stroke is baked into the SVG, so it takes the brand color
                in both themes.
              */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center surface-border-w border-[color-mix(in_srgb,var(--social-color)_30%,transparent)] bg-[color-mix(in_srgb,var(--social-color)_12%,transparent)] text-[var(--social-color)] transition-colors duration-150 group-hover/row:border-[var(--social-color)] group-hover/row:bg-[color-mix(in_srgb,var(--social-color)_22%,transparent)] [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:fill-current [&_svg]:stroke-current"
                dangerouslySetInnerHTML={{ __html: social.iconSvg }}
              />

              <span className="min-w-0 flex-1 truncate font-bold text-foreground transition-colors duration-150 group-hover/row:text-[var(--social-color)]">
                {social.platform}
              </span>

              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-muted-foreground transition-colors duration-150 group-hover/row:text-[var(--social-color)]">
                {social.actionText}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5" />
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
