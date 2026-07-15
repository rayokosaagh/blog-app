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
        className={`relative w-10 h-5 border-[1.5px] border-border-heavy p-0.5 flex-shrink-0
          transition-colors duration-200
          ${isDark ? "bg-foreground" : "bg-accent-2"}`}
      >
        <span
          className={`relative flex items-center justify-center w-4 h-4 border-[1.5px] border-border-heavy
            transition-transform duration-200
            ${isDark ? "translate-x-5 bg-background" : "translate-x-0 bg-background"}`}
        >
          <Sun
            size={9}
            className={`absolute text-on-accent-2 transition-opacity duration-150 ${
              isDark ? "opacity-0" : "opacity-100"
            }`}
          />
          <Moon
            size={8}
            className={`absolute text-foreground transition-opacity duration-150 ${
              isDark ? "opacity-100" : "opacity-0"
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
      className={`relative w-16 h-8 border-[1.5px] border-border-heavy p-1
        transition-colors duration-200
        ${isDark ? "bg-foreground" : "bg-accent-2"}`}
    >
      <span
        className={`relative flex items-center justify-center w-6 h-6 border-[1.5px] border-border-heavy
          transition-transform duration-200
          ${isDark ? "translate-x-8 bg-background" : "translate-x-0 bg-background"}`}
      >
        <Sun
          size={14}
          className={`absolute text-on-accent-2 transition-opacity duration-150 ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
        />
        <Moon
          size={13}
          className={`absolute text-foreground transition-opacity duration-150 ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
        />
      </span>
    </button>
  );
}