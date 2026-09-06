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
      className={className || "border border-white/40 text-white px-5 py-2 rounded-full hover:bg-white/10 transition-colors font-medium text-sm"}
    >
      {children || "Sign Out"}
    </button>
  );
}