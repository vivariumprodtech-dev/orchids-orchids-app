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

function UtensilsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="10" fill="#2BB0BB"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 4.5C5.77614 4.5 6 4.72386 6 5V8.5C6 8.77386 6.22614 9 6.5 9H8.5C8.63261 9 8.75978 8.94732 8.85355 8.85355C8.94732 8.75978 9 8.63261 9 8.5V5C9 4.72386 9.22386 4.5 9.5 4.5C9.77614 4.5 10 4.72386 10 5V8.5C10 8.89783 9.84196 9.27936 9.56066 9.56066C9.27936 9.84196 8.89783 10 8.5 10H6.5C5.67386 10 5 9.32614 5 8.5V5C5 4.72386 5.22386 4.5 5.5 4.5Z" fill="white"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 4.5C7.77614 4.5 8 4.72386 8 5V15C8 15.2761 7.77614 15.5 7.5 15.5C7.22386 15.5 7 15.2761 7 15V5C7 4.72386 7.22386 4.5 7.5 4.5Z" fill="white"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12.3787 5.37868C12.9413 4.81607 13.7044 4.5 14.5 4.5C14.6326 4.5 14.7598 4.55268 14.8536 4.64645C14.9473 4.74021 15 4.86739 15 5V15C15 15.2761 14.7761 15.5 14.5 15.5C14.2239 15.5 14 15.2761 14 15V12H13C12.1739 12 11.5 11.3261 11.5 10.5V7.5C11.5 6.70435 11.8161 5.94129 12.3787 5.37868ZM14 11V5.5635C13.657 5.65208 13.3406 5.83102 13.0858 6.08579C12.7107 6.46086 12.5 6.96957 12.5 7.5V10.5C12.5 10.7739 12.7261 11 13 11H14Z" fill="white"/>
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="10" fill="#9FA5BC"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.2518 4.78576C6.62974 4.63459 7.19364 4.5 8 4.5C8.84672 4.5 9.54835 4.78074 10.1578 5.02462C10.1671 5.02834 10.1764 5.03206 10.1857 5.03576C10.8197 5.28938 11.3597 5.5 12 5.5C12.6936 5.5 13.1297 5.38459 13.3768 5.28576C13.5008 5.23617 13.5795 5.18986 13.6211 5.1621C13.6418 5.14828 13.6537 5.13885 13.6576 5.1356C13.8005 5.00132 14.0093 4.96266 14.1913 5.03806C14.3782 5.11545 14.5 5.29777 14.5 5.5V11.5C14.5 11.6326 14.4473 11.7598 14.3536 11.8536L14 11.5C14.3536 11.8536 14.3533 11.8538 14.353 11.8541L14.3514 11.8557C14.3506 11.8565 14.3498 11.8572 14.349 11.8581C14.3473 11.8597 14.3456 11.8614 14.3436 11.8632C14.3398 11.8669 14.3353 11.871 14.3304 11.8756C14.3204 11.8847 14.3081 11.8954 14.2934 11.9074C14.2641 11.9316 14.2252 11.9612 14.1758 11.9942C14.0768 12.0601 13.9367 12.1388 13.7482 12.2142C13.3703 12.3654 12.8064 12.5 12 12.5C11.1533 12.5 10.4517 12.2193 9.84216 11.9754L9.8143 11.9642C9.18026 11.7106 8.64035 11.5 8 11.5C7.30636 11.5 6.87026 11.6154 6.6232 11.7142C6.49922 11.7638 6.42055 11.8101 6.37891 11.8379C6.35818 11.8517 6.34631 11.8612 6.34236 11.8644C6.1995 11.9987 5.99068 12.0373 5.80866 11.9619C5.62182 11.8845 5.5 11.7022 5.5 11.5V5.5C5.5 5.36739 5.55268 5.24021 5.64645 5.14645L6 5.5C5.64645 5.14645 5.64671 5.14619 5.64697 5.14592L5.64751 5.14539C5.64787 5.14503 5.64824 5.14466 5.64862 5.14429C5.64938 5.14354 5.65017 5.14276 5.651 5.14195C5.65265 5.14033 5.65444 5.1386 5.65637 5.13676C5.66024 5.13308 5.66465 5.12895 5.66965 5.12441C5.67963 5.11534 5.69189 5.10463 5.70656 5.09255C5.73592 5.06838 5.77481 5.03879 5.82421 5.00585C5.9232 4.93986 6.06328 4.86117 6.2518 4.78576ZM6.5 5.76903V10.6984C6.8638 10.5863 7.35412 10.5 8 10.5C8.84672 10.5 9.54835 10.7807 10.1578 11.0246L10.1857 11.0358C10.8197 11.2894 11.3597 11.5 12 11.5C12.6936 11.5 13.1297 11.3846 13.3768 11.2858C13.4244 11.2667 13.4653 11.2482 13.5 11.231V6.3016C13.1362 6.41365 12.6459 6.5 12 6.5C11.1533 6.5 10.4516 6.21926 9.84216 5.97538C9.83285 5.97166 9.82357 5.96794 9.8143 5.96424C9.18026 5.71062 8.64035 5.5 8 5.5C7.30636 5.5 6.87026 5.61541 6.6232 5.71424C6.57561 5.73327 6.5347 5.75182 6.5 5.76903ZM6.35252 11.8546L6.35254 11.8546L6.35259 11.8545C6.35256 11.8545 6.35254 11.8546 6.35252 11.8546Z" fill="white"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M6 11C6.27614 11 6.5 11.2239 6.5 11.5V15C6.5 15.2761 6.27614 15.5 6 15.5C5.72386 15.5 5.5 15.2761 5.5 15V11.5C5.5 11.2239 5.72386 11 6 11Z" fill="white"/>
    </svg>
  );
}

function FootprintsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="10" fill="#FF9D52"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M6.48728 6.2602C6.17442 6.74732 6.00695 7.4015 6.00029 8.00551L6.00028 8.006C5.99373 8.55197 6.10008 8.92971 6.22272 9.32966C6.22995 9.35323 6.23728 9.37698 6.24467 9.40094C6.36426 9.78869 6.50032 10.2298 6.50032 10.81V12C6.50032 12.1326 6.553 12.2598 6.64677 12.3536C6.74053 12.4473 6.86771 12.5 7.00032 12.5C7.13293 12.5 7.2601 12.4473 7.35387 12.3536C7.44764 12.2598 7.50032 12.1326 7.50032 12V11.09C7.50032 10.2533 7.77198 9.49109 8.0128 8.81543C8.01832 8.79995 8.02382 8.7845 8.02931 8.76911C8.28329 8.05606 8.50032 7.42791 8.50032 6.75C8.50032 6.37383 8.4286 6.03602 8.29542 5.81051C8.17914 5.61362 8.02107 5.5 7.75032 5.5C7.20983 5.5 6.79292 5.78429 6.48728 6.2602ZM5.64586 5.7198C6.08521 5.03571 6.78581 4.5 7.75032 4.5C8.41457 4.5 8.88149 4.83638 9.15647 5.30199C9.41454 5.73898 9.50032 6.27617 9.50032 6.75C9.50032 7.61965 9.22213 8.40059 8.9776 9.08705L8.97133 9.10464C8.71606 9.82131 8.50032 10.4359 8.50032 11.09V12C8.50032 12.3978 8.34228 12.7794 8.06098 13.0607C7.77968 13.342 7.39814 13.5 7.00032 13.5C6.60249 13.5 6.22096 13.342 5.93966 13.0607C5.65835 12.7794 5.50032 12.3978 5.50032 12V10.81C5.50032 10.3835 5.40423 10.0707 5.28182 9.6722C5.27681 9.65589 5.27176 9.63944 5.26666 9.62284C5.13557 9.19533 4.99194 8.69814 5.00035 7.99422C5.00874 7.2383 5.21376 6.3926 5.64586 5.7198Z" fill="white"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M10.8438 7.30199C11.1188 6.83638 11.5857 6.5 12.25 6.5C13.2145 6.5 13.9151 7.03571 14.3545 7.7198C14.7865 8.39254 14.9915 9.23814 15 9.994C15 9.99404 15 9.99409 15 9.99413C15.0084 10.6981 14.8648 11.1953 14.7337 11.6228C14.7286 11.6394 14.7235 11.6559 14.7185 11.6722C14.5961 12.0707 14.5 12.3835 14.5 12.81V14C14.5 14.3978 14.342 14.7794 14.0607 15.0607C13.7794 15.342 13.3978 15.5 13 15.5C12.6022 15.5 12.2206 15.342 11.9393 15.0607C11.658 14.7794 11.5 14.3978 11.5 14V13.09C11.5 12.4359 11.2843 11.8213 11.029 11.1046L11.0227 11.0871C10.7782 10.4006 10.5 9.61965 10.5 8.75C10.5 8.27617 10.5858 7.73898 10.8438 7.30199ZM11.7049 7.81051C11.5717 8.03602 11.5 8.37383 11.5 8.75C11.5 9.42791 11.717 10.0561 11.971 10.7691C11.9765 10.7845 11.982 10.7999 11.9875 10.8154C12.2283 11.4911 12.5 12.2533 12.5 13.09V14C12.5 14.1326 12.5527 14.2598 12.6464 14.3536C12.7402 14.4473 12.8674 14.5 13 14.5C13.1326 14.5 13.2598 14.4473 13.3536 14.3536C13.4473 14.2598 13.5 14.1326 13.5 14V12.81C13.5 12.2298 13.6361 11.7887 13.7557 11.4009C13.763 11.377 13.7704 11.3532 13.7776 11.3297C13.9002 10.9297 14.0066 10.552 14 10.006L14 10.0055C13.9934 9.4015 13.8259 8.74732 13.513 8.2602C13.2074 7.78429 12.7905 7.5 12.25 7.5C11.9793 7.5 11.8212 7.61362 11.7049 7.81051Z" fill="white"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M11.5 12.5C11.5 12.2239 11.7239 12 12 12H14C14.2761 12 14.5 12.2239 14.5 12.5C14.5 12.7761 14.2761 13 14 13H12C11.7239 13 11.5 12.7761 11.5 12.5Z" fill="white"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 10.5C5.5 10.2239 5.72386 10 6 10H8C8.27614 10 8.5 10.2239 8.5 10.5C8.5 10.7761 8.27614 11 8 11H6C5.72386 11 5.5 10.7761 5.5 10.5Z" fill="white"/>
    </svg>
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
                      <UtensilsIcon />
                      <span>{data.calories.toLocaleString("it-IT")}/{totalTarget.toLocaleString("it-IT")} <span className="text-gray-400">(goal + active)</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-[15px]">
                      <FlagIcon />
                      <span>{BMR.toLocaleString("it-IT")} goal <span className="text-gray-400">(BMR - deficit)</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-[15px]">
                      <FootprintsIcon />
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
