// src/lib/gadgets/categories/index.ts
import { GadgetCategoryDef } from "../types";
import { mobiles } from "./mobiles";
import { laptops } from "./laptops";
import { smartwatch } from "./smartwatches";
import { earbuds } from "./earbuds"

export const CATEGORY_REGISTRY: Record<string, GadgetCategoryDef> = { mobiles, laptops, smartwatch,earbuds };
export const CATEGORY_LIST = Object.values(CATEGORY_REGISTRY); // drives the icon bar, in order
// Undefined for a slug with no spec-group definition — every caller guards for it.
export const getCategoryDef = (slug: string): GadgetCategoryDef | undefined =>
  CATEGORY_REGISTRY[slug];