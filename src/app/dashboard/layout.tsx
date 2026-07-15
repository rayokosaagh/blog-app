// app/dashboard/layout.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
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