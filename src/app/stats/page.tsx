"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useRef } from "react";
import { Utensils, Flag, Footprints } from "lucide-react";

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

function MacroCard({
  icon,
  iconBg,
  name,
  value,
  target,
  color,
  isToday,
}: {
  icon: string;
  iconBg: string;
  name: string;
  value: number;
  target: number;
  color: string;
  isToday: boolean;
}) {
  const progress = value / target;
  const surplus = value - target;
  const left = Math.round(target - value);

  let status = "";
  let statusColor = "#333";
  let circleText = `${left}g`;
  let circleLabel = "left";
  let circleTextColor = "#333";
  let isCheckmark = false;

  if (isToday) {
    const dayProgress = Math.max(0, Math.min(1, (new Date().getHours() - 7) / 15));
    const expected = target * dayProgress;
    const diff = value - expected;
    const tolerance = target * 0.15;

    if (progress >= 0.85 && progress <= 1.15) {
      status = "On target";
      statusColor = "#4CAF50";
      circleText = "✓";
      circleLabel = "";
      isCheckmark = true;
    } else if (value > target) {
      status = "↑ over";
      statusColor = "#FF5252";
      circleText = `+${Math.round(surplus)}g`;
      circleLabel = "";
      circleTextColor = "#FF5252";
    } else if (diff < -tolerance) {
      status = "Behind schedule";
      statusColor = "#FF9800";
    } else {
      status = "On track";
      statusColor = "#4CAF50";
    }
    } else {
      if (progress >= 0.85 && progress <= 1.15) {
        status = "On target";
        statusColor = "#4CAF50";
        circleText = "✓";
        circleLabel = "";
        isCheckmark = true;
      } else if (value > target) {
        status = "↑ over";
        statusColor = "#FF5252";
        circleText = `+${Math.round(surplus)}g`;
        circleLabel = "";
        circleTextColor = "#FF5252";
      } else {
        status = "Under target";
        statusColor = "#FF9800";
      }
    }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-sm"
              style={{ background: iconBg }}
            >
              {icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{name}</span>
          </div>
          <div className="mb-2">
            <span className="text-2xl font-bold text-gray-900">{Math.round(value)}</span>
            <span className="text-base text-gray-400">/{target}g</span>
          </div>
          <div className="text-xs font-semibold" style={{ color: statusColor }}>
            {status}
          </div>
        </div>
          <CircleProgress value={value} max={target} size={65} strokeWidth={6} color={color}>
              <div
                className="font-bold"
                style={{ fontSize: isCheckmark ? 28 : 14, color: circleTextColor }}
              >
                {circleText}
              </div>
            {circleLabel && <div className="text-[9px] text-gray-400">{circleLabel}</div>}
          </CircleProgress>
      </div>
    </div>
  );
}

const WATER_OPTIONS = [
  { label: "100ml", value: 100 },
  { label: "200ml", value: 200 },
  { label: "250ml", value: 250 },
  { label: "330ml", value: 330 },
  { label: "500ml", value: 500 },
  { label: "750ml", value: 750 },
  { label: "1L", value: 1000 },
];

