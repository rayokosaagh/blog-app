// src/components/feeds/specIcons.tsx
import type { ComponentType } from "react";
import {
  Monitor,
  Cpu,
  CircuitBoard,
  BatteryCharging,
  BatteryFull,
  PlugZap,
  Waves,
  Camera,
  Aperture,
  ScanFace,
  Keyboard,
  Fingerprint,
  MemoryStick,
  HardDrive,
  Ruler,
  Smartphone,
  Wifi,
  Bluetooth,
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
  Layers3,
  Radar,
  Building2,
  GitBranch,
  Hash,
  Calendar,
  Activity,
  CreditCard,
  SunMedium,
  RefreshCw,
  LayoutGrid,
  Sparkles,
  Video,
  MapPin,
  Nfc,
  Gauge,
  List,
  Speaker,
  AudioLines,
  AudioWaveform,
  Mic,
  Ear,
  EarOff,
  Play,
  PhoneCall,
  Link2,
  Watch,
  CircleDot,
  Shield,
  Clock,
} from "lucide-react";

export interface SpecAccent {
  bar: string;
  icon: string;
}

type IconComponent = ComponentType<{
  size?: number | string;
  className?: string;
  strokeWidth?: number | string;
}>;

function AntutuIcon({ size = 24, className, strokeWidth = 2 }: { size?: number | string; className?: string; strokeWidth?: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
      <path d="M12 3v6M12 15v6M4.2 7.8l5.2 3M14.6 13.2l5.2 3M4.2 16.2l5.2-3M14.6 10.8l5.2-3" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  );
}

function GeekbenchIcon({ size = 24, className, strokeWidth = 2 }: { size?: number | string; className?: string; strokeWidth?: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
      <rect x="4" y="10" width="4" height="10" rx="1" />
      <rect x="10" y="5" width="4" height="15" rx="1" />
      <rect x="16" y="13" width="4" height="7" rx="1" />
    </svg>
  );
}

function ThreeDMarkIcon({ size = 24, className, strokeWidth = 2 }: { size?: number | string; className?: string; strokeWidth?: number | string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className={className}>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" strokeLinejoin="round" />
      <path d="M12 3v9M12 12l8-4.5M12 12l-8-4.5" strokeLinejoin="round" />
    </svg>
  );
}

// Phrases (multi-word keywords) match by substring. Single-word keywords
// require a LEFT word boundary — so "date" won't misfire inside "Update",
// "os" won't misfire inside "Cost", "cpu" won't misfire inside "Chipset".
function matchesKeyword(lower: string, kw: string): boolean {
  if (kw.includes(" ") || kw.includes("-")) return lower.includes(kw);
  return new RegExp(`\\b${kw}`).test(lower);
}

