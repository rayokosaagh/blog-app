"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import AnimatedPostCard from "@/components/AnimatedPostCard";

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
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

      return matchesSearch && matchesStatus;
    });
  }, [posts, searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Posts</h1>
          <p className="text-gray-500 mt-1">
            {filteredPosts.length} of {posts.length} total posts
          </p>
        </div>
        <Link
          href="/dashboard/posts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Post
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <input
            type="text"
            placeholder="Search by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">🔍</div>
        </div>

        {/* Custom Dropdown */}
        <div className="sm:w-56 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="w-full border border-gray-300 rounded-2xl px-5 py-3.5 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-left flex items-center justify-between text-gray-900"
          >
            <span>
              {statusFilter === "ALL" && "All Posts"}
              {statusFilter === "PUBLISHED" && "Published Only"}
              {statusFilter === "DRAFT" && "Drafts Only"}
            </span>
            <span className={`transition-transform duration-200 ${showStatusDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>

          {showStatusDropdown && (
            <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50">
              {[
                { value: "ALL", label: "All Posts" },
                { value: "PUBLISHED", label: "Published Only" },
                { value: "DRAFT", label: "Drafts Only" },
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value as "ALL" | "PUBLISHED" | "DRAFT");
                    setShowStatusDropdown(false);
                  }}
                  className={`px-5 py-3 hover:bg-gray-100 cursor-pointer transition-colors ${
                    statusFilter === option.value ? "bg-blue-50 text-blue-700 font-medium" : ""
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
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
              <p className="text-5xl mb-4">📝</p>
              <p className="text-lg font-medium">No posts found</p>
              <Link
                href="/dashboard/posts/new"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Create your first post
              </Link>
            </div>
          </AnimatedPostCard>
        ) : (
          filteredPosts.map((post, index) => (
            <AnimatedPostCard key={post.id} index={index}>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden flex">
                {/* Featured Image */}
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-48 h-36 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-48 h-36 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-4xl">📝</span>
                  </div>
                )}

                {/* Post Info */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {post.title}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          /{post.slug}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                          post.published
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {post.published ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">
                      By {post.author.name} ·{" "}
                      {new Date(post.createdAt).toDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      {post.published && (
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          View →
                        </Link>
                      )}
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="text-sm text-blue-600 hover:underline font-medium"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        postId={post.id}
                        postTitle={post.title}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedPostCard>
          ))
        )}
      </div>
    </div>
  );
}