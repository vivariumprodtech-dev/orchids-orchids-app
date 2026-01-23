"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import BadgeIconSm from "@/components/BadgeIconSm";

interface FoodEntry {
  name: string;
  grams: number;
  calories: number;
  pro: number;
  carb: number;
  fat: number;
  fiber: number;
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
  foods: FoodEntry[];
  meals?: MealEntry[];
  alcohol?: {
    grams: number;
    calories: number;
  };
}

const DAY_13_DATA: StatsData = {
  calories: 2020,
  protein: 72,
  carbs: 195,
  fats: 88,
  fiber: 18,
  water: 1200,
  activeCalories: 0,
  foods: [],
  alcohol: {
    grams: 10,
    calories: 70,
  },
  meals: [
    {
      meal: "Colazione",
      foods: [
        { name: "Cornetto alla crema", grams: 80, calories: 290, pro: 5, carb: 38, fat: 14, fiber: 1 },
        { name: "Cappuccino con zucchero", grams: 200, calories: 120, pro: 4, carb: 15, fat: 5, fiber: 0 },
      ],
      totalCalories: 410,
    },
    {
      meal: "Pranzo",
      foods: [
        { name: "Pasta alla carbonara", grams: 280, calories: 580, pro: 22, carb: 65, fat: 26, fiber: 3 },
        { name: "Pane bianco", grams: 50, calories: 130, pro: 4, carb: 25, fat: 1, fiber: 1 },
      ],
      totalCalories: 710,
    },
    {
      meal: "Spuntino",
      foods: [
        { name: "Tiramisù", grams: 120, calories: 350, pro: 6, carb: 35, fat: 20, fiber: 0 },
      ],
      totalCalories: 350,
    },
    {
      meal: "Cena",
      foods: [
        { name: "Pizza margherita", grams: 300, calories: 480, pro: 35, carb: 57, fat: 27, fiber: 13 },
        { name: "Vino rosso", grams: 125, calories: 70, pro: 0, carb: 0, fat: 0, fiber: 0 },
      ],
      totalCalories: 550,
    },
  ],
};

const DAY_14_DATA: StatsData = {
  calories: 1480,
  protein: 95,
  carbs: 145,
  fats: 55,
  fiber: 22,
  water: 2000,
  activeCalories: 180,
  foods: [],
  meals: [
    {
      meal: "Colazione",
      foods: [
        { name: "Yogurt greco 0%", grams: 170, calories: 95, pro: 17, carb: 6, fat: 0, fiber: 0 },
        { name: "Muesli integrale", grams: 40, calories: 150, pro: 4, carb: 28, fat: 3, fiber: 4 },
        { name: "Mirtilli freschi", grams: 80, calories: 45, pro: 1, carb: 10, fat: 0, fiber: 2 },
      ],
      totalCalories: 290,
    },
    {
      meal: "Pranzo",
      foods: [
        { name: "Insalata di pollo", grams: 250, calories: 320, pro: 35, carb: 12, fat: 15, fiber: 5 },
        { name: "Pane integrale", grams: 40, calories: 95, pro: 4, carb: 18, fat: 1, fiber: 3 },
      ],
      totalCalories: 415,
    },
    {
      meal: "Spuntino",
      foods: [
        { name: "Mela", grams: 180, calories: 95, pro: 0, carb: 25, fat: 0, fiber: 4 },
        { name: "Mandorle", grams: 20, calories: 115, pro: 4, carb: 4, fat: 10, fiber: 2 },
      ],
      totalCalories: 210,
    },
    {
      meal: "Cena",
      foods: [
        { name: "Salmone al forno", grams: 150, calories: 280, pro: 30, carb: 0, fat: 18, fiber: 0 },
        { name: "Verdure grigliate", grams: 200, calories: 85, pro: 3, carb: 15, fat: 2, fiber: 6 },
        { name: "Riso basmati", grams: 80, calories: 200, pro: 4, carb: 45, fat: 1, fiber: 1 },
      ],
      totalCalories: 565,
    },
  ],
};

