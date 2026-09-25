"use client";

// Small on/off switch, reused for the two diff toggles. Renders as a
// self-contained "chip" that solidifies to accent-2 on activation.
export default function ToggleSwitch({
  checked,
  onChange,
  label,
  size = "md",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  /** "sm" is the same chip with tighter padding/type, for the sticky bar. */
  size?: "md" | "sm";
}) {
  const sm = size === "sm";
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`flex items-center rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press font-extrabold uppercase tracking-wide transition-colors duration-200 ease-out ${
        sm ? "gap-1.5 py-1 pl-1 pr-2 text-[10px]" : "gap-2 py-1.5 pl-1.5 pr-3 text-xs"
      } ${
        checked
          ? "bg-accent-2 text-on-accent-2"
          : "bg-card text-muted-foreground hover:bg-accent-tint hover:text-foreground"
      }`}
    >
      {/*
        When on, the track takes --on-accent-2 and the knob takes --accent-2 —
        the inverse of the chip around it. Those two are contrast partners by
        construction, so the knob stays visible whatever the accent is set to.
        Previously the knob used --on-accent-2 on a --card track, which is
        white-on-white in modern: the knob simply disappeared.
      */}
      <span
        className={`relative inline-flex shrink-0 items-center rounded-none border-2 border-border-heavy transition-colors duration-200 ease-out ${
          sm ? "h-4 w-7" : "h-5 w-9"
        } ${checked ? "bg-on-accent-2" : "bg-muted"}`}
      >
        <span
          className={`rounded-none transition-[transform,background-color] duration-200 ease-out ${
            sm ? "h-2 w-2" : "h-3 w-3"
          } ${
            checked
              ? `${sm ? "translate-x-[15px]" : "translate-x-[19px]"} bg-accent-2`
              : `${sm ? "translate-x-[2px]" : "translate-x-[3px]"} bg-muted-foreground`
          }`}
        />
      </span>
      <span className={sm ? "text-left leading-tight" : undefined}>{label}</span>
    </button>
  );
}