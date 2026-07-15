// src/components/gadgets/compare/ToggleSwitch.tsx
"use client";

// Small on/off switch, reused for the two diff toggles. Renders as a
// self-contained "chip" that solidifies to accent-2 on activation.
export default function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex items-center gap-2 rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press py-1.5 pl-1.5 pr-3 text-xs font-extrabold uppercase tracking-wide transition-colors duration-100 ${
        checked
          ? "bg-accent-2 text-on-accent-2"
          : "bg-card text-muted-foreground hover:bg-accent-tint hover:text-foreground"
      }`}
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-none border-2 border-border-heavy transition-colors duration-100 ${
          checked ? "bg-card" : "bg-muted"
        }`}
      >
        <span
          className={`h-3 w-3 rounded-none transition-transform duration-75 ease-linear ${
            checked ? "translate-x-[19px] bg-on-accent-2" : "translate-x-[3px] bg-muted-foreground"
          }`}
        />
      </span>
      {label}
    </button>
  );
}