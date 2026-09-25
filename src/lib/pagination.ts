// Collapses a long run of pages into first/last + a window around the
// current page, e.g. 1 … 4 5 [6] 7 8 … 42, so a pager stays scannable no
// matter how many pages of content exist. Shared by the public listing pager
// (link-based) and the dashboard pager (state-based).
export function pageWindow(current: number, total: number) {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}