const RULES: { keywords: string[]; icon: IconComponent; accent: SpecAccent }[] = [
  // --- General info -------------------------------------------------
  { keywords: ["brand", "manufacturer"], icon: Building2, accent: { bar: "bg-gray-500", icon: "text-gray-600 dark:text-gray-400" } },
  { keywords: ["series", "lineup"], icon: GitBranch, accent: { bar: "bg-purple-500", icon: "text-purple-600 dark:text-purple-400" } },
  { keywords: ["model"], icon: Hash, accent: { bar: "bg-blue-500", icon: "text-blue-600 dark:text-blue-400" } },

  // --- Launch ---------------------------------------------------------
  { keywords: ["launch date", "release date", "date"], icon: Calendar, accent: { bar: "bg-sky-500", icon: "text-sky-600 dark:text-sky-400" } },
  { keywords: ["market status"], icon: Activity, accent: { bar: "bg-lime-500", icon: "text-lime-600 dark:text-lime-400" } },

  { keywords: ["design", "build", "construction"], icon: Layers, accent: { bar: "bg-gray-500", icon: "text-gray-600 dark:text-gray-400" } },

  // --- Display ---------------------------------------------------------
  { keywords: ["display", "screen"], icon: Monitor, accent: { bar: "bg-blue-500", icon: "text-blue-600 dark:text-blue-400" } },
  { keywords: ["resolution", "pixel density", "ppi"], icon: ScanLine, accent: { bar: "bg-blue-500", icon: "text-blue-600 dark:text-blue-400" } },
  { keywords: ["brightness", "nits"], icon: SunMedium, accent: { bar: "bg-amber-500", icon: "text-amber-600 dark:text-amber-400" } },
  { keywords: ["refresh rate"], icon: RefreshCw, accent: { bar: "bg-blue-500", icon: "text-blue-600 dark:text-blue-400" } },

  // Chipset (SoC name/model) vs CPU (core config) vs GPU are now three
  // separate rules with three separate icons — previously chipset and
  // cpu shared one rule/icon, which is why they rendered identically.
  { keywords: ["chipset", "soc"], icon: Cpu, accent: { bar: "bg-violet-500", icon: "text-violet-600 dark:text-violet-400" } },
  { keywords: ["cpu", "processor", "core"], icon: Layers3, accent: { bar: "bg-fuchsia-600", icon: "text-fuchsia-700 dark:text-fuchsia-400" } },
  { keywords: ["gpu", "graphics"], icon: CircuitBoard, accent: { bar: "bg-cyan-500", icon: "text-cyan-600 dark:text-cyan-400" } },
  { keywords: ["ui version"], icon: LayoutGrid, accent: { bar: "bg-sky-500", icon: "text-sky-600 dark:text-sky-400" } },

  // --- Benchmark ---------------------------------------------------------
  { keywords: ["antutu"], icon: AntutuIcon, accent: { bar: "bg-yellow-500", icon: "text-yellow-600 dark:text-yellow-400" } },
  { keywords: ["geekbench"], icon: GeekbenchIcon, accent: { bar: "bg-rose-500", icon: "text-rose-600 dark:text-rose-400" } },
  { keywords: ["3dmark"], icon: ThreeDMarkIcon, accent: { bar: "bg-lime-500", icon: "text-lime-600 dark:text-lime-400" } },

  // --- Battery ---------------------------------------------------------
  // Capacity / wired Charging / Wireless Charging previously shared one
  // rule and one icon. Split into three, most-specific first: "wireless
  // charging" must be checked before the generic charging rule below,
  // since it also contains the word "charging".
  { keywords: ["wireless charging", "wireless charg"], icon: Waves, accent: { bar: "bg-cyan-600", icon: "text-cyan-700 dark:text-cyan-400" } },
  { keywords: ["capacity"], icon: BatteryFull, accent: { bar: "bg-amber-500", icon: "text-amber-600 dark:text-amber-400" } },
  { keywords: ["battery", "charging", "adapter", "fast charg"], icon: PlugZap, accent: { bar: "bg-orange-500", icon: "text-orange-600 dark:text-orange-400" } },

  // --- Camera ---------------------------------------------------------
  { keywords: ["front camera", "selfie camera"], icon: ScanFace, accent: { bar: "bg-fuchsia-500", icon: "text-fuchsia-600 dark:text-fuchsia-400" } },
  { keywords: ["rear camera", "back camera", "primary camera"], icon: Aperture, accent: { bar: "bg-pink-500", icon: "text-pink-600 dark:text-pink-400" } },
  { keywords: ["camera"], icon: Camera, accent: { bar: "bg-pink-500", icon: "text-pink-600 dark:text-pink-400" } },
  { keywords: ["video"], icon: Video, accent: { bar: "bg-pink-500", icon: "text-pink-600 dark:text-pink-400" } },

  { keywords: ["keyboard", "trackpad"], icon: Keyboard, accent: { bar: "bg-yellow-500", icon: "text-yellow-600 dark:text-yellow-400" } },

  // --- Earbuds / audio hardware ---------------------------------------
  // Placed before the generic "size"/"type"/"audio" rules so specific
  // earbud fields (Driver, Fit, Ear Tip Sizes…) win over them.
  { keywords: ["driver"], icon: Speaker, accent: { bar: "bg-orange-500", icon: "text-orange-600 dark:text-orange-400" } },
  { keywords: ["codec"], icon: AudioLines, accent: { bar: "bg-amber-500", icon: "text-amber-600 dark:text-amber-400" } },
  { keywords: ["frequency response", "frequency"], icon: AudioWaveform, accent: { bar: "bg-orange-500", icon: "text-orange-600 dark:text-orange-400" } },
  { keywords: ["microphone", "mic"], icon: Mic, accent: { bar: "bg-rose-500", icon: "text-rose-600 dark:text-rose-400" } },
  { keywords: ["noise cancellation", "noise cancel", "anc"], icon: EarOff, accent: { bar: "bg-purple-500", icon: "text-purple-600 dark:text-purple-400" } },
  { keywords: ["fitness", "tracking", "health"], icon: Activity, accent: { bar: "bg-green-500", icon: "text-green-600 dark:text-green-400" } },
  { keywords: ["ear tip", "fit"], icon: Ear, accent: { bar: "bg-fuchsia-500", icon: "text-fuchsia-600 dark:text-fuchsia-400" } },
  { keywords: ["ip rating", "ingress", "dust"], icon: Droplets, accent: { bar: "bg-cyan-500", icon: "text-cyan-600 dark:text-cyan-400" } },
  { keywords: ["playback", "music play"], icon: Play, accent: { bar: "bg-orange-500", icon: "text-orange-600 dark:text-orange-400" } },
  { keywords: ["talk time", "call time"], icon: PhoneCall, accent: { bar: "bg-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" } },
  { keywords: ["pairing", "multi-pair"], icon: Link2, accent: { bar: "bg-blue-500", icon: "text-blue-600 dark:text-blue-400" } },
  { keywords: ["companion app", "companion"], icon: Smartphone, accent: { bar: "bg-sky-500", icon: "text-sky-600 dark:text-sky-400" } },

  // --- Smartwatch / wearable body -------------------------------------
  { keywords: ["strap", "band"], icon: Watch, accent: { bar: "bg-slate-500", icon: "text-slate-600 dark:text-slate-400" } },
  { keywords: ["case"], icon: CircleDot, accent: { bar: "bg-slate-500", icon: "text-slate-600 dark:text-slate-400" } },
  { keywords: ["durability", "durable"], icon: Shield, accent: { bar: "bg-gray-500", icon: "text-gray-600 dark:text-gray-400" } },
  { keywords: ["usage time", "runtime", "standby"], icon: Clock, accent: { bar: "bg-orange-500", icon: "text-orange-600 dark:text-orange-400" } },
  { keywords: ["wlan"], icon: Wifi, accent: { bar: "bg-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" } },
  { keywords: ["compatib", "compab"], icon: Smartphone, accent: { bar: "bg-sky-500", icon: "text-sky-600 dark:text-sky-400" } },

  { keywords: ["security", "fingerprint"], icon: Fingerprint, accent: { bar: "bg-red-500", icon: "text-red-600 dark:text-red-400" } },
  { keywords: ["face unlock", "face recognition", "face id"], icon: ScanFace, accent: { bar: "bg-rose-500", icon: "text-rose-600 dark:text-rose-400" } },

  { keywords: ["sensors", "gyroscope", "accelerometer", "compass"], icon: Radar, accent: { bar: "bg-purple-500", icon: "text-purple-600 dark:text-purple-400" } },
  { keywords: ["ram", "memory"], icon: MemoryStick, accent: { bar: "bg-teal-500", icon: "text-teal-600 dark:text-teal-400" } },
  { keywords: ["storage", "rom"], icon: HardDrive, accent: { bar: "bg-indigo-500", icon: "text-indigo-600 dark:text-indigo-400" } },
  { keywords: ["sd card", "memory card", "expandable"], icon: CreditCard, accent: { bar: "bg-indigo-500", icon: "text-indigo-600 dark:text-indigo-400" } },
  { keywords: ["weight"], icon: Weight, accent: { bar: "bg-slate-500", icon: "text-slate-600 dark:text-slate-400" } },
  { keywords: ["dimension", "size"], icon: Ruler, accent: { bar: "bg-slate-500", icon: "text-slate-600 dark:text-slate-400" } },
  { keywords: ["os", "android", "ios", "software"], icon: Smartphone, accent: { bar: "bg-sky-500", icon: "text-sky-600 dark:text-sky-400" } },

  // --- Connectivity ---------------------------------------------------------
  // Bluetooth split out from the generic Wi-Fi/network rule so it gets
  // lucide's dedicated Bluetooth glyph instead of reusing the Wi-Fi icon.
  { keywords: ["bluetooth"], icon: Bluetooth, accent: { bar: "bg-blue-600", icon: "text-blue-700 dark:text-blue-400" } },
  { keywords: ["connectivity", "network", "wifi", "wi-fi", "5g", "4g"], icon: Wifi, accent: { bar: "bg-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" } },
  { keywords: ["positioning", "gps", "glonass", "galileo"], icon: MapPin, accent: { bar: "bg-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" } },
  { keywords: ["nfc"], icon: Nfc, accent: { bar: "bg-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" } },

  { keywords: ["port", "usb", "jack"], icon: Usb, accent: { bar: "bg-stone-500", icon: "text-stone-600 dark:text-stone-400" } },
  { keywords: ["color", "colour", "finish"], icon: Palette, accent: { bar: "bg-fuchsia-500", icon: "text-fuchsia-600 dark:text-fuchsia-400" } },
  { keywords: ["price"], icon: Tag, accent: { bar: "bg-green-500", icon: "text-green-600 dark:text-green-400" } },
  { keywords: ["audio", "speaker", "sound"], icon: Volume2, accent: { bar: "bg-orange-500", icon: "text-orange-600 dark:text-orange-400" } },
  { keywords: ["water", "resistance", "ip6", "ip5"], icon: Droplets, accent: { bar: "bg-cyan-500", icon: "text-cyan-600 dark:text-cyan-400" } },
  { keywords: ["signal", "sim", "esim", "e-sim"], icon: Signal, accent: { bar: "bg-lime-500", icon: "text-lime-600 dark:text-lime-400" } },

  { keywords: ["features"], icon: Sparkles, accent: { bar: "bg-amber-500", icon: "text-amber-600 dark:text-amber-400" } },
  { keywords: ["type"], icon: Tag, accent: { bar: "bg-gray-500", icon: "text-gray-600 dark:text-gray-400" } },
];

