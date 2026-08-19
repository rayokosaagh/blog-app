"use client";

import type { PostCategory } from "@/generated/prisma";
import { POST_CATEGORIES, getPostCategory } from "@/lib/blog/categories";

/**
 * The post-category picker for the dashboard forms. A plain <select> — five
 * fixed options don't need a fancier control — plus the chosen category's
 * one-line description so the editor sees what each bucket is for.
 */
export default function CategorySelect({
  value,
  onChange,
  id = "post-category",
}: {
  value: PostCategory;
  onChange: (next: PostCategory) => void;
  id?: string;
}) {
  const current = getPostCategory(value);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
        Category
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as PostCategory)}
        className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
      >
        {POST_CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
        {current.description} Listed at <span style={{ fontFamily: "var(--font-mono)" }}>/{current.slug}</span>.
      </p>
    </div>
  );
}
