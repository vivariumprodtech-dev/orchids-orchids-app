// All data fetching goes through a single server-side route that handles
// cursor pagination internally (server→API). The browser makes one request.

// ─── Raw API shapes (matching actual API field names) ─────────────────────────

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
  date:     string;         // "YYYY-MM-DD"
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
  date:           string;   // "YYYY-MM-DD"
  protein:        number;
  cho:            number;
  fat:            number;
  fiber:          number;
  water:          number;
  caloricDeficit: number;   // calorie target = BMR − caloricDeficit
  [key: string]:  unknown;
}

export interface ApiHealthEntry {
  id:    string;
  date:  string;            // "YYYY-MM-DD"
  type:  string;            // "peso" | "waistline" | …
  value: number;
  [key: string]: unknown;
}

export interface ApiActiveCalEntry {
  id:       string;
  date:     string;         // "YYYY-MM-DD"
  calories: number;
  [key: string]: unknown;
}

export interface AllUserData {
  profile:        ApiProfile;
  foodEntries:    ApiFoodEntry[];
  dailyGoals:     ApiDailyGoal[];
  healthData:     ApiHealthEntry[];
  activeCalories: ApiActiveCalEntry[];
}

// ─── Single browser request — server handles all pagination ───────────────────

export async function fetchAllUserData(userId: string): Promise<AllUserData> {
  const res = await fetch(`/api/user-data/${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}
