// src/lib/gadgets/categories/index.ts
import { mobiles } from "./mobiles";
import { laptops } from "./laptops";

export const CATEGORY_REGISTRY = { mobiles, laptops, };
export const CATEGORY_LIST = Object.values(CATEGORY_REGISTRY); // drives the icon bar, in order
export const getCategoryDef = (slug: string) => CATEGORY_REGISTRY[slug];