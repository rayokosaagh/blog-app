"use client";

import { motion } from "framer-motion";

// A subtle animated section break: two lines draw in from the center
// outward once scrolled into view, meeting flush in the middle.
export default function SectionDivider() {
  return (
    // The negative margin matters. This divider is a flex child of <main>,
    // which carries SECTION_GAP — so it collects a full gap ABOVE and another
    // BELOW, turning a 64px rhythm into ~129px wherever a divider appears.
    // That's the same doubling SECTION_GAP's comment says the spacing was
    // consolidated to avoid; the divider quietly reintroduced it. Pulling back
    // half a gap per side nets the intended single gap with the rule centred
    // in it. Values track SECTION_GAP (gap-10 / sm:gap-14 / lg:gap-16).
    <div
      className="w-full flex items-center justify-center -my-5 sm:-my-7 lg:-my-8"
      aria-hidden="true"
    >
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