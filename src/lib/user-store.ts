export interface UserData {
  water: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  foods: FoodEntry[];
  activeCalories: number;
  activities: ActivityEntry[];
  awaitingQuantity: string | null;
  awaitingActivity: boolean;
  awaitingWater: boolean;
}

export interface FoodEntry {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

export interface ActivityEntry {
  name: string;
  kcal: number;
}

const fakeDB: Record<number, UserData> = {};

export function initUser(userId: number): UserData {
  if (!fakeDB[userId]) {
    fakeDB[userId] = {
      water: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      foods: [],
      activeCalories: 0,
      activities: [],
      awaitingQuantity: null,
      awaitingActivity: false,
      awaitingWater: false,
    };
  }
  return fakeDB[userId];
}

export function getUser(userId: number): UserData | undefined {
  return fakeDB[userId];
}

export function resetUser(userId: number): UserData {
  fakeDB[userId] = {
    water: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    foods: [],
    activeCalories: 0,
    activities: [],
    awaitingQuantity: null,
    awaitingActivity: false,
    awaitingWater: false,
  };
  return fakeDB[userId];
}

export function resetActiveCalories(userId: number): UserData {
  if (fakeDB[userId]) {
    fakeDB[userId].activeCalories = 0;
    fakeDB[userId].activities = [];
  }
  return fakeDB[userId] || initUser(userId);
}

export const FOODS: Record<string, { emoji: string; cal: number; pro: number; carb: number; fat: number; fiber: number }> = {
  'Skyr Lidl': { emoji: '🥛', cal: 60, pro: 11, carb: 4, fat: 0.2, fiber: 0 },
  'Yogurt Mevgal': { emoji: '🥛', cal: 60, pro: 11, carb: 4, fat: 0, fiber: 0 },
  'Cioccolato 78%': { emoji: '🍫', cal: 587, pro: 10, carb: 30, fat: 45, fiber: 11 },
  'Pane Proteico': { emoji: '🥖', cal: 225, pro: 18, carb: 14, fat: 9, fiber: 8 },
};

export const ACTIVITIES: Record<string, { name: string; kcal: number }> = {
  walk15: { name: '🚶 Camminata 15\'', kcal: 50 },
  walk30: { name: '🚶 Camminata 30\'', kcal: 100 },
  walk60: { name: '🚶 Camminata 1h', kcal: 200 },
  run30: { name: '🏃 Corsa 30\'', kcal: 300 },
  bike30: { name: '🚴 Bici 30\'', kcal: 250 },
  gym60: { name: '💪 Palestra 1h', kcal: 350 },
};
