// src/components/ui/Underline.tsx
"use client";

/**
 * Brutalist swap for a soft animated underline: an instant hard-edged
 * highlighter block behind the text, revealed on hover with no easing.
 * Requires a `group` class on the parent link/container.
 *
 * In the modern theme the block is normally replaced by a lighter text-only
 * treatment (see `.underline-swap` in globals.css). Pass `block` to keep the
 * filled highlighter in modern too — needed for labels sitting on top of
 * photos, where a text-colour change alone has poor contrast.
 */
export default function Underline({
  children,
  block = false,
}: {
  children: React.ReactNode;
  block?: boolean;
}) {
  return (
    <span
      className={`${block ? "" : "underline-swap "}box-decoration-clone bg-[length:0%_100%] group-hover:bg-[length:100%_100%] bg-no-repeat bg-left transition-[background-size] duration-100 ease-out group-hover:text-on-accent-2`}
      style={{ backgroundImage: "linear-gradient(var(--accent-2), var(--accent-2))" }}
    >
      {children}
    </span>
  );
}