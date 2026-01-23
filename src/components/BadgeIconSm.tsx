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

export const BadgeIconColors = {
  Lunch: "#2BB0BB",
  Goal: "#9FA5BC",
  KcalActive: "#FF9D52",
  Protein: "#FF9191",
  Carbo: "#FFBC58",
  Fat: "#9D9EFF",
  Fiber: "#3FA97A",
  ProcessFood: "#DB74ED",
  Water: "#73B0FF",
  Alcohol: "#CE6194",
};

const mapping = {
  Lunch: { icon: Utensils, bg: BadgeIconColors.Lunch },
  Goal: { icon: Flag, bg: BadgeIconColors.Goal },
  KcalActive: { icon: Footprints, bg: BadgeIconColors.KcalActive },
  Protein: { icon: Beef, bg: BadgeIconColors.Protein },
  Carbo: { icon: Wheat, bg: BadgeIconColors.Carbo },
  Fat: { icon: Nut, bg: BadgeIconColors.Fat },
  Fiber: { icon: LeafyGreen, bg: BadgeIconColors.Fiber },
  ProcessFood: { icon: Hamburger, bg: BadgeIconColors.ProcessFood },
  Water: { icon: GlassWater, bg: BadgeIconColors.Water },
  Alcohol: { icon: Wine, bg: BadgeIconColors.Alcohol },
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
