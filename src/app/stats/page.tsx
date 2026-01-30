"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import HeaderNav from "@/components/HeaderNav";
import BadgeIconSm, { BadgeIconColors, BadgeIconSemantic } from "@/components/BadgeIconSm";
import BalanceChart from "@/components/BalanceChart";
import CaloricConsumeChart from "@/components/CaloricConsumeChart";
import ActiveKcalChart from "@/components/ActiveKcalChart";
import MacrosChart from "@/components/MacrosChart";
import ProcessedFoodChart from "@/components/ProcessedFoodChart";
import WaterChart from "@/components/WaterChart";
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";
import { ChevronDown, ChevronUp, MoveRight, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FoodEntry {
  name: string;
  grams: number;
  calories: number;
  pro: number;
  carb: number;
  fat: number;
  fiber: number;
  alcohol: number;
  is_processed?: boolean;
  meal?: string;
  time?: string;
}

interface MealEntry {
  meal: string;
  foods: FoodEntry[];
  totalCalories: number;
}

interface StatsData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  water: number;
    activeCalories: number;
    bmr?: number;
    processedPercentage?: number;
    foods: FoodEntry[];
    meals?: MealEntry[];
  alcohol?: {
    grams: number;
    calories: number;
  };
  targets?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    water: number;
    deficit: number;
  };
}

const INITIAL_FOODS_DISPLAY = 5;

function StatusBadge({ 
  text, 
  connotation 
}: { 
  text: string; 
  connotation: "good" | "warning" | "danger" | "on-track" | "great" | "neutral"
}) {
  const styles = {
    good: {
      bg: "#F5FAF8",
      color: "#199761",
      icon: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 3L4.5 8.5L2 6" stroke="#199761" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    great: {
      bg: "#F5FAF8",
      color: "#199761",
      icon: null
    },
    warning: {
      bg: "#FFF9D6",
      color: "#A56D00",
      icon: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9V3M6 9L3 6M6 9L9 6" stroke="#A56D00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    danger: {
      bg: "#FEF5F7",
      color: "#C10127",
      icon: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3V9M6 3L3 6M6 3L9 6" stroke="#C10127" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    "on-track": {
      bg: "#F9F9FB",
      color: "#3B4361",
      icon: null
    },
    neutral: {
      bg: "#F2F2F2",
      color: "#666666",
      icon: null
    }
  };

  const style = styles[connotation];

    return (
      <div 
        className="text-caption-custom"
        style={{
          display: "inline-flex",
          height: "1.25rem",
          padding: "0 0.5rem",
          alignItems: "center",
          gap: "0.25rem",
          borderRadius: "6.25rem",
          background: style.bg,
          color: style.color,
          fontFamily: "var(--font-dm-sans)",
          fontWeight: "600",
          lineHeight: "1",
          width: "fit-content",
          whiteSpace: "nowrap"
        }}
      >
      {style.icon}
      <span>{text}</span>
    </div>
  );
}

function MissingAlert() {
  return (
    <div 
      style={{
        background: "#FEF5F7",
        borderRadius: "1rem",
        padding: "0.75rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "1rem"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.125rem" }}>
          <div 
            className="text-caption-custom"
            style={{ 
              color: "#C10127", 
              fontWeight: "600", 
              display: "flex",
              alignItems: "center",
              gap: "0.25rem"
            }}
          >
            🚨 Something might be missing
          </div>
          <div 
            className="text-caption-custom"
            style={{ 
              color: "#C10127", 
              fontWeight: "400",
              lineHeight: "1.4"
            }}
          >
            Tell me in the chat if there are missing meals to adjust this day.
          </div>

      </div>
    </div>
  );
}

function ShadcnRadialProgress({
  value,
  max,
  size = 120,
  color = "#4ECDC4",
  innerRadius = "80%",
  outerRadius = "100%",
  children,
}: {
  value: number;
  max: number;
  size?: number;
  color?: string;
  innerRadius?: string;
  outerRadius?: string;
  children?: React.ReactNode;
}) {
  const chartData = [
    { name: "progress", value: value, fill: color },
  ];

  const chartConfig = {
    progress: {
      label: "Progress",
      color: color,
    },
  } satisfies ChartConfig;

  return (
    <div className="relative p-0" style={{ width: size, height: size }}>
      <ChartContainer
        config={chartConfig}
        className="aspect-square h-full w-full p-0"
      >
        <RadialBarChart
          data={chartData}
          startAngle={90}
          endAngle={-270}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          cx="50%"
          cy="50%"
        >
          <PolarAngleAxis
            type="number"
            domain={[0, max]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: "#E5E7EB" }}
            dataKey="value"
            cornerRadius={10}
            fill="var(--color-progress)"
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-0">
        {children}
      </div>
    </div>
  );
}

function getCalorieBadge(consumed: number, target: number, isToday: boolean) {
  if (target === 0) return { text: "No target", connotation: "neutral" as const };
  
  const tolerance = target * 0.03;
  const isNear = consumed >= target - tolerance && consumed <= target + tolerance;
  
  if (!isToday) {
    if (consumed < target * 0.5) return { text: "missing", connotation: "danger" as const, showAlert: true };
    if (consumed > target + tolerance) return { text: "Calories over target", connotation: "danger" as const };
    if (isNear) return { text: "Calories on target 🎯", connotation: "good" as const };
    if (consumed < target - tolerance) return { text: "Calories low", connotation: "warning" as const };
  } else {
    if (consumed > target + tolerance) return { text: "Calories over target", connotation: "danger" as const };
    if (isNear) return { text: "Calories on target 🎯", connotation: "good" as const };
    if (consumed < target - tolerance) return { text: "Calories on track", connotation: "on-track" as const };
  }
  return { text: "Calories on track", connotation: "on-track" as const };
}

function getMacroBadge(type: "protein" | "carbs" | "fat" | "fiber", consumed: number, target: number, isToday: boolean) {
  if (target === 0) return { text: "No target", connotation: "neutral" as const };

  if (isToday && consumed < target) {
    const overThresholds = {
      protein: 1.5,
      fiber: 1.5,
      fat: 1.03,
      carbs: 1.03
    };
    if (consumed > target * overThresholds[type]) {
      return { text: "over", connotation: "danger" as const };
    }
    return { text: "on track", connotation: "on-track" as const };
  }

  const rules = {
    protein: { over: 1.5, low: 0.03, near: 0.03 },
    fiber: { over: 1.5, low: 0.06, near: 0.06 },
    fat: { over: 1.03, low: 0.1, near: 0.1 },
    carbs: { over: 1.03, low: 0.1, near: 0.1 }
  };

  const r = rules[type];
  if (consumed > target * r.over) return { text: "over", connotation: "danger" as const };
  
  const isNear = consumed >= target * (1 - r.near) && consumed <= target * (1 + r.near);
  if (isNear) return { text: "good", connotation: "good" as const };
  
  if (consumed < target * (1 - r.low)) return { text: "low", connotation: "warning" as const };
  
  return { text: "good", connotation: "good" as const };
}

