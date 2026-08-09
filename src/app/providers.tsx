"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import PageTransition from "@/components/ui/PageTransition";
import TopProgressBar from "@/components/ui/TopProgressBar";
import SmoothAnchors from "@/components/ui/SmoothAnchors";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // Light/dark swaps instantly. Without this, every element carrying a
      // `transition-colors` utility (cards, links, borders, nav) cross-fades
      // on its own schedule, so the page arrives in pieces over ~300ms.
      // next-themes suppresses all transitions for the single frame of the
      // swap and restores them immediately, so hover/focus animations are
      // unaffected.
      disableTransitionOnChange
    >
      <SessionProvider>
        <TopProgressBar />
        <SmoothAnchors />
        <PageTransition>{children}</PageTransition>
      </SessionProvider>
    </ThemeProvider>
  );
}