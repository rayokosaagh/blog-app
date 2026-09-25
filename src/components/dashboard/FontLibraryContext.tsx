"use client";

import { createContext, useContext } from "react";
import {
  fontFaceCss,
  findFont,
  googleHref,
  isCustomRef,
  refOf,
  type CustomFont,
  type GoogleFont,
} from "@/lib/fontLibrary";
import { HEADING_FONT_LABELS, type BuiltInFont } from "@/lib/typography";

const FontLibraryContext = createContext<readonly CustomFont[]>([]);

/** The admin's font library as currently edited in Appearance, for every font picker and preview. */
export function FontLibraryProvider({ fonts, children }: { fonts: readonly CustomFont[]; children: React.ReactNode }) {
  return <FontLibraryContext.Provider value={fonts}>{children}</FontLibraryContext.Provider>;
}

export const useFontLibrary = () => useContext(FontLibraryContext);

/** <option>s for a font <select>: built-ins, then the library, then a stale reference if the value points at a deleted font. */
export function FontOptions({ builtIns, value }: { builtIns: readonly BuiltInFont[]; value: string }) {
  const library = useFontLibrary();
  const stale = isCustomRef(value) && !findFont(value, library);
  return (
    <>
      <optgroup label="Built-in">
        {builtIns.map((f) => (
          <option key={f} value={f}>
            {HEADING_FONT_LABELS[f]}
          </option>
        ))}
      </optgroup>
      {library.length > 0 && (
        <optgroup label="Custom fonts">
          {library.map((f) => (
            <option key={f.id} value={refOf(f)}>
              {f.name}
            </option>
          ))}
        </optgroup>
      )}
      {stale && <option value={value}>Deleted font (uses theme font)</option>}
    </>
  );
}

/** Loads library fonts into the dashboard so previews render in them. */
export function FontAssets({ fonts }: { fonts: readonly CustomFont[] }) {
  const css = fontFaceCss(fonts);
  const href = googleHref(fonts.filter((f): f is GoogleFont => f.source === "google"));
  return (
    <>
      {css && <style>{css}</style>}
      {href && <link rel="stylesheet" href={href} precedence="default" />}
    </>
  );
}
