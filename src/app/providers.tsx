"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import PageTransition from "@/components/ui/PageTransition";
import TopProgressBar from "@/components/ui/TopProgressBar";
import SmoothAnchors from "@/components/ui/SmoothAnchors";
import ScrollTopOnNavigate from "@/components/ui/ScrollTopOnNavigate";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";
import CompareTrayProvider from "@/components/gadgets/compare/CompareTrayProvider";
import CompareTray from "@/components/gadgets/compare/CompareTray";

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
        <CompareTrayProvider>
          <TopProgressBar />
          <SmoothAnchors />
          {/* Outside PageTransition, like the other listeners — inside it,
              AnimatePresence would unmount and remount it every navigation,
              resetting the refs it uses to detect back/forward. */}
          <ScrollTopOnNavigate />
          <ServiceWorkerRegistrar />
          <PageTransition>{children}</PageTransition>
          {/* Outside PageTransition — inside it, AnimatePresence tears the tray
              down and remounts it on every navigation.

              There is deliberately no install prompt here. The manifest and
              service worker stay, so the site is still installable through the
              browser's own affordance (Chrome's address-bar icon, Safari's
              Share sheet); what's gone is us interrupting the page to ask. */}
          <CompareTray />
        </CompareTrayProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}