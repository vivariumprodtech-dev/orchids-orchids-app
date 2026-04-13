// Calls go through the Next.js proxy (/api/giada/...) to avoid
// mixed-content blocks (the upstream API is HTTP, the app is HTTPS).
const BASE_URL = "/api/giada";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ─── Paginated fetch — follows nextCursor until exhausted ─────────────────────
// Returns all items from a list endpoint by walking every page.

async function fetchAllPages<TItem>(
  basePath: string,
  listKey: string
): Promise<TItem[]> {
  const all: TItem[] = [];
  let cursor: string | null | undefined = undefined; // undefined = first page

  while (true) {
    const url = cursor ? `${basePath}?cursor=${encodeURIComponent(cursor)}` : basePath;
    const page = await apiFetch<Record<string, unknown>>(url);

    const items = (page[listKey] as TItem[]) ?? [];
    all.push(...items);

    const next = page["nextCursor"] as string | null | undefined;
    if (!next) break;
    cursor = next;
  }

  return all;
}

// ─── Raw API response shapes (matching actual API) ────────────────────────────

export interface ApiProfile {
  id:            string;
  name:          string;
  bmr:           number;
  weightKg:      number | null;
  weightGoalKg:  number | null;
  heightCm:      number | null;
  [key: string]: unknown;
}

export interface ApiFoodEntry {
  id:       string;
  foodName: string;
  date:     string;    // "YYYY-MM-DD"
  calories: number | null;
  protein:  number;
  carbs:    number;
  fiber:    number;
  fat:      number;
  mealType: string;
  [key: string]: unknown;
}

export interface ApiDailyGoal {
  id:             string;
  date:           string;  // "YYYY-MM-DD"
  protein:        number;
  cho:            number;
  fat:            number;
  fiber:          number;
  water:          number;
  caloricDeficit: number;  // calorie target = BMR − caloricDeficit
  [key: string]:  unknown;
}

export interface ApiHealthEntry {
  id:    string;
  date:  string;   // "YYYY-MM-DD"
  type:  string;   // "peso" | "waistline" | ...
  value: number;
  [key: string]: unknown;
}

export interface ApiActiveCalEntry {
  id:       string;
  date:     string;  // "YYYY-MM-DD"
  calories: number;
  [key: string]: unknown;
}

// ─── Typed fetch wrappers (all pages) ─────────────────────────────────────────

export function fetchProfile(userId: string) {
  return apiFetch<{ profile: ApiProfile }>(`/users/${userId}/profile`);
}

export function fetchFoodEntries(userId: string) {
  return fetchAllPages<ApiFoodEntry>(`/users/${userId}/food-entries`, "foodEntries");
}

export function fetchDailyGoals(userId: string) {
  return fetchAllPages<ApiDailyGoal>(`/users/${userId}/daily-goals`, "dailyGoals");
}

export function fetchHealthData(userId: string) {
  return fetchAllPages<ApiHealthEntry>(`/users/${userId}/health-data`, "healthData");
}

export function fetchActiveCalories(userId: string) {
  return fetchAllPages<ApiActiveCalEntry>(`/users/${userId}/active-calories`, "activeCalories");
}

// ─── Aggregated shape for the dashboard ───────────────────────────────────────

export interface AllUserData {
  profile:        ApiProfile;
  foodEntries:    ApiFoodEntry[];
  dailyGoals:     ApiDailyGoal[];
  healthData:     ApiHealthEntry[];
  activeCalories: ApiActiveCalEntry[];
}

export async function fetchAllUserData(userId: string): Promise<AllUserData> {
  const [profileRes, foodEntries, dailyGoals, healthData, activeCalories] = await Promise.all([
    fetchProfile(userId),
    fetchFoodEntries(userId),
    fetchDailyGoals(userId),
    fetchHealthData(userId),
    fetchActiveCalories(userId),
  ]);
  return {
    profile:        profileRes.profile,
    foodEntries,
    dailyGoals,
    healthData,
    activeCalories,
  };
}
