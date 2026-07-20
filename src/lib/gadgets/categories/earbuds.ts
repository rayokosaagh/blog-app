// src/lib/gadgets/categories/laptops.ts
import { GadgetCategoryDef } from "../types";
export const earbuds: GadgetCategoryDef = {
  slug: "earbuds",
  name: "Earbuds",
  icon: "bi bi-earbuds",
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
        { key: "dimensions", label: "Dimension", type: "multiline" },
        { key: "weightGm", label: "Weight", type: "multiline" },
        { key: "ipRating", label: "IP Rating", type: "multiline" },
        { key: "fit", label: "Fit", type: "text" },
        { key: "earTipSizes", label: "Ear Tip Sizes", type: "text" },
      ],
    },
    {
      title: "Audio",
      fields: [
        { key: "driver", label: "Driver", type: "text"},
        { key: "codecs", label: "Codecs", type: "text"},
        { key: "frequencyRes", label: "Frequency Response", type: "text"},
        { key: "microphone", label: "Microphone", type: "text"},
        { key: "noiseCancellation", label: "Noise Cancellation", type: "text"},
        { key: "350Audio", label: "360 Audio", type: "text" },
        { key: "others", label: "Others", type: "multiline" },
      ],
    },
    {
  title: "Connectivity",
  fields: [              
    { key: "bluetooth", label: "Bluetooth", type: "text" }, 
    { key: "multiPairing", label: "Multi-Pairing", type: "text" },        
    { key: "companionApp", label: "Companiong App", type: "text" },                  
  ],
},
    {
      title: "Battery",
      fields: [
        { key: "batteryMah", label: "Type", type: "text"},
        { key: "musciPlayback", label: "Music Playback", type: "multiline"},
        { key: "talkTime", label: "Talk Time", type: "text"},
        { key: "charging", label: "Charging", type: "multiline" },
      ],
    },
  ],
  maxCompare: 3,
};