function getProcessedFoodBadge(consumed: number, target: number) {
  if (consumed <= 25) return { text: "Great! 🏆", connotation: "great" as const };
  if (consumed <= 50) return { text: "Good", connotation: "good" as const };
  return { text: "Over", connotation: "danger" as const };
}

function getWaterBadge(consumed: number, target: number) {
  if (target === 0) return { text: "No target", connotation: "neutral" as const };
  if (consumed > target * 1.5) return { text: "Over", connotation: "danger" as const };
  if (consumed < target * 0.1) return { text: "Low", connotation: "warning" as const };
  return { text: "Good", connotation: "good" as const };
}

function getAlcoholBadge(alcoholKcal: number, totalTarget: number) {
  if (alcoholKcal === 0) return { text: "Good", connotation: "good" as const };
  const limit = totalTarget * 0.06;
  if (alcoholKcal < limit) return { text: "Within limit", connotation: "on-track" as const };
  return { text: "Over limit", connotation: "danger" as const };
}

function MacroCard({
  icon,
  iconBg,
  name,
  value,
  target,
  color,
  isToday,
  type,
  centered = false,
}: {
  icon: React.ReactNode;
  iconBg?: string;
  name: string;
  value: number;
  target: number;
  color: string;
  isToday: boolean;
  type?: "protein" | "carbs" | "fat" | "fiber" | "processed" | "water" | "alcohol";
  centered?: boolean;
}) {
    const left = Math.round(target - value);
    let badge: { text: string; connotation: "good" | "warning" | "danger" | "on-track" | "great" | "neutral" } = { text: "good", connotation: "good" };
    let circleText = value > target ? `+${Math.abs(left)}g` : `${Math.max(0, left)}g`;
    let circleLabel = value > target ? "over" : "left";
    let helpText = "";

    if (type === "processed") {
      badge = getProcessedFoodBadge(value, target);
      const diff = target - value;
      const displayVal = Math.round(Math.abs(diff));
      circleText = value > target ? `+${displayVal}%` : `${displayVal}%`;
      circleLabel = value > target ? "over" : "left";
      helpText = "(Base limit 50% of total)";
      } else if (type === "water") {
        badge = getWaterBadge(value, target);
        const diff = target - value;
        const displayVal = Math.round(Math.abs(diff) * 10) / 10;
        circleText = value > target ? `+${displayVal}L` : `${displayVal}L`;
        circleLabel = value > target ? "over" : "left";
        helpText = "(Count in liters)";

    } else if (type === "alcohol") {
      badge = getAlcoholBadge(value * 7, target * 7);
      const diff = target - value;
      const displayVal = Math.round(Math.abs(diff));
      circleText = value > target ? `+${displayVal}g` : `${displayVal}g`;
      circleLabel = value > target ? "over" : "left";
      helpText = "(Based on your weight)";
    } else if (type === "protein" || type === "carbs" || type === "fat" || type === "fiber") {
      badge = getMacroBadge(type, value, target, isToday);
    }

    const isSpecial = type === "water" || type === "processed" || type === "alcohol";

      return (
        <div className={`relative rounded-2xl bg-white pl-4 ${type === "water" ? "py-3" : "py-4"} pr-2 shadow-sm`}>
          <div className={`flex ${centered ? "items-center" : "items-start"} justify-between`}>
            <div className={`flex-1 ${(!centered && !isSpecial) ? "pr-[84px]" : ""}`}>
            {isSpecial ? (
              <div className="flex flex-col gap-[8px]">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center justify-center">
                    {icon}
                  </div>
                  <div className="flex items-baseline gap-1">
                      {type === "alcohol" ? (
                        <>
                          <span className="text-subtitle-1-custom">{Math.round(value)}g</span>
                          <span className="text-body-sm-custom">→ <span className="text-subtitle-1-custom">{Math.round(value * 7)}</span> Kcal</span>
                          <span className="ml-0.5 text-body-sm-custom">{name}</span>
                        </>
                      ) : (
                        <>
                            <span className="text-subtitle-1-custom">
                              {type === "water" ? value.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : Math.round(value)}
                            </span>
                              <span className="text-body-sm-custom">
                                /{type === "processed" ? "100" : Math.round(target)}{type === "water" ? "" : type === "processed" ? "%" : "g"} {name}
                              </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-helper-custom">{helpText}</span>
                      <StatusBadge text={badge.text} connotation={badge.connotation} />
                    </div>
                  </div>
                ) : (
                  <>
                      <div className="mb-1 flex items-center gap-1">
                        {iconBg ? (
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
                            style={{ background: iconBg }}
                          >
                            {icon}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            {icon}
                          </div>
                        )}
                        <span className="text-body-md-custom">{name}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-subtitle-1-custom">{Math.round(value)}</span>
                        <span className="text-body-sm-custom">/{Math.round(target)}g</span>
                      </div>
                    <StatusBadge text={badge.text} connotation={badge.connotation} />
                  </>
                )}
          </div>
          {(type === "water" || (!isSpecial && !centered)) && (
            <div className={centered || type === "water" ? "flex-shrink-0" : "absolute top-[16px] right-2"}>
                <ShadcnRadialProgress 
                  value={value} 
                  max={target} 
                    size={(type === "protein" || type === "carbs" || type === "fat" || type === "fiber" || type === "water") ? 77 : 72} 
                    color={color}
                    innerRadius={(type === "protein" || type === "carbs" || type === "fat" || type === "fiber" || type === "water") ? "78.2%" : "80%"}
                >
                      <div
                        className="text-caption-custom font-bold"
                        style={{ 
                          color: badge.text.toLowerCase().includes("over") ? "#C10127" : "#262C44" 
                        }}
                      >
                        {circleText}
                      </div>
                      {circleLabel && <div className="text-helper-custom">{circleLabel}</div>}

              </ShadcnRadialProgress>
            </div>
          )}
        </div>
      </div>
    );
  }

  function MealMomentCard({
    meal,
    isOpen,
    onToggle
  }: {
    meal: MealEntry;
    isOpen: boolean;
    onToggle: () => void;
  }) {
    const mealNameDisplayMap: Record<string, string> = {
      "breakfast": "Breakfast",
      "lunch": "Lunch",
      "dinner": "Dinner",
      "pre_breakfast": "Pre-breakfast",
      "morning": "Morning Snack",
      "afternoon": "Afternoon Snack",
      "night": "Night Snack",
      "snack": "Snack",
      "other": "Other"
    };

    const mealNameIconMap: Record<string, BadgeIconSemantic> = {
      "breakfast": "Breakfast",
      "lunch": "Lunch",
      "dinner": "Dinner",
      "pre_breakfast": "Breakfast",
      "morning": "Morning",
      "afternoon": "Afternoon",
      "night": "Night",
      "snack": "Afternoon",
      "other": "Lunch"
    };

    const semantic = mealNameIconMap[meal.meal] || "Lunch";
    const displayName = mealNameDisplayMap[meal.meal] || meal.meal;

  
    const totals = meal.foods.reduce((acc, food) => ({
      pro: acc.pro + food.pro,
      fiber: acc.fiber + food.fiber,
      carb: acc.carb + food.carb,
      fat: acc.fat + food.fat,
      alcohol: acc.alcohol + (food.alcohol || 0)
    }), { pro: 0, fiber: 0, carb: 0, fat: 0, alcohol: 0 });

    return (
      <div className="relative rounded-2xl bg-white p-4 shadow-sm cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BadgeIconSm semantic={semantic} />
              <span className="text-subtitle-1-custom font-bold">{displayName}</span>
              <MoveRight size={16} className="text-body-sm-custom" />
              <span className="text-subtitle-1-custom font-bold">{Math.round(meal.totalCalories)} <span className="font-normal text-body-sm-custom">Kcal</span></span>
            </div>
            <div className="flex flex-wrap gap-x-4">
              <div className="flex items-center gap-1 text-helper-custom">
                <BadgeIconSm semantic="Protein" />
                <span>{Math.round(totals.pro)}g</span>
              </div>
              <div className="flex items-center gap-1 text-helper-custom">
                <BadgeIconSm semantic="Fiber" />
                <span>{Math.round(totals.fiber)}g</span>
              </div>
              <div className="flex items-center gap-1 text-helper-custom">
                <BadgeIconSm semantic="Carbo" />
                <span>{Math.round(totals.carb)}g</span>
              </div>
              <div className="flex items-center gap-1 text-helper-custom">
                <BadgeIconSm semantic="Fat" />
                <span>{Math.round(totals.fat)}g</span>
              </div>
              {totals.alcohol > 0 && (
                <div className="flex items-center gap-1 text-helper-custom">
                  <BadgeIconSm semantic="Alcohol" />
                  <span>{Math.round(totals.alcohol)}g</span>
                </div>
              )}
            </div>
          </div>
        <div className="text-body-sm-custom">
          {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>
    </div>
    );
  }

    function KcalAveragesCard({ 
      consumeAvg, 
      cumulativeBalance, 
      dailyAvg,
      subtitle
    }: { 
      consumeAvg: number; 
      cumulativeBalance: number; 
      dailyAvg: number;
      subtitle: string;
    }) {
      return (
        <div className="rounded-2xl bg-white pl-4 py-4 pr-2 shadow-sm">
          <div className="mb-4">
            <h2 className="text-title-custom font-bold text-[#262C44]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Kcal averages</h2>
            {subtitle && (
              <p className="text-body-sm-custom mt-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: "#757FA0" }}>{subtitle}</p>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeIconSm semantic="Lunch" />
                <span className="text-body-md-custom text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Consume average</span>
              </div>
              <div className="flex items-baseline gap-1 mr-2">
                <span className="text-subtitle-1-custom font-bold text-[#262C44]">{consumeAvg.toLocaleString("it-IT")}</span>
                <span className="text-body-sm-custom text-[#5A658D]">kcal</span>
              </div>
            </div>
    
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: "20px", height: "20px", borderRadius: "9999px", backgroundColor: "#6ACFD5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={12} color="#FFFFFF" strokeWidth={2.5} />
                </div>
                <span className="text-body-md-custom text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Cumulative balance</span>
              </div>
              <div className="flex items-baseline gap-1 mr-2">
                <span className="text-subtitle-1-custom font-bold text-[#262C44]">{cumulativeBalance > 0 ? "+" : ""}{cumulativeBalance.toLocaleString("it-IT")}</span>
                <span className="text-body-sm-custom text-[#5A658D]">kcal</span>
              </div>
            </div>
    
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: "20px", height: "20px", borderRadius: "9999px", backgroundColor: "#90E0E4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={12} color="#FFFFFF" strokeWidth={2.5} />
                </div>
                <span className="text-body-md-custom text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Daily average</span>
              </div>
              <div className="flex items-baseline gap-1 mr-2">
                <span className="text-subtitle-1-custom font-bold text-[#262C44]">{dailyAvg > 0 ? "+" : ""}{dailyAvg.toLocaleString("it-IT")}</span>
                <span className="text-body-sm-custom text-[#5A658D]">kcal</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    function MacroStatusCircle({ average, target, type }: { average: number; target: number; type: "protein" | "carbs" | "fat" | "fiber" }) {
      const tolerance = 0.03;
      const isNear = average >= target * (1 - tolerance) && average <= target * (1 + tolerance);
      
      let connotation: "good" | "warning" | "danger" = "good";
      
      if (isNear) {
        connotation = "good";
      } else if (average < target) {
        connotation = "warning"; // Yellow down
      } else {
        connotation = "danger"; // Red up
      }

      const styles = {
        good: {
          bg: "#F5FAF8",
          color: "#199761",
          icon: (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L4.5 8.5L2 6" stroke="#199761" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        },
        warning: {
          bg: "#FFF9D6",
          color: "#A56D00",
          icon: (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9V3M6 9L3 6M6 9L9 6" stroke="#A56D00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        },
        danger: {
          bg: "#FEF5F7",
          color: "#C10127",
          icon: (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3V9M6 3L3 6M6 3L9 6" stroke="#C10127" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )
        }
      };

      const style = styles[connotation];

      return (
        <div 
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "9999px",
            backgroundColor: style.bg,
            color: style.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          {style.icon}
        </div>
      );
    }

    function MacrosAveragesCard({ 
      proteinAvg, 
      carbsAvg, 
      fatsAvg, 
      fiberAvg,
      targets,
      subtitle
    }: { 
      proteinAvg: number; 
      carbsAvg: number; 
      fatsAvg: number; 
      fiberAvg: number;
      targets: any;
      subtitle: string;
    }) {
      const rows = [
        { name: "Protein", avg: proteinAvg, goal: targets.protein, icon: "Protein", type: "protein" as const },
        { name: "Fiber", avg: fiberAvg, goal: targets.fiber, icon: "Fiber", type: "fiber" as const },
        { name: "Carbs", avg: carbsAvg, goal: targets.carbs, icon: "Carbo", type: "carbs" as const },
        { name: "Fat", avg: fatsAvg, goal: targets.fats, icon: "Fat", type: "fat" as const },
      ];

      return (
        <div className="rounded-2xl bg-white pl-4 py-4 pr-2 shadow-sm">
          <div className="mb-4">
            <h2 className="text-title-custom font-bold text-[#262C44]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Macros averages</h2>
            {subtitle && (
              <p className="text-body-sm-custom mt-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif", color: "#757FA0" }}>{subtitle}</p>
            )}
          </div>

          <div className="mb-2 flex justify-end gap-8 pr-12">
            <span className="text-[12px] italic text-[#757FA0]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>day goal</span>
            <span className="text-[12px] italic text-[#757FA0]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>average</span>
          </div>
          
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeIconSm semantic={row.icon as any} />
                  <span className="text-body-md-custom text-[#5A658D]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>{row.name}</span>
                </div>
                <div className="flex items-center gap-6 mr-2">
                  <div className="w-16 text-right">
                    <span className="text-subtitle-1-custom font-medium text-[#5A658D]">{Math.round(row.goal)}g</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-subtitle-1-custom font-bold text-[#262C44]">{Math.round(row.avg)}g</span>
                  </div>
                  <MacroStatusCircle average={row.avg} target={row.goal} type={row.type} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }


    const StatsContent = () => {
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
    const [openMeals, setOpenMeals] = useState<Record<string, boolean>>({});
      const [activeView, setActiveView] = useState<"day" | "progress" | "profile">("day");
      const [progressTab, setProgressTab] = useState<"kcal" | "macros">("kcal");
      const [timeRange, setTimeRange] = useState<"7d" | "1m" | "3m" | "6m">("7d");
      const [progressData, setProgressData] = useState<any[]>([]);

      const toggleMeal = (mealName: string) => {
        setOpenMeals(prev => ({ ...prev, [mealName]: !prev[mealName] }));
      };

      const handleViewChange = (view: "day" | "progress" | "profile") => {
        if (view === "progress") {
          setProgressTab("kcal");
          setTimeRange("7d");
        }
        setActiveView(view);
      };

      const [data, setData] = useState<StatsData>({
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        water: 0,
        activeCalories: 0,
        foods: [],
        alcohol: { grams: 0, calories: 0 },
          targets: {
            calories: 1600,
            protein: 96,
            carbs: 160,
            fats: 64,
            fiber: 30,
            water: 0,
            deficit: 0
          }
      });


  useEffect(() => {
    setOpenMeals({});
    
    const fetchData = async () => {
        if (userId === "ugo_demo" && selectedDate) {
          // Generate deterministic pseudo-random data based on the date
          const dateSeed = selectedDate.split("-").reduce((acc, part) => acc + parseInt(part), 0);
          const pseudoRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
          };

          const r = (offset: number) => pseudoRandom(dateSeed + offset);

          // Fetch Ugo's profile from DB for real targets
          const { data: ugoProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('telegram_id', 'ugo_demo')
            .maybeSingle();

          const ugoData: StatsData = {
            calories: 1800 + Math.floor(r(1) * 400),
            protein: 100 + Math.floor(r(2) * 20),
            carbs: 180 + Math.floor(r(3) * 40),
            fats: 60 + Math.floor(r(4) * 15),
            fiber: 25 + Math.floor(r(5) * 10),
            water: 1800 + Math.floor(r(6) * 1000),
            activeCalories: 200 + Math.floor(r(7) * 300),
            foods: [],
            meals: [
              {
                meal: "breakfast",
                totalCalories: 450,
                foods: [
                  { name: "Skyr Bianco", grams: 150, calories: 95, pro: 16, carb: 6, fat: 0, fiber: 0, time: "08:30" },
                  { name: "Mandorle", grams: 30, calories: 180, pro: 6, carb: 6, fat: 15, fiber: 3, time: "08:35" },
                  { name: "Pane Integrale", grams: 50, calories: 175, pro: 6, carb: 35, fat: 1, fiber: 4, time: "08:40" },
                ]
              },
              {
                meal: "lunch",
                totalCalories: 650,
                foods: [
                  { name: "Pasta al Pomodoro", grams: 100, calories: 350, pro: 12, carb: 70, fat: 2, fiber: 3, time: "13:15" },
                  { name: "Insalata Mista", grams: 200, calories: 50, pro: 2, carb: 5, fat: 0, fiber: 4, time: "13:20" },
                  { name: "Petto di Pollo", grams: 150, calories: 250, pro: 45, carb: 0, fat: 5, fiber: 0, time: "13:25" },
                ]
              },
              {
                meal: "snack",
                totalCalories: 200,
                foods: [
                  { name: "Mela", grams: 200, calories: 104, pro: 1, carb: 28, fat: 0, fiber: 5, time: "16:45" },
                  { name: "Yogurt Greco", grams: 150, calories: 96, pro: 15, carb: 6, fat: 0, fiber: 0, time: "17:00" },
                ]
              },
              {
                meal: "dinner",
                totalCalories: 500,
                foods: [
                  { name: "Salmone", grams: 150, calories: 310, pro: 30, carb: 0, fat: 20, fiber: 0, time: "20:10" },
                  { name: "Verdure Grigliate", grams: 200, calories: 80, pro: 4, carb: 12, fat: 2, fiber: 6, time: "20:15" },
                  { name: "Pane Integrale", grams: 30, calories: 110, pro: 4, carb: 22, fat: 1, fiber: 3, time: "20:20" },
                ]
              }
            ],
            alcohol: { grams: r(8) > 0.7 ? 15 : 0, calories: r(8) > 0.7 ? 105 : 0 },
            targets: {
              calories: ugoProfile?.target_calories || 1600,
              protein: ugoProfile?.target_protein || 96,
              carbs: ugoProfile?.target_carbs || 160,
              fats: ugoProfile?.target_fats || 64,
              fiber: ugoProfile?.target_fiber || 30,
              water: ugoProfile?.target_water || 2,
              deficit: 0
            }
          };

          // Flatten foods for the summary calculations if needed
          ugoData.foods = ugoData.meals?.flatMap(m => m.foods) || [];
          setData(ugoData);
          return;
        }

      if (!userId || !selectedDate) {
        loadFromParams();
        return;
      }

            try {
            const [{ data: log, error }, { data: profile }, { data: ugoProfile }] = await Promise.all([
              supabase
                .from('daily_logs')
                .select('*, food_entries(*)')
                .eq('user_id', userId)
                .eq('date', selectedDate)
                .order('created_at', { foreignTable: 'food_entries', ascending: true })
                .maybeSingle(),
              supabase
                .from('profiles')
                .select('*')
                .eq('telegram_id', userId)
                .maybeSingle(),
              supabase
                .from('profiles')
                .select('*')
                .eq('telegram_id', 'ugo_demo')
                .maybeSingle()
            ]);

              if (error) {
                console.error("Error fetching data:", error);
                loadFromParams();
                return;
              }

                      if (log) {
                        const rawFoods = log.food_entries || [];
                        const foods = rawFoods
                          .filter((f: any) => {
                            // Filter out water-only entries from the food log summary
                            const isWater = (f.calories || 0) === 0 && (f.protein || 0) === 0 && (f.carbs || 0) === 0 && (f.fats || 0) === 0;
                            const hasWaterName = f.name?.toLowerCase().includes("acqua") || f.name?.toLowerCase().includes("water");
                            return !(isWater && hasWaterName);
                          })
                          .map((f: any) => ({
                            name: f.name,
                            grams: f.grams,
                            calories: f.calories,
                            pro: f.protein,
                            carb: f.carbs,
                            fat: f.fats,
                            fiber: f.fiber,
                            meal: f.meal,
                            alcohol: f.alcohol || 0,
                            is_processed: f.is_processed || false,
                            time: f.intake_time || (f.created_at ? new Date(f.created_at).toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' }) : undefined)
                          })) || [];

                      // Calculate totals from foods
                      const foodTotals = foods.reduce((acc: any, f: any) => ({
                        calories: acc.calories + (f.calories || 0),
                        protein: acc.protein + (f.pro || 0),
                        carbs: acc.carbs + (f.carb || 0),
                        fats: acc.fats + (f.fat || 0),
                        fiber: acc.fiber + (f.fiber || 0),
                        alcohol: acc.alcohol + (f.alcohol || 0),
                        processedCalories: acc.processedCalories + (f.is_processed ? f.calories : 0)
                      }), { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, alcohol: 0, processedCalories: 0 });

                      const processedPercentage = foodTotals.calories > 0 
                        ? (foodTotals.processedCalories / foodTotals.calories) * 100 
                        : 0;

                    // Group by meal with time-based snack categorization
                    const mealsMap: Record<string, MealEntry> = {};
                    
                    const getSnackKey = (time?: string) => {
                      if (!time) return "afternoon"; // Default
                      // Clean time: remove non-numeric/colon characters (e.g., "07:10," -> "07:10")
                      const cleanTime = time.replace(/[^\d:]/g, '');
                      const [hours, minutes] = cleanTime.split(':').map(Number);
                      
                      if (isNaN(hours)) return "afternoon"; // Fallback for invalid formats
                      
                      const totalMinutes = hours * 60 + (minutes || 0);
                      
                      if (totalMinutes < 9 * 60) return "pre_breakfast"; // Before 9:00
                      if (totalMinutes < 12 * 60 + 30) return "morning"; // 9:00 - 12:30
                      if (totalMinutes < 19 * 60 + 30) return "afternoon"; // 12:30 - 19:30
                      return "night"; // After 19:30
                    };


                  foods.forEach((f: any) => {
                    let m = (f.meal || "snack").toLowerCase().trim();
                    
                    // Normalize if still in Italian from DB
                    if (m === "colazione") m = "breakfast";
                    else if (m === "pranzo") m = "lunch";
                    else if (m === "cena") m = "dinner";
                    else if (m === "spuntino" || m === "snack") {
                      m = getSnackKey(f.time);
                    }

                    const finalMealKey = m;

                    if (!mealsMap[finalMealKey]) {
                      mealsMap[finalMealKey] = { meal: finalMealKey, foods: [], totalCalories: 0 };
                    }
                    mealsMap[finalMealKey].foods.push({ ...f, meal: finalMealKey });
                    mealsMap[finalMealKey].totalCalories += f.calories;
                  });
                
                // Order meals
                const mealOrder = [
                  "pre_breakfast", 
                  "breakfast", 
                  "morning", 
                  "lunch", 
                  "afternoon", 
                  "dinner", 
                  "night", 
                  "other"
                ];

              const meals = Object.keys(mealsMap)
                .sort((a, b) => {
                  const indexA = mealOrder.indexOf(a);
                  const indexB = mealOrder.indexOf(b);
                  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                })
                .map(name => mealsMap[name]);

                  const finalCalories = foodTotals.calories > 0 ? foodTotals.calories : (log.calories || 0);
                  const finalAlcoholGrams = foodTotals.alcohol > 0 ? foodTotals.alcohol : (log.alcohol || 0);

                      setData({
                        water: log.water || 0,
                        calories: Math.round(finalCalories),
                        protein: Math.round(foodTotals.protein || log.protein || 0),
                        carbs: Math.round(foodTotals.carbs || log.carbs || 0),
                        fats: Math.round(foodTotals.fats || log.fats || 0),
                        fiber: Math.round(foodTotals.fiber || log.fiber || 0),
                        foods: foods,
                        meals: meals.length > 0 ? meals : undefined,
                        activeCalories: Math.round(log.active_calories || 0),
                        bmr: log.bmr || profile?.bmr || ugoProfile?.bmr || undefined,
                        processedPercentage: processedPercentage,
                        alcohol: { 
                          grams: Math.round(finalAlcoholGrams), 
                          calories: Math.round(finalAlcoholGrams * 7)
                          },
                        targets: {
                          calories: log.target_calories || profile?.target_calories || ugoProfile?.target_calories || 1600,
                          protein: log.target_protein || profile?.target_protein || ugoProfile?.target_protein || 96,
                          carbs: log.target_carbs || profile?.target_carbs || ugoProfile?.target_carbs || 160,
                          fats: log.target_fats || profile?.target_fats || ugoProfile?.target_fats || 64,
                          fiber: log.target_fiber || profile?.target_fiber || ugoProfile?.target_fiber || 30,
                            water: (() => {
                              const raw = log.target_water ?? profile?.target_water ?? (profile ? 0 : (ugoProfile?.target_water || 0));
                              return (raw && raw > 10) ? raw / 1000 : (raw || 0);
                            })(),
                          deficit: log.target_deficit || profile?.target_deficit || 0
                        }
                      });

                return;
              } else {
                const targets = {
                  calories: profile?.target_calories || ugoProfile?.target_calories || 1600,
                  protein: profile?.target_protein || ugoProfile?.target_protein || 96,
                  carbs: profile?.target_carbs || ugoProfile?.target_carbs || 160,
                  fats: profile?.target_fats || ugoProfile?.target_fats || 64,
                  fiber: profile?.target_fiber || ugoProfile?.target_fiber || 30,
                    water: (() => {
                      const raw = profile?.target_water ?? (profile ? 0 : (ugoProfile?.target_water || 0));
                      return (raw && raw > 10) ? raw / 1000 : (raw || 0);
                    })(),
                  deficit: profile?.target_deficit || 0
                };

              if (selectedDate === new Date().toISOString().split('T')[0]) {
                loadFromParams(targets);
              } else {
                setData({
                  calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0,
                  water: 0, activeCalories: 0, foods: [],
                  alcohol: { grams: 0, calories: 0 },
                  targets
                });
              }
            }
        } catch (err) {
        console.error("Unexpected error fetching data:", err);
        loadFromParams();
      }
    };

    function loadFromParams(customTargets?: any) {
      const calories = parseInt(searchParams.get("calories") || "0");
      const protein = parseFloat(searchParams.get("protein") || "0");
      const carbs = parseFloat(searchParams.get("carbs") || "0");
      const fats = parseFloat(searchParams.get("fats") || "0");
      const fiber = parseFloat(searchParams.get("fiber") || "0");
      const water = parseInt(searchParams.get("water") || "0");
      const activeCalories = parseInt(searchParams.get("activeCalories") || "0");
      const alcoholGrams = parseInt(searchParams.get("alcohol_grams") || "0");
      const alcoholKcal = parseInt(searchParams.get("alcohol_kcal") || "0");
  
      const foodsParam = searchParams.get("foods");
      let foods: FoodEntry[] = [];
      if (foodsParam) {
        foods = foodsParam.split("|").map((f) => {
          const [name, grams, cals, pro, carb, fat, fib, alc] = f.split(":");
          return {
            name,
            grams: parseInt(grams),
            calories: parseInt(cals),
            pro: parseFloat(pro),
            carb: parseFloat(carb),
            fat: parseFloat(fat),
            fiber: parseFloat(fib) || 0,
            alcohol: parseFloat(alc) || 0,
          };
        });
      }
  
      setData(prev => ({ 
        ...prev,
        calories, 
        protein, 
        carbs, 
        fats, 
        fiber, 
        water, 
        activeCalories, 
        foods,
        alcohol: { grams: alcoholGrams, calories: alcoholKcal },
        targets: customTargets || prev.targets
      }));
    }

    fetchData();

    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, [searchParams, selectedDate, userId]);

  useEffect(() => {
    if (activeView !== "progress") return;

    const fetchProgressData = async () => {
      const today = new Date();
      let days = 7;
      if (timeRange === "1m") days = 30;
      if (timeRange === "3m") days = 90;
      if (timeRange === "6m") days = 180;

      const dates = Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (days - 1 - i));
        return d.toISOString().split('T')[0];
      });

        if (userId === "ugo_demo") {
          // Fetch Ugo's profile from DB for real targets
          const { data: ugoProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('telegram_id', 'ugo_demo')
            .maybeSingle();

            const formattedData = dates.map((dateStr) => {
              const date = new Date(dateStr);
              const dateSeed = dateStr.split("-").reduce((acc, part) => acc + parseInt(part), 0);
              const pseudoRandom = (seed: number) => {
                const x = Math.sin(seed) * 10000;
                return x - Math.floor(x);
              };
              const r = (offset: number) => pseudoRandom(dateSeed + offset);

                const bmr = ugoProfile?.bmr || 1600;
                const activeCals = 200 + Math.floor(r(7) * 300);
                const totalTarget = bmr + activeCals;
                const consumed = 1800 + Math.floor(r(1) * 400);

                      return {
                        dayName: date.toLocaleDateString("en-GB", { weekday: 'short' }).charAt(0),
                        dayNumber: date.getDate(),
                        date: date.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit' }),
                        diff: consumed - totalTarget,
                        baseline: 0,
                        fullDate: dateStr,
                        consumed: consumed,
                        protein: 100 + Math.floor(r(2) * 20),
                        carbs: 180 + Math.floor(r(3) * 40),
                        fats: 60 + Math.floor(r(4) * 15),
                        fiber: 25 + Math.floor(r(5) * 10),
                        water: 1800 + Math.floor(r(6) * 1000),
                        targetWater: (ugoProfile?.target_water || 2) * 1000,
                        processedPercentage: 15 + Math.floor(r(10) * 50),
                        bmr: bmr,
                        target: totalTarget,
                        activeCalories: activeCals
                      };
                  });
                  setProgressData(formattedData);
                  return;
                }

                if (!userId) return;

                    try {
                      const { data: logs } = await supabase
                        .from('daily_logs')
                        .select('date, water, target_water, calories, protein, carbs, fats, fiber, target_calories, active_calories, bmr, target_deficit, food_entries(calories, is_processed)')
                        .eq('user_id', userId)
                        .in('date', dates);

                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('target_calories, bmr, target_deficit, target_water')
                      .eq('telegram_id', userId)
                      .maybeSingle();

                    const logsMap = new Map(logs?.map(log => [log.date, log]));

                    const formattedData = dates.map((dateStr) => {
                      const date = new Date(dateStr);
                      const log = logsMap.get(dateStr) as any;
                      
                        const bmrForDay = log?.bmr || profile?.bmr || profile?.target_calories || 1600;
                        const activeCals = log?.active_calories || 0;
                        const deficit = log?.target_deficit || profile?.target_deficit || 0;
                        const totalTarget = Math.round(bmrForDay + activeCals - deficit);
                        const consumed = log?.calories || 0;

                        // Calculate processed percentage
                        const rawFoods = log?.food_entries || [];
                        const foodTotals = rawFoods.reduce((acc: any, f: any) => ({
                          calories: acc.calories + (f.calories || 0),
                          processedCalories: acc.processedCalories + (f.is_processed ? (f.calories || 0) : 0)
                        }), { calories: 0, processedCalories: 0 });
                        
                        const processedPercentage = foodTotals.calories > 0 
                          ? (foodTotals.processedCalories / foodTotals.calories) * 100 
                          : 0;

                        return {
                          dayName: date.toLocaleDateString("en-GB", { weekday: 'short' }).charAt(0),
                          dayNumber: date.getDate(),
                          date: date.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit' }),
                          diff: log ? consumed - totalTarget : null,
                          baseline: 0,
                          fullDate: dateStr,
                          consumed: log ? consumed : null,
                          protein: log?.protein || 0,
                          carbs: log?.carbs || 0,
                          fats: log?.fats || 0,
                          fiber: log?.fiber || 0,
                          water: log?.water || 0,
                          targetWater: (() => {
                            const raw = log?.target_water ?? profile?.target_water ?? (ugoProfile?.target_water || 0);
                            return (raw && raw > 10) ? raw : (raw * 1000 || 0);
                          })(),
                          processedPercentage: log ? processedPercentage : null,
                          bmr: bmrForDay,
                          target: totalTarget,
                          activeCalories: log ? activeCals : null
                        };
                    });

        setProgressData(formattedData);
      } catch (err) {
        console.error("Error fetching progress data:", err);
      }
    };

    fetchProgressData();
  }, [activeView, userId, timeRange]);


    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
  
        const BMR = Math.round(data.bmr || data.targets?.calories || 1600);
        const deficit = data.targets?.deficit || 0;
        const totalTarget = Math.round(BMR + data.activeCalories - deficit);
        const caloriesLeft = Math.round(totalTarget - data.calories);
      const isOver = data.calories > totalTarget;
      const surplus = Math.round(data.calories - totalTarget);
      const waterLiters = data.water / 1000;
      const waterTarget = data.targets?.water || 2.0;
      const calorieBadge = getCalorieBadge(data.calories, totalTarget, isToday);

        const validProgressData = progressData.filter(d => d.consumed !== null);
        const consumeAvg = validProgressData.length > 0
          ? Math.round(validProgressData.reduce((acc, d) => acc + d.consumed, 0) / validProgressData.length)
          : 0;
        const cumulativeBalance = Math.round(validProgressData.reduce((acc, d) => acc + (d.diff || 0), 0));
        const dailyAvg = validProgressData.length > 0
          ? Math.round(cumulativeBalance / validProgressData.length)
          : 0;

        const proteinAvg = validProgressData.length > 0
          ? Math.round(validProgressData.reduce((acc, d) => acc + d.protein, 0) / validProgressData.length)
          : 0;
        const carbsAvg = validProgressData.length > 0
          ? Math.round(validProgressData.reduce((acc, d) => acc + d.carbs, 0) / validProgressData.length)
          : 0;
        const fatsAvg = validProgressData.length > 0
          ? Math.round(validProgressData.reduce((acc, d) => acc + d.fats, 0) / validProgressData.length)
          : 0;
        const fiberAvg = validProgressData.length > 0
          ? Math.round(validProgressData.reduce((acc, d) => acc + d.fiber, 0) / validProgressData.length)
          : 0;

        const progressSubtitle = progressData.length > 0 ? `From ${progressData[0].date} to ${progressData[progressData.length - 1].date}${timeRange === "7d" ? " (today)" : ""}` : "";


      return (
        <div className="h-screen bg-gray-100 font-sans text-gray-900 overflow-y-auto scrollbar-hide">
          <style jsx global>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="fixed top-0 left-0 right-0 z-50 bg-gray-100 px-5 pt-5 border-b-2 border-[#ECEDF2]">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-3xl font-bold"
                style={{
                  background: "linear-gradient(90deg, #7DD3C0 0%, #A8B8E6 50%, #D4A5E8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Giada.
              </div>
                <HeaderNav activeView={activeView} onViewChange={handleViewChange} />
            </div>

            <div className="flex flex-col">
              {activeView === "day" ? (
                <div className="flex justify-between gap-2 pb-2">
                  {last7Days.map((date, i) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isTodayDay = dateStr === new Date().toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;
                    const dayName = date.toLocaleDateString("en-GB", { weekday: 'short' }).charAt(0);
                    const dayNum = date.getDate();
                    
                    let bgColor = "#FFFFFF";
                    if (isSelected) bgColor = "#9EDDE2";
                    else if (isTodayDay) bgColor = "#E2F7F9";

                    let textColor = "#5A658D";
                    if (isSelected) textColor = "#262C44";
                    else if (isTodayDay) textColor = "#088D98";

                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDate(dateStr)}
                        className="flex-1 rounded-[1.5rem] py-3 text-center transition-all"
                        style={{ 
                          backgroundColor: bgColor,
                          cursor: "pointer",
                          fontFamily: '"DM Sans", sans-serif',
                          minWidth: "40px",
                          maxWidth: "48px"
                        }}
                      >
                        <div style={{ fontSize: "0.875rem", fontWeight: 700, color: textColor }}>{dayName}</div>
                        <div style={{ fontSize: "0.875rem", fontWeight: (isTodayDay || isSelected) ? 700 : 400, color: textColor, marginTop: "0.25rem" }}>{dayNum}</div>
                      </div>
                    );
                  })}
                </div>
              ) : activeView === "progress" ? (
                    <div className="flex flex-col w-full gap-3 pb-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setProgressTab("kcal")}
                          className="flex-1 rounded-full text-center transition-all flex items-center justify-center"
                          style={{
                            height: "32px",
                            backgroundColor: progressTab === "kcal" ? "#9EDDE2" : "#FFFFFF",
                            color: progressTab === "kcal" ? "#262C44" : "#5A658D",
                            fontSize: "0.875rem",
                            fontWeight: 700,
                          }}
                        >
                          Kcal & goals
                        </button>
                        <button
                          onClick={() => setProgressTab("macros")}
                          className="flex-1 rounded-full text-center transition-all flex items-center justify-center"
                          style={{
                            height: "32px",
                            backgroundColor: progressTab === "macros" ? "#9EDDE2" : "#FFFFFF",
                            color: progressTab === "macros" ? "#262C44" : "#5A658D",
                            fontSize: "0.875rem",
                            fontWeight: 700,
                          }}
                        >
                          Macros
                        </button>
                      </div>
                        <div className="flex items-center justify-center gap-2">
                          {(["7d", "1m", "3m", "6m"] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className="text-caption-custom transition-all"
                            style={{
                              display: "flex",
                              height: "24px",
                              padding: "4px 8px",
                              justifyContent: "center",
                              alignItems: "center",
                              gap: "10px",
                              borderRadius: "100px",
                              backgroundColor: timeRange === range ? "#5A658D" : "#FFFFFF",
                              color: timeRange === range ? "#FFFFFF" : "#5A658D",
                            }}
                          >
                            {range === "7d" ? "7 days" : range === "1m" ? "1 month" : range === "3m" ? "3 months" : "6 months"}
                          </button>
                        ))}
                        <button 
                          style={{
                            display: "flex",
                            width: "24px",
                            height: "24px",
                            padding: "4px",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "#FFFFFF",
                            color: "#5A658D",
                            borderRadius: "100px",
                          }}
                        >
                          <Calendar size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pb-2 h-[56px]" />
                  )}
            </div>
          </div>

          <div 
            className="px-5 pb-5 space-y-8"
            style={{ 
              paddingTop: "160px" 
            }}
          >
          {activeView === "day" && (
            <>
              {calorieBadge.showAlert && <MissingAlert />}
              <div className="space-y-3">
                <div className="rounded-2xl bg-white pl-4 py-4 pr-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2.5">
                      <h2 className="mb-5 text-title-custom">Daily Calories</h2>
                              <div className="flex items-start gap-1 text-body-sm-custom">
                                <BadgeIconSm semantic="Lunch" />
                                <span><span className="text-subtitle-1-custom">{data.calories.toLocaleString("it-IT")}</span>/{totalTarget.toLocaleString("it-IT")} <span className="text-helper-custom">target + active</span></span>
                              </div>
                            <div className="flex items-start gap-1 text-body-sm-custom">
                              <BadgeIconSm semantic="KcalActive" />
                              <span><span className="text-subtitle-1-custom">{data.activeCalories.toLocaleString("it-IT")}</span> active kcal</span>
                            </div>
                                <div className="flex items-start gap-1 text-body-sm-custom">
                                  <BadgeIconSm semantic="Goal" />
                                  <span><span className="text-subtitle-1-custom">{(BMR - deficit).toLocaleString("it-IT")}</span> target <span className="text-helper-custom">{BMR.toLocaleString("it-IT")} BMR - {deficit.toLocaleString("it-IT")} deficit</span></span>
                                </div>
                      <StatusBadge text={calorieBadge.text} connotation={calorieBadge.connotation} />
                    </div>
                        <ShadcnRadialProgress value={data.calories} max={totalTarget} size={122} color={BadgeIconColors.Lunch} innerRadius="77%">
                          <div className="text-center text-title-custom font-bold" style={{ color: calorieBadge.text === "Calories over target" ? "#C10127" : "#262C44" }}>
                            {isOver ? `+${surplus.toLocaleString("it-IT")}` : caloriesLeft.toLocaleString("it-IT")}
                          </div>
                            <div className="text-helper-custom">{isOver ? "over" : "left"}</div>
                        </ShadcnRadialProgress>

                </div>
              </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MacroCard icon={<BadgeIconSm semantic="Protein" />} name="PRO" value={data.protein} target={data.targets?.protein || 96} color={BadgeIconColors.Protein} isToday={isToday} type="protein" />
                      <MacroCard icon={<BadgeIconSm semantic="Carbo" />} name="CAR" value={data.carbs} target={data.targets?.carbs || 160} color={BadgeIconColors.Carbo} isToday={isToday} type="carbs" />
                      <MacroCard icon={<BadgeIconSm semantic="Fat" />} name="FAT" value={data.fats} target={data.targets?.fats || 64} color={BadgeIconColors.Fat} isToday={isToday} type="fat" />
                      <MacroCard icon={<BadgeIconSm semantic="Fiber" />} name="FIB" value={data.fiber} target={data.targets?.fiber || 30} color={BadgeIconColors.Fiber} isToday={isToday} type="fiber" />
                    </div>

                  {data.targets?.water && data.targets.water > 0 ? (
                    <MacroCard icon={<BadgeIconSm semantic="Water" />} name="Water intake" value={waterLiters} target={data.targets.water} color={BadgeIconColors.Water} isToday={isToday} type="water" centered />
                  ) : null}
                  <MacroCard icon={<BadgeIconSm semantic="ProcessFood" />} name="Processed food" value={data.processedPercentage || 0} target={50} color={BadgeIconColors.ProcessFood} isToday={isToday} type="processed" centered />
                <MacroCard icon={<BadgeIconSm semantic="Alcohol" />} name="Alcohol intake" value={data.alcohol?.grams || 0} target={30} color={BadgeIconColors.Alcohol} isToday={isToday} type="alcohol" centered />
            </div>

          <div>
            <h2 className="mb-4 text-title-custom">Food log → <span className="text-subtitle-1-custom">{data.calories.toLocaleString("it-IT")}</span> Kcal total</h2>
            <div className="space-y-3">
              {data.meals && data.meals.length > 0 && !isToday ? (
                data.meals.map((meal, mealIdx) => (
                  <div key={mealIdx} className="space-y-2">
                    <MealMomentCard 
                      meal={meal} 
                      isOpen={!!openMeals[meal.meal]} 
                      onToggle={() => toggleMeal(meal.meal)} 
                    />
                      {openMeals[meal.meal] && (
                          <div className="ml-4 space-y-3 border-l-2 border-dashed border-teal-100 pl-4 py-2">
                            {meal.foods.map((food, i) => (
                              <div key={i} className="relative rounded-2xl bg-white p-4 shadow-sm">
                                  <div className="absolute top-3 right-3 flex items-center gap-1">
                                    {food.is_processed && (
                                      <div className="text-caption-custom rounded-full bg-[#FCE8FF] px-2 py-0.5 text-[#DB74ED]">
                                        P
                                      </div>
                                    )}
                                  {food.time && (
                                    <div className="text-caption-custom rounded-lg bg-[#F9F9FB] px-2 py-0.5 text-[#757FA0]">
                                      {food.time}
                                    </div>
                                  )}
                                </div>
                                <div className="mb-2 flex items-center justify-between pr-24">
                                  <div className="flex items-center gap-2">
                                    <span className="text-body-md-custom">{food.name}</span>
                                  </div>
                                </div>
                                  <div className="mb-2 flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#2BB0BB" }} />
                                    <span className="text-subtitle-1-custom font-bold">{Math.round(food.calories)}</span>
                                    <span className="text-body-sm-custom">kcal</span>
                                  </div>

                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                  <div className="flex items-center gap-1 text-helper-custom">
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Protein }} />
                                    <i>Protein {Math.round(food.pro)}g</i>
                                  </div>
                                  <div className="flex items-center gap-1 text-helper-custom">
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Fiber }} />
                                    <i>Fiber {Math.round(food.fiber)}g</i>
                                  </div>
                                  <div className="flex items-center gap-1 text-helper-custom">
                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Carbo }} />
                                    <i>Carbo {Math.round(food.carb)}g</i>
                                  </div>
                                    <div className="flex items-center gap-1 text-helper-custom">
                                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Fat }} />
                                      <i>Fat {Math.round(food.fat)}g</i>
                                    </div>
                                    {food.alcohol > 0 && (
                                      <div className="flex items-center gap-1 text-helper-custom">
                                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Alcohol }} />
                                        <i>Alcohol {Math.round(food.alcohol)}g</i>
                                      </div>
                                    )}
                                  </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                ))
                ) : data.foods.length === 0 ? (
                  <div className="rounded-2xl bg-white p-8 text-center text-helper-custom shadow-sm">No food logged for this day</div>
                  ) : (
                      [...data.foods].reverse().map((food, i) => (
                        <div key={i} className="relative rounded-2xl bg-white p-4 shadow-sm">
                          <div className="absolute top-3 right-3 flex items-center gap-1">
                          {food.is_processed && (
                            <div className="text-caption-custom rounded-full bg-[#FCE8FF] px-2 py-0.5 text-[#D14FE8]">
                              P
                            </div>
                          )}
                          {food.time && (
                            <div className="text-caption-custom rounded-lg bg-[#F9F9FB] px-2 py-0.5 text-[#757FA0]">
                              {food.time}
                            </div>
                          )}
                        </div>
                        <div className="mb-2 flex items-center justify-between pr-24">
                          <div className="flex items-center gap-2">
                            <span className="text-body-md-custom">{food.name}</span>
                          </div>
                        </div>
                          <div className="mb-2 flex items-center gap-1.5">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#2BB0BB" }} />
                            <span className="text-subtitle-1-custom font-bold">{Math.round(food.calories)}</span>
                            <span className="text-body-sm-custom">kcal</span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            <div className="flex items-center gap-1 text-helper-custom">
                              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Protein }} />
                              <i>Protein {Math.round(food.pro)}g</i>
                            </div>
                            <div className="flex items-center gap-1 text-helper-custom">
                              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Fiber }} />
                              <i>Fiber {Math.round(food.fiber)}g</i>
                            </div>
                            <div className="flex items-center gap-1 text-helper-custom">
                              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Carbo }} />
                              <i>Carbo {Math.round(food.carb)}g</i>
                            </div>
                            <div className="flex items-center gap-1 text-helper-custom">
                              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Fat }} />
                              <i>Fat {Math.round(food.fat)}g</i>
                            </div>
                            {food.alcohol > 0 && (
                              <div className="flex items-center gap-1 text-helper-custom">
                                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Alcohol }} />
                                <i>Alcohol {Math.round(food.alcohol)}g</i>
                              </div>
                            )}
                          </div>
                    </div>
                  ))
                )}
            </div>
          </div>
        </>
      )}
          {activeView === "progress" && (
            <div className="space-y-4">
                {progressTab === "kcal" && (
                    <>
                      <BalanceChart 
                        data={progressData} 
                        title="Balance"
                        type={timeRange === "7d" ? "bar" : "area"}
                        subtitle={progressSubtitle}
                      />
                      <CaloricConsumeChart 
                        data={progressData}
                        title="Caloric consume"
                        type={timeRange === "7d" ? "bar" : "area"}
                        subtitle={progressSubtitle}
                      />
                        <KcalAveragesCard 
                          consumeAvg={consumeAvg}
                          cumulativeBalance={cumulativeBalance}
                          dailyAvg={dailyAvg}
                          subtitle={progressSubtitle}
                        />
                          <ActiveKcalChart 
                            data={progressData}
                            title="Active kcal"
                            type={timeRange === "7d" ? "bar" : "area"}
                            subtitle={progressSubtitle}
                          />
                        </>
                    )}
                    {progressTab === "macros" && (
                      <>
                        <MacrosChart 
                          data={progressData}
                          title="Macros"
                          type={timeRange === "7d" ? "bar" : "area"}
                          subtitle={progressSubtitle}
                        />
                          <MacrosAveragesCard 
                            proteinAvg={proteinAvg}
                            carbsAvg={carbsAvg}
                            fatsAvg={fatsAvg}
                            fiberAvg={fiberAvg}
                            targets={data.targets}
                            subtitle={progressSubtitle}
                          />
                            <ProcessedFoodChart 
                              data={progressData}
                              title="Processed food"
                              type={timeRange === "7d" ? "bar" : "area"}
                              subtitle={progressSubtitle}
                            />
                            <WaterChart 
                              data={progressData}
                              title="Water"
                              type={timeRange === "7d" ? "bar" : "area"}
                              subtitle={progressSubtitle}
                            />
                          </>
                    )}
              </div>
            )}

    </div>
  </div>
  );
};

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <StatsContent />
    </Suspense>
  );
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
      };
    };
  }
}
