"use client";

import { motion } from "framer-motion";

// A subtle animated section break: two lines draw in from the center
// outward once scrolled into view, meeting flush in the middle.
export default function SectionDivider() {
  return (
    <div className="w-full flex items-center justify-center" aria-hidden="true">
      <motion.span
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ transformOrigin: "right" }}
        className="h-px flex-1 bg-gradient-to-l from-border via-border to-transparent"
      />

      <motion.span
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
        className="h-px flex-1 bg-gradient-to-r from-border via-border to-transparent"
      />
    </div>
  );
}