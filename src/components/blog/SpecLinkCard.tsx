import Link from "next/link";
import { ArrowRight, Cpu } from "lucide-react";

/**
 * End-of-article pointer to the full spec sheet of the product the post is
 * about (Post.product, picked in the editor). The whole card is one link so
 * it is an easy target inside the swipeable layout on small screens.
 *
 * `@container` rather than viewport breakpoints: the card is 216–340px wide
 * in the wide-screen gutter but up to 896px as a carousel slide, and it lays
 * out by the space it actually has.
 */
export default function SpecLinkCard({
  product,
}: {
  product: {
    slug: string;
    name: string;
    brand: string;
    image: string | null;
    category: { name: string };
  };
}) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="@container group flex flex-col bg-card border-[1.5px] border-border-heavy p-5 transition-colors hover:bg-accent-tint/40"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-border-heavy bg-accent-3 text-on-accent-3">
          <Cpu className="h-3.5 w-3.5" />
        </span>
        <h3 className="h-eyebrow text-accent">Full specs</h3>
      </div>

      <div className="flex flex-col gap-4 @min-[30rem]:flex-row @min-[30rem]:items-center">
        <div className="flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden border-[1.5px] border-border-heavy bg-accent-tint @min-[30rem]:w-48">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Cpu className="h-10 w-10 text-accent/40" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {product.brand} · {product.category.name}
            </p>
            <p className="mt-1 line-clamp-2 font-bold leading-snug text-foreground">{product.name}</p>
          </div>

          <span className="inline-flex w-full items-center justify-center gap-2 border-2 border-border-heavy bg-accent px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-on-accent shadow-brutal-sm transition-transform group-hover:-translate-y-px">
            Check the full detailed spec
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
