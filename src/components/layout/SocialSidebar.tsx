import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Share2 } from "lucide-react";

export default async function SocialSidebar() {
  const socials = await prisma.socialLink.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="bg-card border-2 border-border-heavy rounded-none shadow-brutal px-4 py-6 sm:px-6 sm:py-8 md:px-8">
      <div className="flex items-center gap-2">
        <Share2 size={20} className="text-accent" />
        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Socials</h2>
      </div>

      {/* Internal divider — thin, not the heavy structural border */}
      <div className="border-t-2 border-border mt-4 mb-4" />

      <div className="space-y-3">
        {socials.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No links posted yet
          </div>
        ) : (
          socials.map((social) => (
            <Link
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 p-3 rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press"
              style={{ "--social-color": social.color } as React.CSSProperties}
            >
              <div className="flex min-w-0 items-center">
                {/*
                  Forces the raw icon markup to render in currentColor
                  instead of whatever fill/stroke is baked into the SVG,
                  so it inherits text-muted-foreground in both themes and
                  steps to the brand color on hover, same as the label.
                */}
                <div
                  className="w-6 shrink-0 flex justify-center text-muted-foreground group-hover:text-[var(--social-color)] transition-colors duration-100 [&_svg]:fill-current [&_svg]:stroke-current [&_svg]:w-5 [&_svg]:h-5"
                  dangerouslySetInnerHTML={{ __html: social.iconSvg }}
                />
                <div className="w-[2px] h-5 shrink-0 bg-border mx-2.5 sm:mx-3" />
                <span className="truncate font-bold text-foreground group-hover:text-[var(--social-color)] transition-colors duration-100">
                  {social.platform}
                </span>
              </div>

              <span className="shrink-0 text-xs font-extrabold uppercase tracking-wide text-muted-foreground group-hover:text-[var(--social-color)] transition-colors duration-100">
                {social.actionText}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}