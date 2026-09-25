import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { readSocials } from "@/lib/authorProfile";

/**
 * "About the author" box at the end of a post: photo, name, bio, article
 * count, social links and a link to the author's other posts. Built from the
 * site's theme tokens, so it follows brutalist/modern and light/dark. Every
 * optional part (photo, bio, socials, update date) simply drops out when unset.
 */
export default function AuthorCard({
  author,
  articleCount,
  updatedLabel,
}: {
  author: { id: string; name: string | null; image: string | null; bio: string | null; socials: unknown };
  articleCount: number;
  /** "Updated September 3, 2026", only when the post was really edited. */
  updatedLabel?: string | null;
}) {
  const name = author.name || "Staff writer";
  const socials = readSocials(author.socials);

  return (
    <section
      aria-label="About the author"
      className="flex flex-col gap-4 border-[1.5px] border-border-heavy bg-card p-5 sm:flex-row sm:gap-5 sm:p-6"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden border-[1.5px] border-border-heavy bg-muted">
        {author.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            loading="lazy"
            decoding="async"
            src={author.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent text-2xl font-bold text-on-accent">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="h-eyebrow text-muted-foreground">About the author</p>
        <p className="h-card mt-1 text-foreground">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {articleCount} {articleCount === 1 ? "article" : "articles"}
          {updatedLabel && <> · {updatedLabel}</>}
        </p>

        {author.bio && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{author.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="me noopener noreferrer nofollow"
                    aria-label={`${name} on ${s.label}`}
                    title={s.label}
                    className="flex h-9 w-9 items-center justify-center border-[1.5px] border-border-heavy bg-background text-foreground transition-colors hover:bg-accent hover:text-on-accent"
                  >
                    <i className={`bi ${s.icon} text-base`} aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <Link
            href={`/blog?author=${author.id}`}
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
          >
            More from {name}
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
