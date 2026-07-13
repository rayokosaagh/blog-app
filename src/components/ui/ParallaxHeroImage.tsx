"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxHeroImageProps {
  src?: string | null;
  alt: string;
}

export default function ParallaxHeroImage({ src, alt }: ParallaxHeroImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div ref={ref} className="absolute inset-0">
      {src ? (
        <motion.img
          src={src}
          alt={alt}
          style={{ y, scale }}
          className="hero-zoom w-full h-full object-cover"
        />
      ) : (
        <motion.div
          style={{ y, scale }}
          className="hero-zoom w-full h-full bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700"
        />
      )}
    </div>
  );
}