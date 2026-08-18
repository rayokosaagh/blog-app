import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CatalogueSkeleton from "@/components/ui/CatalogueSkeleton";

/**
 * A tag page is the same PageHeader + listing shape as /products, just filtered,
 * so it shares CatalogueSkeleton — with fewer cards, since a single tag rarely
 * fills a full grid.
 */
export default function TagLoading() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-busy="true" aria-label="Loading tagged posts">
      <Navbar />
      <CatalogueSkeleton cards={6} />
      <Footer />
    </div>
  );
}
