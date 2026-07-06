// src/lib/gadgets/categories/mobiles.ts
import { GadgetCategoryDef } from "../types";

export const mobiles: GadgetCategoryDef = {
  slug: "mobiles",
  name: "Smartphones",
  icon: "/icons/smartphone.svg",
  groups: [
    {
      title: "Launch",
      fields: [
        { key: "launchDate", label: "Date", type: "text" },
        { key: "marketStatus", label: "Market Status", type: "select", options: ["In Stock", "Upcoming", "Discontinued"] },
      ],
    },
    {
      title: "Body",
      fields: [
        { key: "dimensions", label: "Dimension", type: "text" },
        { key: "weightGm", label: "Weight", type: "number", unit: "gm", higherIsBetter: false },
        { key: "build", label: "Build", type: "multiline" },
        { key: "colors", label: "Colors", type: "text" },
      ],
    },
    {
      title: "Memory",
      fields: [
        { key: "ram", label: "RAM", type: "text" },
        { key: "storage", label: "Storage", type: "text" },
        { key: "sdCard", label: "SD Card", type: "boolean" },
      ],
    },
    {
      title: "Display",
      fields: [
        { key: "screenSize", label: "Size", type: "number", unit: "in", higherIsBetter: true },
        { key: "displayType", label: "Display Type", type: "text" },
        { key: "resolution", label: "Resolution", type: "text" },
        { key: "refreshRate", label: "Refresh Rate", type: "number", unit: "Hz", higherIsBetter: true },
      ],
    },
    {
      title: "Performance",
      fields: [
        { key: "chipset", label: "Chipset", type: "text" },
        { key: "os", label: "OS", type: "text" },
      ],
    },
    {
      title: "Battery",
      fields: [
        { key: "batteryMah", label: "Type", type: "number", unit: "mAh", higherIsBetter: true },
        { key: "charging", label: "Charging", type: "text" },
        { key: "wirelessCharging", label: "Wireless Charging", type: "text" },
      ],
    },
    // Back Cameras, Front Camera, Security, Audio, Sensors, Connectivity, Extras
    // follow the same { title, fields } shape — add as many groups as needed.
  ],
  maxCompare: 3,
};