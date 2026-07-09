/**
 * Strips HTML tags from rich-text post content and returns the first
 * `wordLimit` words as a plain-text excerpt, ending with an ellipsis
 * if the content was truncated.
 */
export function getExcerpt(html: string, wordLimit: number = 40): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = text.split(" ");
  if (words.length <= wordLimit) return text;

  return words.slice(0, wordLimit).join(" ") + "…";
}

/**
 * Formats a date as a short relative time string, e.g. "10 hours ago",
 * "2 days ago", matching the "Published: X ago" style in the design.
 * Falls back to a short absolute date once it's more than ~4 weeks old.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  if (diffDay < 28) {
    const weeks = Math.round(diffDay / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

/**
 * Estimates reading time in minutes from HTML content, assuming ~200 wpm.
 * Always returns at least 1.
 */
export function getReadingTime(html: string): number {
  const wordCount = html
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 200));
}