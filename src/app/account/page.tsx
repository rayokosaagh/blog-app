import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AccountClient from "@/components/account/AccountClient";

// Signed-in only, and personal to each reader — never index it.
export const metadata: Metadata = {
  title: "Your Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 mx-auto w-full max-w-3xl px-6 py-10">
        <AccountClient />
      </div>

      <Footer />
    </div>
  );
}
