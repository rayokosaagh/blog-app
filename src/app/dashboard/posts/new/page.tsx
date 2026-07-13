"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import TagPicker from "@/components/blog/TagPicker";

const Editor = dynamic(() => import("@/components/dashboard/Editor"), { ssr: false });

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [featuredImage, setFeaturedImage] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    if (!file) return;

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          content,
          published,
          featuredImage,
          tagIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create post");
        setLoading(false);
        return;
      }

      // Show success message
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/dashboard/posts";
      }, 2000);

    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  // Success screen
  if (success) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="bg-white rounded-xl shadow-sm p-12 text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Post {published ? "Published" : "Saved"}!
          </h2>
          <p className="text-gray-500 mb-2">
            "{title}" has been {published ? "published successfully" : "saved as a draft"}.
          </p>
          <p className="text-sm text-gray-400">
            Redirecting to posts...
          </p>
          <div className="mt-6 w-full bg-gray-100 rounded-full h-1">
            <div className="bg-green-500 h-1 rounded-full animate-[width_2s_ease-in-out]" style={{ width: "100%", transition: "width 2s" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">New Post</h1>
        <p className="text-gray-500 mt-1">Create a new blog post</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              URL: /blog/{slug || "my-awesome-blog-post"}
            </p>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Featured Image
            </label>
            {featuredImage ? (
              <div className="relative">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage("")}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="text-center">
                  <p className="text-4xl mb-2">🖼️</p>
                  <p className="text-sm font-medium text-gray-700">
                    {uploading ? "Uploading..." : "Click to upload featured image"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
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

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <Editor content={content} onChange={setContent} />
          </div>

          {/* Tags */}
          <TagPicker selectedTagIds={tagIds} onChange={setTagIds} />

          {/* Published toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publish immediately
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={loading || uploading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? "Creating..." : published ? "Publish Post" : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}