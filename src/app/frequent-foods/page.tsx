"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, useMemo } from "react";
import { User2, ChevronDown, ChevronLeft, ChevronRight, Search, Plus, Utensils, GlassWater, Footprints, Salad, Apple, Cookie } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BadgeIconSm, { BadgeIconColors } from "@/components/BadgeIconSm";

type MealMoment = "breakfast" | "morning_snack" | "lunch" | "afternoon_snack" | "dinner";

interface FrequentFood {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  count: number;
  meal?: string;
}

type FilterType = "all" | "fullmeal" | "single" | "snack";
type TabType = "food" | "water" | "activity";

function getFoodEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("skyr") || n.includes("yogurt") || n.includes("greco")) return "🍦";
  if (n.includes("pane") || n.includes("bread") || n.includes("focaccia") || n.includes("crackers") || n.includes("gallette")) return "🍞";
  if (n.includes("cioccolato") || n.includes("chocolate") || n.includes("fondente") || n.includes("cacao")) return "🍫";
  if (n.includes("pasta") || n.includes("spaghetti") || n.includes("fusilli") || n.includes("penne")) return "🍝";
  if (n.includes("pollo") || n.includes("chicken") || n.includes("tacchino") || n.includes("fesa")) return "🍗";
  if (n.includes("mela") || n.includes("apple") || n.includes("pera") || n.includes("pesca")) return "🍎";
  if (n.includes("insalata") || n.includes("salad") || n.includes("lattuga") || n.includes("pomodori")) return "🥗";
  if (n.includes("salmone") || n.includes("salmon") || n.includes("tonno") || n.includes("merluzzo") || n.includes("pesce")) return "🐟";
  if (n.includes("verdure") || n.includes("vegetables") || n.includes("broccoli") || n.includes("zucchine") || n.includes("spinaci")) return "🥦";
  if (n.includes("uova") || n.includes("egg") || n.includes("uovo")) return "🥚";
  if (n.includes("carne") || n.includes("meat") || n.includes("manzo") || n.includes("bistecca") || n.includes("hamburger") || n.includes("tagliata")) return "🥩";
  if (n.includes("riso") || n.includes("rice")) return "🍚";
  if (n.includes("latte") || n.includes("milk")) return "🥛";
  if (n.includes("caffè") || n.includes("coffee")) return "☕";
  if (n.includes("banana")) return "🍌";
  if (n.includes("pizza")) return "🍕";
  if (n.includes("frutta") || n.includes("fruit") || n.includes("fragole") || n.includes("mirtilli")) return "🍓";
  if (n.includes("mandorle") || n.includes("nuts") || n.includes("noci") || n.includes("nocciole") || n.includes("burro d'arachidi")) return "🥜";
  if (n.includes("formaggio") || n.includes("cheese") || n.includes("mozzarella") || n.includes("parmigiano") || n.includes("ricotta")) return "🧀";
  if (n.includes("biscotti") || n.includes("cookies") || n.includes("cookie")) return "🍪";
  if (n.includes("birra") || n.includes("beer")) return "🍺";
  if (n.includes("vino") || n.includes("wine")) return "🍷";
  return "🍲";
}

// Activity types with their properties
interface ActivityItem {
  id: string;
  name: string;
  emoji: string;
  unit: string;
  min: number;
  max: number;
  defaultValue: number;
  step: number;
}

const activityItems: ActivityItem[] = [
  { id: "active_kcal", name: "Active kcal", emoji: "🏃", unit: "kcal", min: 50, max: 1000, defaultValue: 250, step: 10 },
  { id: "steps", name: "Steps", emoji: "👣", unit: "steps", min: 1000, max: 30000, defaultValue: 5000, step: 500 },
  { id: "walking", name: "Walking", emoji: "🚶", unit: "hour", min: 0, max: 180, defaultValue: 60, step: 15 },
  { id: "running", name: "Running", emoji: "🏃", unit: "min", min: 0, max: 120, defaultValue: 30, step: 5 },
  { id: "biking", name: "Biking", emoji: "🚴", unit: "min", min: 0, max: 180, defaultValue: 30, step: 5 },
  { id: "training", name: "Training", emoji: "🏋️", unit: "hour", min: 0, max: 180, defaultValue: 60, step: 15 },
];

function FrequentFoodsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [activeTab, setActiveTab] = useState<TabType>("food");
  const [searchQuery, setSearchQuery] = useState("");
  const [activitySearchQuery, setActivitySearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [frequentFoods, setFrequentFoods] = useState<FrequentFood[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date & moment picker state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMoment, setSelectedMoment] = useState<MealMoment>("lunch");
  const [showMomentPicker, setShowMomentPicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  
  // Toast for feedback
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const formatDateDisplay = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return "Today";
    
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const momentLabels: Record<MealMoment, string> = {
      breakfast: "Breakfast",
      morning_snack: "Morning S.",
      lunch: "Lunch", 
      afternoon_snack: "Afternoon S.",
      dinner: "Dinner"
    };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handlePrevMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    if (isFuture(day)) return;
    const newDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    const today = new Date();
    setCalendarMonth(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const isSelectedDay = (day: number) => {
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    return checkDate.toISOString().split('T')[0] === selectedDate;
  };

  const isToday = (day: number) => {
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    return checkDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  };

  const isFuture = (day: number) => {
    const checkDate = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  // Load frequent foods from user's food logs
  useEffect(() => {
    const fetchFrequentFoods = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Get all daily logs for this user
        const { data: logs, error: logsError } = await supabase
          .from("daily_logs")
          .select("id")
          .eq("user_id", userId);

        if (logsError || !logs || logs.length === 0) {
          setFrequentFoods([]);
          setLoading(false);
          return;
        }

        const logIds = logs.map(l => l.id);

        // Get all food entries for these logs
        const { data: foods, error: foodsError } = await supabase
          .from("food_entries")
          .select("name, grams, calories, protein, carbs, fats, fiber, meal")
          .in("log_id", logIds);

        if (foodsError || !foods) {
          setFrequentFoods([]);
          setLoading(false);
          return;
        }

        // Aggregate by food name (case-insensitive)
        const foodMap: Record<string, FrequentFood> = {};
        
        foods.forEach(f => {
          const key = f.name.toLowerCase().trim();
          if (!foodMap[key]) {
            foodMap[key] = {
              name: f.name,
              grams: f.grams || 0,
              calories: f.calories || 0,
              protein: f.protein || 0,
              carbs: f.carbs || 0,
              fats: f.fats || 0,
              fiber: f.fiber || 0,
              count: 0,
              meal: f.meal
            };
          }
          foodMap[key].count += 1;
          // Use averages for nutritional values
          const current = foodMap[key];
          const newCount = current.count;
          current.grams = Math.round((current.grams * (newCount - 1) + (f.grams || 0)) / newCount);
          current.calories = Math.round((current.calories * (newCount - 1) + (f.calories || 0)) / newCount);
          current.protein = Math.round((current.protein * (newCount - 1) + (f.protein || 0)) / newCount);
          current.carbs = Math.round((current.carbs * (newCount - 1) + (f.carbs || 0)) / newCount);
          current.fats = Math.round((current.fats * (newCount - 1) + (f.fats || 0)) / newCount);
          current.fiber = Math.round((current.fiber * (newCount - 1) + (f.fiber || 0)) / newCount);
        });

        // Convert to array and sort by frequency
        const sortedFoods = Object.values(foodMap)
          .filter(f => f.count >= 1) // Show foods that appear at least once
          .sort((a, b) => b.count - a.count);

        setFrequentFoods(sortedFoods);
      } catch (err) {
        console.error("Error fetching frequent foods:", err);
        setFrequentFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFrequentFoods();
  }, [userId]);

  // Filter foods based on search and filter type
  const filteredFoods = useMemo(() => {
    let result = frequentFoods;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(query));
    }

    // Apply category filter
    if (activeFilter !== "all") {
      result = result.filter(f => {
        const meal = f.meal?.toLowerCase() || "";
        switch (activeFilter) {
          case "fullmeal":
            return meal === "breakfast" || meal === "lunch" || meal === "dinner" || meal === "colazione" || meal === "pranzo" || meal === "cena";
          case "single":
            return !meal || meal === "";
          case "snack":
            return meal === "snack" || meal === "spuntino" || meal === "morning" || meal === "afternoon" || meal === "night";
          default:
            return true;
        }
      });
    }

    return result;
  }, [frequentFoods, searchQuery, activeFilter]);

  // Add food to log
  const handleAddFood = async (food: FrequentFood) => {
    if (!userId) return;

    try {
      // Get or create daily log for selected date
      let { data: log, error: logError } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("date", selectedDate)
        .maybeSingle();

      if (logError) throw logError;

      let logId = log?.id;

      if (!logId) {
        const { data: newLog, error: createError } = await supabase
          .from("daily_logs")
          .insert({ user_id: userId, date: selectedDate })
          .select("id")
          .single();

        if (createError) throw createError;
        logId = newLog.id;
      }

      // Insert food entry
      const { error: insertError } = await supabase.from("food_entries").insert({
        log_id: logId,
        name: food.name,
        meal: selectedMoment,
        grams: food.grams,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        fiber: food.fiber,
        intake_time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      });

      if (insertError) throw insertError;

      showToast(`${food.name} aggiunto a ${momentLabels[selectedMoment]}`);
    } catch (err) {
      console.error("Error adding food:", err);
      showToast("Errore nell'aggiunta del cibo");
    }
  };

  // Add water to log
  const handleAddWater = async (ml: number) => {
    if (!userId) return;

    try {
      let { data: log, error: logError } = await supabase
        .from("daily_logs")
        .select("id, water_ml")
        .eq("user_id", userId)
        .eq("date", selectedDate)
        .maybeSingle();

      if (logError) throw logError;

      let logId = log?.id;
      const currentWater = log?.water_ml || 0;

      if (!logId) {
        const { data: newLog, error: createError } = await supabase
          .from("daily_logs")
          .insert({ user_id: userId, date: selectedDate, water_ml: ml })
          .select("id")
          .single();

        if (createError) throw createError;
        logId = newLog.id;
      } else {
        const { error: updateError } = await supabase
          .from("daily_logs")
          .update({ water_ml: currentWater + ml })
          .eq("id", logId);

        if (updateError) throw updateError;
      }

      showToast(`${ml}ml of water added`);
    } catch (err) {
      console.error("Error adding water:", err);
      showToast("Error adding water");
    }
  };

  // Add activity to log
  const handleAddActivity = async (activityId: string, value: number, unit: string) => {
    if (!userId) return;

    try {
      let { data: log, error: logError } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("date", selectedDate)
        .maybeSingle();

      if (logError) throw logError;

      let logId = log?.id;

      if (!logId) {
        const { data: newLog, error: createError } = await supabase
          .from("daily_logs")
          .insert({ user_id: userId, date: selectedDate })
          .select("id")
          .single();

        if (createError) throw createError;
        logId = newLog.id;
      }

      // Update specific activity field based on activityId
      const updateData: Record<string, number> = {};
      if (activityId === "active_kcal") updateData.active_kcal = value;
      else if (activityId === "steps") updateData.steps = value;
      else if (activityId === "walking") updateData.walking_minutes = unit === "hour" ? value : Math.round(value / 60);
      else if (activityId === "running") updateData.running_minutes = value;
      else if (activityId === "biking") updateData.biking_minutes = value;
      else if (activityId === "training") updateData.training_minutes = unit === "hour" ? value : Math.round(value / 60);

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("daily_logs")
          .update(updateData)
          .eq("id", logId);

        if (updateError) throw updateError;
      }

      const activity = activityItems.find(a => a.id === activityId);
      showToast(`${activity?.name || "Activity"} added: ${value} ${unit}`);
    } catch (err) {
      console.error("Error adding activity:", err);
      showToast("Error adding activity");
    }
  };

  // Filter activities based on search
  const filteredActivities = useMemo(() => {
    if (!activitySearchQuery.trim()) return activityItems;
    const query = activitySearchQuery.toLowerCase();
    return activityItems.filter(a => a.name.toLowerCase().includes(query));
  }, [activitySearchQuery]);

  const handleProfileClick = () => {
    router.push(`/profile?userId=${userId || ""}`);
  };

    return (
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900 overflow-y-auto scrollbar-hide">
        <style jsx global>{`
            html, body {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            html::-webkit-scrollbar, body::-webkit-scrollbar {
              display: none !important;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none !important;
            }
            .scrollbar-hide {
              -ms-overflow-style: none !important;
              scrollbar-width: none !important;
            }
            * {
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            *::-webkit-scrollbar {
              display: none !important;
            }
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #5A658D;
              cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #5A658D;
              cursor: pointer;
              border: none;
            }
          `}</style>

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-100 px-5 pt-5 border-b-2 border-[#ECEDF2]">
          <div className="mb-3 flex items-center justify-between">
            {/* Logo */}
            <div
              className="text-3xl font-bold"
              style={{
                background: "linear-gradient(90deg, #7DD3C0 0%, #A8B8E6 50%, #D4A5E8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Giada.
            </div>

            <div className="flex items-center gap-2">
              {/* Date & Moment Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowMomentPicker(!showMomentPicker)}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-caption-custom text-[var(--text-secondary)] transition-colors active:bg-gray-200"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.6667 2.66667H3.33333C2.59695 2.66667 2 3.26362 2 4V13.3333C2 14.0697 2.59695 14.6667 3.33333 14.6667H12.6667C13.403 14.6667 14 14.0697 14 13.3333V4C14 3.26362 13.403 2.66667 12.6667 2.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M10.6667 1.33333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M5.33333 1.33333V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 6.66667H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{formatDateDisplay(selectedDate)}{activeTab === "food" ? ` - ${momentLabels[selectedMoment]}` : ""}</span>
                    <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                </button>

                  {showMomentPicker && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl bg-white p-4 shadow-lg border border-gray-100">
                        {/* Date selector - Custom Calendar */}
                        <div className="mb-4">
                          <label className="mb-2 block text-caption-custom text-[var(--text-tertiary)]">Date</label>
                          
                          {/* Calendar Header */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-body-sm-custom text-[var(--text-secondary)] font-medium">{formatMonthYear(calendarMonth)}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePrevMonth}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F9F9FB] text-[var(--text-secondary)] hover:bg-gray-200 transition-colors"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                onClick={handleNextMonth}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F9F9FB] text-[var(--text-secondary)] hover:bg-gray-200 transition-colors"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                          
                          {/* Day Labels */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                              <div key={i} className="text-center text-caption-custom text-[var(--text-tertiary)]">
                                {day}
                              </div>
                            ))}
                          </div>
                          
                          {/* Calendar Days */}
                          <div className="grid grid-cols-7 gap-1">
                            {getDaysInMonth(calendarMonth).map((day, i) => (
                              <div key={i} className="aspect-square">
                                {day && (
                                  <button
                                    onClick={() => handleSelectDay(day)}
                                    disabled={isFuture(day)}
                                    className={`w-full h-full flex items-center justify-center rounded-full text-body-sm-custom transition-colors ${
                                      isSelectedDay(day)
                                        ? "bg-[#009EAB] text-white"
                                        : isToday(day)
                                        ? "bg-[#9EDDE2] text-[#262C44]"
                                        : isFuture(day)
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-[var(--text-secondary)] hover:bg-[#F9F9FB]"
                                    }`}
                                  >
                                    {day}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Today Button */}
                          <div className="flex justify-end mt-3">
                            <button
                              onClick={handleToday}
                              className="text-body-sm-custom text-[#009EAB] font-medium hover:underline"
                            >
                              Today
                            </button>
                          </div>
                        </div>
                        
                        {/* Moment selector - only for food tab */}
                        {activeTab === "food" && (
                          <div>
                            <label className="mb-1.5 block text-caption-custom text-[var(--text-tertiary)]">Moment</label>
                            <div className="flex flex-wrap gap-2">
                              {(["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"] as MealMoment[]).map(moment => (
                                <button
                                  key={moment}
                                  onClick={() => {
                                    setSelectedMoment(moment);
                                    setShowMomentPicker(false);
                                  }}
                                  className={`rounded-full px-3 py-2 text-body-sm-custom transition-colors ${
                                    selectedMoment === moment
                                      ? "bg-[#009EAB] text-white"
                                      : "bg-[#F9F9FB] text-[var(--text-tertiary)] hover:bg-gray-200"
                                  }`}
                                >
                                  {momentLabels[moment]}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
              </div>

              {/* Profile Button */}
              <button
                onClick={handleProfileClick}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--text-secondary)] transition-all active:scale-95 active:bg-[#5A658D]/20"
              >
                <User2 size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="pb-3 flex gap-2">
                  <button
                    onClick={() => setActiveTab("food")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-full text-caption-custom transition-all whitespace-nowrap ${
                      activeTab === "food"
                        ? "bg-[#9EDDE2] text-[#262C44]"
                        : "bg-white text-[var(--text-secondary)]"
                    }`}
                    style={{ height: "32px", paddingLeft: "12px", paddingRight: "12px" }}
                  >
                    <Utensils size={16} />
                    <span>Frequent food</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("water")}
                    className={`flex items-center justify-center gap-2 rounded-full text-caption-custom transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === "water"
                        ? "bg-[#9EDDE2] text-[#262C44]"
                        : "bg-white text-[var(--text-secondary)]"
                    }`}
                    style={{ height: "32px", paddingLeft: "12px", paddingRight: "12px" }}
                  >
                    <GlassWater size={16} />
                    <span>Water</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("activity")}
                    className={`flex items-center justify-center gap-2 rounded-full text-caption-custom transition-all whitespace-nowrap flex-shrink-0 ${
                      activeTab === "activity"
                        ? "bg-[#9EDDE2] text-[#262C44]"
                        : "bg-white text-[var(--text-secondary)]"
                    }`}
                    style={{ height: "32px", paddingLeft: "12px", paddingRight: "12px" }}
                  >
                    <Footprints size={16} />
                    <span>Activity</span>
                  </button>
              </div>

          {/* Search Row (only if tab is food) */}
            {activeTab === "food" && (
              <div className="pb-3">
                <div
                  className="flex items-center gap-2 rounded-full px-4"
                  style={{ backgroundColor: "#ECEDF2", height: "40px" }}
                >
                  <Search size={16} className="text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search for food..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-body-sm-custom placeholder:text-[var(--text-secondary)] focus:outline-none"
                    style={{ color: "var(--text-secondary)" }}
                  />
                </div>
              </div>
            )}

          {/* Search Row (only if tab is activity) */}
            {activeTab === "activity" && (
              <div className="pb-3">
                <div
                  className="flex items-center gap-2 rounded-full px-4"
                  style={{ backgroundColor: "#ECEDF2", height: "40px" }}
                >
                  <Search size={16} className="text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search for activity..."
                    value={activitySearchQuery}
                    onChange={(e) => setActivitySearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-body-sm-custom placeholder:text-[var(--text-secondary)] focus:outline-none"
                    style={{ color: "var(--text-secondary)" }}
                  />
                </div>
              </div>
            )}

          {/* Filters Row (only if tab is food) */}
          {activeTab === "food" && (
            <div className="pb-3 flex gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
              {[
                { key: "all" as FilterType, label: "All", icon: null },
                { key: "fullmeal" as FilterType, label: "Full meal", icon: <Salad size={16} /> },
                { key: "single" as FilterType, label: "Single", icon: <Apple size={16} /> },
                { key: "snack" as FilterType, label: "Snack", icon: <Cookie size={16} /> },
              ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setActiveFilter(filter.key)}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-full text-caption-custom transition-colors flex-shrink-0 ${
                      activeFilter === filter.key
                        ? "bg-[var(--text-secondary)] text-[var(--text-invert)]"
                        : "bg-white text-[var(--text-secondary)]"
                    }`}
                    style={{ height: "32px", paddingLeft: "12px", paddingRight: "12px" }}
                  >
                  {filter.icon}
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        <div 
          className="px-5 pb-20 space-y-4" 
          style={{ paddingTop: activeTab === "food" ? "230px" : activeTab === "activity" ? "190px" : "150px" }}
        >
          {activeTab === "food" && (
          <>
            {/* Food List */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#009EAB] border-t-transparent" />
                </div>
              ) : filteredFoods.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
                  <div className="text-4xl mb-4">🍽️</div>
                  <p className="text-[#5A658D]">
                    {searchQuery ? "Nessun cibo trovato" : "Nessun cibo frequente disponibile"}
                  </p>
                </div>
              ) : (
                filteredFoods.map((food, index) => (
                  <FoodCard
                    key={`${food.name}-${index}`}
                    food={food}
                    onAdd={() => handleAddFood(food)}
                  />
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "water" && (
            <div className="space-y-3">
              <WaterCard onAdd={handleAddWater} />
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-3">
              {filteredActivities.map(activity => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  onAdd={(value) => handleAddActivity(activity.id, value, activity.unit)}
                />
              ))}
            </div>
          )}
      </div>

      {/* Toast */}
      {toast.visible && (
        <div
          className="fixed bottom-10 left-5 right-5 z-[100] flex h-[64px] items-center gap-3 rounded-full px-4 shadow-lg animate-in fade-in slide-in-from-bottom-5 duration-300"
          style={{
            backgroundColor: "rgba(38, 44, 68, 0.88)",
            backdropFilter: "blur(8px)"
          }}
        >
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "#2BB0BB" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-white font-medium text-body-md-custom">{toast.message}</span>
        </div>
      )}

      {/* Click outside to close moment picker */}
      {showMomentPicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMomentPicker(false)}
        />
      )}
    </div>
  );
}

function FoodCard({ food, onAdd }: { food: FrequentFood; onAdd: () => void }) {
  const [sliderValue, setSliderValue] = useState(food.grams);
  
  const ratio = food.grams > 0 ? sliderValue / food.grams : 1;
  const displayCalories = Math.round(food.calories * ratio);
  const displayProtein = Math.round(food.protein * ratio);
  const displayCarbs = Math.round(food.carbs * ratio);
  const displayFats = Math.round(food.fats * ratio);
  const displayFiber = Math.round(food.fiber * ratio);

  return (
    <div className="relative rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        {/* Food emoji */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "#F9F9FB" }}
        >
          <span style={{ fontSize: "18px" }}>{getFoodEmoji(food.name)}</span>
        </div>

        <div className="flex-1">
          {/* Food name */}
          <div className="mb-1">
            <span className="text-title-custom">{food.name}</span>
          </div>

          {/* Macros */}
          <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Protein }} />
              <span className="text-body-sm-custom">PRO {displayProtein}g</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Fiber }} />
              <span className="text-body-sm-custom">FIB {displayFiber}g</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Carbo }} />
              <span className="text-body-sm-custom">CAR {displayCarbs}g</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BadgeIconColors.Fat }} />
              <span className="text-body-sm-custom">FAT {displayFats}g</span>
            </div>
          </div>

          {/* Slider */}
          <div className="mb-3">
            <input
              type="range"
              min={10}
              max={Math.max(500, food.grams * 2)}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #5A658D 0%, #5A658D ${((sliderValue - 10) / (Math.max(500, food.grams * 2) - 10)) * 100}%, #E5E7EB ${((sliderValue - 10) / (Math.max(500, food.grams * 2) - 10)) * 100}%, #E5E7EB 100%)`
              }}
            />
          </div>

            {/* Calories and grams with + button */}
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-body-sm-custom">{displayCalories}</span>
                <span className="text-body-sm-custom">Kcal</span>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-subtitle-1-custom">{sliderValue}</span>
                <span className="text-body-sm-custom">g</span>
              </div>
              <button
                onClick={onAdd}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors active:opacity-80"
                style={{ backgroundColor: "#009EAB" }}
              >
                <Plus size={16} color="#FFFFFF" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
}

