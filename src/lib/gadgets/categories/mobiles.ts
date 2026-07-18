// src/lib/gadgets/categories/mobiles.ts
import { GadgetCategoryDef } from "../types";

export const mobiles: GadgetCategoryDef = {
  slug: "mobiles",
  name: "Smartphones",
  icon: "bi bi-phone",
  groups: [
   {
  title: "General Information",
  fields: [
    { key: "brand", label: "Brand / Manufacturer", type: "dropdown" },
    { key: "series", label: "Series Lineup", type: "text" },         
    { key: "modelName", label: "Model Name", type: "text" },          
    { key: "formFactor", label: "Device Type", type: "dropdown" },     
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
        { key: "dimensions", label: "Dimension", type: "text" },
        { key: "weightGm", label: "Weight", type: "number", unit: "gm", higherIsBetter: false },
        { key: "build", label: "Build Materials", type: "multiline" },
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
        { key: "screenSize", label: "Size", type: "text",  },
        { key: "displayType", label: "Display Type", type: "text" },
        { key: "resolution", label: "Resolution", type: "text" },
        { key: "brightness", label: "Brightness", type: "text"},
        { key: "refreshRate", label: "Refresh Rate", type: "number", unit: "Hz", higherIsBetter: true },

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
        { key: "osSupport", label: "OS Support", type: "text" },
      ],
    },
    {
      title: "Benchmark",
      fields: [
        { key: "antutu", label: "Antutu", type: "text" },
        { key: "geekbench", label: "GeekBench", type: "text" },
        { key: "3Dmark", label: "3DMark", type: "text" },
      ],
    },
     {
      title: "Rear Camera System",
      fields: [
        { key: "type", label: "Type", type: "text" },
        { key: "backSensors", label: "Sensors", type: "multiline" },
        { key: "features", label: "Features", type: "multiline" },
        { key: "video", label: "Video", type: "multiline" },
      ],
    },
    {
      title: "Front Camera System",
      fields: [
        { key: "frontSensors", label: "Sensors", type: "multiline" },
        { key: "frontFeatures", label: "Features", type: "multiline" },
        { key: "frontVideo", label: "Video", type: "multiline" },
      ],
    },
    {
      title: "Audio",
      fields: [
        { key: "audio", label: "Speaker", type: "text"},
        { key: "headphoneJack", label: "3.5mm Jack", type: "text" },
        { key: "audioFeatures", label: "Features", type: "multiline" },
      ],
    },
    {
  title: "Connectivity",
  fields: [
    { key: "wifi", label: "Wi-Fi", type: "text" },               
    { key: "bluetooth", label: "Bluetooth", type: "text" },
    { key: "positioning", label: "Positioning (GPS)", type: "multiline" }, 
    { key: "nfc", label: "NFC Support", type: "boolean" },        
    { key: "usb", label: "USB", type: "text" },                  
  ],
},
    {
      title: "Biometrics",
      fields: [
        { key: "fingerprint", label: "Fingerprint", type: "text"},
        { key: "faceUnlock", label: "Face Unlock", type: "text"},
      ],
    },
    {
      title: "Sensors",
      fields: [
        { key: "sensors", label: "Type", type: "multiline"},
      ],
    },
    {
      title: "Battery",
      fields: [
        { key: "batteryMah", label: "Capacity", type: "text"},
        { key: "charging", label: "Charging", type: "text" },
        { key: "wirelessCharging", label: "Wireless Charging", type: "text" },
      ],
    },
  ],
  maxCompare: 3,
};