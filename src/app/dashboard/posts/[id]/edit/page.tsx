"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FileEdit, ImageIcon, X } from "lucide-react";
import TagPicker from "@/components/blog/TagPicker";
import { useFileDrop, DROP_ACTIVE_CLASS } from "@/components/dashboard/useFileDrop";
import NotifySubscribersButton from "@/components/newsletter/NotifySubscribersButton";
import BackLink from "@/components/dashboard/BackLink";
import StickyFormActions from "@/components/dashboard/StickyFormActions";
import VerdictEditor, {
  EMPTY_VERDICT,
  verdictDraftFromPost,
  verdictPayload,
  type VerdictDraft,
} from "@/components/dashboard/VerdictEditor";
import CategorySelect from "@/components/dashboard/CategorySelect";
import { DEFAULT_POST_CATEGORY, isPostCategory } from "@/lib/blog/categories";
import type { PostCategory } from "@/generated/prisma";




const Editor = dynamic(() => import("@/components/dashboard/Editor"), { ssr: false });

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [category, setCategory] = useState<PostCategory>(DEFAULT_POST_CATEGORY);
  const [featuredImage, setFeaturedImage] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<VerdictDraft>(EMPTY_VERDICT);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [postId, setPostId] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        const { id } = await params;
        setPostId(id);
        const res = await fetch(`/api/posts/${id}`);
        const data = await res.json();
        setTitle(data.title);
        setSlug(data.slug);
        setContent(data.content);
        setPublished(data.published);
        if (isPostCategory(data.category)) setCategory(data.category);
        setFeaturedImage(data.featuredImage || "");
        setTagIds(data.tags?.map((t: { id: string }) => t.id) || []);
        setVerdict(verdictDraftFromPost(data));
      } catch (err) {
        setError("Failed to load post");
      } finally {
        setFetching(false);
      }
    }
    fetchPost();
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .trim()
    );
  }

  async function handleFeaturedImageUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (file) await uploadFeaturedImage(file);
    e.target.value = "";
  }

  async function uploadFeaturedImage(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }

      setFeaturedImage(data.url);
    } catch (error) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const featuredDrop = useFileDrop({
    onFiles: (files) => uploadFeaturedImage(files[0]),
    disabled: uploading,
    onReject: (msg) => alert(msg),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content,
          published,
          featuredImage,
          tagIds,
          category,
          ...verdictPayload(verdict),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update post");
        return;
      }

      router.push("/dashboard/posts");
      router.refresh();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-400">Loading post...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/posts" label="Posts" />

      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <FileEdit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Edit post
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Update your blog post</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 p-6 sm:p-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
              required
            />
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5" style={{ fontFamily: "var(--font-mono)" }}>
              URL: /blog/{slug}
            </p>
          </div>

          {/* Category — what kind of article this is; tags below say what
              it is about. Drives the /news, /reviews… pages and the badge on
              every card. */}
          <CategorySelect value={category} onChange={setCategory} />

          {/* Featured Image */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Featured image
            </label>

            {featuredImage ? (
              <div className="relative">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage("")}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                {...featuredDrop.dropProps}
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  featuredDrop.isDragging
                    ? DROP_ACTIVE_CLASS
                    : "border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <div className="text-center pointer-events-none">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {uploading
                      ? "Uploading..."
                      : featuredDrop.isDragging
                        ? "Drop to upload"
                        : "Drag a featured image here, or click to browse"}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    PNG, JPG, GIF, WEBP up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFeaturedImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Tags — kept right under the featured image */}
          <TagPicker selectedTagIds={tagIds} onChange={setTagIds} />

          {/* Published toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500/40"
            />
            <label htmlFor="published" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Published
            </label>
            <NotifySubscribersButton postId={postId} />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Content
            </label>
            <Editor content={content} onChange={setContent} />
          </div>

          <VerdictEditor value={verdict} onChange={setVerdict} />

          {/* Sticky action bar */}
          <StickyFormActions
            saving={loading}
            disabled={uploading}
            submitLabel="Save changes"
            onCancel={() => router.back()}
          />
        </form>
      </div>
    </div>
  );
}