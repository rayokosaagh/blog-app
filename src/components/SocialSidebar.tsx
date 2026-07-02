import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SocialSidebar() {
  const socials = await prisma.socialLink.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="bg-card rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border border-border p-6">
      <h3 className="text-xl font-bold text-foreground mb-4">Latest tech, all here</h3>
      <div className="w-full border-t border-dashed border-accent/30 mb-5"></div>

      <div className="space-y-3">
        {socials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No links posted yet
          </div>
        ) : (
          socials.map((social) => (
            <Link
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-3 rounded-xl border border-border hover:border-foreground/20 hover:bg-foreground/5 transition-all duration-200"
              style={{ '--social-color': social.color } as React.CSSProperties}
            >
              <div className="flex items-center">
                <div
                  className="w-6 flex justify-center text-foreground/80 group-hover:text-[var(--social-color)] transition-colors"
                  dangerouslySetInnerHTML={{ __html: social.iconSvg }}
                />
                <div className="w-px h-5 bg-border mx-3"></div>
                <span className="font-medium text-foreground group-hover:text-[var(--social-color)] transition-colors">
                  {social.platform}
                </span>
              </div>

              <span className="text-sm font-medium text-muted-foreground group-hover:text-[var(--social-color)] transition-colors">
                {social.actionText}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}