"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  SlidersHorizontal,
  Search,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import TagIcon from "./TagIcon";

interface Tag {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface Author {
  id: string;
  name: string | null;
}

interface BlogFiltersProps {
  tags: Tag[];
  authors: Author[];
  years: number[];
}

const fieldsContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseTags(value: string | null) {
  return value ? value.split(",").filter(Boolean) : [];
}

export default function BlogFilters({ tags, authors, years }: BlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [author, setAuthor] = useState(searchParams.get("author") ?? "");
  const [month, setMonth] = useState(searchParams.get("month") ?? "");
  const [year, setYear] = useState(searchParams.get("year") ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(() =>
    parseTags(searchParams.get("tag"))
  );
  const [applied, setApplied] = useState(false);
  const appliedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilterCount =
    [search, author].filter(Boolean).length +
    (month || year ? 1 : 0) +
    (selectedTags.length > 0 ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const periodLabel =
    month && year
      ? `${MONTHS[Number(month) - 1]} ${year}`
      : month
      ? MONTHS[Number(month) - 1]
      : year
      ? year
      : null;

  function buildQuery(
    overrides: Partial<{
      search: string;
      author: string;
      month: string;
      year: string;
      tags: string[];
    }> = {}
  ) {
    const values = {
      search,
      author,
      month,
      year,
      tags: selectedTags,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (values.search) params.set("search", values.search);
    if (values.author) params.set("author", values.author);
    if (values.month) params.set("month", values.month);
    if (values.year) params.set("year", values.year);
    if (values.tags.length) params.set("tag", values.tags.join(","));
    return params.toString();
  }

  function applyFilters(e?: React.FormEvent) {
    e?.preventDefault();
    const qs = buildQuery();
    router.push(qs ? `/blog?${qs}` : "/blog");

    if (appliedTimeout.current) clearTimeout(appliedTimeout.current);
    setApplied(true);
    appliedTimeout.current = setTimeout(() => setApplied(false), 1200);
  }

  function toggleTag(slug: string) {
    const next = selectedTags.includes(slug)
      ? selectedTags.filter((s) => s !== slug)
      : [...selectedTags, slug];
    setSelectedTags(next);
  }

  function clearAll() {
    setSearch("");
    setAuthor("");
    setMonth("");
    setYear("");
    setSelectedTags([]);
    router.push("/blog");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-card border-[1.5px] border-border-heavy rounded-md px-6 py-4 mt-8"
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 group"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-md border-[1.5px] border-border-heavy bg-accent text-on-accent">
            <SlidersHorizontal className="w-4 h-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">Filters</span>
          <AnimatePresence mode="wait">
            {hasActiveFilters && (
              <motion.span
                key={activeFilterCount}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md border-[1.5px] border-border-heavy bg-accent-2 text-on-accent-2 text-[11px] font-bold"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-muted-foreground group-hover:text-foreground transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="filters-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <motion.form
              onSubmit={applyFilters}
              variants={fieldsContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6"
            >
              {/* Text search */}
              <motion.div variants={fieldVariants} className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground peer-focus:text-accent transition-colors" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search title or content..."
                    className="peer w-full border-[1.5px] border-border-heavy bg-background rounded-md pl-10 pr-9 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground"
                  />
                  <AnimatePresence>
                    {search && (
                      <motion.button
                        type="button"
                        key="clear-search"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Author */}
              <motion.div variants={fieldVariants}>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Author
                </label>
                <div className="relative">
                  <select
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="peer w-full appearance-none border-[1.5px] border-border-heavy bg-background rounded-md pl-4 pr-9 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground"
                  >
                    <option value="">All authors</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name ?? "Unknown"}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-transform duration-200 peer-focus:rotate-180 peer-focus:text-accent" />
                </div>
              </motion.div>

              {/* Month / Year */}
              <motion.div variants={fieldVariants} className="grid grid-cols-2 gap-2 relative">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Month
                  </label>
                  <div className="relative">
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="peer w-full appearance-none border-[1.5px] border-border-heavy bg-background rounded-md pl-3.5 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground"
                    >
                      <option value="">Any</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground peer-focus:text-accent" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Year
                  </label>
                  <div className="relative">
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="peer w-full appearance-none border-[1.5px] border-border-heavy bg-background rounded-md pl-3.5 pr-8 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent text-foreground"
                    >
                      <option value="">Any</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground peer-focus:text-accent" />
                  </div>
                </div>
                <AnimatePresence>
                  {periodLabel && (
                    <motion.div
                      key="period-badge"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="col-span-2 overflow-hidden"
                    >
                      <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wide text-accent">
                        Showing {periodLabel}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Tag pills + actions */}
              <motion.div
                variants={fieldVariants}
                className="md:col-span-4 flex items-start justify-between flex-wrap gap-3 pt-3 border-t-[1.5px] border-border mt-1"
              >
                <div className="flex flex-wrap gap-2 pt-4">
                  {tags.map((t) => {
                    const isActive = selectedTags.includes(t.slug);
                    return (
                      <motion.button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTag(t.slug)}
                        aria-pressed={isActive}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        className={`tag-pill transition-colors duration-200 ${
                          isActive
                            ? "bg-accent text-on-accent"
                            : "bg-background text-muted-foreground hover:bg-foreground/5"
                        }`}
                      >
                        {isActive ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <TagIcon
                            icon={t.icon}
                            className="inline-flex w-3.5 h-3.5 [&>svg]:w-full [&>svg]:h-full"
                          />
                        )}
                        {t.name}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <AnimatePresence>
                    {hasActiveFilters && (
                      <motion.button
                        type="button"
                        key="clear-all"
                        onClick={clearAll}
                        initial={{ opacity: 0, scale: 0.9, width: 0 }}
                        animate={{ opacity: 1, scale: 1, width: "auto" }}
                        exit={{ opacity: 0, scale: 0.9, width: 0 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors px-3 py-3 whitespace-nowrap overflow-hidden"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear all
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    className="relative bg-accent text-on-accent border-[1.5px] border-border-heavy px-6 py-3 rounded-md text-xs font-bold uppercase tracking-wide hover:opacity-90 transition-all min-w-[130px] flex items-center justify-center overflow-hidden"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={applied ? "applied" : "apply"}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        {applied ? (
                          <>
                            <Check className="w-4 h-4" /> Applied
                          </>
                        ) : (
                          "Apply Filters"
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                </div>
              </motion.div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}