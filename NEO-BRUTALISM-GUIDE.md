# Neo-Brutalism Design Guide

Stack: Next.js 16 · Tailwind 4 · `globals.css` token system

---

## 1. Core Tokens

Defined in `globals.css`, theme-aware via `.dark`:

| Token | Purpose |
|---|---|
| `--background` / `--foreground` | Base page colors |
| `--card` | Surface color for cards/panels |
| `--border` | Soft/light border (rarely used — brutalism prefers heavy) |
| `--border-heavy` | The signature hard border. Black in light mode, white in dark mode. |
| `--accent` / `--on-accent` | Primary accent + readable text on it |
| `--accent-2` / `--on-accent-2` | Secondary accent (highlighter color) + readable text on it |
| `--accent-tint` | Soft background tint of accent |
| `--muted` / `--muted-foreground` | Low-emphasis surfaces/text |
| `--danger` / `--on-danger` | Error/destructive states |
| `--accent-bookmark` / `--on-accent-bookmark` | Dedicated bookmark UI color — intentionally separate from `--accent` so it can carry its own identity per theme |
| `--photo-overlay` / `--on-photo` | **Fixed, theme-independent** black/white pair for caption plates and overlays sitting on top of arbitrary photos. Never override these in `.dark`. |

**Rule:** Never hardcode hex values in components. Always go through the Tailwind color classes mapped from these tokens (`bg-accent`, `text-on-accent`, `border-border-heavy`, etc.).

---

## 2. Shape & Borders

- **Zero border radius** is the default assumption for brutalist surfaces — cards, buttons, pills, images. Use `rounded-none` explicitly where Tailwind/base styles might otherwise round something.
- **Heavy borders** (`border-2` or `border-4` + `border-border-heavy`) define every card, panel, pill, and section boundary. Thin `--border` is reserved for minor internal dividers only.
- Section breaks (like page headers) use `border-b-4 border-border-heavy` for strong separation.

---

## 3. Shadow System

Hard offset shadows, always keyed to `--shadow-color` (= `--border-heavy`), so they auto-flip in dark mode:

```css
.shadow-brutal-sm   /* 3px 3px 0 0 */
.shadow-brutal       /* 4px 4px 0 0 */
.shadow-brutal-lg   /* 6px 6px 0 0 */
.shadow-brutal-xl   /* 8px 8px 0 0 */
```

**Rule:** Every raised card/panel/button gets a shadow tier proportional to its visual weight:
- `shadow-brutal-sm` — small cards, pills, list items (e.g. product tiles)
- `shadow-brutal` — standard cards, dashboard panels
- `shadow-brutal-lg` / `shadow-brutal-xl` — hero elements, featured/promoted cards

Always pair a shadow with a `border-heavy` border — the shadow reads as the "block" the bordered element sits on top of.

---

## 4. Interaction Patterns

### `.brutal-press`
The signature interaction. Element presses toward its shadow on hover, flattens completely on click — like pushing a physical button into the page.

- **Use on:** every clickable card, button, pill.
- **Requires:** the element already has a `shadow-brutal-*` class and a `border-heavy` border.
- Hover → shifts 2px/2px, shadow steps down to `sm`.
- Active → shifts 4px/4px, shadow flattens to 0.

### `.brutal-press-lg`
Same interaction, scaled for elements using `shadow-brutal-lg`, so hover/active steps down proportionally instead of jumping straight to flat.

### `.brutal-invert`
Flat inverted hover for **text-only** links with no shadow (nav items, "view all" links). Instant color block instead of a fade — background flips to `--foreground`, text flips to `--background`.

### `.brutal-snap`
Generic fast linear transition helper (`100ms linear`) for one-off transform/shadow effects that don't fit the two patterns above.

### `Underline` (hover text highlight)
**Component:** `src/components/ui/Underline.tsx`

Brutalist swap for a soft animated underline: an instant hard-edged highlighter block (`--accent-2`) reveals behind the text on hover with no easing, and the text flips to `--on-accent-2` for contrast.

```tsx
"use client";

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
```

**Rule:** Wrap any interactive text label (product names, article titles, nav links, "read more" text) in `<Underline>` when it sits inside a link/clickable container — instead of `underline`, `hover:underline`, or a manual `::after` line.

**Requirements:**
- The parent link/container **must** have the `group` class — `Underline` relies on `group-hover:` to trigger.
- Use it on the primary clickable text only, not on entire cards. Pair it with `brutal-press` on the card itself for the shadow/press interaction; `Underline` handles the text.
- Font size/weight is controlled by the wrapping element (`h4`, `h3`, etc.) — `Underline` only owns the highlight/color-flip behavior.

```tsx
<Link href={...} className="group ...">
  <h4 className="text-xl font-extrabold">
    <Underline>{title}</Underline>
  </h4>
</Link>
```

---

## 5. Typography

- Font: `Space Grotesk`, forced globally via `!important` — no per-component font overrides.
- Headings and labels lean **extrabold + uppercase + tracked-out** for brutalist emphasis (e.g. `text-xs font-extrabold tracking-[0.14em] uppercase` on eyebrow/kicker labels).
- Body/secondary text uses `font-bold` more often than regular weight — brutalism avoids thin/light text.

---

## 6. Cards (reference pattern)

Standard clickable content card (e.g. product tile):

```tsx
<Link
  href={...}
  className="group brutal-press bg-card border-2 border-border-heavy rounded-none overflow-hidden shadow-brutal-sm"
>
  <div className="aspect-square bg-white border-b-2 border-border-heavy overflow-hidden">
    {/* image, object-contain, group-hover:scale-105 for subtle zoom */}
  </div>
  <div className="p-2.5">
    {/* eyebrow row: brand (muted) + category (accent), both uppercase/extrabold/tiny */}
    <h4 className="text-xl font-extrabold line-clamp-2 leading-snug">
      <Underline>{name}</Underline>
    </h4>
    {/* price: font-bold text-accent */}
  </div>
</Link>
```

---

## 7. Special-case Tokens

- **Photo overlays** (captions/labels on top of arbitrary images): use `--photo-overlay` / `--on-photo`, never `--border-heavy` derivatives — these must look identical regardless of site theme.
- **Bookmark UI**: use `--accent-bookmark` / `--on-accent-bookmark`, not `--accent` — kept separate so bookmark state can have its own visual identity independent of the primary accent.

---

## 8. Grid Density

For dense product/tile grids, prefer more columns with compact card padding over fewer columns with generous padding — brutalism reads better dense and blocky than airy:

```
grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4
```

with tight internal card padding (`p-2.5`) and small eyebrow text (`text-[9px]`).
