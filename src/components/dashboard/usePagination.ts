"use client";

import { useRef, useState } from "react";

/**
 * Client-side paging for dashboard lists that are fetched whole and filtered
 * in the browser. Pair it with <DashboardPagination {...pagerProps} />.
 *
 * The page is clamped at render rather than reset in an effect: deleting the
 * last item on the last page, or a filter that shrinks the list, just lands on
 * the new last page. Call `resetPage()` from filter handlers so a changed
 * filter starts over at page 1 — page 3 of the old results means nothing in
 * the new ones.
 */
export function usePagination<T>(
  items: T[],
  pageSizeOptions: number[] = [10, 20, 50],
  initialPageSize: number = pageSizeOptions[1] ?? pageSizeOptions[0]
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  // Attach to the element the list should scroll back to on a page change.
  const topRef = useRef<HTMLDivElement>(null);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function goToPage(next: number) {
    setPage(next);
    // The pager sits under the list; bring the top of the list back into view
    // if the reader has scrolled past it.
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) {
      top.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return {
    pageItems,
    topRef,
    resetPage: () => setPage(1),
    pagerProps: {
      page: currentPage,
      pageSize,
      total: items.length,
      pageSizeOptions,
      onPageChange: goToPage,
      onPageSizeChange: (size: number) => {
        setPageSize(size);
        setPage(1);
      },
    },
  };
}
