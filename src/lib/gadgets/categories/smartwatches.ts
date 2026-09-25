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
        { key: "launchDate", label: "Date", type: "text", important: true },
        { key: "marketStatus", label: "Market Status", type: "select", options: ["In Stock", "Upcoming", "Discontinued"] },
      ],
    },
    {
      title: "Body",
      fields: [
        { key: "case", label: "Case", type: "multiline" },
        { key: "Strap", label: "Strap", type: "multiline"},
        { key: "dimensions", label: "Dimensions", type: "text" },
        { key: "weight", label: "Weight", type: "text", important: true },
        { key: "durability", label: "Durability", type: "multiline", important: true },
      ],
    },
    {
      title: "Display",
      fields: [
        { key: "screenSize", label: "Size", type: "text", important: true },
        { key: "displayType", label: "Display Type", type: "text", important: true },
        { key: "resolution", label: "Resolution", type: "text" },
        { key: "brightness", label: "Brightness", type: "text"},
      ],
    },
    {
      title: "Performance",
      fields: [
        { key: "chipset", label: "Chipset", type: "text", important: true },
        { key: "cpu", label: "CPU", type: "multiline" },
        { key: "gpu", label: "GPU", type: "multiline" },
        { key: "os", label: "OS", type: "text", important: true },
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
    { key: "bluetooth", label: "Bluetooth", type: "text", important: true },
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
        { key: "healthFeatures", label: "Features", type: "multiline", important: true },
        { key: "fitnessTracking", label: "Fitness Tracking", type: "text", important: true }
      ],
    },
    {
      title: "Battery",
      fields: [
        { key: "batteryMah", label: "Type", type: "text", important: true },
        { key: "charging", label: "Charging", type: "multiline" },
        { key: "usageTime", label: "Usage Time", type: "multiline", important: true },
      ],
    },
  ],
  maxCompare: 3,
};