const BASE_URL = "http://api.giada.care/v1";
const TOKEN = "dk_namaedpfjvrtqmxbr0hr5ukw";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export interface UserProfile {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  weightGoalKg?: number;
  startingWeightKg?: number;
  dailyCalorieTarget?: number;
  [key: string]: unknown;
}

export interface FoodEntry {
  id: string;
  date: string;
  totalCalories?: number;
  calories?: number;
  [key: string]: unknown;
}

export interface DailyGoal {
  date: string;
  calorieTarget?: number;
  calories?: number;
  [key: string]: unknown;
}

export interface HealthDataEntry {
  date: string;
  weightKg?: number;
  weight?: number;
  [key: string]: unknown;
}

export interface ActiveCaloriesEntry {
  date: string;
  activeCalories?: number;
  calories?: number;
  [key: string]: unknown;
}

export function fetchProfile(userId: string) {
  return apiFetch<UserProfile>(`/users/${userId}/profile`);
}

export function fetchFoodEntries(userId: string) {
  return apiFetch<FoodEntry[]>(`/users/${userId}/food-entries?limit=100`);
}

export function fetchDailyGoals(userId: string) {
  return apiFetch<DailyGoal[]>(`/users/${userId}/daily-goals?limit=100`);
}

export function fetchHealthData(userId: string) {
  return apiFetch<HealthDataEntry[]>(`/users/${userId}/health-data?limit=100`);
}

export function fetchActiveCalories(userId: string) {
  return apiFetch<ActiveCaloriesEntry[]>(`/users/${userId}/active-calories?limit=100`);
}

export interface AllUserData {
  profile: UserProfile;
  foodEntries: FoodEntry[];
  dailyGoals: DailyGoal[];
  healthData: HealthDataEntry[];
  activeCalories: ActiveCaloriesEntry[];
}

export async function fetchAllUserData(userId: string): Promise<AllUserData> {
  const [profile, foodEntries, dailyGoals, healthData, activeCalories] =
    await Promise.all([
      fetchProfile(userId),
      fetchFoodEntries(userId),
      fetchDailyGoals(userId),
      fetchHealthData(userId),
      fetchActiveCalories(userId),
    ]);
  return { profile, foodEntries, dailyGoals, healthData, activeCalories };
}
