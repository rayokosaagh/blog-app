import Skeleton from "@/components/ui/Skeleton";

/** Mirrors the centred confirmation block in newsletter/confirmed/page.tsx. */
export default function NewsletterConfirmedLoading() {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      <Skeleton className="h-8 w-72 max-w-full" />
      <Skeleton className="h-4 w-full max-w-md" />
      <Skeleton className="h-4 w-64 max-w-full" />
      <Skeleton className="mt-2 h-10 w-40" />
    </div>
  );
}
