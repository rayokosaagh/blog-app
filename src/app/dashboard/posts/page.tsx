"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FileText, Search, ChevronDown, Plus } from "lucide-react";
import DeleteButton from "@/components/dashboard/DeleteButton";
import AnimatedPostCard from "@/components/blog/AnimatedPostCard";
import NotifySubscribersButton from "@/components/newsletter/NotifySubscribersButton";
import { SuccessToast } from "@/components/dashboard/DashboardUI";
import { POST_CATEGORIES, getPostCategory } from "@/lib/blog/categories";

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Unique tags across all posts, for the tag filter dropdown.
  const availableTags = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    for (const post of posts) {
      for (const t of post.tags ?? []) map.set(t.slug, { name: t.name, slug: t.slug });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [posts]);

  // Fetch posts on client
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all sm:w-44"
        >
          <option value="ALL">All categories</option>
          {POST_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>

        {/* Tag filter */}
        {availableTags.length > 0 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all sm:w-52"
          >
            <option value="ALL">All tags</option>
            {availableTags.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        {/* Custom Dropdown */}
        <div className="relative sm:w-52" ref={dropdownRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-700 dark:text-zinc-200 flex justify-between items-center hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            <span>
              {statusFilter === "ALL" && "All posts"}
              {statusFilter === "PUBLISHED" && "Published only"}
              {statusFilter === "DRAFT" && "Drafts only"}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showStatusDropdown && (
            <div className="absolute right-0 mt-2 w-full bg-white dark:bg-zinc-800 rounded-xl shadow-xl ring-1 ring-zinc-200 dark:ring-zinc-700 py-1.5 z-50">
              {[
                { value: "ALL", label: "All posts" },
                { value: "PUBLISHED", label: "Published only" },
                { value: "DRAFT", label: "Drafts only" },
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value as "ALL" | "PUBLISHED" | "DRAFT");
                    setShowStatusDropdown(false);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    statusFilter === option.value
                      ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-500/10"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                  }`}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <AnimatedPostCard index={0}>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">No posts found</p>
              <Link
                href="/dashboard/posts/new"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mt-2 inline-block"
              >
                Create your first post
              </Link>
            </div>
          </AnimatedPostCard>
        ) : (
          filteredPosts.map((post, index) => (
            <AnimatedPostCard key={post.id} index={index}>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden flex flex-col sm:flex-row">
                {/* Featured Image */}
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-40 sm:w-48 sm:h-36 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-full h-40 sm:w-48 sm:h-36 bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-8 w-8 text-blue-300 dark:text-blue-400/40" />
                  </div>
                )}

                {/* Post Info */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                          {post.title}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                          <span className="font-semibold text-zinc-600 dark:text-zinc-300">
                            {getPostCategory(post.category).label}
                          </span>
                          <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                          /{post.slug}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide flex-shrink-0 ${
                          post.published
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      By {post.author.name} · {new Date(post.createdAt).toDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      {post.published && (
                        <>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          >
                            View →
                          </Link>
                          <NotifySubscribersButton postId={post.id} postTitle={post.title} />
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
                  </div>
                </div>
              </div>
            </AnimatedPostCard>
          ))
        )}
      </div>

      {/* Success confirmation after a delete */}
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