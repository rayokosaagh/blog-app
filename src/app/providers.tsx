"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import PageTransition from "@/components/PageTransition";
import TopProgressBar from "@/components/TopProgressBar";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <SessionProvider>
        <TopProgressBar />
        <PageTransition>{children}</PageTransition>
      </SessionProvider>
    </ThemeProvider>
  );
}