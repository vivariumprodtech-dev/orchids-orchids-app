// ─── Mock progress data for demo profiles ──────────────────────────────────
// Camila (1722322879) = onboarding user, first week
// Ugo (ugo_demo)      = experienced user, 3+ months

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockDayCalories {
  date: string;
  calories: number;
  target: number;
}

export interface MockDayWeight {
  date: string;
  weight: number;
}

export interface MockDayActive {
  date: string;
  activeCal: number;
}

export interface MockWeightMeta {
  goalWeight: number;
  startingWeight: number;
}

// ─── Profile 1: Camila — Onboarding ──────────────────────────────────────────
// First week of use. Logged last 3 days. Still learning.

function generateCamila() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rand = seededRandom(42);

  // She started 3 days ago
  const startDay = addDays(today, -2); // 3 days: -2, -1, today

  const calories: MockDayCalories[] = [];
  const weights: MockDayWeight[] = [];
  const active: MockDayActive[] = [];

  // BMR=1950, caloricDeficit=150 → bmrDeficit=1800. Target = bmrDeficit + activeCalories.
  const bmrDeficit = 1800;

  // Generate 3 months back of "empty" + 3 days of actual data
  const threeMonthsAgo = addDays(today, -90);

  for (let i = 0; i <= 90; i++) {
    const day = addDays(threeMonthsAgo, i);
    const dateStr = toYMD(day);
    const daysFromStart = Math.floor(
      (day.getTime() - startDay.getTime()) / 86400000
    );

    if (daysFromStart >= 0 && daysFromStart <= 2) {
      // She logged these 3 days
      // Active kcal: 100-200 (just starting)
      const kcal = 100 + Math.floor(rand() * 100);
      active.push({ date: dateStr, activeCal: kcal });

      const target = bmrDeficit + kcal;
      // Mostly under target (still learning) — eating 200-500 under
      const deficit = 200 + Math.floor(rand() * 300);
      const cal = target - deficit + (rand() > 0.7 ? Math.floor(rand() * 200) : 0);

      calories.push({ date: dateStr, calories: Math.round(cal), target });

      // Weight: 68kg, no real change yet (just 3 days)
      const w = 68.0 + (rand() - 0.5) * 0.4;
      weights.push({ date: dateStr, weight: Math.round(w * 10) / 10 });
    }
  }

  return {
    calories,
    weights,
    active,
    weightMeta: { goalWeight: 65, startingWeight: 68 },
  };
}

// ─── Profile 2: Ugo — Experienced user ───────────────────────────────────────
// 3+ months of data, 15 day streak, steady progress

function generateUgo() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rand = seededRandom(123);

  const calories: MockDayCalories[] = [];
  const weights: MockDayWeight[] = [];
  const active: MockDayActive[] = [];

  // BMR=2500, caloricDeficit=300 → bmrDeficit=2200. Target = bmrDeficit + activeCalories.
  const bmrDeficit = 2200;

  const threeMonthsAgo = addDays(today, -90);

  for (let i = 0; i <= 90; i++) {
    const day = addDays(threeMonthsAgo, i);
    const dateStr = toYMD(day);
    const daysFromEnd = 90 - i; // 0 = today

    // He logs almost every day. Last 15 days = perfect streak.
    // Before that: ~85% logging rate
    const isInStreak = daysFromEnd <= 14;
    const logged = isInStreak || rand() < 0.85;

    if (!logged) continue;

    // Active kcal: 250-400/day
    const kcal = 250 + Math.floor(rand() * 150);
    active.push({ date: dateStr, activeCal: kcal });

    const target = bmrDeficit + kcal;

    // Mostly near target, occasional spikes
    let cal: number;
    const r = rand();
    if (r < 0.1) {
      // Spike day — ate 300-600 over target
      cal = target + 300 + Math.floor(rand() * 300);
    } else if (r < 0.2) {
      // Under day
      cal = target - 200 - Math.floor(rand() * 200);
    } else {
      // Near target — within ±150
      cal = target + Math.floor((rand() - 0.5) * 300);
    }
    calories.push({ date: dateStr, calories: Math.round(cal), target });

    // Weight: 56 → 54 over 3 months, goal 52
    // Linear trend with daily fluctuation
    const progress = i / 90; // 0 to 1
    const trendWeight = 56 - progress * 2; // 56 → 54
    const fluctuation = (rand() - 0.5) * 0.6;
    const w = trendWeight + fluctuation;
    weights.push({ date: dateStr, weight: Math.round(w * 10) / 10 });
  }

  return {
    calories,
    weights,
    active,
    weightMeta: { goalWeight: 52, startingWeight: 56 },
  };
}

// ─── Profile 3: Alex — Regular user ──────────────────────────────────────────
// ~6 weeks of data, decent consistency (~70%), bulking phase (weight going up)

