import { Palette } from "lucide-react";
import type { ProductColor } from "@/lib/gadgets/colors";

/**
 * Color-variant swatches for the product hero. Each swatch shows the color; on
 * hover (or focus, for touch/keyboard) a popover previews the photo of the
 * device in that color, when one was uploaded. Pure CSS group-hover — no JS.
 */
export default function ProductColors({ colors }: { colors: ProductColor[] }) {
  if (!colors || colors.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground">
        <Palette size={12} />
        {colors.length} {colors.length === 1 ? "Color" : "Colors"}
      </p>

      <div className="mt-2 flex flex-wrap gap-2.5">
        {colors.map((color, i) => (
          <div key={i} className="group relative">
            <button
              type="button"
              aria-label={color.name}
              className="block h-9 w-9 shrink-0 rounded-none border-2 border-border-heavy shadow-brutal-sm brutal-press focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{ backgroundColor: color.hex }}
            />

            {/* Hover / focus preview popover, above the swatch */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2.5 w-max max-w-[13rem] -translate-x-1/2 scale-95 opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100">
              <div className="rounded-none border-2 border-border-heavy bg-card p-2 shadow-brutal">
                {color.image && (
                  <div className="mb-2 flex h-36 w-36 items-center justify-center border-2 border-border-heavy bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img loading="lazy" decoding="async"
                      src={color.image}
                      alt={color.name}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 shrink-0 border border-border-heavy"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-xs font-bold text-foreground">{color.name}</span>
                </div>
              </div>
              {/* Caret */}
              <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-border-heavy bg-card" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
