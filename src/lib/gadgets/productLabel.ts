/**
 * "Brand Name" for a product, without repeating the brand when the name
 * already starts with it. Most catalogue names carry their brand ("Motorola
 * Moto G Max 5G"), so a plain `${brand} ${name}` printed "Motorola Motorola
 * Moto G Max 5G"; names that don't ("iPhone 17", brand Apple) still get it.
 *
 * The brand must end at a word boundary, so "Applewood" doesn't count as
 * starting with "Apple" — but "Nothing(4a)Pro" does start with "Nothing".
 */
export function productLabel(brand: string, name: string): string {
  const b = brand.trim();
  if (!b) return name;
  const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}(?![\\p{L}\\p{N}])`, "iu").test(name.trim()) ? name : `${b} ${name}`;
}