function WaterMenu({ isOpen, onClose, onSelect }: { isOpen: boolean; onClose: () => void; onSelect: (ml: number) => void }) {
  const [customValue, setCustomValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-white shadow-lg border border-gray-200 z-50">
      <div className="p-2 space-y-1">
        {WATER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onSelect(opt.value); onClose(); }}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 text-sm font-medium text-gray-700 transition-colors"
          >
            💧 {opt.label}
          </button>
        ))}
        <div className="border-t border-gray-100 pt-2 mt-2">
          <div className="flex gap-2 px-1">
            <input
              type="number"
              placeholder="ml"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <button
              onClick={() => {
                const val = parseInt(customValue);
                if (val > 0) { onSelect(val); onClose(); setCustomValue(""); }
              }}
              className="px-3 py-2 bg-teal-400 text-white text-sm font-medium rounded-lg hover:bg-teal-500"
            >
              Add
            </button>
          </div>
        </div>
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
  const [waterMenuOpen, setWaterMenuOpen] = useState(false);

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
    const waterProgress = waterLiters / waterTarget;
    const waterLeft = (waterTarget - waterLiters).toFixed(1);

    let calCircleColor = "#4ECDC4";
    if (isOver) {
      if (surplus <= 100) calCircleColor = "#ffd700";
      else if (surplus <= 300) calCircleColor = "#ff8c00";
      else calCircleColor = "#ff0000";
    }

    const getCalorieStatus = () => {
      if (!isToday) {
        const diff = data.calories - totalTarget;
        if (Math.abs(diff) <= 50) return { text: "On target", color: "#4CAF50", bg: "#E8F5E9" };
        if (diff > 0) {
          // Use the same circle color logic for consistency
          let statusColor = "#ff0000"; // Default red
          let bg = "#FFEBEE";
          if (diff <= 100) {
            statusColor = "#ffd700";
            bg = "#FFFDE7";
          } else if (diff <= 300) {
            statusColor = "#ff8c00";
            bg = "#FFF3E0";
          }
          return { text: "Over limit", color: statusColor, bg: bg };
        }
        return { text: "Under target", color: "#FF9800", bg: "#FFF3E0" };
      }

      if (data.calories === 0) {
        return { text: "No meals logged", color: "#9E9E9E", bg: "#F5F5F5" };
      }

      const now = new Date();
      const hour = now.getHours();
      const dayProgress = Math.max(0, Math.min(1, (hour - 7) / 15));
      const expectedCalories = totalTarget * dayProgress;
      const diff = data.calories - expectedCalories;
      const tolerance = totalTarget * 0.15;

      if (Math.abs(diff) <= tolerance) {
        return { text: "On track", color: "#4CAF50", bg: "#E8F5E9" };
      }
      if (diff > tolerance * 2) {
        return { text: "Way ahead of schedule!", color: "#FF5252", bg: "#FFEBEE" };
      }
      if (diff > tolerance) {
        return { text: "Slightly ahead", color: "#FF9800", bg: "#FFF3E0" };
      }
      if (diff < -tolerance * 2) {
        return { text: "Way behind schedule", color: "#FF9800", bg: "#FFF3E0" };
      }
      return { text: "Slightly behind", color: "#2196F3", bg: "#E3F2FD" };
    };

    const calorieStatus = getCalorieStatus();

    const getWaterStatus = () => {
      if (!isToday) {
        if (waterProgress >= 0.95) return { text: "On target", color: "#4CAF50" };
        return { text: "Under target", color: "#FF9800" };
      }
      
      const now = new Date();
      const hour = now.getHours();
      const dayProgress = Math.max(0, Math.min(1, (hour - 7) / 15));
      const expected = waterTarget * dayProgress;
      const diff = waterLiters - expected;
      const tolerance = waterTarget * 0.15;

      if (waterProgress >= 0.95) return { text: "On target", color: "#4CAF50" };
      if (waterLiters > waterTarget) return { text: "↑ over", color: "#FF5252" };
      if (diff < -tolerance) return { text: "Behind schedule", color: "#FF9800" };
      return { text: "On track", color: "#4CAF50" };
    };

    const waterStatus = getWaterStatus();

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

        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">Daily Calories</h2>
            <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#39B2B0]">
                      <Utensils className="h-4 w-4 text-white" />
                    </div>
                    <span>{data.calories.toLocaleString("it-IT")}/{totalTarget.toLocaleString("it-IT")} <span className="text-gray-400">(goal + active)</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#A8B1CF]">
                      <Flag className="h-4 w-4 text-white" />
                    </div>
                    <span>{BMR.toLocaleString("it-IT")} goal <span className="text-gray-400">(BMR - deficit)</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-[15px]">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF9E57]">
                      <Footprints className="h-4 w-4 text-white" />
                    </div>
                    <span>{data.activeCalories.toLocaleString("it-IT")} active kcal{data.activeCalories > 200 && <span> 🔥</span>}</span>
                  </div>
                  <div 

                    className="mt-3 inline-block rounded-lg px-3 py-2 text-base font-bold"
                    style={{
                      background: calorieStatus.bg,
                      color: calorieStatus.color
                    }}
                  >
                    {calorieStatus.text}
                  </div>
              </div>
              <CircleProgress value={data.calories} max={totalTarget} color={calCircleColor}>
                <div className="text-center text-2xl font-bold" style={{ color: isOver ? calCircleColor : "#333" }}>
                  {isOver ? `+${surplus.toLocaleString("it-IT")}` : caloriesLeft.toLocaleString("it-IT")}
                </div>
                <div className="text-[11px] text-gray-400">
                  {isOver ? "surplus" : "kcal left"}
                </div>
              </CircleProgress>
            </div>
          </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <MacroCard icon="🥩" iconBg="#FFE5E5" name="Protein" value={data.protein} target={96} color="#FF6B9D" isToday={isToday} />
        <MacroCard icon="🍞" iconBg="#FFF4E5" name="Carbs" value={data.carbs} target={160} color="#FFB84D" isToday={isToday} />
        <MacroCard icon="🥑" iconBg="#F0E5FF" name="Fat" value={data.fats} target={64} color="#9C6FFF" isToday={isToday} />
        <MacroCard icon="🌾" iconBg="#E8F5E9" name="Fiber" value={data.fiber} target={30} color="#4CAF50" isToday={isToday} />
      </div>

      <div className="mb-4 flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex-1">
            <div className="mb-2 flex items-center">
              <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-xl">
                💧
              </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {waterLiters.toFixed(1)}/2L
                  </div>
                </div>
            </div>
          <div className="mt-1 text-sm font-semibold" style={{ color: waterStatus.color }}>
            {waterStatus.text}
          </div>
        </div>
        <CircleProgress value={waterLiters} max={waterTarget} size={80} strokeWidth={8}>
          {waterProgress >= 0.95 ? (
            <div className="text-3xl font-bold">✓</div>
          ) : (
            <>
              <div className="text-lg font-bold text-gray-900">{waterLeft}L</div>
              <div className="text-[10px] text-gray-400">left</div>
            </>
          )}
        </CircleProgress>
      </div>

      {data.alcohol && (
        <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center">
            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-xl">
              🍷
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">{data.alcohol.grams}g</span>
                <span className="text-lg text-slate-500">→ {data.alcohol.calories} Kcal Alcohol intake</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-slate-400 font-medium italic">(Based on your weight)</span>
                <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-700">on track</span>
              </div>
            </div>
          </div>
        </div>
      )}

          <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-slate-800">
              Food log → {data.calories} Kcal total
            </h2>
            {!isToday && data.meals && data.meals.length > 0 ? (
              <div className="space-y-4">
                {data.meals.map((meal, mealIndex) => (
                  <div key={mealIndex} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="font-bold text-gray-800">{meal.meal}</span>
                      <span className="text-sm font-semibold text-teal-400">{meal.totalCalories} Kcal</span>
                    </div>
                    <div className="space-y-2 pl-2">
                      {meal.foods.map((food, foodIndex) => (
                        <div key={foodIndex} className="border-l-2 border-gray-200 pl-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-700">{food.name}</span>
                            <span className="text-xs text-gray-400">{food.calories} kcal</span>
                          </div>
                          <div className="flex gap-2 text-xs text-gray-400">
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
              <div className="py-5 text-center text-gray-400">Nessun cibo loggato</div>
            ) : (
              <div className="space-y-3">
                {(showAllFoods ? data.foods : data.foods.slice(0, INITIAL_FOODS_DISPLAY)).map((food, i) => (
                  <div key={i} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="mb-1.5 flex justify-between">
                      <span className="font-medium">{food.name}</span>
                      <span className="text-sm text-gray-400">
                        {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="mb-1.5 font-semibold text-teal-400">• {food.calories} Kcal</div>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span>🥩 {food.pro || 0}g</span>
                      <span>🍞 {food.carb || 0}g</span>
                      <span>🥑 {food.fat || 0}g</span>
                      <span>🌾 {food.fiber || 0}g</span>
                    </div>
                  </div>
                ))}
                {data.foods.length > INITIAL_FOODS_DISPLAY && (
                  <button
                    onClick={() => setShowAllFoods(!showAllFoods)}
                    className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-200"
                  >
                    {showAllFoods ? "Mostra meno" : `Mostra altri ${data.foods.length - INITIAL_FOODS_DISPLAY} cibi`}
                  </button>
                )}
              </div>
            )}
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
