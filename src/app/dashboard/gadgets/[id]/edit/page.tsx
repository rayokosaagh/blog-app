import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import GadgetProductForm from "@/components/GadgetProductForm";

export default async function EditGadgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) return notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Edit Gadget
      </h1>
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
        }}
      />
    </div>
  );
}