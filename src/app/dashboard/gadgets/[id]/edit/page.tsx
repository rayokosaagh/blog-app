import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import GadgetProductForm from "@/components/gadgets/GadgetProductForm";

export default async function EditGadgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, tags: true }, // ← added tags
  });

  if (!product) return notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/gadgets"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Gadgets
      </Link>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl ring-1 ring-zinc-200/70 dark:ring-zinc-800 overflow-hidden">
        <div className="h-1 bg-blue-500" />
        <div className="p-5 sm:p-6 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
            <Pencil className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Edit {product.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {product.category.name} · {product.brand}
            </p>
          </div>
        </div>
      </div>

      <GadgetProductForm
        mode="edit"
        productId={product.id}
        initial={{
          slug: product.slug,
          name: product.name,
          brand: product.brand,
          image: product.image,
          priceFrom: product.priceFrom,
          published: product.published,
          categorySlug: product.category.slug,
          specs: (product.specs as Record<string, any>) ?? {},
          tagIds: product.tags.map((t) => t.id), // ← added
        }}
      />
    </div>
  );
}