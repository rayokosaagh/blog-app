// src/lib/gadgets/categories/laptops.ts
import { GadgetCategoryDef } from "../types";
export const laptops: GadgetCategoryDef = {
  slug: "laptops",
  name: "Laptops",
  icon: "bi bi-laptop",
  groups:  [
  {
    title: "Launch & Classification",
    fields: [
      { key: "brand", label: "Manufacturer / Brand", type: "select", options: ["Acer", "Asus", "Lenovo", "HP", "Dell", "Apple", "MSI"] },
      { key: "series", label: "Series Lineup", type: "text" },
      { key: "laptopType", label: "Laptop Class", type: "select", options: ["Gaming", "Ultrabook", "Creator", "Workstation", "Budget/Office"] },
      { key: "announcedDate", label: "Announcement Date", type: "text" },
      { key: "marketStatus", label: "Market Availability", type: "select", options: ["In stock", "Out of Stock", "Pre-order", "Discontinued"] },
    ],
  },
  {
    title: "Chassis & Build",
    fields: [
      { key: "dimensions", label: "Dimensions (W x D x H)", type: "text" },
      { key: "weight", label: "Weight", type: "text" },
      { key: "colorOptions", label: "Color Variants", type: "text" },
    ],
  },
  {
    title: "Processor (CPU)",
    fields: [
      { key: "cpuSeries", label: "CPU Architecture Series", type: "text" },
      { key: "processorModel", label: "Processor Model", type: "text" },
      { key: "coresThreads", label: "Cores / Threads", type: "text" },
      { key: "baseClock", label: "Base Clock Speed", type: "multiline" },
      { key: "boostClock", label: "Max Boost Clock", type: "multiline" },
      { key: "l3Cache", label: "L3 Cache Size", type: "text" },
      { key: "cpuTdp", label: "Thermal Design Power (TDP)", type: "text" },
    ],
  },
  {
    title: "Graphics (GPU) & AI Processing",
    fields: [
      { key: "gpuModel", label: "GPU Model Name", type: "text" },
      { key: "graphicsType", label: "Graphics Setup", type: "select", options: ["Dedicated", "Integrated", "Switchable (MUX/Optimus)"] },
      { key: "vram", label: "Video Memory (VRAM)", type: "text" },
      { key: "tgp", label: "Total Graphics Power (TGP)", type: "text" },
      { key: "gpuBoostClock", label: "GPU Boost Clock Speed", type: "text" },
      { key: "npuName", label: "NPU Architecture", type: "text" },
      { key: "npuTops", label: "NPU AI Performance (TOPS)", type: "text" },
    ],
  },
  {
    title: "Memory & Storage Subsystem",
    fields: [
      { key: "installedRam", label: "Installed RAM Capacity", type: "text" },
      { key: "solderedMemory", label: "Memory Soldered On-Board", type: "boolean" },
      { key: "ramSpeed", label: "Memory Speed / Interface", type: "text" },
      { key: "ramChannel", label: "Memory Channel Setup", type: "select", options: ["Dual channel", "Single channel", "Quad channel"] },
      { key: "maxRamCapacity", label: "Maximum Memory Ceiling", type: "text" },
      { key: "hasHdd", label: "Mechanical Drive Support (HDD)", type: "boolean" },
      { key: "primarySsd", label: "Default SSD Configuration", type: "text" },
      { key: "ssdSlots", label: "M.2 Expansion Slots", type: "text" },
    ],
  },
  {
    title: "Display Specifications",
    fields: [
      { key: "screenSize", label: "Screen Diagonal Size", type: "text" },
      { key: "panelType", label: "Display Panel Type", type: "select", options: ["Mini LED", "OLED", "IPS / LCD", "TN", "VA"] },
      { key: "touchscreen", label: "Touch Screen Capability", type: "boolean" },
      { key: "screenFinish", label: "Display Panel Finish", type: "select", options: ["Anti-glare", "Glossy", "Matte"] },
      { key: "resolution", label: "Native Resolution / Aspect Ratio", type: "text" },
      { key: "refreshRate", label: "Panel Refresh Rate", type: "text" },
      { key: "responseTime", label: "Grey-to-Grey Response Time", type: "text" },
      { key: "vrrSupport", label: "Variable Refresh Rate (VRR)", type: "text" },
      { key: "peakBrightness", label: "Peak Screen Brightness", type: "text" },
      { key: "colorGamut", label: "Color Space Coverage", type: "text" },
      { key: "displayCertifications", label: "Display Certifications / Enhancements", type: "multiline" },
    ],
  },
  {
    title: "I/O Ports & Interfacing",
    fields: [
      { key: "usbTypeA", label: "USB Type-A Connectors", type: "text" },
      { key: "usbTypeC", label: "USB Type-C / Thunderbolt / USB4", type: "text" },
      { key: "displayPorts", label: "External Display Outs (HDMI / DP)", type: "text" },
      { key: "audioJack", label: "Analog Audio Interface", type: "text" },
      { key: "cardReader", label: "Integrated Flash Card Reader", type: "text" },
    ],
  },
  {
    title: "Network & Comms",
    fields: [
      { key: "hasEthernet", label: "Ethernet Port (RJ45)", type: "boolean" },
      { key: "wifiStandard", label: "Wireless Networking (Wi-Fi)", type: "text" },
      { key: "bluetoothStandard", label: "Bluetooth Protocol", type: "text" },
    ],
  },
  {
    title: "Peripherals, Audio & Security",
    fields: [
      { key: "keyboardType", label: "Keyboard Interface & Backlighting", type: "text" },
      { key: "trackpadType", label: "Pointer Trackpad Driver Class", type: "text" },
      { key: "webcamSpecs", label: "Integrated Web Camera Matrix", type: "text" },
      { key: "securityHardware", label: "Security Encryption Framework", type: "text" },
      { key: "speakerConfiguration", label: "Acoustic Speaker Array", type: "text" },
      { key: "microphoneArray", label: "Voice Microphone Hardware", type: "text" },
    ],
  },
  {
    title: "Power Architecture & Software",
    fields: [
      { key: "batteryCapacity", label: "Internal Battery Capacity", type: "text" },
      { key: "powerAdapter", label: "AC Charger Brick Wattage", type: "text" },
      { key: "operatingSystem", label: "Primary Operating System", type: "select", options: ["Windows 11 Home", "Windows 11 Pro", "macOS", "Linux / Ubuntu", "No OS"] },
      { key: "bundledSoftware", label: "Preloaded Bloatware / Utility Apps", type: "multiline" },
    ],
  },
],
  maxCompare: 3,
};