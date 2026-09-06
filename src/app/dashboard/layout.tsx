import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Admin area. It's already behind auth, but the noindex covers the case where
// a dashboard URL leaks into a sitemap, a referrer header or someone's tweet.
export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import DashboardShell from "@/components/dashboard/DashboardShell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  const isAdmin = session.user?.role === "ADMIN";
  const isStaff = isAdmin || session.user?.role === "EDITOR";

  // Belt-and-braces alongside the middleware check: a READER has a valid
  // session but isn't staff, so shouldn't see dashboard tooling.
  if (!isStaff) redirect("/");

  return (
    <div className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
      <DashboardShell
        isAdmin={isAdmin}
        userName={session.user?.name ?? ""}
        userEmail={session.user?.email ?? ""}
        userRole={session.user?.role ?? ""}
      >
        {children}
      </DashboardShell>
    </div>
  );
}