// src/lib/gadgets/categories/mobiles.ts
import { GadgetCategoryDef } from "../types";

export const smartwatch: GadgetCategoryDef = {
  slug: "smartwatch",
  name: "SmartWatches",
  icon: "bi bi-watch",
  groups: [
   {
  title: "General Information",
  fields: [
    { key: "brand", label: "Brand / Manufacturer", type: "select" },
    { key: "series", label: "Series Lineup", type: "text" },         
    { key: "modelName", label: "Model Name", type: "text" },          
  ],
},
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
        { key: "case", label: "Case", type: "multiline" },
        { key: "Strap", label: "Strap", type: "multiline"},
        { key: "dimensions", label: "Dimensions", type: "text" },
        { key: "weight", label: "Weight", type: "text" },
        { key: "durability", label: "Durability", type: "multiline" },
      ],
    },
    {
      title: "Display",
      fields: [
        { key: "screenSize", label: "Size", type: "text",  },
        { key: "displayType", label: "Display Type", type: "text" },
        { key: "resolution", label: "Resolution", type: "text" },
        { key: "brightness", label: "Brightness", type: "text"},
      ],
    },
    {
      title: "Performance",
      fields: [
        { key: "chipset", label: "Chipset", type: "text" },
        { key: "cpu", label: "CPU", type: "multiline" },
        { key: "gpu", label: "GPU", type: "multiline" },
        { key: "os", label: "OS", type: "text" },
        { key: "ui", label: "UI Version", type: "text" },
        { key: "memory", label: "Memory", type: "text" },
      ],
    },
    {
      title: "Audio",
      fields: [
        { key: "audio", label: "Speaker", type: "text"},
        { key: "microphone", label: "Microphone", type: "text" },
      ],
    },
    {
  title: "Connectivity",
  fields: [
    { key: "wlan", label: "WLAN", type: "text" },               
    { key: "bluetooth", label: "Bluetooth", type: "text" },
    { key: "eSim", label: "eSIM", type: "text" },
    { key: "nfc", label: "NFC", type: "text" },
    { key: "compability", label: "Compability", type: "text" },
    { key: "positioning", label: "Positioning (GPS)", type: "multiline" },      
    { key: "companionApp", label: "Companion App", type: "multiline" },                  
  ],
},
    {
      title: "Sensors",
      fields: [
        { key: "sensors", label: "Type", type: "multiline"},
      ],
    },
    {
      title: "Health Monitoring",
      fields: [
        { key: "healthFeatures", label: "Features", type: "multiline"},
        { key: "fitnessTracking", label: "Fitness Tracking", type: "text"}
      ],
    },
    {
      title: "Battery",
      fields: [
        { key: "batteryMah", label: "Type", type: "text"},
        { key: "charging", label: "Charging", type: "multiline" },
        { key: "usageTime", label: "Usage Time", type: "multiline" },
      ],
    },
  ],
  maxCompare: 3,
};