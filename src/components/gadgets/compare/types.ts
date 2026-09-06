import { SpecField } from "@/lib/gadgets/types";

export interface CategoryOption {
  slug: string;
  name: string;
  icon?: string;
}

export interface ProductLite {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image?: string | null;
}

export interface Product extends ProductLite {
  priceFrom?: number | null;
  specs: Record<string, any>;
}

// A spec group after any filtering (only-differences / text search)
// has already been applied — title + the fields that survived.
export interface SpecGroupLike {
  title: string;
  fields: SpecField[];
}