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
    Wine,
    Croissant,
    Cookie,
    Salad
  } from "lucide-react";
  
  export type BadgeIconSemantic = 
    | "Lunch" 
    | "Breakfast"
    | "Afternoon"
    | "Dinner"
    | "Goal" 
    | "KcalActive" 
    | "Protein" 
    | "Carbo" 
    | "Fat" 
    | "Fiber" 
    | "ProcessFood" 
    | "Water" 
    | "Alcohol";
  
    export const BadgeIconColors = {
      Lunch: "#2BB0BB",
      Breakfast: "#2BB0BB",
      Afternoon: "#2BB0BB",
      Dinner: "#2BB0BB",
      Goal: "#9FA5BC",
      KcalActive: "#FF9D52",
      Protein: "#FF8A8A",
      Carbo: "#FFB74D",
      Fat: "#95A4FC",
      Fiber: "#3FA97A",
      ProcessFood: "#DB74ED",
      Water: "#73B0FF",
      Alcohol: "#CE6194",
    };
  
  interface BadgeIconSmProps {
  semantic: BadgeIconSemantic;
}

const mapping = {
    Lunch: { icon: Utensils, bg: BadgeIconColors.Lunch },
    Breakfast: { icon: Croissant, bg: BadgeIconColors.Breakfast },
    Afternoon: { icon: Cookie, bg: BadgeIconColors.Afternoon },
    Dinner: { icon: Salad, bg: BadgeIconColors.Dinner },
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
        width: "24px",
        height: "24px",
        borderRadius: "9999px",
        backgroundColor: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={16} color="#FFFFFF" strokeWidth={2.5} />
    </div>
  );
}

export default BadgeIconSm;
