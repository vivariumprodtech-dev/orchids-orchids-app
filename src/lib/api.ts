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

// ─── Raw API response shapes (matching actual API) ────────────────────────────

export interface ApiProfile {
  id:             string;
  name:           string;
  bmr:            number;
  weightKg:       number | null;
  weightGoalKg:   number | null;
  heightCm:       number | null;
  [key: string]:  unknown;
}

export interface ApiFoodEntry {
  id:        string;
  foodName:  string;
  date:      string;       // "YYYY-MM-DD"
  calories:  number;
  protein:   number;
  carbs:     number;
  fiber:     number;
  fat:       number;
  mealType:  string;
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
  caloricDeficit: number;  // subtract from BMR to get calorie target
  [key: string]:  unknown;
}

export interface ApiHealthEntry {
  id:    string;
  date:  string;  // "YYYY-MM-DD"
  type:  string;  // "peso" | "waistline" | ...
  value: number;
  [key: string]: unknown;
}

export interface ApiActiveCalEntry {
  id:       string;
  date:     string;   // "YYYY-MM-DD"
  calories: number;
  [key: string]: unknown;
}

// ─── Typed fetch wrappers ──────────────────────────────────────────────────────

export function fetchProfile(userId: string) {
  return apiFetch<{ profile: ApiProfile }>(`/users/${userId}/profile`);
}

export function fetchFoodEntries(userId: string) {
  return apiFetch<{ foodEntries: ApiFoodEntry[] }>(`/users/${userId}/food-entries?limit=100`);
}

export function fetchDailyGoals(userId: string) {
  return apiFetch<{ dailyGoals: ApiDailyGoal[] }>(`/users/${userId}/daily-goals?limit=100`);
}

export function fetchHealthData(userId: string) {
  return apiFetch<{ healthData: ApiHealthEntry[] }>(`/users/${userId}/health-data?limit=100`);
}

export function fetchActiveCalories(userId: string) {
  return apiFetch<{ activeCalories: ApiActiveCalEntry[] }>(`/users/${userId}/active-calories?limit=100`);
}

// ─── Aggregated shape for the dashboard ───────────────────────────────────────

export interface AllUserData {
  profile:         ApiProfile;
  foodEntries:     ApiFoodEntry[];
  dailyGoals:      ApiDailyGoal[];
  healthData:      ApiHealthEntry[];
  activeCalories:  ApiActiveCalEntry[];
}

export async function fetchAllUserData(userId: string): Promise<AllUserData> {
  const [profileRes, foodRes, goalsRes, healthRes, activeRes] = await Promise.all([
    fetchProfile(userId),
    fetchFoodEntries(userId),
    fetchDailyGoals(userId),
    fetchHealthData(userId),
    fetchActiveCalories(userId),
  ]);
  return {
    profile:        profileRes.profile,
    foodEntries:    foodRes.foodEntries,
    dailyGoals:     goalsRes.dailyGoals,
    healthData:     healthRes.healthData,
    activeCalories: activeRes.activeCalories,
  };
}
