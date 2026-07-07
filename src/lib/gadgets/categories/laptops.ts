// src/lib/gadgets/categories/laptops.ts
import { GadgetCategoryDef } from "../types";
export const laptops: GadgetCategoryDef = {
  slug: "laptops",
  name: "Laptops",
  icon: "bi bi-laptop",
  groups: [
    { title: "Launch", fields: [{ key: "launchDate", label: "Date", type: "text" }] },
    { title: "Design", fields: [{ key: "weightKg", label: "Weight", type: "number", unit: "kg" }] },
    { title: "Display", fields: [{ key: "screenSize", label: "Size", type: "number", unit: "in" }] },
    { title: "Performance", fields: [{ key: "processor", label: "Processor", type: "text" }, { key: "gpu", label: "GPU", type: "text" }] },
    { title: "Battery", fields: [{ key: "batteryWh", label: "Capacity", type: "number", unit: "Wh" }] },
  ],
  maxCompare: 3,
};