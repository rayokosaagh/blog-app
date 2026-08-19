import Link from "next/link";
import { ArrowRight, Award, Newspaper, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { readVerdict, VERDICT_MAX, verdictBand } from "@/lib/verdict";
import { getExcerpt, getReadingTime, formatRelativeTime } from "@/lib/postUtils";
import { sortTagsByOrder } from "@/lib/sortTags";
import { FadeIn } from "@/components/ui/AnimatedSection";
import SectionHeader from "@/components/ui/SectionHeader";
import OptimizedImage from "@/components/ui/OptimizedImage";
import Underline from "@/components/ui/Underline";

/**
 * Homepage "Newsroom" — a Verge-style split: a dense, timestamped river of
 * the latest news on the left, and a rail of the latest reviews with their
 * scores on the right.
 *
 * Why it exists next to the Latest Posts mosaic: the mosaic is the visual
 * feed of *everything*; this section is the first place on the page that
 * separates the two things the publication actually does — reports news and
 * scores gadgets — which is what the category split was for. The river is
 * headline-first (small thumb, big type, time on the left) so eight stories
 * fit in the height of two mosaic tiles; the reviews rail leads with the
 * number, because that's what a review is for at a glance.
 *
 * Dedupe: the river never repeats a Top Story. It also skips anything the
 * mosaic already showed *when enough news remains* (>= MIN_FRESH) — on a
 * small corpus that would empty the river, so it falls back to plain
 * newest-first and accepts the overlap; the two sections are far enough
 * apart that this reads as a section, not a repeat. The reviews rail is a
 * lens ("our reviews, with scores"), not a feed, and is not deduped.
 */

const NEWS_TAKE = 8;
const REVIEWS_TAKE = 4;
const MIN_FRESH = 4;
/** How recent a story has to be for the lead's "NEW" flag. */
const NEW_WITHIN_MS = 7 * 24 * 60 * 60 * 1000;

const postSelect = {
  id: true,
  slug: true,
  title: true,
  content: true,
  featuredImage: true,
  createdAt: true,
  tagOrder: true,
  author: { select: { name: true } },
  tags: { select: { id: true, name: true, slug: true } },
  verdictScore: true,
  verdictSummary: true,
  verdictSubScores: true,
} as const;

export interface NewsroomData {
  news: NewsItem[];
  reviews: ReviewItem[];
}

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  dek: string;
  featuredImage: string | null;
  createdAt: Date;
  authorName: string | null;
  kicker: string | null;
  readingTime: number;
  /** Published within NEW_WITHIN_MS — drives the lead's "NEW" flag. */
  isNew: boolean;
}

interface ReviewItem extends NewsItem {
  score: number | null;
  /** The verdict's bottom line when it exists, else the dek. */
  summary: string;
}

export async function getNewsroom({
  /** Ids already on the page above this section (Top Stories, mosaic…). */
  topStoryIds = [],
  mosaicIds = [],
}: {
  topStoryIds?: string[];
  mosaicIds?: string[];
} = {}): Promise<NewsroomData> {
  const [newsRows, reviewRows] = await Promise.all([
    // Over-fetch so there's room to drop the mosaic's ids and still fill.
    prisma.post.findMany({
      where: { published: true, category: "NEWS", NOT: { id: { in: topStoryIds } } },
      orderBy: { createdAt: "desc" },
      take: NEWS_TAKE + mosaicIds.length,
      select: postSelect,
    }),
    prisma.post.findMany({
      where: { published: true, category: "REVIEW" },
      orderBy: { createdAt: "desc" },
      take: REVIEWS_TAKE,
      select: postSelect,
    }),
  ]);

  const mosaic = new Set(mosaicIds);
  const fresh = newsRows.filter((p) => !mosaic.has(p.id));
  const chosen = (fresh.length >= MIN_FRESH ? fresh : newsRows).slice(0, NEWS_TAKE);

  const now = Date.now();
  const toItem = (p: (typeof newsRows)[number]): NewsItem => {
    const tags = sortTagsByOrder(p.tags, p.tagOrder);
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      dek: getExcerpt(p.content, 24),
      featuredImage: p.featuredImage,
      createdAt: p.createdAt,
      authorName: p.author?.name ?? null,
      kicker: tags[0]?.name ?? null,
      readingTime: getReadingTime(p.content),
      isNew: now - p.createdAt.getTime() < NEW_WITHIN_MS,
    };
  };

  return {
    news: chosen.map(toItem),
    reviews: reviewRows.map((p) => {
      const verdict = readVerdict(p);
      const base = toItem(p);
      return { ...base, score: verdict?.score ?? null, summary: verdict?.summary ?? base.dek };
    }),
  };
}


