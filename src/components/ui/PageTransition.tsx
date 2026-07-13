"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

// Refined, editorial-feeling motion: a soft directional slide + blur,
// eased with an expo-out curve for a fast start and smooth, bounce-free settle.
const EASE = [0.22, 1, 0.36, 1] as const;
const DISTANCE = 20;

const variants = {
  enter: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction * DISTANCE,
    filter: "blur(4px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction * -DISTANCE,
    filter: "blur(4px)",
  }),
};

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const isBackForward = useRef(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Browser back/forward buttons fire `popstate`; regular Link clicks and
  // router.push() do not. That's enough to distinguish "going back" (-1)
  // from "moving forward" (1) without needing a full history stack.
  useEffect(() => {
    function handlePopState() {
      isBackForward.current = true;
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    setDirection(isBackForward.current ? -1 : 1);
    isBackForward.current = false;
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.45, ease: EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}