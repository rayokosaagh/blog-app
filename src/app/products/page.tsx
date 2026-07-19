import ProductListing from "@/components/gadgets/ProductListing";

export const revalidate = 60;

export const metadata = { title: "Gadgets in Nepal | Explore, Filter & Compare" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  return <ProductListing sp={sp} basePath="/products" />;
}
