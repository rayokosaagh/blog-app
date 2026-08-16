import { auth } from "@/auth";
import { redirect } from "next/navigation";

// User management is ADMIN-only. The page itself is a client component, so the
// check lives here — and server-side, not only in the edge proxy, so it still
// holds if the proxy is bypassed or stops matching this route.
export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  return <>{children}</>;
}
