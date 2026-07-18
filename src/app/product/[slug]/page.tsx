import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCategoryDef } from "@/lib/gadgets/categories";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import ProductHero from "@/components/gadgets/product/ProductHero";
import OwnershipWidget from "@/components/gadgets/product/OwnershipWidget";
import ProductSpecNav from "@/components/gadgets/product/ProductSpecNav";
import ProductSpecTable from "@/components/gadgets/product/ProductSpecTable";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true, tags: true },
  });
  return product;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — Full Specifications`,
    description: `${product.name} by ${product.brand} — detailed specifications, price and features.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || !product.published) notFound();

  const categoryDef = getCategoryDef(product.category.slug);
  if (!categoryDef) notFound(); // category exists in DB but has no spec-group definition

  const specs = (product.specs as Record<string, unknown>) ?? {};

  // ── Ownership widget data ──
  const session = await auth();
  const ownershipCounts = await prisma.productOwnership.groupBy({
    by: ["status"],
    where: { productId: product.id },
    _count: true,
  });
  const counts = { WANT: 0, HAVE: 0, HAD: 0 } as Record<"WANT" | "HAVE" | "HAD", number>;
  for (const c of ownershipCounts) counts[c.status] = c._count;

  const userOwnership = session?.user?.id
    ? await prisma.productOwnership.findUnique({
        where: { userId_productId: { userId: session.user.id, productId: product.id } },
      })
    : null;

  // Small helper so missing/empty spec values don't render "undefined" or blank bullets
  function specStr(key: string): string | null {
    const v = specs[key];
    return typeof v === "string" && v.trim() !== "" ? v : null;
  }

  const launchDate = specStr("launchDate");
  const dimensions = specStr("dimensions");
  const weightGm = specStr("weightGm");
  const storage = specStr("storage");
  const os = specStr("os");
  const colors = specStr("colors");
  const screenSize = specStr("screenSize");
  const resolution = specStr("resolution");
  const ram = specStr("ram");
  const chipset = specStr("chipset");
  const batteryMah = specStr("batteryMah");
  const charging = specStr("charging");

  const meta = [
    launchDate ? { icon: "calendar" as const, text: `Released ${launchDate}` } : null,
    dimensions || weightGm
      ? {
          icon: "smartphone" as const,
          text: [dimensions, weightGm].filter(Boolean).join(", "),
        }
      : null,
    storage ? { icon: "hardDrive" as const, text: `${storage} storage` } : null,
    os ? { icon: "layers" as const, text: os } : null,
    colors ? { icon: "palette" as const, text: colors } : null,
  ].filter(
    (m): m is { icon: "calendar" | "smartphone" | "hardDrive" | "layers" | "palette"; text: string } =>
      m !== null
  );

  const quickSpecs = [
    screenSize
      ? { icon: "monitor" as const, value: screenSize, label: resolution ?? "Display" }
      : null,
    ram ? { icon: "memoryStick" as const, value: ram, label: "RAM" } : null,
    chipset ? { icon: "cpu" as const, value: chipset, label: "Chipset" } : null,
    batteryMah
      ? {
          icon: "batteryCharging" as const,
          value: batteryMah,
          label: charging ?? "Battery",
        }
      : null,
  ].filter(
    (q): q is { icon: "monitor" | "cpu" | "memoryStick" | "batteryCharging"; value: string; label: string } =>
      q !== null
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 pt-10 sm:pt-14 pb-16">
        <ProductHero
          product={product}
          categoryName={product.category.name}
          meta={meta}
          quickSpecs={quickSpecs}
        />

        <div className="mt-6">
          <OwnershipWidget
            productId={product.id}
            initialCounts={counts}
            initialUserStatus={userOwnership?.status ?? null}
            isSignedIn={!!session?.user?.id}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 mt-10">
          <ProductSpecNav groups={categoryDef.groups} specs={specs} />

          <div className="flex-1 min-w-0 flex flex-col gap-10">
            {categoryDef.groups.map((group) => (
              <ProductSpecTable key={group.title} group={group} specs={specs} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}