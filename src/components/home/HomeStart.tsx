import Link from "next/link";
import { ArrowRight, BookOpen, GitCompareArrows, Smartphone } from "lucide-react";

const destinations = [
  { href: "/reviews", label: "Read reviews", description: "Our verdicts and hands-on coverage", Icon: BookOpen },
  { href: "/products", label: "Explore gadgets", description: "Find phones, laptops and more", Icon: Smartphone },
  { href: "/compare", label: "Compare", description: "See specifications side by side", Icon: GitCompareArrows },
];

/**
 * The homepage's opening section, straight under the hero: the page's one h1
 * plus three starting points. The links use the site's card vocabulary
 * (surface border, hard/soft shadow, brutal-press, icon chip), so they follow
 * the active theme like every other homepage section.
 */
export default function HomeStart() {
  return (
    <div className="mt-6 border-t border-border pt-5 sm:mt-8 sm:pt-6">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <h1 className="h-page-title text-foreground">Find your next gadget</h1>
        <p className="text-sm text-muted-foreground">Read the review. Explore the specs. Make your choice.</p>
      </div>
      <nav aria-label="Start exploring" className="grid grid-cols-3 gap-2 sm:gap-4">
        {destinations.map(({ href, label, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-w-0 flex-col items-start gap-2.5 surface-border border-border-heavy bg-card p-3 text-foreground shadow-brutal-sm brutal-press focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:flex-row sm:items-center sm:gap-3.5 sm:p-4"
          >
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center surface-border border-border-heavy bg-accent-tint text-accent transition-colors group-hover:bg-accent group-hover:text-on-accent sm:h-10 sm:w-10"
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
            </span>
            <span className="min-w-0">
              <span className="block break-words text-sm font-extrabold">{label}</span>
              <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">{description}</span>
            </span>
            <ArrowRight
              aria-hidden
              className="ml-auto hidden h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent sm:block"
            />
          </Link>
        ))}
      </nav>
    </div>
  );
}
