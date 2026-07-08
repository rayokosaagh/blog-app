// src/lib/gadgets/categories/index.ts
import { mobiles } from "./mobiles";
import { laptops } from "./laptops";
import { smartwatch } from "./smartwatches";
import { earbuds } from "./earbuds"

export const CATEGORY_REGISTRY = { mobiles, laptops, smartwatch,earbuds };
export const CATEGORY_LIST = Object.values(CATEGORY_REGISTRY); // drives the icon bar, in order
export const getCategoryDef = (slug: string) => CATEGORY_REGISTRY[slug];