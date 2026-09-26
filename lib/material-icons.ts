import {
  Armchair,
  Cake,
  CookingPot,
  Crown,
  CupSoda,
  Fan,
  Flower2,
  Frame,
  Gift,
  Heart,
  Lamp,
  LampFloor,
  Layers,
  Lightbulb,
  Music,
  Package,
  Sofa,
  Speaker,
  Sparkles,
  Star,
  Table,
  Tent,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from "lucide-react";

/** Catálogo de ícones que um material pode usar. A chave é guardada na BD. */
export const MATERIAL_ICONS = {
  Armchair: { icon: Armchair, label: "Cadeira / Poltrona" },
  Sofa: { icon: Sofa, label: "Sofá" },
  Table: { icon: Table, label: "Mesa" },
  Lamp: { icon: Lamp, label: "Candeeiro" },
  LampFloor: { icon: LampFloor, label: "Candeeiro de pé" },
  UtensilsCrossed: { icon: UtensilsCrossed, label: "Loiça / Talheres" },
  Wine: { icon: Wine, label: "Copos / Vinho" },
  CupSoda: { icon: CupSoda, label: "Bebidas" },
  CookingPot: { icon: CookingPot, label: "Cozinha" },
  Cake: { icon: Cake, label: "Bolo / Festa" },
  Flower2: { icon: Flower2, label: "Flores" },
  Gift: { icon: Gift, label: "Presentes" },
  Crown: { icon: Crown, label: "Luxo" },
  Star: { icon: Star, label: "Destaque" },
  Heart: { icon: Heart, label: "Casamento" },
  Sparkles: { icon: Sparkles, label: "Brilho" },
  Music: { icon: Music, label: "Música" },
  Speaker: { icon: Speaker, label: "Som" },
  Lightbulb: { icon: Lightbulb, label: "Iluminação" },
  Tent: { icon: Tent, label: "Tenda" },
  Frame: { icon: Frame, label: "Painel / Moldura" },
  Layers: { icon: Layers, label: "Têxteis" },
  Fan: { icon: Fan, label: "Ventilação" },
  Package: { icon: Package, label: "Geral" },
} as const satisfies Record<string, { icon: LucideIcon; label: string }>;

export type MaterialIconKey = keyof typeof MATERIAL_ICONS;
export const MATERIAL_ICON_KEYS = Object.keys(MATERIAL_ICONS);

export function materialIcon(key: string | null | undefined): LucideIcon {
  if (key && key in MATERIAL_ICONS) return MATERIAL_ICONS[key as MaterialIconKey].icon;
  return Package;
}
