import {
  Monitor,
  Cpu,
  CircuitBoard,
  BatteryCharging,
  Camera,
  Aperture,
  ScanFace,
  Keyboard,
  Fingerprint,
  MemoryStick,
  HardDrive,
  Ruler,
  Smartphone,
  Zap,
  Wifi,
  Usb,
  Palette,
  Tag,
  Volume2,
  Droplets,
  Signal,
  ScanLine,
  Weight,
  Info,
  Layers,
  Radar,
  type LucideIcon,
} from "lucide-react";

export interface SpecAccent {
  bar: string;
  icon: string;
}

const RULES: { keywords: string[]; icon: LucideIcon; accent: SpecAccent }[] = [
  { keywords: ["design", "build", "construction"], icon: Layers, accent: { bar: "bg-gray-500", icon: "text-gray-600 dark:text-gray-400" } },
  { keywords: ["display", "screen", "resolution"], icon: Monitor, accent: { bar: "bg-blue-500", icon: "text-blue-600 dark:text-blue-400" } },
  { keywords: ["chipset", "processor", "cpu", "soc"], icon: Cpu, accent: { bar: "bg-violet-500", icon: "text-violet-600 dark:text-violet-400" } },
  { keywords: ["gpu", "graphics"], icon: CircuitBoard, accent: { bar: "bg-cyan-500", icon: "text-cyan-600 dark:text-cyan-400" } },
  { keywords: ["battery", "charging", "adapter", "fast charg"], icon: BatteryCharging, accent: { bar: "bg-amber-500", icon: "text-amber-600 dark:text-amber-400" } },
  { keywords: ["front camera", "selfie camera"], icon: ScanFace, accent: { bar: "bg-fuchsia-500", icon: "text-fuchsia-600 dark:text-fuchsia-400" } },
  { keywords: ["rear camera", "back camera", "primary camera"], icon: Aperture, accent: { bar: "bg-pink-500", icon: "text-pink-600 dark:text-pink-400" } },
  { keywords: ["camera"], icon: Camera, accent: { bar: "bg-pink-500", icon: "text-pink-600 dark:text-pink-400" } },
  { keywords: ["keyboard", "trackpad"], icon: Keyboard, accent: { bar: "bg-yellow-500", icon: "text-yellow-600 dark:text-yellow-400" } },
  { keywords: ["security", "fingerprint", "face unlock"], icon: Fingerprint, accent: { bar: "bg-red-500", icon: "text-red-600 dark:text-red-400" } },
  { keywords: ["sensors", "gyroscope", "accelerometer", "compass"], icon: Radar, accent: { bar: "bg-purple-500", icon: "text-purple-600 dark:text-purple-400" } },
  { keywords: ["ram", "memory"], icon: MemoryStick, accent: { bar: "bg-teal-500", icon: "text-teal-600 dark:text-teal-400" } },
  { keywords: ["storage", "rom"], icon: HardDrive, accent: { bar: "bg-indigo-500", icon: "text-indigo-600 dark:text-indigo-400" } },
  { keywords: ["weight"], icon: Weight, accent: { bar: "bg-slate-500", icon: "text-slate-600 dark:text-slate-400" } },
  { keywords: ["dimension", "size"], icon: Ruler, accent: { bar: "bg-slate-500", icon: "text-slate-600 dark:text-slate-400" } },
  { keywords: ["os", "android", "ios", "software"], icon: Smartphone, accent: { bar: "bg-sky-500", icon: "text-sky-600 dark:text-sky-400" } },
  { keywords: ["connectivity", "network", "wifi", "bluetooth", "5g", "4g"], icon: Wifi, accent: { bar: "bg-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" } },
  { keywords: ["port", "usb", "jack"], icon: Usb, accent: { bar: "bg-stone-500", icon: "text-stone-600 dark:text-stone-400" } },
  { keywords: ["color", "colour", "finish"], icon: Palette, accent: { bar: "bg-fuchsia-500", icon: "text-fuchsia-600 dark:text-fuchsia-400" } },
  { keywords: ["price"], icon: Tag, accent: { bar: "bg-green-500", icon: "text-green-600 dark:text-green-400" } },
  { keywords: ["audio", "speaker", "sound"], icon: Volume2, accent: { bar: "bg-orange-500", icon: "text-orange-600 dark:text-orange-400" } },
  { keywords: ["water", "resistance", "ip6", "ip5"], icon: Droplets, accent: { bar: "bg-cyan-500", icon: "text-cyan-600 dark:text-cyan-400" } },
  { keywords: ["signal", "sim"], icon: Signal, accent: { bar: "bg-lime-500", icon: "text-lime-600 dark:text-lime-400" } },
];

const DEFAULT_ACCENT: SpecAccent = { bar: "bg-gray-400", icon: "text-muted-foreground" };

function findRule(label: string) {
  const lower = label.toLowerCase();
  return RULES.find((rule) => rule.keywords.some((kw) => lower.includes(kw)));
}

export function getSpecIcon(label: string): LucideIcon {
  return findRule(label)?.icon ?? Info;
}

export function getSpecAccent(label: string): SpecAccent {
  return findRule(label)?.accent ?? DEFAULT_ACCENT;
}