"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  size?: "default" | "sm";
}

export default function ThemeToggle({ size = "default" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isSm = size === "sm";

  if (!mounted) {
    return <div className={isSm ? "w-10 h-5" : "w-16 h-8"} />;
  }

  const isDark = resolvedTheme === "dark";

  if (isSm) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="relative w-10 h-5 rounded-full p-0.5 overflow-hidden flex-shrink-0
          transition-colors duration-500 ease-in-out
          bg-gradient-to-r from-sky-400 to-sky-300
          dark:from-indigo-950 dark:to-slate-900"
      >
        <span
          className={`relative flex items-center justify-center w-4 h-4 rounded-full
            transition-all duration-500 ease-in-out
            ${
              isDark
                ? "translate-x-5 rotate-[360deg] bg-slate-100 shadow-[0_0_4px_1px_rgba(241,245,249,0.5)]"
                : "translate-x-0 rotate-0 bg-yellow-300 shadow-[0_0_4px_1px_rgba(250,204,21,0.6)]"
            }`}
        >
          <Sun
            size={9}
            className={`absolute text-yellow-600 transition-all duration-300 ${
              isDark ? "opacity-0 scale-50" : "opacity-100 scale-100"
            }`}
          />
          <Moon
            size={8}
            className={`absolute text-slate-500 transition-all duration-300 ${
              isDark ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-16 h-8 rounded-full p-1 overflow-hidden
        transition-colors duration-500 ease-in-out
        bg-gradient-to-r from-sky-400 to-sky-300
        dark:from-indigo-950 dark:to-slate-900"
    >
      {/* Stars — fade in at night */}
      <span className="absolute top-1.5 left-2.5 w-[3px] h-[3px] rounded-full bg-white opacity-0 dark:opacity-80 transition-opacity duration-700" />
      <span className="absolute top-3 left-5 w-[3px] h-[3px] rounded-full bg-white opacity-0 dark:opacity-60 transition-opacity duration-700 delay-100" />
      <span className="absolute top-1 left-7 w-[3px] h-[3px] rounded-full bg-white opacity-0 dark:opacity-90 transition-opacity duration-700 delay-150" />
      <span className="absolute bottom-1.5 left-4 w-[3px] h-[3px] rounded-full bg-white opacity-0 dark:opacity-70 transition-opacity duration-700 delay-200" />

      {/* Clouds — fade out at night */}
      <span className="absolute bottom-1 right-2 w-3 h-1.5 rounded-full bg-white/70 blur-[1px] opacity-100 dark:opacity-0 transition-opacity duration-500" />
      <span className="absolute top-1.5 right-4 w-2 h-1 rounded-full bg-white/60 blur-[1px] opacity-100 dark:opacity-0 transition-opacity duration-500" />

      {/* Sliding sun/moon */}
      <span
        className={`relative flex items-center justify-center w-6 h-6 rounded-full
          transition-all duration-500 ease-in-out
          ${
            isDark
              ? "translate-x-8 rotate-[360deg] bg-slate-100 shadow-[0_0_6px_2px_rgba(241,245,249,0.5)]"
              : "translate-x-0 rotate-0 bg-yellow-300 shadow-[0_0_8px_2px_rgba(250,204,21,0.6)]"
          }`}
      >
        <Sun
          size={14}
          className={`absolute text-yellow-600 transition-all duration-300 ${
            isDark ? "opacity-0 scale-50" : "opacity-100 scale-100"
          }`}
        />
        <Moon
          size={13}
          className={`absolute text-slate-500 transition-all duration-300 ${
            isDark ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
        />
      </span>
    </button>
  );
}