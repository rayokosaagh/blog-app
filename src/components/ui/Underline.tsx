// src/components/ui/Underline.tsx
"use client";

/**
 * Brutalist swap for a soft animated underline: an instant hard-edged
 * highlighter block behind the text, revealed on hover with no easing.
 * Requires a `group` class on the parent link/container.
 */
export default function Underline({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="
        box-decoration-clone
        bg-[length:0%_100%] group-hover:bg-[length:100%_100%]
        bg-no-repeat bg-left
        transition-[background-size] duration-100 ease-out
        group-hover:text-on-accent-2
      "
      style={{ backgroundImage: "linear-gradient(var(--accent-2), var(--accent-2))" }}
    >
      {children}
    </span>
  );
}