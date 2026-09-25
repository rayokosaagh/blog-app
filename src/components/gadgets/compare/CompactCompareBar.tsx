"use client";
import JumpNav from "./JumpNav";
import ToggleSwitch from "./ToggleSwitch";
import { PlusIcon } from "./icons";
import { LABEL_COL_PX, productAccent } from "./columns";
import { Product, SpecGroupLike } from "./types";
import OptimizedImage from "@/components/ui/OptimizedImage";

/**
 * The sticky strip over the spec table: a compact product row (thumbnail,
 * name, remove) laid out on the table's own columns, plus the section chips.
 * The product row only opens once the full slot cards have scrolled away —
 * until then they're on screen and a second copy would just be noise.
 */
export default function CompactCompareBar({
  products,
  stuck,
  highlightDiff,
  onHighlightDiffChange,
  onlyDiff,
  onOnlyDiffChange,
  keyOnly,
  onKeyOnlyChange,
  onRemove,
  canAdd,
  onAdd,
  groups,
  activeGroupTitle,
  onJump,
}: {
  /** Filled products in table order, with the slot each one occupies. */
  products: { product: Product; slotIndex: number }[];
  stuck: boolean;
  highlightDiff: boolean;
  onHighlightDiffChange: (v: boolean) => void;
  onlyDiff: boolean;
  onOnlyDiffChange: (v: boolean) => void;
  keyOnly: boolean;
  onKeyOnlyChange: (v: boolean) => void;
  onRemove: (slotIndex: number) => void;
  canAdd: boolean;
  onAdd: () => void;
  groups: SpecGroupLike[];
  activeGroupTitle: string | null;
  onJump: (title: string) => void;
}) {
  const n = products.length;

  return (
    <div>
      {/* Collapses to nothing while the slot cards are visible. The 0fr→1fr
          grid-row trick animates to the row's natural height without
          measuring it. The phone bleed (-mx-4, matching MobileTable) goes on
          this wrapper, not the row: the overflow-hidden inside would
          otherwise clip the row's outer 16px on each side. */}
      <div
        className={`-mx-4 sm:mx-0 grid transition-[grid-template-rows] duration-200 ease-out ${
          stuck ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!stuck}
        inert={!stuck}
      >
        <div className="overflow-hidden">
          <div data-compact-products className="border-2 border-border-heavy bg-card">
            {/* Products only, on the table's own columns — the tables have
                no open-slot column, so "+ Add" sits in the chip row below. */}
            <div
              className="grid grid-cols-[var(--label-col-m)_repeat(var(--n),minmax(0,1fr))] sm:grid-cols-[var(--label-col-d)_repeat(var(--n),minmax(0,1fr))]"
              style={
                {
                  "--n": n,
                  "--label-col-m": `${LABEL_COL_PX.mobile}px`,
                  "--label-col-d": `${LABEL_COL_PX.desktop}px`,
                } as React.CSSProperties
              }
            >
              <div className="flex min-w-0 flex-col justify-center gap-1.5 border-r-2 border-border-heavy p-1.5 sm:p-3">
                <ToggleSwitch size="sm" checked={highlightDiff} onChange={onHighlightDiffChange} label="Highlight" />
                <ToggleSwitch size="sm" checked={onlyDiff} onChange={onOnlyDiffChange} label="Diffs only" />
                <ToggleSwitch size="sm" checked={keyOnly} onChange={onKeyOnlyChange} label="Key specs" />
              </div>

              {products.map(({ product, slotIndex }, i) => (
                <div key={product.id} className="min-w-0 p-1.5 sm:p-2">
                  {/* Each product on its own card, like the slot cards above.
                      The top band is the product's colour — the key for its
                      column in the table. A positioned span rather than a
                      border-top, which the modern theme thins to 1px. */}
                  <div
                    className="relative flex h-full flex-col items-center justify-center gap-1 overflow-hidden rounded-none border-2 border-border-heavy bg-card p-1.5 pt-2.5 text-center shadow-brutal-sm sm:p-2 sm:pt-3"
                  >
                    <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${productAccent(i).chip}`} />
                    <button
                      type="button"
                      onClick={() => onRemove(slotIndex)}
                      aria-label={`Remove ${product.name} from comparison`}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-none border-2 border-border-heavy bg-card text-xs leading-none text-muted-foreground transition-colors duration-100 hover:bg-danger hover:text-on-danger"
                    >
                      ×
                    </button>
                    {product.image && (
                      <div className="h-9 w-9 shrink-0 rounded-none border-2 border-border-heavy bg-card p-0.5 sm:h-10 sm:w-10">
                        {/* Inner box so `fill` covers the content area. */}
                        <div className="relative h-full w-full">
                          <OptimizedImage
                            src={product.image}
                            alt=""
                            fill
                            sizes="(min-width: 640px) 32px, 28px"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      </div>
                    )}
                    <p className="w-full truncate px-4 text-[11px] font-bold text-foreground sm:text-sm">
                      {product.name}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {/* The one "+ Add" on every width: the tables keep no empty column
            for a free slot, so the product columns use the full width. */}
        {canAdd && (
          <button
            type="button"
            onClick={onAdd}
            aria-label="Add a product: back to the slot search"
            className="flex shrink-0 items-center gap-1 rounded-none border-2 border-dashed border-border-heavy bg-card px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground transition-colors duration-100 hover:border-solid hover:bg-accent-2 hover:text-on-accent-2"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add
          </button>
        )}
        <JumpNav groups={groups} activeGroupTitle={activeGroupTitle} onJump={onJump} />
      </div>
    </div>
  );
}

