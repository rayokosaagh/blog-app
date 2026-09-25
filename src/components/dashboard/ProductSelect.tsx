"use client";

import { useEffect, useMemo, useState } from "react";

interface ProductOption {
  id: string;
  name: string;
  slug: string;
  published: boolean;
  category: { name: string };
}

/**
 * The "linked product" picker for the post forms — which catalogue entry the
 * article is about. A linked, published product puts a "full detailed spec"
 * card at the end of the post. Same plain <select> treatment as
 * CategorySelect, grouped by gadget category so a long catalogue stays
 * findable.
 */
export default function ProductSelect({
  value,
  onChange,
  id = "post-product",
}: {
  /** Product id, or "" for none. */
  value: string;
  onChange: (next: string) => void;
  id?: string;
}) {
  const [products, setProducts] = useState<ProductOption[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gadgets/products")
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data.products) ? data.products : []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, ProductOption[]>();
    for (const p of products ?? []) {
      const list = map.get(p.category.name) ?? [];
      list.push(p);
      map.set(p.category.name, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, list]) => [name, list.sort((a, b) => a.name.localeCompare(b.name))] as const);
  }, [products]);

  const selected = products?.find((p) => p.id === value);

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
        Linked product
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={products === null}
        className="w-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all disabled:opacity-60"
      >
        <option value="">{products === null ? "Loading products…" : "None"}</option>
        {groups.map(([category, list]) => (
          <optgroup key={category} label={category}>
            {list.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.published ? "" : " (draft)"}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
        {selected ? (
          <>
            Adds a &ldquo;full detailed spec&rdquo; card at the end of the post, linking to{" "}
            <span style={{ fontFamily: "var(--font-mono)" }}>/product/{selected.slug}</span>
            {!selected.published && " once the product is published"}.
          </>
        ) : (
          "Optional. Link the gadget this article is about to show its spec card at the end of the post."
        )}
      </p>
    </div>
  );
}