/* ─────────────────────────── presentation ─────────────────────────── */

// The theme accents, cycled through the river's kickers, corner tabs and
// arrow buttons the way the mockup does (blue / pink / yellow). Full class
// strings so Tailwind sees them.
const KICKER_COLOR = ["text-accent", "text-accent-3"] as const;
const TAB_COLOR = ["bg-accent", "bg-accent-3"] as const;
const ARROW_COLOR = [
  "bg-accent-2 text-on-accent-2",
  "bg-accent-3 text-on-accent-3",
  "bg-accent text-on-accent",
] as const;

function cycle<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length];
}

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short" });

/** Square arrow button, the row's "go" affordance. Decorative — the whole row is the link. */
function ArrowSquare({ color, size = "md" }: { color: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center border-2 border-border-heavy shadow-brutal-sm transition-transform duration-150 group-hover:translate-x-0.5 ${color} ${
        size === "md" ? "h-9 w-9" : "h-8 w-8"
      }`}
    >
      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
    </span>
  );
}

/** Calendar-leaf date block. The lead is filled; the rest carry a coloured corner tab. */
function DateBlock({ date, lead, index }: { date: Date; lead: boolean; index: number }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative w-[4.5rem] border-2 border-border-heavy py-1.5 text-center leading-none ${
          lead ? "bg-accent text-on-accent shadow-brutal-sm" : "bg-card text-foreground"
        }`}
      >
        <span className="block text-[10px] font-extrabold uppercase tracking-wide">{MONTH.format(date)}</span>
        <span className="my-1 block text-2xl font-black tabular-nums">{String(date.getDate()).padStart(2, "0")}</span>
        <span className="block text-[10px] font-bold tabular-nums">{date.getFullYear()}</span>
        {!lead && (
          <span
            aria-hidden
            className={`absolute -bottom-[2px] -left-[2px] h-3 w-3 border-2 border-border-heavy ${cycle(TAB_COLOR, index)}`}
          />
        )}
      </div>
      {lead && (
        <span aria-hidden className="mt-3 flex flex-col gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block h-1.5 w-1.5 bg-foreground" />
          ))}
        </span>
      )}
    </div>
  );
}

/**
 * Image with a bordered, clipped bottom-right corner. Two nested clips: the
 * outer is the border colour, the inner (inset by the border width) is the
 * photo, so the diagonal edge gets a border too instead of a raw cut.
 */
function ClippedImage({ src, alt, sizes, className = "" }: { src: string | null; alt: string; sizes: string; className?: string }) {
  return (
    <div className={`clip-frame clip-corner-br bg-border-heavy p-[2px] ${className}`}>
      <div className="clip-corner-br relative h-full w-full overflow-hidden bg-accent-tint">
        {src ? (
          <OptimizedImage
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-40">✦</div>
        )}
      </div>
    </div>
  );
}

