import Link from "next/link";
import { ArrowRight, BookOpen, GitCompareArrows, Smartphone } from "lucide-react";

const destinations = [
  { href: "/reviews", label: "Read reviews", description: "Our verdicts and hands-on coverage", Icon: BookOpen },
  { href: "/products", label: "Explore gadgets", description: "Find phones, laptops and more", Icon: Smartphone },
  { href: "/compare", label: "Compare", description: "See specifications side by side", Icon: GitCompareArrows },
];

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
            className="group flex min-w-0 flex-col items-start gap-2 surface-border border-border-heavy bg-card p-3 text-foreground shadow-brutal-sm transition-colors hover:bg-accent-tint focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:flex-row sm:items-center sm:gap-3 sm:p-4"
          >
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" />
            <span className="min-w-0">
              <span className="block break-words text-sm font-extrabold">{label}</span>
              <span className="mt-1 hidden text-xs text-muted-foreground sm:block">{description}</span>
            </span>
            <ArrowRight aria-hidden="true" className="ml-auto hidden h-4 w-4 shrink-0 sm:block" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