function WaterCard({ onAdd }: { onAdd: (ml: number) => void }) {
  const [sliderValue, setSliderValue] = useState(250);
  const min = 50;
  const max = 1000;

  return (
    <div className="relative rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        {/* Water emoji */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "#F9F9FB" }}
        >
          <span style={{ fontSize: "18px" }}>💧</span>
        </div>
        <span className="text-title-custom">Water</span>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min={min}
          max={max}
          step={50}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #5A658D 0%, #5A658D ${((sliderValue - min) / (max - min)) * 100}%, #E5E7EB ${((sliderValue - min) / (max - min)) * 100}%, #E5E7EB 100%)`
          }}
        />
      </div>

      {/* Value and add button */}
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-baseline gap-0.5">
          <span className="text-subtitle-1-custom">{sliderValue}</span>
          <span className="text-body-sm-custom">ml</span>
        </div>
        <button
          onClick={() => onAdd(sliderValue)}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors active:opacity-80"
          style={{ backgroundColor: "#009EAB" }}
        >
          <Plus size={16} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
}

function ActivityCard({ activity, onAdd }: { activity: ActivityItem; onAdd: (value: number) => void }) {
  const [sliderValue, setSliderValue] = useState(activity.defaultValue);

  // Format display value based on unit
  const formatValue = () => {
    if (activity.unit === "hour") {
      return sliderValue >= 60 ? Math.round(sliderValue / 60) : sliderValue;
    }
    return sliderValue;
  };

  const formatUnit = () => {
    if (activity.unit === "hour") {
      return sliderValue >= 60 ? "hour" : "min";
    }
    return activity.unit;
  };

  return (
    <div className="relative rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        {/* Activity emoji */}
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: "#F9F9FB" }}
        >
          <span style={{ fontSize: "18px" }}>{activity.emoji}</span>
        </div>
        <span className="text-title-custom">{activity.name}</span>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <input
          type="range"
          min={activity.min}
          max={activity.max}
          step={activity.step}
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #5A658D 0%, #5A658D ${((sliderValue - activity.min) / (activity.max - activity.min)) * 100}%, #E5E7EB ${((sliderValue - activity.min) / (activity.max - activity.min)) * 100}%, #E5E7EB 100%)`
          }}
        />
      </div>

      {/* Value and add button */}
      <div className="flex items-center justify-end gap-3">
        <div className="flex items-baseline gap-0.5">
          <span className="text-subtitle-1-custom">{formatValue()}</span>
          <span className="text-body-sm-custom">{formatUnit()}</span>
        </div>
        <button
          onClick={() => onAdd(sliderValue)}
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors active:opacity-80"
          style={{ backgroundColor: "#009EAB" }}
        >
          <Plus size={16} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
}

export default function FrequentFoodsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <FrequentFoodsContent />
    </Suspense>
  );
}
