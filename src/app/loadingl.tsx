import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 rounded ${className}`}
    />
  );
}

function PostCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden flex flex-col h-full border border-border">
      {/* Image */}
      <Skeleton className="w-full h-52 rounded-none" />

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Title (2 lines) */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        {/* Tag pills */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>

        {/* Author + date */}
        <div className="mt-auto flex items-center gap-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content - Socials left / Posts centered / Poll right */}
      <section className="max-w-[1600px] mx-auto px-6 py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12">

          {/* Left Sidebar skeleton */}
          <div className="hidden lg:block lg:w-72 flex-shrink-0 pt-4 lg:pt-0">
            <div className="sticky top-24 space-y-3">
              <Skeleton className="h-5 w-24 mb-2" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>

          {/* Center - Latest Posts */}
          <div className="flex-1 lg:max-w-[760px] mx-auto w-full">
            <div className="mb-12 text-center lg:text-left space-y-2">
              <Skeleton className="h-8 w-48 mx-auto lg:mx-0" />
              <Skeleton className="h-4 w-64 mx-auto lg:mx-0" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Right Sidebar skeleton */}
          <div className="lg:w-80 flex-shrink-0 lg:ml-10 pt-4 lg:pt-0">
            <div className="sticky top-24 space-y-3">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}