const DAY_15_DATA: StatsData = {
  calories: 1720,
  protein: 78,
  carbs: 185,
  fats: 72,
  fiber: 16,
  water: 1600,
  activeCalories: 50,
  foods: [],
  meals: [
    {
      meal: "Colazione",
      foods: [
        { name: "Pane tostato", grams: 60, calories: 155, pro: 5, carb: 30, fat: 2, fiber: 2 },
        { name: "Burro di arachidi", grams: 30, calories: 180, pro: 7, carb: 6, fat: 15, fiber: 2 },
        { name: "Banana", grams: 120, calories: 105, pro: 1, carb: 27, fat: 0, fiber: 3 },
      ],
      totalCalories: 440,
    },
    {
      meal: "Pranzo",
      foods: [
        { name: "Panino con prosciutto", grams: 180, calories: 380, pro: 22, carb: 40, fat: 15, fiber: 2 },
        { name: "Patatine fritte", grams: 100, calories: 310, pro: 3, carb: 40, fat: 15, fiber: 3 },
      ],
      totalCalories: 690,
    },
    {
      meal: "Spuntino",
      foods: [
        { name: "Barretta proteica", grams: 50, calories: 190, pro: 15, carb: 20, fat: 7, fiber: 2 },
      ],
      totalCalories: 190,
    },
    {
      meal: "Cena",
      foods: [
        { name: "Risotto ai funghi", grams: 300, calories: 400, pro: 10, carb: 62, fat: 12, fiber: 4 },
      ],
      totalCalories: 400,
    },
  ],
};

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
      style={{
        display: "inline-flex",
        height: "20px",
        padding: "0 8px",
        alignItems: "center",
        gap: "4px",
        borderRadius: "100px",
        background: style.bg,
        color: style.color,
        fontFamily: "var(--font-dm-sans)",
        fontSize: "12px",
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
        borderRadius: "16px",
        padding: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "16px"
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div 
          style={{ 
            color: "#C10127", 
            fontFamily: "var(--font-dm-sans)", 
            fontWeight: "600", 
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}
        >
          🚨 Something might be missing
        </div>
        <div 
          style={{ 
            color: "#C10127", 
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: "400",
            lineHeight: "1.4"
          }}
        >
          Tell me in the chat if there are missing meals to adjust this day.
        </div>
      </div>
      <button
        onClick={() => window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: "https://t.me/your_bot" } }, "*")}
        style={{
          background: "white",
          borderRadius: "100px",
          padding: "6px 12px",
          color: "#3B4361",
          fontSize: "13px",
          fontWeight: "600",
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap"
        }}
      >
        Go to chat
      </button>
    </div>
  );
}

