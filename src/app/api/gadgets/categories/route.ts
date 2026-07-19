// Lightweight gadget-category metadata (slug/name/icon only) for menus and
// pickers — keeps the heavy per-category spec definitions out of client bundles.
import { CATEGORY_LIST } from "@/lib/gadgets/categories";

export function GET() {
  const categories = CATEGORY_LIST.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
  }));
  return Response.json({ categories });
}