function Thumb({ src, alt, sizes, className = "" }: { src: string | null; alt: string; sizes: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden border-2 border-border-heavy bg-accent-tint ${className}`}>
      {src ? (
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-40">✦</div>
      )}
    </div>
  );
}

/** "TAG • Author" line above a headline. */
function Kicker({ item, index }: { item: NewsItem; index: number }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-extrabold uppercase tracking-wide">
      {item.kicker && <span className={cycle(KICKER_COLOR, index)}>{item.kicker}</span>}
      {item.kicker && item.authorName && <span aria-hidden className="h-1 w-1 bg-foreground/60" />}
      {item.authorName && (
        <span className="normal-case tracking-normal font-semibold text-muted-foreground">{item.authorName}</span>
      )}
    </p>
  );
}

/** Lead headline: condensed uppercase, last words underlined with a highlighter stroke. */
function HighlightedTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/);
  const cut = Math.max(1, words.length - 3);
  const head = words.slice(0, cut).join(" ");
  const tail = words.slice(cut).join(" ");
  return (
    <>
      {head && <>{head} </>}
      <span
        className="box-decoration-clone"
        style={{
          backgroundImage: "linear-gradient(var(--accent-2), var(--accent-2))",
          backgroundSize: "100% 0.22em",
          backgroundPosition: "0 92%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {tail}
      </span>
    </>
  );
}

function LeadNewsRow({ item }: { item: NewsItem }) {
  return (
    <li className="pb-7">
      <Link
        href={`/blog/${item.slug}`}
        className="group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 sm:gap-x-6 lg:grid-cols-[4.5rem_minmax(0,1fr)_18rem]"
      >
        <DateBlock date={item.createdAt} lead index={0} />
        <div className="min-w-0">
          <Kicker item={item} index={0} />
          <h3 className="mt-2 font-condensed text-4xl leading-[0.95] text-foreground sm:text-5xl">
            <HighlightedTitle title={item.title} />
          </h3>
          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.dek}</p>
        </div>
        <div className="relative col-start-2 lg:col-start-3">
          <ClippedImage
            src={item.featuredImage}
            alt={item.title}
            sizes="(min-width: 1024px) 288px, 100vw"
            className="aspect-[3/2] w-full"
          />
          {/* Only a story from the last week is "new" — an old lead with the
              flag would be the section lying about itself. */}
          {item.isNew && (
            <span className="absolute right-0 top-3 border-2 border-border-heavy bg-accent-3 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-on-accent-3">
              New
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

function NewsRow({ item, index }: { item: NewsItem; index: number }) {
  return (
    <li className="border-t border-border py-5">
      <Link
        href={`/blog/${item.slug}`}
        className="group grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-x-6"
      >
        <DateBlock date={item.createdAt} lead={false} index={index} />
        <div className="min-w-0">
          <Kicker item={item} index={index} />
          <h3 className="mt-1.5 line-clamp-2 text-lg font-extrabold leading-snug text-foreground sm:text-xl">
            <Underline>{item.title}</Underline>
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.dek}</p>
        </div>
        {/* Thumb between hairlines, arrow tucked under its right edge. */}
        <div className="col-start-2 flex items-end gap-3 sm:col-start-3 sm:flex-col sm:items-end sm:gap-2">
          <div className="border-y border-border py-1.5">
            <Thumb src={item.featuredImage} alt={item.title} sizes="152px" className="aspect-[3/2] w-32 sm:w-[9.5rem]" />
          </div>
          <ArrowSquare color={cycle(ARROW_COLOR, index)} />
        </div>
      </Link>
    </li>
  );
}

/** "MORE NEWS →" — text cell + coloured arrow cell in one bordered pill.
 *
 * overflow-hidden matters: border-2 picks up --radius from the modern compat
 * layer, but the filled arrow cell is a child with its own background, so
 * without clipping it painted square corners over the parent's rounded ones
 * and the button read as half-rounded. No-op in brutalist, where --radius is 0. */
function SplitButton({ href, label, arrowColor }: { href: string; label: string; arrowColor: string }) {
  return (
    <Link href={href} className="group inline-flex items-stretch overflow-hidden border-2 border-border-heavy bg-card shadow-brutal-sm brutal-press">
      <span className="flex items-center px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-foreground">{label}</span>
      <span className={`flex w-10 items-center justify-center border-l-2 border-border-heavy ${arrowColor}`}>
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
      </span>
    </Link>
  );
}

function ScoreChip({
  score,
  size = "md",
  color = "bg-accent-2 text-on-accent-2",
}: {
  score: number;
  size?: "sm" | "md";
  color?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 flex-col items-center justify-center border-2 border-border-heavy font-black leading-none tabular-nums shadow-brutal-sm ${color} ${
        size === "md" ? "h-16 w-16" : "h-14 w-[4.25rem]"
      }`}
      aria-label={`${score.toFixed(1)} out of ${VERDICT_MAX}, ${verdictBand(score)}`}
    >
      <span className={size === "md" ? "text-2xl" : "text-xl"}>{score.toFixed(1)}</span>
      <span className="mt-1 text-[8px] font-extrabold uppercase tracking-wider opacity-90">{verdictBand(score)}</span>
    </span>
  );
}

