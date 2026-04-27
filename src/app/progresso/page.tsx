"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { CostanzaCard } from "@/components/CostanzaCard";
import { BilancioCalorico } from "@/components/BilancioCalorico";
import { ObiettivoPeso } from "@/components/ObiettivoPeso";
import { Girovita } from "@/components/Girovita";
import { CalorieAttive } from "@/components/CalorieAttive";
import { DeficitCalorico } from "@/components/DeficitCalorico";
import { isMockUser, getMockLoggedDates, isMockNewUser, getMockGirovita, getMockPreviousGirovita, getMockWeightMeta, getMockWeights, getMockPreviousWeight } from "@/lib/mock-progress-data";
import { fetchAllUserData, AllUserData } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab    = "obiettivo" | "macros";
type Period = "settimana" | "1mese" | "2mesi" | "3mesi";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "settimana", label: "Settimana" },
  { value: "1mese",     label: "1 Mese"    },
  { value: "2mesi",     label: "2 Mesi"    },
  { value: "3mesi",     label: "3 Mesi"    },
];

const PERIOD_DAYS: Record<Period, number> = {
  settimana: 7,
  "1mese":   30,
  "2mesi":   60,
  "3mesi":   90,
};

// ─── Processed API data shape ─────────────────────────────────────────────────

interface ProcessedApiData {
  loggedDates:          string[];
  allLoggedDates:       string[]; // full history, for streak calc
  isNewUser:            boolean;
  calorieData:          { date: string; calories: number; target: number; fabbisogno: number }[];
  /** Per-day target for every day in range — (BMR + activeCalories) − deficit. Used only by BilancioCalorico. */
  bilancioTargets:      { date: string; target: number }[];
  weightData:           { date: string; weight: number }[];
  goalWeight:           number | null;
  startingWeight:       number | null;
  previousWeight:       { date: string; weight: number } | null;
  girovitaData:         { date: string; cm: number }[];
  girovitaFirstEver:    { date: string; cm: number } | null;
  girovitaPrevious:     { date: string; cm: number } | null;
  activeData:           { date: string; activeCal: number }[];
  userGoal:             "deficit" | "maintain" | "surplus";
  bmr:                  number;
}

/** Process the raw AllUserData fetched from the API into per-component shapes,
 *  filtered to [startDate, endDate]. */
