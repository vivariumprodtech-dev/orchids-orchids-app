import React from "react";
import { 
  Utensils, 
  Flag, 
  Footprints, 
  Beef, 
  Wheat, 
  Nut, 
  LeafyGreen, 
  Hamburger, 
  GlassWater, 
  Wine 
} from "lucide-react";

export type BadgeIconSemantic = 
  | "Lunch" 
  | "Goal" 
  | "KcalActive" 
  | "Protein" 
  | "Carbo" 
  | "Fat" 
  | "Fiber" 
  | "ProcessFood" 
  | "Water" 
  | "Alcohol";

interface BadgeIconSmProps {
  semantic: BadgeIconSemantic;
}

const mapping = {
  Lunch: { icon: Utensils, bg: "#2BB0BB" },
  Goal: { icon: Flag, bg: "#9FA5BC" },
  KcalActive: { icon: Footprints, bg: "#FF9D52" },
  Protein: { icon: Beef, bg: "#FF9191" },
  Carbo: { icon: Wheat, bg: "#FFBC58" },
  Fat: { icon: Nut, bg: "#9D9EFF" },
  Fiber: { icon: LeafyGreen, bg: "#3FA97A" },
  ProcessFood: { icon: Hamburger, bg: "#DB74ED" },
  Water: { icon: GlassWater, bg: "#73B0FF" },
  Alcohol: { icon: Wine, bg: "#CE6194" },
};

export function BadgeIconSm({ semantic }: BadgeIconSmProps) {
  const { icon: Icon, bg } = mapping[semantic] || mapping.Goal;

  return (
    <div
      style={{
        width: "20px",
        height: "20px",
        borderRadius: "9999px",
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={12} color="#FFFFFF" strokeWidth={2.5} />
    </div>
  );
}

export default BadgeIconSm;