function CircleProgress({
  value,
  max,
  size = 120,
  strokeWidth = 12,
  color = "#4ECDC4",
  children,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e0e0e0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
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
    // Check "Over" rules even on current day if it's already over
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

  // Past day or Over target logic
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
  if (target === 0) return { text: "No target", connotation: "neutral" as const };
  const percentage = (consumed / target) * 100;
  if (percentage < 25) return { text: "Great! 🏆", connotation: "great" as const };
  if (percentage <= 49) return { text: "Good", connotation: "good" as const };
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
  let badge: { text: string; connotation: any } = { text: "good", connotation: "good" };
  let circleText = `${left}g`;
  let circleLabel = "left";
  let isCheckmark = false;

  if (type === "processed") {
    badge = getProcessedFoodBadge(value, target);
    circleText = `${Math.round((value / target) * 100)}%`;
    circleLabel = "";
  } else if (type === "water") {
    badge = getWaterBadge(value, target);
    const litersLeft = (target - value).toFixed(1);
    circleText = value >= target ? "✓" : `${litersLeft}L`;
    circleLabel = value >= target ? "" : "left";
    isCheckmark = value >= target;
  } else if (type === "alcohol") {
    // handled separately in main content for now, but keeping for consistency
  } else if (type) {
    badge = getMacroBadge(type as any, value, target, isToday);
    if (value >= target * 0.97 && value <= target * 1.03) {
      circleText = "✓";
      circleLabel = "";
      isCheckmark = true;
    } else if (value > target) {
      circleText = `+${Math.round(value - target)}g`;
      circleLabel = "";
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className={`flex ${centered ? "items-center" : "items-start"} justify-between`}>
        <div className="flex-1">
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
            <span className="text-secondary-custom">{name}</span>
          </div>
          <div className="mb-4">
            <span className="text-primary-custom">{Math.round(value)}</span>
            <span className="text-secondary-custom">/{target}{type === "water" ? "L" : type === "processed" ? "%" : "g"}</span>
          </div>
          <StatusBadge text={badge.text} connotation={badge.connotation} />
        </div>
        <CircleProgress value={value} max={target} size={65} strokeWidth={6} color={color}>
          <div
            className="font-bold"
            style={{ 
              fontSize: isCheckmark ? 28 : 14, 
              color: badge.connotation === "danger" ? "#C10127" : "#333" 
            }}
          >
            {circleText}
          </div>
          {circleLabel && <div className="text-tertiary-custom !not-italic !text-[10px]">{circleLabel}</div>}
        </CircleProgress>
      </div>
    </div>
  );
}

function StatsContent() {
  const searchParams = useSearchParams();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [data, setData] = useState<StatsData>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    water: 0,
    activeCalories: 0,
    foods: [],
  });
  const [showAllFoods, setShowAllFoods] = useState(false);

  useEffect(() => {
    if (selectedDay === 13) {
      setData(DAY_13_DATA);
      return;
    }
    if (selectedDay === 14) {
      setData(DAY_14_DATA);
      return;
    }
    if (selectedDay === 15) {
      setData(DAY_15_DATA);
      return;
    }

    const calories = parseInt(searchParams.get("calories") || "0");
    const protein = parseFloat(searchParams.get("protein") || "0");
    const carbs = parseFloat(searchParams.get("carbs") || "0");
    const fats = parseFloat(searchParams.get("fats") || "0");
    const fiber = parseFloat(searchParams.get("fiber") || "0");
    const water = parseInt(searchParams.get("water") || "0");
    const activeCalories = parseInt(searchParams.get("activeCalories") || "0");

    const foodsParam = searchParams.get("foods");
    let foods: FoodEntry[] = [];
    if (foodsParam) {
      foods = foodsParam.split("|").map((f) => {
        const [name, grams, cals, pro, carb, fat, fib] = f.split(":");
        return {
          name,
          grams: parseInt(grams),
          calories: parseInt(cals),
          pro: parseFloat(pro),
          carb: parseFloat(carb),
          fat: parseFloat(fat),
          fiber: parseFloat(fib) || 0,
        };
      });
    }

    setData({ calories, protein, carbs, fats, fiber, water, activeCalories, foods });

    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, [searchParams, selectedDay]);

  const isToday = selectedDay === null;
  const displayDate = isToday 
    ? "Today's Balance" 
    : `${selectedDay} January 2026`;

  const BMR = 1600;
    const totalTarget = BMR + data.activeCalories;
    const caloriesLeft = totalTarget - data.calories;
    const isOver = data.calories > totalTarget;
    const surplus = data.calories - totalTarget;

    const waterLiters = data.water / 1000;
    const waterTarget = 2.0;

    const calorieBadge = getCalorieBadge(data.calories, totalTarget, isToday);
    const waterBadge = getWaterBadge(waterLiters, waterTarget);
    const alcoholBadge = getAlcoholBadge(data.alcohol?.calories || 0, totalTarget);

    let calCircleColor = "#4ECDC4";
    if (isOver) {
      const surplusVal = data.calories - totalTarget;
      if (surplusVal <= 100) calCircleColor = "#ffd700";
      else if (surplusVal <= 300) calCircleColor = "#ff8c00";
      else calCircleColor = "#ff0000";
    }

  return (
    <div className="min-h-screen bg-gray-100 p-5 font-sans text-gray-900">
        <div className="mb-5 flex items-center justify-between">
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
          <div className="text-primary-custom">
            {displayDate}
          </div>
        </div>

        <div className="mb-5 flex justify-between gap-2">
          {["S", "S", "M", "T", "W", "T", "F"].map((day, i) => {
            const dayNum = 10 + i;
            const isTodayDay = dayNum === 16;
            const isSelected = selectedDay === dayNum;
            const isClickable = dayNum === 13 || dayNum === 14 || dayNum === 15 || isTodayDay;
            const isViewingPast = selectedDay !== null;
            return (
              <div
                key={i}
                onClick={() => {
                  if (dayNum === 13 || dayNum === 14 || dayNum === 15) {
                    setSelectedDay(dayNum);
                  } else if (isTodayDay) {
                    setSelectedDay(null);
                  }
                }}
                className={`flex-1 rounded-xl py-3 text-center transition-all ${
                  isSelected ? "bg-teal-400 text-white" : 
                  (isTodayDay && !isViewingPast) ? "bg-teal-400 text-white" : 
                  (isTodayDay && isViewingPast) ? "cursor-pointer bg-blue-100 text-blue-600 font-semibold" :
                  isClickable ? "cursor-pointer bg-white opacity-70 hover:opacity-100" : "bg-white opacity-40"
                }`}
              >
                <div className="text-xs font-semibold">{day}</div>
                <div className="text-lg font-bold">{dayNum}</div>
                {dayNum === 13 && <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />}
                {dayNum === 15 && <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-yellow-400" />}
              </div>
            );
          })}
        </div>

        <div className="space-y-8">
          {calorieBadge.showAlert && <MissingAlert />}
          {/* Section 1: kcal card, macro cards, process food, water and alcohol */}
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-primary-custom">Daily Calories</h2>
                <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-1 text-secondary-custom">
                          <BadgeIconSm semantic="Lunch" />
                          <span><span className="text-primary-custom">{data.calories.toLocaleString("it-IT")}</span>/{totalTarget.toLocaleString("it-IT")} <span className="text-tertiary-custom">(goal + active)</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-secondary-custom">
                          <BadgeIconSm semantic="Goal" />
                          <span><span className="text-primary-custom">{BMR.toLocaleString("it-IT")}</span> goal <span className="text-tertiary-custom">(BMR - deficit)</span></span>
                        </div>
                        <div className="flex items-center gap-1 text-secondary-custom">
                          <BadgeIconSm semantic="KcalActive" />
                          <span><span className="text-primary-custom">{data.activeCalories.toLocaleString("it-IT")}</span> active kcal{data.activeCalories > 200 && <span> 🔥</span>}</span>
                        </div>
                        <StatusBadge text={calorieBadge.text} connotation={calorieBadge.connotation} />
                    </div>
                      <CircleProgress value={data.calories} max={totalTarget} color={calCircleColor}>

                      <div className="text-center text-primary-custom" style={{ color: isOver ? calCircleColor : "var(--text-secondary)" }}>
                        {isOver ? `+${surplus.toLocaleString("it-IT")}` : caloriesLeft.toLocaleString("it-IT")}
                      </div>
                    <div className="text-tertiary-custom">
                      {isOver ? "surplus" : "kcal left"}
                    </div>
                  </CircleProgress>
                </div>
              </div>

            <div className="grid grid-cols-2 gap-3">
              <MacroCard icon={<BadgeIconSm semantic="Protein" />} name="Protein" value={data.protein} target={96} color="#FF6B9D" isToday={isToday} type="protein" />
              <MacroCard icon={<BadgeIconSm semantic="Carbo" />} name="Carbs" value={data.carbs} target={160} color="#FFB84D" isToday={isToday} type="carbs" />
              <MacroCard icon={<BadgeIconSm semantic="Fat" />} name="Fat" value={data.fats} target={64} color="#9C6FFF" isToday={isToday} type="fat" />
              <MacroCard icon={<BadgeIconSm semantic="Fiber" />} name="Fiber" value={data.fiber} target={30} color="#4CAF50" isToday={isToday} type="fiber" />
            </div>

              <MacroCard icon={<BadgeIconSm semantic="ProcessFood" />} name="Process Food" value={0} target={100} color="#DB74ED" isToday={isToday} type="processed" centered />

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                      <div className="mb-1 flex items-center gap-1">
                        <BadgeIconSm semantic="Water" />
                          <span className="text-secondary-custom">Water</span>
                        </div>
                        <div className="mb-4">
                          <span className="text-primary-custom">{waterLiters.toFixed(1)}</span>
                          <span className="text-secondary-custom">/2L</span>
                        </div>
                      <StatusBadge text={waterBadge.text} connotation={waterBadge.connotation} />
                    </div>
                    <CircleProgress value={waterLiters} max={waterTarget} size={65} strokeWidth={6} color="#73B0FF">

                    {waterLiters >= waterTarget ? (
                      <div className="text-primary-custom !text-2xl">✓</div>
                    ) : (
                      <>
                        <div className="text-primary-custom !text-sm !font-bold">{(waterTarget - waterLiters).toFixed(1)}L</div>
                        <div className="text-tertiary-custom !not-italic !text-[10px]">left</div>
                      </>
                    )}
                  </CircleProgress>
                </div>
              </div>

              {data.alcohol && (
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="mb-1 flex items-center gap-1">
                          <BadgeIconSm semantic="Alcohol" />
                          <span className="text-secondary-custom">Alcohol</span>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center gap-1">
                            <span className="text-primary-custom">{data.alcohol.grams}g</span>
                            <span className="text-secondary-custom">→ <span className="text-primary-custom">{data.alcohol.calories}</span> Kcal</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-tertiary-custom">(Weight based)</span>
                          <StatusBadge text={alcoholBadge.text} connotation={alcoholBadge.connotation} />
                        </div>
                      </div>
                      <CircleProgress value={data.alcohol.grams} max={30} size={65} strokeWidth={6} color="#CE6194">

                      <div className="text-primary-custom !text-sm !font-bold">{Math.max(0, 30 - data.alcohol.grams)}g</div>
                      <div className="text-tertiary-custom !not-italic !text-[10px]">left</div>
                    </CircleProgress>
                  </div>
                </div>
              )}
          </div>

          {/* Section 2: Food log section */}
          <div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-primary-custom">
                  Food log → <span className="text-primary-custom">{data.calories}</span> Kcal total
                </h2>
                {!isToday && data.meals && data.meals.length > 0 ? (
                  <div className="space-y-4">
                    {data.meals.map((meal, mealIndex) => (
                      <div key={mealIndex} className="border-b border-gray-100 pb-4 last:border-0">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-primary-custom">{meal.meal}</span>
                          <span className="text-secondary-custom"><span className="text-primary-custom">{meal.totalCalories}</span> Kcal</span>
                        </div>
                        <div className="space-y-2 pl-2">
                          {meal.foods.map((food, foodIndex) => (
                            <div key={foodIndex} className="border-l-2 border-gray-200 pl-3">
                              <div className="flex justify-between">
                                <span className="text-secondary-custom">{food.name}</span>
                                <span className="text-tertiary-custom !not-italic">{food.calories} kcal</span>
                              </div>
                              <div className="flex gap-2 text-tertiary-custom !not-italic">
                                <span>🥩 {food.pro}g</span>
                                <span>🍞 {food.carb}g</span>
                                <span>🥑 {food.fat}g</span>
                                <span>🌾 {food.fiber}g</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : data.foods.length === 0 ? (
                  <div className="py-5 text-center text-tertiary-custom">Nessun cibo loggato</div>
                ) : (
                  <div className="space-y-3">
                    {(showAllFoods ? data.foods : data.foods.slice(0, INITIAL_FOODS_DISPLAY)).map((food, i) => (
                      <div key={i} className="border-b border-gray-100 pb-3 last:border-0">
                        <div className="mb-1.5 flex justify-between">
                          <span className="text-primary-custom !font-medium">{food.name}</span>
                          <span className="text-tertiary-custom !not-italic">
                            {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="mb-1.5 text-primary-custom">• <span className="text-primary-custom">{food.calories}</span> Kcal</div>
                        <div className="flex gap-3 text-tertiary-custom !not-italic">
                          <span>🥩 {food.pro || 0}g</span>
                          <span>🍞 {food.carb || 0}g</span>
                          <span>🥑 {food.fat || 0}g</span>
                          <span>🌾 {food.fiber || 0}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Caricamento...</div>}>
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