function processApiData(
  data: AllUserData,
  startDate: string,
  endDate: string
): ProcessedApiData {
  const { profile, foodEntries, dailyGoals, healthData, activeCalories } = data;

  // ── Aggregate food entries (multiple meals/day) by date ──────────────────
  const calByDate    = new Map<string, number>();
  const allFoodDates: string[] = [];
  for (const entry of foodEntries) {
    const d = entry.date?.slice(0, 10);
    if (!d) continue;
    calByDate.set(d, (calByDate.get(d) ?? 0) + (entry.calories ?? 0));
    if (!allFoodDates.includes(d)) allFoodDates.push(d);
  }

  // ── Calorie target per day = BMR − caloricDeficit + activeCalories ──────
  // We carry the last known goal (bmr-deficit) forward for days without an explicit record,
  // then add that day's actual active calories on top.
  const bmr = profile.bmr ?? 0;

  // Build active calories lookup by date
  const activeCalByDate = new Map<string, number>();
  for (const ac of activeCalories) {
    const d = ac.date?.slice(0, 10);
    if (d) activeCalByDate.set(d, ac.calories ?? 0);
  }

  // Store only the bmr-deficit portion keyed by date (active cal added per-day below)
  const bmrDeficitByDate = new Map<string, number>();
  for (const g of dailyGoals) {
    const d = g.date?.slice(0, 10);
    if (d) bmrDeficitByDate.set(d, bmr - (g.caloricDeficit ?? 0));
  }

  // Carry-forward helper: find latest goal date <= queried date
  const sortedGoalDates = Array.from(bmrDeficitByDate.keys()).sort();
  function nearestBmrDeficit(date: string): number {
    let best: string | null = null;
    for (const gd of sortedGoalDates) {
      if (gd <= date) best = gd;
      else break;
    }
    return best ? bmrDeficitByDate.get(best)! : bmr;
  }

  // Calorie data filtered to current view range
  const calorieData = Array.from(calByDate.entries())
    .filter(([d]) => d >= startDate && d <= endDate)
    .map(([date, calories]) => {
      const activeCal  = activeCalByDate.get(date) ?? 0;
      const bmrDeficit = bmrDeficitByDate.get(date) ?? nearestBmrDeficit(date);
      return {
        date,
        calories,
        target:      bmrDeficit + activeCal,
        fabbisogno:  bmr + activeCal,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Per-day targets for BilancioCalorico covering ALL days in range ─────
  // Formula: (BMR + activeCalories) − deficit, applied to every calendar day.
  const bilancioTargets = (() => {
    const result: { date: string; target: number }[] = [];
    const cur = new Date(startDate + "T00:00:00");
    const last = new Date(endDate + "T00:00:00");
    while (cur <= last) {
      const yy   = cur.getFullYear();
      const mm   = String(cur.getMonth() + 1).padStart(2, "0");
      const dd   = String(cur.getDate()).padStart(2, "0");
      const date = `${yy}-${mm}-${dd}`;
      const activeCal  = activeCalByDate.get(date) ?? 0;
      const bmrDeficit = bmrDeficitByDate.get(date) ?? nearestBmrDeficit(date);
      result.push({ date, target: bmrDeficit + activeCal });
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  })();

  // Logged dates in current view range
  const loggedDates = Array.from(calByDate.keys())
    .filter((d) => d >= startDate && d <= endDate)
    .sort();

  // All logged dates (full history) — for streak calculation
  const allLoggedDates = Array.from(calByDate.keys()).sort();

  // isNewUser = first ever log within 7 days of today
  const firstDate = [...allFoodDates].sort()[0];
  const todayMs   = new Date().setHours(0, 0, 0, 0);
  const isNewUser =
    !firstDate ||
    Math.floor((todayMs - new Date(firstDate + "T00:00:00").getTime()) / 86400000) <= 7;

  // ── Weight — only "peso" type entries ────────────────────────────────────
  const weightData = healthData
    .filter((e) => {
      const d = e.date?.slice(0, 10);
      return d && d >= startDate && d <= endDate && e.type === "peso" && e.value != null;
    })
    .map((e) => ({
      date:   e.date.slice(0, 10),
      weight: e.value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Last weight entry strictly before startDate — used to anchor the line when ≤ 1 in period
  const prevWeightEntry = healthData
    .filter((e) => {
      const d = e.date?.slice(0, 10);
      return d && d < startDate && e.type === "peso" && e.value != null;
    })
    .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  const previousWeight = prevWeightEntry
    ? { date: prevWeightEntry.date.slice(0, 10), weight: prevWeightEntry.value }
    : null;

  // ── Girovita (waist) ─────────────────────────────────────────────────────
  const girovitaData = healthData
    .filter((e) => {
      const d = e.date?.slice(0, 10);
      return d && d >= startDate && d <= endDate && e.type === "waistline" && e.value != null;
    })
    .map((e) => ({ date: e.date.slice(0, 10), cm: e.value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const allGirovita = healthData
    .filter((e) => e.type === "waistline" && e.value != null && e.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const girovitaFirstEverRaw = allGirovita[0] ?? null;
  const girovitaFirstEver = girovitaFirstEverRaw
    ? { date: girovitaFirstEverRaw.date.slice(0, 10), cm: girovitaFirstEverRaw.value }
    : null;

  const girovitaPreviousRaw = allGirovita
    .filter((e) => e.date.slice(0, 10) < startDate)
    .at(-1) ?? null;
  const girovitaPrevious = girovitaPreviousRaw
    ? { date: girovitaPreviousRaw.date.slice(0, 10), cm: girovitaPreviousRaw.value }
    : null;

  // ── Active calories ───────────────────────────────────────────────────────
  const activeData = activeCalories
    .filter((e) => {
      const d = e.date?.slice(0, 10);
      return d && d >= startDate && d <= endDate;
    })
    .map((e) => ({
      date:      e.date.slice(0, 10),
      activeCal: e.calories ?? 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Derive userGoal from the most recent caloricDeficit value
  const latestGoalDate = sortedGoalDates[sortedGoalDates.length - 1];
  const latestDeficit  = latestGoalDate
    ? (dailyGoals.find((g) => g.date?.slice(0, 10) === latestGoalDate)?.caloricDeficit ?? 0)
    : 0;
  const userGoal: "deficit" | "maintain" | "surplus" =
    latestDeficit > 0 ? "deficit" : latestDeficit < 0 ? "surplus" : "maintain";

  return {
    loggedDates,
    allLoggedDates,
    isNewUser,
    calorieData,
    bilancioTargets,
    weightData,
    goalWeight:       profile.weightGoalKg ?? null,
    startingWeight:   profile.weightKg     ?? null,
    previousWeight,
    girovitaData,
    girovitaFirstEver,
    girovitaPrevious,
    activeData,
    userGoal,
    bmr,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function toYMD(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ─── PeriodSelect ─────────────────────────────────────────────────────────────

function PeriodSelect({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = PERIOD_OPTIONS.find((o) => o.value === value)?.label ?? "";

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display:         "inline-flex",
          alignItems:      "center",
          gap:             "var(--spacing-1-5)",
          paddingTop:      "var(--spacing-1-5)",
          paddingBottom:   "var(--spacing-1-5)",
          paddingLeft:     "var(--spacing-3)",
          paddingRight:    "var(--spacing-2-5)",
          borderRadius:    "var(--rounded-full)",
          backgroundColor: "var(--aila-button-neutral-invert-bg-default)",
          color:           "var(--aila-button-neutral-invert-text-default)",
          border:          "var(--aila-button-border-width) solid transparent",
          cursor:          "pointer",
          outline:         "none",
          userSelect:      "none",
          boxShadow:       "var(--shadow-xs)",
          transition:      "var(--aila-button-transition)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "var(--aila-button-neutral-invert-bg-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            "var(--aila-button-neutral-invert-bg-default)";
        }}
      >
        <span className="label-sm">{label}</span>
        <ChevronDown size={14} strokeWidth={2.5} />
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position:        "absolute",
              top:             "calc(100% + var(--spacing-1-5))",
              left:            0,
              zIndex:          20,
              backgroundColor: "var(--background)",
              borderRadius:    "var(--rounded-4)",
              boxShadow:       "var(--shadow-lg)",
              border:          "var(--border-1) solid var(--border)",
              overflow:        "hidden",
              minWidth:        "9rem",
            }}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display:         "block",
                  width:           "100%",
                  textAlign:       "left",
                  padding:         "var(--spacing-2-5) var(--spacing-4)",
                  backgroundColor: opt.value === value ? "var(--neutral-tonal)" : "transparent",
                  color:           opt.value === value ? "var(--neutral-action)" : "var(--body)",
                  cursor:          "pointer",
                  border:          "none",
                  outline:         "none",
                  transition:      "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (opt.value !== value)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      "var(--neutral-tonal-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    opt.value === value ? "var(--neutral-tonal)" : "transparent";
                }}
              >
                <span className="label-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PeriodNavigator ─────────────────────────────────────────────────────────

function PeriodNavigator({
  endDate,
  period,
  onPrev,
  onNext,
}: {
  endDate: Date;
  period:  Period;
  onPrev:  () => void;
  onNext:  () => void;
}) {
  const days       = PERIOD_DAYS[period];
  const startDate  = addDays(endDate, -(days - 1));
  const yesterday  = startOfDay(addDays(new Date(), -1));
  const isYesterday = startOfDay(endDate).getTime() === yesterday.getTime();

  const rangeLabel = `${formatDate(startDate)} – ${formatDate(endDate)}`;

  const chevronStyle = (disabled: boolean): React.CSSProperties => ({
    display:        "inline-flex",
    alignItems:     "center",
    justifyContent: "center",
    background:     "none",
    border:         "none",
    padding:        "0 var(--spacing-1)",
    cursor:         disabled ? "not-allowed" : "pointer",
    color:          disabled ? "var(--disabled-font)" : "var(--neutral-action)",
    opacity:        disabled ? 0.4 : 1,
    flexShrink:     0,
    outline:        "none",
  });

  return (
    <div
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        flex:            1,
        minWidth:        0,
        height:          "calc(var(--spacing-1-5) * 2 + 1.25rem + 2 * var(--border-1))",
        paddingLeft:     "var(--spacing-1)",
        paddingRight:    "var(--spacing-1)",
        borderRadius:    "var(--rounded-full)",
        backgroundColor: "var(--aila-button-neutral-invert-bg-default)",
        boxShadow:       "var(--shadow-xs)",
        border:          "var(--aila-button-border-width) solid transparent",
        gap:             "var(--spacing-1)",
        overflow:        "hidden",
        boxSizing:       "border-box",
      }}
    >
      <button style={chevronStyle(false)} onClick={onPrev}>
        <ChevronLeft size={15} strokeWidth={2.5} />
      </button>

      <span
        className="body-sm"
        style={{
          flex:         1,
          textAlign:    "center",
          color:        "var(--subtitle-1)",
          whiteSpace:   "nowrap",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          userSelect:   "none",
        }}
      >
        {rangeLabel}
      </span>

      <button
        style={chevronStyle(isYesterday)}
        onClick={onNext}
        disabled={isYesterday}
      >
        <ChevronRight size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

const DEMO_USER_ID = "ugo_demo";

function ProgressoContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const userId       = searchParams.get("userId") || DEMO_USER_ID;

  const [tab,    setTab]    = useState<Tab>("obiettivo");
  const [period, setPeriod] = useState<Period>("settimana");

  const today     = useMemo(() => startOfDay(new Date()), []);
  const yesterday = useMemo(() => addDays(today, -1), [today]);
  const [endDate, setEndDate] = useState<Date>(yesterday);

  // CostanzaCard state (mock + API)
  const [loggedDates,       setLoggedDates]       = useState<string[]>([]);
  const [streakLoggedDates, setStreakLoggedDates]  = useState<string[]>([]);
  const [isNewUser,         setIsNewUser]          = useState(false);
  const [loadingLogs,       setLoadingLogs]        = useState(false);

  // Centralized API data for real users — start true so cards never flash empty
  const [rawApiData,  setRawApiData]  = useState<AllUserData | null>(null);
  const [loadingApi,  setLoadingApi]  = useState(true);
  // Processed/filtered slice for the current view window
  const [processed,   setProcessed]   = useState<ProcessedApiData | null>(null);

  const days        = PERIOD_DAYS[period];
  const periodStart = addDays(endDate, -(days - 1));
  const startStr    = toYMD(periodStart);
  const endStr      = toYMD(endDate);

  // ── Card ordering flags ───────────────────────────────────────────────────
  // Derived from processed (real users) or mock helpers (mock users).
  const hasWeightGoal: boolean = userId
    ? isMockUser(userId)
      ? (getMockWeightMeta(userId)?.goalWeight ?? null) != null
      : (processed?.goalWeight ?? null) != null
    : false;

  const hasAnyWeight: boolean = userId
    ? isMockUser(userId)
      ? getMockWeights(userId, toYMD(addDays(today, -90)), toYMD(today)).length > 0
          || getMockPreviousWeight(userId, startStr) != null
      : (processed?.weightData ?? []).length > 0 || processed?.previousWeight != null
    : false;

  // ── Effect 1: fetch ALL raw API data once per userId (real users only) ──────
  useEffect(() => {
    if (!userId || isMockUser(userId)) {
      setRawApiData(null);
      setProcessed(null);
      setLoadingApi(false);  // mock users need no API fetch
      return;
    }

    setLoadingApi(true);
    setProcessed(null);

    fetchAllUserData(userId)
      .then((data) => {
        setRawApiData(data);
        setLoadingApi(false);
      })
      .catch(() => {
        setRawApiData(null);
        setLoadingApi(false);
      });
  }, [userId]);

  // ── Effect 2: (re)process raw data or mock when view window changes ─────────
  useEffect(() => {
    if (!userId) return;

    if (isMockUser(userId)) {
      const todayStr = toYMD(today);
      const ninetyAgo = toYMD(addDays(today, -90));
      setLoggedDates(getMockLoggedDates(userId, startStr, endStr));
      setStreakLoggedDates(getMockLoggedDates(userId, ninetyAgo, todayStr));
      setIsNewUser(isMockNewUser(userId));
      setLoadingLogs(false);
      setProcessed(null);
      return;
    }

    // Real user — wait until raw API data arrives
    if (loadingApi) {
      setLoadingLogs(true);
      return;
    }

    if (!rawApiData) {
      setLoadingLogs(false);
      return;
    }

    const p = processApiData(rawApiData, startStr, endStr);
    setProcessed(p);
    setLoggedDates(p.loggedDates);
    setStreakLoggedDates(p.allLoggedDates);
    setIsNewUser(p.isNewUser);
    setLoadingLogs(false);
  }, [userId, startStr, endStr, rawApiData, loadingApi]);

  function handlePrev() {
    setEndDate((d) => addDays(d, -days));
  }

  function handleNext() {
    const next = addDays(endDate, days);
    if (next.getTime() > yesterday.getTime()) return;
    setEndDate(next);
  }

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    setEndDate(yesterday);
  }

  function handleOpenChat() {
    if (userId) router.push(`/?userId=${userId}`);
  }

  const isLoading = loadingApi || loadingLogs;
  const showLoader = loadingApi || (!!userId && !isMockUser(userId) && processed === null);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: "var(--neutral-bg)",
        padding:         "var(--spacing-4)",
        gap:             "var(--spacing-3)",
      }}
    >
      {/* Back */}
      <div style={{ marginLeft: "calc(-1 * var(--spacing-1))" }}>
        <Button
          variant="neutral-link"
          size="sm"
          iconStart={ChevronLeft}
          onClick={() => router.back()}
        >
          Indietro
        </Button>
      </div>

      {/* Tabs + period row */}
      <div
        style={{
          display:       "flex",
          flexDirection: "column",
          gap:           "var(--spacing-3)",
          paddingBottom: "var(--spacing-3)",
          borderBottom:  "var(--border-1) solid var(--border)",
          marginLeft:    "calc(-1 * var(--spacing-4))",
          marginRight:   "calc(-1 * var(--spacing-4))",
          paddingLeft:   "var(--spacing-4)",
          paddingRight:  "var(--spacing-4)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
          <PeriodSelect value={period} onChange={handlePeriodChange} />
          <PeriodNavigator
            endDate={endDate}
            period={period}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </div>
      </div>

      {/* Page title */}
      <h1 className="page-title" style={{ paddingLeft: "var(--spacing-1)" }}>
        Tuo progresso
      </h1>

      {/* Full-page 3-dot loader while data is loading */}
      {showLoader ? (
        <div
          style={{
            flex:            1,
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            minHeight:       "12rem",
            gap:             "var(--spacing-2)",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display:         "inline-block",
                width:           "12px",
                height:          "12px",
                borderRadius:    "50%",
                backgroundColor: "var(--color-neutral-100)",
                animation:       `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
          <style>{`
            @keyframes dotPulse {
              0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
              40%            { opacity: 1;   transform: scale(1);   }
            }
          `}</style>
        </div>
      ) : (
        <>
          {/* Costanza Card */}
          {isLoading ? (
            <div
              style={{
                backgroundColor: "var(--color-white)",
                boxShadow:       "var(--shadow-sm)",
                borderRadius:    "var(--rounded-6)",
                padding:         "var(--spacing-6)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                minHeight:       "8rem",
              }}
            >
              <span className="help-text">Caricamento…</span>
            </div>
          ) : (
            <CostanzaCard
              loggedDates={loggedDates}
              streakLoggedDates={streakLoggedDates}
              startDate={startStr}
              endDate={endStr}
              period={period}
              isCurrentPeriod={period === "settimana" && endStr === toYMD(yesterday)}
              isNewUser={isNewUser}
              onOpenChat={handleOpenChat}
            />
          )}

          {/* 2) Obiettivo di Peso — only if user has weight AND a weight goal */}
          {userId && hasAnyWeight && hasWeightGoal && (
            <ObiettivoPeso
              userId={userId}
              startDate={startStr}
              endDate={endStr}
              period={period}
              preloadedWeights={processed?.weightData}
              preloadedGoalWeight={processed?.goalWeight}
              preloadedStartingWeight={processed?.startingWeight}
              preloadedPreviousWeight={processed?.previousWeight}
              isCurrentPeriod={endStr === toYMD(yesterday)}
              userGoal={processed?.userGoal ?? "deficit"}
            />
          )}

          {/* Obiettivo di Peso — fallback if user has weight but no goal */}
          {userId && hasAnyWeight && !hasWeightGoal && (
            <ObiettivoPeso
              userId={userId}
              startDate={startStr}
              endDate={endStr}
              period={period}
              preloadedWeights={processed?.weightData}
              preloadedGoalWeight={processed?.goalWeight}
              preloadedStartingWeight={processed?.startingWeight}
              preloadedPreviousWeight={processed?.previousWeight}
              isCurrentPeriod={endStr === toYMD(yesterday)}
              userGoal={processed?.userGoal ?? "deficit"}
            />
          )}

          {/* 3) Girovita — only if at least one girovita measured (component self-hides) */}
          {userId && (
            <Girovita
              userId={userId}
              startDate={startStr}
              endDate={endStr}
              period={period}
              preloadedData={processed?.girovitaData}
              preloadedFirstEver={processed?.girovitaFirstEver}
              preloadedPreviousEntry={processed?.girovitaPrevious}
            />
          )}

          {/* 4) Deficit Calorico */}
          {userId && (
            <DeficitCalorico
              userId={userId}
              startDate={startStr}
              endDate={endStr}
              period={period}
              preloadedData={processed?.calorieData}
              userGoal={processed?.userGoal ?? "deficit"}
              bmr={processed?.bmr ?? 0}
            />
          )}

          {/* 5) Giorni in target (Bilancio Calorico) */}
          {userId && (
            <BilancioCalorico
              userId={userId}
              startDate={startStr}
              endDate={endStr}
              period={period}
              preloadedData={processed?.calorieData}
              preloadedTargets={processed?.bilancioTargets}
            />
          )}

          {/* 6) Calorie Attive */}
          {userId && (
            <CalorieAttive
              userId={userId}
              startDate={startStr}
              endDate={endStr}
              period={period}
              preloadedData={processed?.activeData}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ProgressoPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ backgroundColor: "var(--neutral-bg)" }}
        >
          <span className="body-md" style={{ color: "var(--placeholder)" }}>
            Caricamento…
          </span>
        </div>
      }
    >
      <ProgressoContent />
    </Suspense>
  );
}
