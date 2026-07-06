// src/lib/gadgets/types.ts
export type SpecFieldType = "number" | "text" | "boolean" | "select" | "multiline";

export interface SpecField {
  key: string;
  label: string;
  type: SpecFieldType;
  unit?: string;
  options?: string[];
  higherIsBetter?: boolean;
}

export interface SpecGroup {
  title: string;        // "Display", "Battery" — becomes the anchor + section header
  fields: SpecField[];
}

export interface GadgetCategoryDef {
  slug: string;          // "mobiles"
  name: string;          // "Smartphones"
  icon: string;          // path to svg, for the top picker bar
  groups: SpecGroup[];   // ordered — order = table order = nav order
  maxCompare?: number;   // default 3, matches the reference site
}