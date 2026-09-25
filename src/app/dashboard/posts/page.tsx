"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import DeleteButton from "@/components/dashboard/DeleteButton";
import NotifySubscribersButton from "@/components/newsletter/NotifySubscribersButton";
import { SuccessToast } from "@/components/dashboard/DashboardUI";
import FilterSelect from "@/components/dashboard/FilterSelect";
import FilterSearch from "@/components/dashboard/FilterSearch";
import DashboardPagination from "@/components/dashboard/DashboardPagination";
import { usePagination } from "@/components/dashboard/usePagination";
import { POST_CATEGORIES, getPostCategory } from "@/lib/blog/categories";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All posts" },
  { value: "PUBLISHED", label: "Published only" },
  { value: "DRAFT", label: "Drafts only" },
];

// One grid for the heading row and every post row, so columns line up. Below
// xl: thumbnail | title | status, with the actions wrapping onto a second line.
const ROW =
  "grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 sm:px-5 xl:grid-cols-[64px_minmax(0,1fr)_96px_104px_56px_96px_220px] xl:gap-x-4";

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  views: number;
  featuredImage: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string;
  };
  tags?: { id: string; name: string; slug: string }[];
  category?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [deletedTitle, setDeletedTitle] = useState<string | null>(null);

  // Unique tags across all posts, for the tag filter dropdown.
  const availableTags = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    for (const post of posts) {
      for (const t of post.tags ?? []) map.set(t.slug, { name: t.name, slug: t.slug });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [posts]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch("/api/posts");
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load posts");
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "PUBLISHED" && post.published) ||
        (statusFilter === "DRAFT" && !post.published);

      const matchesTag =
        tagFilter === "ALL" || (post.tags ?? []).some((t) => t.slug === tagFilter);

      const matchesCategory =
        categoryFilter === "ALL" || getPostCategory(post.category).key === categoryFilter;

      return matchesSearch && matchesStatus && matchesTag && matchesCategory;
    });
  }, [posts, searchTerm, statusFilter, tagFilter, categoryFilter]);

  const { pageItems: pagedPosts, topRef, resetPage, pagerProps } = usePagination(filteredPosts);

  // Any filter change starts over at page 1.
  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      resetPage();
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1
                className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                All posts
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {filteredPosts.length} of {posts.length} total posts
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/posts/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New post</span>
          </Link>
        </div>
      </div>

      <div ref={topRef} className="flex scroll-mt-4 flex-col gap-3 sm:flex-row">
        <FilterSearch
          value={searchTerm}
          onChange={updateFilter(setSearchTerm)}
          placeholder="Search by title or slug..."
          ariaLabel="Search posts"
          className="flex-1"
        />
        <FilterSelect
          ariaLabel="Filter by category"
          value={categoryFilter}
          onChange={updateFilter(setCategoryFilter)}
          options={[
            { value: "ALL", label: "All categories" },
            ...POST_CATEGORIES.map((c) => ({ value: c.key, label: c.label })),
          ]}
          className="sm:w-44"
        />
        {availableTags.length > 0 && (
          <FilterSelect
            ariaLabel="Filter by tag"
            value={tagFilter}
            onChange={updateFilter(setTagFilter)}
            options={[
              { value: "ALL", label: "All tags" },
              ...availableTags.map((t) => ({ value: t.slug, label: t.name })),
            ]}
            className="sm:w-44"
          />
        )}
        <FilterSelect
          ariaLabel="Filter by status"
          value={statusFilter}
          onChange={updateFilter((v: string) => setStatusFilter(v as "ALL" | "PUBLISHED" | "DRAFT"))}
          options={STATUS_OPTIONS}
          className="sm:w-44"
          align="right"
        />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {posts.length === 0 ? "No posts yet" : "No posts match your filters"}
            </p>
            {posts.length === 0 && (
              <Link
                href="/dashboard/posts/new"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mt-2 inline-block"
              >
                Create your first post
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Column headings, desktop only; below xl each row stacks. */}
            <div
              aria-hidden
              className={`${ROW} hidden py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 xl:grid`}
            >
              <span className="col-span-2">Post</span>
              <span>Category</span>
              <span>Date</span>
              <span className="text-right">Views</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {pagedPosts.map((post) => {
                const category = getPostCategory(post.category).label;
                const date = new Date(post.createdAt).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <li
                    key={post.id}
                    className={`${ROW} py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40`}
                  >
                    {post.featuredImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.featuredImage}
                        alt=""
                        loading="lazy"
                        className="h-11 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                        <FileText className="h-4 w-4 text-blue-300 dark:text-blue-400/40" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="block truncate text-sm font-semibold text-zinc-900 hover:text-blue-600 dark:text-zinc-50 dark:hover:text-blue-400"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {/* Below xl the category/date/views columns are hidden,
                            so they ride along on this line instead. */}
                        <span className="xl:hidden">
                          <span className="font-semibold text-zinc-600 dark:text-zinc-300">{category}</span>
                          {" · "}
                          {date} · {post.views.toLocaleString()} views ·{" "}
                        </span>
                        By {post.author.name}
                        <span className="hidden xl:inline"> · /{post.slug}</span>
                      </p>
                    </div>

                    <span className="hidden truncate text-sm font-semibold text-zinc-600 xl:block dark:text-zinc-300">
                      {category}
                    </span>
                    <span className="hidden text-sm text-zinc-500 xl:block dark:text-zinc-400">{date}</span>
                    <span className="hidden text-right text-sm tabular-nums text-zinc-500 xl:block dark:text-zinc-400">
                      {post.views.toLocaleString()}
                    </span>

                    <span>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${
                          post.published
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </span>

                    <div className="col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1 pl-[76px] xl:col-span-1 xl:justify-end xl:pl-0">
                      {post.published && (
                        <>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          >
                            View →
                          </Link>
                          <NotifySubscribersButton
                            postId={post.id}
                            postTitle={post.title}
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          />
                        </>
                      )}
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        endpoint={`/api/posts/${post.id}`}
                        itemLabel={post.title}
                        itemType="post"
                        onDeleted={() => {
                          // Drop it from the list immediately so the deleted
                          // post no longer shows, then confirm with a toast.
                          setPosts((prev) => prev.filter((p) => p.id !== post.id));
                          setDeletedTitle(post.title);
                          setTimeout(() => setDeletedTitle(null), 3000);
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <DashboardPagination {...pagerProps} itemLabel="posts" />

      <AnimatePresence>
        {deletedTitle && (
          <SuccessToast
            message={`"${deletedTitle}" was deleted`}
            onClose={() => setDeletedTitle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
