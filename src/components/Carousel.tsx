"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
}

interface CarouselProps {
  banners: Banner[];
}

export default function Carousel({ banners }: CarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) return null;

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg"
      style={{ height: "420px" }}
    >
      {/* Slides */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Link href={banners[current].link} target="_blank" rel="noopener noreferrer">
            {/* Image */}
            <img
  src={banners[current].image}
  alt={banners[current].title}
  className="w-full h-full object-cover"
/>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Title */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white text-2xl font-bold mb-2"
              >
                {banners[current].title}
              </motion.h3>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="inline-block bg-white text-gray-900 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Learn More →
              </motion.span>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Left Arrow */}
      {banners.length > 1 && (
        <button
          onClick={(e) => { e.preventDefault(); prev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all z-10 hover:scale-110"
          style={{ backgroundColor: "rgba(79,99,103,0.8)" }}
        >
          ‹
        </button>
      )}

      {/* Right Arrow */}
      {banners.length > 1 && (
        <button
          onClick={(e) => { e.preventDefault(); next(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all z-10 hover:scale-110"
          style={{ backgroundColor: "rgba(79,99,103,0.8)" }}
        >
          ›
        </button>
      )}

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                setDirection(i > current ? 1 : -1);
                setCurrent(i);
              }}
              className="rounded-full transition-all"
              style={{
                width: i === current ? "24px" : "8px",
                height: "8px",
                backgroundColor: i === current ? "white" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {banners.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-10">
          <motion.div
            key={current}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-full"
            style={{ backgroundColor: "#4F6367" }}
          />
        </div>
      )}
    </div>
  );
}