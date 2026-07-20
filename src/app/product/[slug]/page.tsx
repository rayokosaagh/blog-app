import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCategoryDef } from "@/lib/gadgets/categories";
import { parseColors } from "@/lib/gadgets/colors";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import ProductHero from "@/components/gadgets/product/ProductHero";
import type {
  HeroIconKey,
  HeroMetaItem,
  HeroQuickSpec,
} from "@/components/gadgets/product/ProductHero";
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

  // Small builders that drop empty values, so a category only shows the meta
  // bullets / quick-specs it actually has.
  const item = (icon: HeroIconKey, text: string | null): HeroMetaItem | null =>
    text && text.trim() ? { icon, text } : null;
  const quick = (icon: HeroIconKey, key: string, label: string): HeroQuickSpec | null => {
    const v = specStr(key);
    return v ? { icon, value: v, label } : null;
  };
  const dims = (...keys: string[]) =>
    keys.map((k) => specStr(k)).filter(Boolean).join(", ") || null;

  // Each category stores its specs under different keys, so the hero's icon
  // bullets and quick-spec strip are built per category (earbuds/watches don't
  // have "ram"/"chipset" etc., which is why they previously showed no icons).
  let metaRaw: (HeroMetaItem | null)[];
  let quickRaw: (HeroQuickSpec | null)[];

  switch (product.category.slug) {
    case "laptops":
      metaRaw = [
        item("calendar", specStr("announcedDate") && `Released ${specStr("announcedDate")}`),
        item("smartphone", dims("dimensions", "weight")),
        item("hardDrive", specStr("primarySsd") && `${specStr("primarySsd")} SSD`),
        item("layers", specStr("operatingSystem")),
      ];
      quickRaw = [
        quick("monitor", "screenSize", specStr("resolution") ?? "Display"),
        quick("memoryStick", "installedRam", "RAM"),
        quick("cpu", "processorModel", "Processor"),
        quick("images", "gpuModel", "Graphics"),
      ];
      break;

    case "earbuds":
      metaRaw = [
        item("calendar", specStr("launchDate") && `Released ${specStr("launchDate")}`),
        item("smartphone", dims("dimensions", "weightGm")),
        item("droplet", specStr("ipRating") && `${specStr("ipRating")} rated`),
        item("ear", specStr("fit") && `${specStr("fit")} fit`),
      ];
      quickRaw = [
        quick("volume", "driver", "Driver"),
        quick("music", "codecs", "Codecs"),
        quick("shield", "noiseCancellation", "ANC"),
        quick("batteryCharging", "musciPlayback", "Playback"),
      ];
      break;

    case "smartwatch":
      metaRaw = [
        item("calendar", specStr("launchDate") && `Released ${specStr("launchDate")}`),
        item("smartphone", dims("dimensions", "weight")),
        item("layers", specStr("os")),
        item("shield", specStr("durability")),
      ];
      quickRaw = [
        quick("monitor", "screenSize", specStr("resolution") ?? "Display"),
        quick("cpu", "chipset", "Chipset"),
        quick("activity", "fitnessTracking", "Fitness"),
        quick("batteryCharging", "batteryMah", "Battery"),
      ];
      break;

    default: // mobiles
      metaRaw = [
        item("calendar", specStr("launchDate") && `Released ${specStr("launchDate")}`),
        item("smartphone", dims("dimensions", "weightGm")),
        item("hardDrive", specStr("storage") && `${specStr("storage")} storage`),
        item("layers", specStr("os")),
      ];
      quickRaw = [
        quick("monitor", "screenSize", specStr("resolution") ?? "Display"),
        quick("memoryStick", "ram", "RAM"),
        quick("cpu", "chipset", "Chipset"),
        quick("batteryCharging", "batteryMah", specStr("charging") ?? "Battery"),
      ];
  }

  const meta = metaRaw.filter((m): m is HeroMetaItem => m !== null);
  const quickSpecs = quickRaw.filter((q): q is HeroQuickSpec => q !== null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 pt-10 sm:pt-14 pb-16">
        <ProductHero
          product={product}
          categoryName={product.category.name}
          colors={parseColors(product.colors)}
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