function ReviewsRail({ reviews }: { reviews: ReviewItem[] }) {
  const [lead, ...rest] = reviews;
  return (
    <div>
      {/* Lead review: photo, then a dark caption panel — fixed photo tokens
          so it's the same black plate in every theme, like the tile captions. */}
      <Link
        href={`/blog/${lead.slug}`}
        className="group relative block overflow-hidden border-2 border-border-heavy bg-photo-overlay text-on-photo shadow-brutal"
      >
        <div className="relative">
          <ClippedImage
            src={lead.featuredImage}
            alt={lead.title}
            sizes="(min-width: 1024px) 384px, 100vw"
            className="clip-flush-b aspect-[16/10] w-full"
          />
          {lead.score !== null && (
            <div className="absolute left-4 top-4">
              <ScoreChip score={lead.score} color="bg-accent text-on-accent" />
            </div>
          )}
        </div>
        <div className="p-5 pb-6 pr-16">
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold uppercase tracking-wide text-on-photo/70">
            <time dateTime={lead.createdAt.toISOString()}>{formatRelativeTime(lead.createdAt)}</time>
            <span aria-hidden className="h-1 w-1 bg-on-photo/50" />
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lead.readingTime} min read
            </span>
          </p>
          <h3 className="mt-2 text-xl font-extrabold leading-snug">{lead.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-on-photo/70">{lead.summary}</p>
        </div>
        <span className="absolute bottom-4 right-4">
          <ArrowSquare color="bg-accent-3 text-on-accent-3" />
        </span>
      </Link>

      {/* Compact rows */}
      {rest.length > 0 && (
        <ul className="mt-2">
          {rest.map((r, i) => (
            <li key={r.id} className="border-b border-border">
              <Link href={`/blog/${r.slug}`} className="group flex items-center gap-4 py-4">
                <Thumb src={r.featuredImage} alt="" sizes="64px" className="h-16 w-16 shrink-0 shadow-brutal-sm" />
                <span aria-hidden className={`w-1 self-stretch ${cycle(TAB_COLOR, i)}`} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-3 text-sm font-bold leading-snug text-foreground">
                    <Underline>{r.title}</Underline>
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    <time dateTime={r.createdAt.toISOString()}>{formatRelativeTime(r.createdAt)}</time>
                  </p>
                </div>
                {/* Only scored reviews get the chip; a "—" box would just be
                    a hole with a border. Score them in the dashboard. */}
                {r.score !== null && <ScoreChip score={r.score} size="sm" />}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* overflow-hidden for the same reason as <SplitButton />: the filled
          arrow cell would otherwise square off the rounded right-hand corners. */}
      <Link href="/reviews" className="group mt-6 flex items-stretch overflow-hidden border-2 border-border-heavy bg-card shadow-brutal brutal-press">
        <span className="flex flex-1 items-center px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-foreground">
          All reviews
        </span>
        <span className="flex w-12 items-center justify-center border-l-2 border-border-heavy bg-accent-3 text-on-accent-3">
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.5} />
        </span>
      </Link>
    </div>
  );
}

export default function Newsroom({ data }: { data: NewsroomData }) {
  const { news, reviews } = data;
  // Needs both halves to be a split; with one, the section reads as a
  // broken layout rather than a design. Each half's own page still lists it.
  if (news.length < 2 || reviews.length === 0) return null;
  const [lead, ...rest] = news;

  return (
    <section className="max-w-[1600px] mx-auto px-6 w-full" aria-labelledby="newsroom-heading">
      <h2 id="newsroom-heading" className="sr-only">
        Latest news and reviews
      </h2>
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16 lg:items-start">
        {/* News river */}
        <div className="min-w-0">
          <FadeIn>
            <SectionHeader
              as="h3"
              Icon={Newspaper}
              eyebrow="Latest news"
              title="The Latest"
              subtitle="Launches, announcements and what's new"
              action={{ href: "/news", label: "All news" }}
            />
          </FadeIn>
          <ol className="list-none">
            <LeadNewsRow item={lead} />
            {rest.map((item, i) => (
              <NewsRow key={item.id} item={item} index={i} />
            ))}
          </ol>
          <FadeIn>
            <div className="mt-2 flex justify-end border-t border-border pt-5">
              <SplitButton href="/news" label="More news" arrowColor="bg-accent text-on-accent" />
            </div>
          </FadeIn>
        </div>

        {/* Reviews rail — sticky on desktop so it rides alongside a long river */}
        <div className="min-w-0 lg:sticky lg:top-24">
          <FadeIn delay={0.1}>
            <SectionHeader
              as="h3"
              Icon={Award}
              eyebrow="Scored & tested"
              title="Reviews"
              action={{ href: "/reviews", label: "All reviews" }}
              accent="accent-3"
            />
            <ReviewsRail reviews={reviews} />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
