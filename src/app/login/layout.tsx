// src/app/login/layout.tsx
//
// login/page.tsx is a Client Component, and Client Components cannot export
// `metadata` — Next only reads it from server modules. This thin server layout
// exists solely to attach the sign-in page's metadata.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to comment, bookmark articles and manage your account.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
