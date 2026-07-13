"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function SignOutButton({ className, children }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      // If a custom className is passed from the Navbar, it uses it. 
      // Otherwise, it falls back to your original styling!
      className={className || "border border-white/40 text-white px-5 py-2 rounded-full hover:bg-white/10 transition-colors font-medium text-sm"}
    >
      {/* If custom content (like an SVG) is passed, show it. Otherwise, just say "Sign Out" */}
      {children || "Sign Out"}
    </button>
  );
}