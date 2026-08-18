import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CatalogueSkeleton from "@/components/ui/CatalogueSkeleton";

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-background" role="status" aria-busy="true" aria-label="Loading gadgets">
      <Navbar />
      <CatalogueSkeleton cards={12} />
      <Footer />
    </div>
  );
}
