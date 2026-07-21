import {
  Utensils, Car, ShoppingCart, Gamepad2, HeartPulse, GraduationCap,
  Home as HomeIcon, Briefcase, Laptop, TrendingUp, Wallet, Tag,
  Building2, Banknote, Plane, Coffee, Gift, Music, Film, Book,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  "shopping-cart": ShoppingCart,
  "gamepad-2": Gamepad2,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  home: HomeIcon,
  briefcase: Briefcase,
  laptop: Laptop,
  "trending-up": TrendingUp,
  wallet: Wallet,
  tag: Tag,
  bank: Building2,
  cash: Banknote,
  plane: Plane,
  coffee: Coffee,
  gift: Gift,
  music: Music,
  film: Film,
  book: Book,
};

export const ICON_OPTIONS = Object.keys(ICONS);
export const COLOR_OPTIONS = [
  "#2563EB", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6",
  "#EC4899", "#0EA5E9", "#F97316", "#111827", "#14B8A6",
];

export function getIcon(name: string | null | undefined): LucideIcon {
  return ICONS[name ?? "tag"] ?? Tag;
}
