import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const CLASS =
  "inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors";

interface BackLinkProps {
  /** Navigate to a route (renders a Link). */
  href?: string;
  /** Or run a handler, e.g. an in-page view switch or router.back (renders a button). */
  onClick?: () => void;
  label?: string;
}

/**
 * The universal "back" control for dashboard create/edit forms. Renders a
 * <Link> when given `href`, or a <button> when given `onClick` — same markup
 * either way so every form's back affordance looks identical.
 */
export default function BackLink({ href, onClick, label = "Back" }: BackLinkProps) {
  const inner = (
    <>
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={CLASS}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={CLASS}>
      {inner}
    </button>
  );
}
