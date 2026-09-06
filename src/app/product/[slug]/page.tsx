import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { APP_URL } from "@/lib/appUrl";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryDef } from "@/lib/gadgets/categories";
import { groupHasValues } from "@/lib/gadgets/formatSpecValue";
import { parseColors } from "@/lib/gadgets/colors";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import CompareToggle from "@/components/gadgets/compare/CompareToggle";
import ProductHero from "@/components/gadgets/product/ProductHero";
import type {
  HeroIconKey,
  HeroMetaItem,
  HeroQuickSpec,
} from "@/components/gadgets/product/ProductHero";
import OwnershipWidget from "@/components/gadgets/product/OwnershipWidget";
import ProductSpecNav from "@/components/gadgets/product/ProductSpecNav";
import ProductSpecTable from "@/components/gadgets/product/ProductSpecTable";
import EmptyState from "@/components/ui/EmptyState";
import { ClipboardList } from "lucide-react";
import VerdictCard from "@/components/blog/VerdictCard";
import { readVerdict, VERDICT_MAX } from "@/lib/verdict";

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

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };

  const title = `${product.name} — Full Specifications`;
  const description = `${product.name} by ${product.brand} — detailed specifications and features.`;
  const url = `/product/${product.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: product.image ? [product.image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image ? [product.image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product || !product.published) notFound();

  const categoryDef = getCategoryDef(product.category.slug);
  if (!categoryDef) notFound(); // category exists in DB but has no spec-group definition

  const specs = (product.specs as Record<string, unknown>) ?? {};
  // Editorial verdict, if the product has been scored in the dashboard. Same
  // gate as articles: needs both a bottom line and a score, or nothing shows.
  const verdict = readVerdict(product);

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

  // Product structured data. `offers` is emitted only when a price exists —
  // an Offer without a price is invalid and Google rejects the whole block,
  // which would be worse than shipping no structured data at all.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    url: `${APP_URL}/product/${product.slug}`,
    description: `${product.name} by ${product.brand} — detailed specifications and features.`,
    category: product.category.name,
    ...(product.image && {
      image: [product.image, ...product.images]
        .filter(Boolean)
        .map((src) => (src.startsWith("http") ? src : `${APP_URL}${src}`)),
    }),
    ...(product.priceFrom != null && {
      offers: {
        "@type": "Offer",
        price: product.priceFrom,
        priceCurrency: product.currency,
        availability: "https://schema.org/InStock",
        url: `${APP_URL}/product/${product.slug}`,
      },
    }),
    // Editorial verdict as a nested Review — the same score/summary the
    // article page emits, so a scored product is eligible for a review
    // snippet too. Only when readVerdict passes; a Review without a
    // reviewBody or a rating is invalid and would taint the whole block.
    ...(verdict && {
      review: {
        "@type": "Review",
        author: { "@type": "Organization", name: "Blog" },
        reviewBody: verdict.summary,
        reviewRating: {
          "@type": "Rating",
          ratingValue: verdict.score,
          bestRating: VERDICT_MAX,
          worstRating: 0,
        },
      },
    }),
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={productJsonLd} />
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 pt-10 sm:pt-14 pb-16">
        <ProductHero
          product={product}
          categoryName={product.category.name}
          colors={parseColors(product.colors)}
          meta={meta}
          quickSpecs={quickSpecs}
        />

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <OwnershipWidget
              productId={product.id}
              initialCounts={counts}
              initialUserStatus={userOwnership?.status ?? null}
              isSignedIn={!!session?.user?.id}
            />
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <CompareToggle
              variant="wide"
              item={{
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                image: product.image,
                categorySlug: product.category.slug,
              }}
            />
          </div>
        </div>

        {/* Editorial verdict — above the spec tables rather than after them.
            On an article the verdict is the payoff at the end; on a product
            page the specs are reference material, and a reader who arrived
            from the homepage scoreboard came for the opinion first. The
            card carries its own vertical margin (my-10). */}
        {verdict && <VerdictCard verdict={verdict} productName={product.name} />}

        {/* Each group hides itself when it has no filled fields, and the nav
            hides with them — so with nothing filled at all the whole section
            collapsed to an empty spacer. Say so instead. */}
        {categoryDef.groups.some((group) => groupHasValues(group, specs)) ? (
          <div className="flex flex-col lg:flex-row gap-8 mt-10">
            <ProductSpecNav groups={categoryDef.groups} specs={specs} />

            <div className="flex-1 min-w-0 flex flex-col gap-10">
              {categoryDef.groups.map((group) => (
                <ProductSpecTable key={group.title} group={group} specs={specs} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10">
            <EmptyState
              variant="brutal"
              icon={ClipboardList}
              title="No specifications yet"
              description="Full specs for this product have not been published."
            />
          </div>
        )}
      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}