function generateAlex() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rand = seededRandom(789);

  const calories: MockDayCalories[] = [];
  const weights: MockDayWeight[] = [];
  const active: MockDayActive[] = [];

  // BMR=2900, caloricDeficit=300 → bmrDeficit=2600. Target = bmrDeficit + activeCalories.
  const bmrDeficit = 2600;

  const threeMonthsAgo = addDays(today, -90);

  for (let i = 0; i <= 90; i++) {
    const day = addDays(threeMonthsAgo, i);
    const dateStr = toYMD(day);

    // Started logging ~45 days ago
    const daysActive = 90 - i;
    if (daysActive > 45) continue;

    // ~70% logging rate, with a 5-day gap around day 20
    const daysSinceStart = 45 - daysActive;
    const inGap = daysSinceStart >= 18 && daysSinceStart <= 22;
    if (inGap) continue;
    const logged = rand() < 0.72;
    if (!logged) continue;

    // Active kcal: 300-500 (gym days + walks)
    const kcal = 300 + Math.floor(rand() * 200);
    active.push({ date: dateStr, activeCal: kcal });

    const target = bmrDeficit + kcal; // bulking target

    // Often slightly above target (surplus for muscle gain)
    let cal: number;
    const r = rand();
    if (r < 0.15) {
      // Big surplus day
      cal = target + 400 + Math.floor(rand() * 300);
    } else if (r < 0.25) {
      // Under target (missed meals)
      cal = target - 300 - Math.floor(rand() * 250);
    } else {
      // Near/slightly above target
      cal = target + Math.floor(rand() * 200) - 50;
    }
    calories.push({ date: dateStr, calories: Math.round(cal), target });

    // Weight: 75 → 76.5 over 45 days (slow lean bulk)
    const progress = daysSinceStart / 45;
    const trendWeight = 75 + progress * 1.5;
    const fluctuation = (rand() - 0.5) * 0.8;
    const w = trendWeight + fluctuation;
    weights.push({ date: dateStr, weight: Math.round(w * 10) / 10 });
  }

  return {
    calories,
    weights,
    active,
    weightMeta: { goalWeight: 78, startingWeight: 75 },
  };
}

// ─── Cached data ──────────────────────────────────────────────────────────────

let _camila: ReturnType<typeof generateCamila> | null = null;
let _ugo: ReturnType<typeof generateUgo> | null = null;
let _alex: ReturnType<typeof generateAlex> | null = null;

function getCamila() {
  if (!_camila) _camila = generateCamila();
  return _camila;
}

function getUgo() {
  if (!_ugo) _ugo = generateUgo();
  return _ugo;
}

function getAlex() {
  if (!_alex) _alex = generateAlex();
  return _alex;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const MOCK_USER_IDS = new Set(["ugo_demo"]);

export function isMockUser(userId: string): boolean {
  return MOCK_USER_IDS.has(userId);
}

function getProfile(userId: string) {
  if (userId === "1722322879") return getCamila();
  if (userId === "ugo_demo") return getUgo();
  if (userId === "6217569048") return getAlex();
  return null;
}

function filterByRange<T extends { date: string }>(
  arr: T[],
  start: string,
  end: string
): T[] {
  return arr.filter((d) => d.date >= start && d.date <= end);
}

export function getMockCalories(
  userId: string,
  startDate: string,
  endDate: string
): MockDayCalories[] {
  const p = getProfile(userId);
  if (!p) return [];
  return filterByRange(p.calories, startDate, endDate);
}

export function getMockWeights(
  userId: string,
  startDate: string,
  endDate: string
): MockDayWeight[] {
  const p = getProfile(userId);
  if (!p) return [];
  return filterByRange(p.weights, startDate, endDate);
}

export function getMockWeightMeta(userId: string): MockWeightMeta | null {
  const p = getProfile(userId);
  return p?.weightMeta ?? null;
}

/** Returns the last weight entry strictly before startDate (for line anchoring) */
export function getMockPreviousWeight(
  userId: string,
  startDate: string
): MockDayWeight | null {
  const p = getProfile(userId);
  if (!p) return null;
  const before = p.weights.filter((d) => d.date < startDate).sort((a, b) => b.date.localeCompare(a.date));
  return before[0] ?? null;
}

export function getMockActive(
  userId: string,
  startDate: string,
  endDate: string
): MockDayActive[] {
  const p = getProfile(userId);
  if (!p) return [];
  return filterByRange(p.active, startDate, endDate);
}

/** Return all logged date strings for a given user + range (for Costanza card) */
export function getMockLoggedDates(
  userId: string,
  startDate: string,
  endDate: string
): string[] {
  const p = getProfile(userId);
  if (!p) return [];
  return filterByRange(p.calories, startDate, endDate).map((d) => d.date);
}

/** Whether this mock user is "new" (first log within 7 days of today) */
export function isMockNewUser(userId: string): boolean {
  const p = getProfile(userId);
  if (!p || p.calories.length === 0) return true;
  const first = p.calories[0].date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDate = new Date(first + "T00:00:00");
  const diff = Math.floor((today.getTime() - firstDate.getTime()) / 86400000);
  return diff <= 7;
}
