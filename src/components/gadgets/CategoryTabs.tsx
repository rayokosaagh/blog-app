// src/components/gadgets/CategoryTabs.tsx
"use client";
import { CATEGORY_LIST } from "@/lib/gadgets/categories";
import { useRouter } from "next/navigation";

export default function CategoryTabs({ current }: { current: string }) {
  const router = useRouter();
  return (
    <div className="flex gap-6 overflow-x-auto border-b pb-3 mb-6">
      {CATEGORY_LIST.map((c) => (
        <button
          key={c.slug}
          onClick={() => router.push(`/compare?category=${c.slug}`)} // fresh comparison, clears p1/p2/p3
          className={`flex flex-col items-center gap-1 text-sm shrink-0 ${
            c.slug === current ? "text-blue-600 font-semibold" : "text-gray-500"
          }`}
        >
          <img src={c.icon} alt={c.name} className="h-6 w-6" />
          {c.name}
        </button>
      ))}
    </div>
  );
}