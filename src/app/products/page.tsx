import type { Metadata } from "next";
import ProductListing from "@/components/gadgets/ProductListing";

export const revalidate = 60;

const PRODUCTS_DESCRIPTION =
  "Explore, filter and compare phones, laptops, smartwatches and earbuds " +
  "available in Nepal — full specifications and prices.";

// Shortened from "Gadgets in Nepal | Explore, Filter & Compare": the root
// layout now appends "| Blog", and the old string would have run past the
// ~60 characters search results actually show. The rest moved to the
// description, where it still does its job.
export const metadata: Metadata = {
  title: "Gadgets in Nepal",
  description: PRODUCTS_DESCRIPTION,
  alternates: { canonical: "/products" },
  openGraph: {
    url: "/products",
    title: "Gadgets in Nepal",
    description: PRODUCTS_DESCRIPTION,
  },
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <ProductListing sp={sp} basePath="/products" />;
}
