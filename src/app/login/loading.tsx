import Skeleton from "@/components/ui/Skeleton";

/**
 * /login is a client component with no server data, so this rarely shows — but
 * it still covers the gap while the route's JS chunk arrives on a slow link,
 * where the alternative is a blank screen. Deliberately minimal: a centred card
 * matching the sign-in form, no navbar (the login page does not render one).
 */
export default function LoginLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-6"
      role="status"
      aria-busy="true"
      aria-label="Loading sign in"
    >
      <div className="w-full max-w-md surface-border bg-card shadow-brutal p-8">
        <Skeleton className="mx-auto h-8 w-40" />
        <Skeleton className="mx-auto mt-3 h-4 w-56" />

        <div className="mt-8 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>

        <Skeleton className="mx-auto mt-6 h-4 w-48" />
      </div>
    </div>
  );
}
