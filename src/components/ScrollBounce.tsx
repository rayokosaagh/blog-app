"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ScrollBounce({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]
  });

  // Stronger bounce at the very bottom
  const y = useTransform(scrollYProgress, 
    [0.85, 0.95, 1, 1.05], 
    [0, 0, 18, 0]
  );

  return (
    <motion.div
      ref={ref}
      style={{ y }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 22,
        mass: 0.9,
      }}
      className="will-change-transform"
    >
      {children}
    </motion.div>
  );
}