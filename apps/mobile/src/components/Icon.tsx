import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];
type CommunityIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type IconSpec = { set: "material"; name: MaterialIconName } | { set: "community"; name: CommunityIconName };

// Material Symbols (web, police à ligatures) n'a pas d'équivalent RN direct
// (Text ne supporte pas les ligatures) — @expo/vector-icons (inclus avec
// Expo, codepoints stables) est le remplaçant retenu. Noms calqués sur
// apps/web/src/components/icons.tsx pour minimiser la friction de portage,
// glyphe le plus proche choisi par famille.
const ICONS = {
  Dashboard: { set: "material", name: "dashboard" },
  Bell: { set: "material", name: "notifications-none" },
  TrendUp: { set: "material", name: "trending-up" },
  AlertTriangle: { set: "material", name: "warning-amber" },
  CheckCircle: { set: "material", name: "check-circle-outline" },
  PlayCircle: { set: "material", name: "play-circle-outline" },
  Clock: { set: "material", name: "schedule" },
  ArrowRight: { set: "material", name: "arrow-forward" },
  Users: { set: "material", name: "group" },
  Layers: { set: "material", name: "layers" },
  Calendar: { set: "material", name: "calendar-today" },
  ShieldCheck: { set: "community", name: "shield-check-outline" },
  Tasks: { set: "community", name: "clipboard-list-outline" },
  Video: { set: "material", name: "videocam" },
  ClipboardCheck: { set: "community", name: "clipboard-check-outline" },
  Lock: { set: "material", name: "lock-outline" },
  Mail: { set: "material", name: "mail-outline" },
  FileText: { set: "material", name: "description" },
  Menu: { set: "material", name: "menu" },
  X: { set: "material", name: "close" },
  Settings: { set: "material", name: "settings" },
  GraduationCap: { set: "community", name: "school-outline" },
  Target: { set: "material", name: "track-changes" },
} as const satisfies Record<string, IconSpec>;

export type IconKey = keyof typeof ICONS;

export function Icon({ name, size = 20, color }: { name: IconKey; size?: number; color?: string }) {
  const spec = ICONS[name];
  if (spec.set === "community") {
    return <MaterialCommunityIcons name={spec.name} size={size} color={color} />;
  }
  return <MaterialIcons name={spec.name} size={size} color={color} />;
}

// Wrappers nommés comme sur le web (IconCalendar, IconBell, ...) — même
// vocabulaire d'appel, glyphe MaterialIcons/MaterialCommunityIcons derrière.
function makeIcon(key: IconKey) {
  return function NamedIcon({ size, color }: { size?: number; color?: string }) {
    return <Icon name={key} size={size} color={color} />;
  };
}

export const IconDashboard = makeIcon("Dashboard");
export const IconBell = makeIcon("Bell");
export const IconTrendUp = makeIcon("TrendUp");
export const IconAlertTriangle = makeIcon("AlertTriangle");
export const IconCheckCircle = makeIcon("CheckCircle");
export const IconPlayCircle = makeIcon("PlayCircle");
export const IconClock = makeIcon("Clock");
export const IconArrowRight = makeIcon("ArrowRight");
export const IconUsers = makeIcon("Users");
export const IconLayers = makeIcon("Layers");
export const IconCalendar = makeIcon("Calendar");
export const IconShieldCheck = makeIcon("ShieldCheck");
export const IconTasks = makeIcon("Tasks");
export const IconVideo = makeIcon("Video");
export const IconClipboardCheck = makeIcon("ClipboardCheck");
export const IconLock = makeIcon("Lock");
export const IconMail = makeIcon("Mail");
export const IconFileText = makeIcon("FileText");
export const IconMenu = makeIcon("Menu");
export const IconX = makeIcon("X");
export const IconSettings = makeIcon("Settings");
export const IconGraduationCap = makeIcon("GraduationCap");
export const IconTarget = makeIcon("Target");
