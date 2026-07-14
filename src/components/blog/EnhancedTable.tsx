"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Copy,
  Check,
  Table2,
  Download,
  LayoutGrid,
  List,
  X,
} from "lucide-react";

interface ProcessedTable {
  headers: string[];
  rows: string[][];
  caption?: string;
}

type SortDirection = "asc" | "desc" | null;

export default function EnhancedTable({ html }: { html: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
 const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // DOMParser only exists in the browser. Parsing during render (e.g. in a
  // useMemo) would run on the server too, throw there, and produce a
  // server-rendered "empty" fallback that doesn't match what the client
  // renders once DOMParser is available — a hydration mismatch. Deferring
  // the parse to an effect means it only ever runs client-side, after the
  // server-rendered markup has already been hydrated.
  const [tableData, setTableData] = useState<ProcessedTable | null>(null);
  const [hasParsed, setHasParsed] = useState(false);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<table>${html}</table>`, "text/html");
      const table = doc.querySelector("table");
      if (!table) {
        setTableData(null);
        return;
      }

      const allRows = Array.from(table.querySelectorAll("tr"));
      if (allRows.length === 0) {
        setTableData(null);
        return;
      }

      // Prefer an explicit <thead> row as the header; otherwise fall back
      // to the first row in document order. Matching by element reference
      // (rather than re-querying with a selector) guarantees this row can
      // never also end up in the body rows below, even when the browser
      // auto-wraps loose <tr>s in an implicit <tbody>.
      const headerRow = table.querySelector("thead tr") || allRows[0];

      const headers: string[] = [];
      headerRow.querySelectorAll("th, td").forEach((cell) => {
        headers.push(cell.textContent?.trim() || "");
      });

      const bodyRowEls = allRows.filter((row) => row !== headerRow);

      const rows: string[][] = [];
      bodyRowEls.forEach((row) => {
        const cells: string[] = [];
        row.querySelectorAll("td, th").forEach((cell) => {
          cells.push(cell.innerHTML?.trim() || "");
        });
        if (cells.length > 0 && cells.some((c) => c.replace(/<[^>]*>/g, "").trim())) {
          rows.push(cells);
        }
      });

      const caption = table.querySelector("caption")?.textContent?.trim();

      setTableData({ headers, rows, caption });
    } catch {
      setTableData(null);
    } finally {
      setHasParsed(true);
    }
  }, [html]);

  const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!tableData) return null;

    let filtered = tableData.rows;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row) =>
        row.some((cell) => cell.replace(/<[^>]*>/g, "").toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortColumn !== null && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn]?.replace(/<[^>]*>/g, "").trim() || "";
        const bVal = b[sortColumn]?.replace(/<[^>]*>/g, "").trim() || "";

        // Try numeric comparison
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }

        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    return { ...tableData, rows: filtered };
  }, [tableData, searchQuery, sortColumn, sortDirection]);

  const handleSort = useCallback(
    (columnIndex: number) => {
      if (sortColumn === columnIndex) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else if (sortDirection === "desc") {
          setSortColumn(null);
          setSortDirection(null);
        }
      } else {
        setSortColumn(columnIndex);
        setSortDirection("asc");
      }
    },
    [sortColumn, sortDirection]
  );

  const handleCopyTable = useCallback(async () => {
    if (!processedData) return;

    const text = [
      processedData.headers.join("\t"),
      ...processedData.rows.map((row) =>
        row.map((cell) => cell.replace(/<[^>]*>/g, "")).join("\t")
      ),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [processedData]);

  const handleExportCSV = useCallback(() => {
    if (!processedData) return;

    const csv = [
      processedData.headers.join(","),
      ...processedData.rows.map((row) =>
        row
          .map((cell) => {
            const clean = cell.replace(/<[^>]*>/g, "").replace(/"/g, '""');
            return clean.includes(",") ? `"${clean}"` : clean;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `table-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [processedData]);

  // Before the client-only parse effect has run, tableData/processedData
  // are both null on the server AND on the client's first render — so this
  // skeleton is guaranteed to match on both sides. The "no data" message
  // below only ever renders after hasParsed flips to true, which only
  // happens post-hydration, so it can never be part of a mismatch.
  if (!hasParsed) {
    return (
      <div className="my-8 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border bg-background/40 h-11 animate-pulse" />
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-3"
            >
              <div className="h-4 w-2/3 bg-muted-foreground/10 rounded" />
              <div className="h-3 w-full bg-muted-foreground/10 rounded" />
              <div className="h-3 w-5/6 bg-muted-foreground/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!processedData || processedData.rows.length === 0) {
    return (
      <div className="my-8 p-8 rounded-xl border border-border bg-card text-center">
        <Table2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground text-sm">No table data available</p>
      </div>
    );
  }

  const SortIcon = ({ columnIndex }: { columnIndex: number }) => {
    if (sortColumn !== columnIndex)
      return <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-60 transition-opacity" />;
    if (sortDirection === "asc") return <ChevronUp className="w-3.5 h-3.5 text-accent" />;
    if (sortDirection === "desc") return <ChevronDown className="w-3.5 h-3.5 text-accent" />;
    return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  };

  const rowMatches = (row: string[]) =>
    !!searchQuery &&
    row.some((cell) =>
      cell.replace(/<[^>]*>/g, "").toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="my-8 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-background/40">
        <div className="flex items-center gap-3 min-w-0">
          {processedData.caption && (
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
              {processedData.caption}
            </span>
          )}

          {/* Sort by (only meaningful in card view, where there's no clickable header row) */}
          {viewMode === "cards" && (
            <div className="flex items-center gap-1 shrink-0">
              <select
                value={sortColumn ?? ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    setSortColumn(null);
                    setSortDirection(null);
                  } else {
                    setSortColumn(Number(e.target.value));
                    setSortDirection("asc");
                  }
                }}
                className="text-xs bg-transparent border border-border rounded-md px-1.5 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent max-w-[110px]"
              >
                <option value="">Sort by…</option>
                {processedData.headers.map((h, i) => (
                  <option key={i} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </select>
              {sortColumn !== null && (
                <button
                  onClick={() => handleSort(sortColumn)}
                  className="p-1 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/5 transition-colors"
                  title="Toggle sort direction"
                >
                  {sortDirection === "asc" ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* View toggle */}
          <div className="flex items-center rounded-md border border-border overflow-hidden mr-1">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 transition-colors ${
                viewMode === "cards"
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 transition-colors border-l border-border ${
                viewMode === "table"
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-md transition-colors ${
              showSearch
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-accent hover:bg-accent/5"
            }`}
            title="Search in table"
          >
            {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Copy */}
          <button
            onClick={handleCopyTable}
            className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/5 transition-colors"
            title="Copy table"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-accent/5 transition-colors"
            title="Export as CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-border bg-background/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={`${expanded ? "max-h-[600px] overflow-y-auto" : ""} ${
          viewMode === "table" ? "overflow-x-auto scrollbar-hide" : ""
        }`}
      >
        {viewMode === "cards" ? (
  <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
    {processedData.headers.slice(1).map((productName, i) => {
      const headerIndex = i + 1;
      // Inside the cards map, change the attributes line:
const attributes = processedData.rows
  .map((row) => ({ label: stripHtml(row[0] || ""), value: row[headerIndex] }))
  .filter((item) => item.value);
      if (attributes.length === 0) return null;

      const cardMatches =
        !!searchQuery &&
        (productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          attributes.some((a) =>
            a.value.replace(/<[^>]*>/g, "").toLowerCase().includes(searchQuery.toLowerCase())
          ));

      return (
        <div
          key={headerIndex}
          className={`rounded-xl border border-border bg-card p-5 hover:border-accent/30 hover:shadow-md transition-all duration-200 ${
            cardMatches ? "border-accent/40 ring-1 ring-accent/20" : ""
          }`}
        >
          <div className="text-base font-semibold text-foreground pb-3 mb-4 border-b border-border">
            {productName}
          </div>
          <div className="space-y-0">
            {attributes.map(({ label, value }, idx) => (
              <div
  key={idx}
  className={idx > 0 ? "pt-3.5 mt-3.5 border-t border-border/50" : ""}
>
  <span className="inline-block text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wide mb-1.5">
    {label}
  </span>
  <div
    className="text-sm text-foreground font-medium leading-relaxed [&_*]:!text-left"
    dangerouslySetInnerHTML={{ __html: value }}
  />
</div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                {processedData.headers.map((header, i) => (
                  <th
                    key={i}
                    onClick={() => handleSort(i)}
                    className="group px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-accent transition-colors sticky top-0 bg-card z-10"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{header}</span>
                      <span className="shrink-0">
                        <SortIcon columnIndex={i} />
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b border-border transition-colors ${
                    rowIndex % 2 === 0 ? "bg-transparent" : "bg-background/30"
                  } hover:bg-accent/5 ${rowMatches(row) ? "ring-1 ring-inset ring-accent/20" : ""}`}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-sm text-foreground/90"
                      dangerouslySetInnerHTML={{ __html: cell }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {processedData.rows.length > 10 && (
        <div className="flex items-center justify-end px-4 py-2 border-t border-border bg-background/40">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
          >
            {expanded ? "Show less ▲" : `Show all (${tableData?.rows.length}) ▼`}
          </button>
        </div>
      )}
    </div>
  );
}