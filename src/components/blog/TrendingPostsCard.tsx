import Link from "next/link";
import { Flame } from "lucide-react";
import Underline from "@/components/ui/Underline";

interface TrendingPost {
  id: string;
  slug: string;
  title: string;
  featuredImage: string | null;
  views: number;
}

/**
 * Most-read posts, for the end of an article. Same header and rank badges as
 * the homepage's TrendingNewsList, framed as a card so it can stand alone in
 * the article's right gutter or as a carousel slide.
 *
 * Thumbnails only when the card has room for them (`@container`): at 216px in
 * the 1440px gutter, a rank badge plus a 56px thumbnail left the title about
 * 60px, so there it is rank + title.
 */
export default function TrendingPostsCard({ posts }: { posts: TrendingPost[] }) {
  if (posts.length === 0) return null;

  return (
    <div className="@container bg-card border-[1.5px] border-border-heavy p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-border-heavy bg-accent-2 text-on-accent-2">
          <Flame className="h-3.5 w-3.5" fill="currentColor" />
        </span>
        <h3 className="h-eyebrow text-accent">Trending now</h3>
      </div>

      <ol className="divide-y-[1.5px] divide-border">
        {posts.map((post, i) => (
          <li key={post.id}>
            <Link
              href={`/blog/${post.slug}`}
              className="group -mx-2 flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-accent-tint"
            >
              <span
                aria-hidden
                className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-border-heavy bg-accent text-[11px] font-extrabold text-on-accent"
              >
                {i + 1}
              </span>
              <span className="hidden h-12 w-12 shrink-0 overflow-hidden border-[1.5px] border-border-heavy bg-accent-tint @min-[20rem]:block">
                {post.featuredImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.featuredImage}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  <Underline>{post.title}</Underline>
                </span>
                <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                  {post.views.toLocaleString()} views
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
