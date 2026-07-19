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
    <div
      // Clean edge-to-edge image block — the wrapping "Featured Story" card
      // (in the homepage) supplies the border, shadow and header, so the
      // three top-story columns read as one family. Fills its container.
      className="relative h-full w-full overflow-hidden"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

            {/* Tag + Title */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 bg-accent text-on-accent px-3 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider border-[1.5px] border-white/20 mb-2 sm:mb-3"
              >
                Just tested
              </motion.span>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white text-lg sm:text-2xl font-bold mb-3 line-clamp-2 tracking-tight"
              >
                {banners[current].title}
              </motion.h3>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block bg-white text-gray-900 px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold uppercase tracking-wide hover:bg-gray-100 transition-colors"
              >
                Read the latest
              </motion.span>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Left Arrow */}
      {banners.length > 1 && (
        <button
          onClick={(e) => { e.preventDefault(); prev(); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-white border-[1.5px] border-white/40 transition-all z-10 hover:bg-white/15"
          style={{ backgroundColor: "rgba(14,17,22,0.55)" }}
        >
          ‹
        </button>
      )}

      {/* Right Arrow */}
      {banners.length > 1 && (
        <button
          onClick={(e) => { e.preventDefault(); next(); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center text-white border-[1.5px] border-white/40 transition-all z-10 hover:bg-white/15"
          style={{ backgroundColor: "rgba(14,17,22,0.55)" }}
        >
          ›
        </button>
      )}

      {/* Progress ticks — square, not round dots, matching the mock's blocky tag/rule language */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex items-center gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                setDirection(i > current ? 1 : -1);
                setCurrent(i);
              }}
              className="rounded-[2px] transition-all"
              style={{
                width: i === current ? "20px" : "7px",
                height: "7px",
                backgroundColor: i === current ? "white" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {banners.length > 1 && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/20 z-10">
          <motion.div
            key={current}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-full bg-accent"
          />
        </div>
      )}
    </div>
  );
}