const DEFAULT_ACCENT: SpecAccent = { bar: "bg-gray-400", icon: "text-muted-foreground" };

function findRule(label: string) {
  const lower = label.toLowerCase();
  return RULES.find((rule) => rule.keywords.some((kw) => matchesKeyword(lower, kw)));
}

export function getSpecIcon(label: string): IconComponent {
  return findRule(label)?.icon ?? Info;
}

export function getSpecAccent(label: string): SpecAccent {
  return findRule(label)?.accent ?? DEFAULT_ACCENT;
}

// --- Group/section-level icon ------------------------------------------
const GROUP_RULES: { keywords: string[]; icon: IconComponent }[] = [
  { keywords: ["general", "information", "overview", "about", "summary", "highlights"], icon: Info },
  { keywords: ["launch", "release", "availability"], icon: Calendar },
  { keywords: ["body", "design", "build"], icon: Layers },
  { keywords: ["performance", "chip", "processor"], icon: Cpu },
  { keywords: ["benchmark", "score"], icon: Gauge },
  { keywords: ["display", "screen"], icon: Monitor },
  { keywords: ["front camera", "selfie camera"], icon: ScanFace },
  { keywords: ["rear camera", "back camera"], icon: Aperture },
  { keywords: ["camera", "photo"], icon: Camera },
  { keywords: ["battery", "power", "charging"], icon: BatteryCharging },
  { keywords: ["connectiv", "network", "wireless"], icon: Wifi },
  { keywords: ["storage", "memory", "ram"], icon: HardDrive },
  { keywords: ["audio", "sound", "speaker"], icon: Volume2 },
  { keywords: ["biometric", "fingerprint", "face unlock", "security"], icon: Fingerprint },
  { keywords: ["sensor"], icon: Radar },
  { keywords: ["price", "value"], icon: Tag },
];

export function getGroupIcon(title: string): IconComponent {
  const lower = title.toLowerCase();
  return GROUP_RULES.find((r) => r.keywords.some((kw) => matchesKeyword(lower, kw)))?.icon ?? List;
}