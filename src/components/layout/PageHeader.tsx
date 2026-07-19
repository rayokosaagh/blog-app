import Link from "next/link";

interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  crumbs: Crumb[];
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Optional extra content under the title (intro text, quick-filter pills). */
  children?: React.ReactNode;
}

/**
 * Shared page header in the blog-page style: a breadcrumb pill, a large
 * headline with a soft ambient glow behind it. Used by the products and tag
 * listing pages so they match the blog.
 */
export default function PageHeader({ crumbs, title, subtitle, children }: PageHeaderProps) {
  return (
    <header className="relative mx-auto max-w-[1600px] px-6 pt-14 pb-8">
      {/* Soft ambient glow behind the headline — the one signature touch. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 left-1/2 h-[280px] w-[520px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative">
        <nav className="mb-8 inline-flex items-center gap-2 rounded-md border-[1.5px] border-border-heavy bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              {c.href ? (
                <Link href={c.href} className="transition-colors hover:text-accent">
                  {c.label}
                </Link>
              ) : (
                <span className="inline-flex max-w-[240px] items-center gap-1.5 truncate text-foreground">
                  {c.label}
                </span>
              )}
              {i < crumbs.length - 1 && <span className="text-border">/</span>}
            </span>
          ))}
        </nav>

        <h1 className="flex flex-wrap items-center gap-3 text-4xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
          {title}
        </h1>

        {subtitle && <p className="mt-3 font-bold text-muted-foreground">{subtitle}</p>}

        {children && <div className="mt-6">{children}</div>}
      </div>
    </header>
  );
}
