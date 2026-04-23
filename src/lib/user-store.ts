import { supabaseAdmin } from './supabase';

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

export async function loadUserFromSupabase(userId: number, firstName?: string): Promise<UserData> {
  const today = new Date().toISOString().split('T')[0];

  // Ensure user exists
  if (firstName) {
    await supabaseAdmin
      .from('users')
      .upsert({ telegram_id: userId, first_name: firstName }, { onConflict: 'telegram_id' });
  }

  // Get daily log
  const { data: log } = await supabaseAdmin
    .from('daily_logs')
    .select('*, food_entries(*), activity_entries(*)')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (log) {
    fakeDB[userId] = {
      water: log.water || 0,
      calories: log.calories || 0,
      protein: log.protein || 0,
      carbs: log.carbs || 0,
      fats: log.fats || 0,
      fiber: log.fiber || 0,
      foods: log.food_entries || [],
      activeCalories: log.active_calories || 0,
      activities: log.activity_entries || [],
      awaitingQuantity: null,
      awaitingActivity: false,
      awaitingWater: false,
    };
  } else {
    initUser(userId);
  }

  return fakeDB[userId];
}

export async function syncUserToSupabase(userId: number) {
  const userData = fakeDB[userId];
  if (!userData) return;

  const today = new Date().toISOString().split('T')[0];

  // Upsert daily log
  const { data: log, error: logError } = await supabaseAdmin
    .from('daily_logs')
    .upsert({
      user_id: userId,
      date: today,
      water: userData.water,
      calories: userData.calories,
      protein: userData.protein,
      carbs: userData.carbs,
      fats: userData.fats,
      fiber: userData.fiber,
      active_calories: userData.activeCalories,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id, date' })
    .select()
    .single();

  if (logError || !log) {
    console.error('Error syncing log:', logError);
    return;
  }

  // Sync foods
  // Delete existing and re-insert to keep it simple for now
  await supabaseAdmin.from('food_entries').delete().eq('log_id', log.id);
  if (userData.foods.length > 0) {
    await supabaseAdmin.from('food_entries').insert(
      userData.foods.map(f => ({ ...f, log_id: log.id }))
    );
  }

  // Sync activities
  await supabaseAdmin.from('activity_entries').delete().eq('log_id', log.id);
  if (userData.activities.length > 0) {
    await supabaseAdmin.from('activity_entries').insert(
      userData.activities.map(a => ({ ...a, log_id: log.id }))
    );
  }
}

export async function resetUser(userId: number): Promise<UserData> {
  const today = new Date().toISOString().split('T')[0];
  
  // Clear from DB
  const { data: log } = await supabaseAdmin
    .from('daily_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (log) {
    await supabaseAdmin.from('daily_logs').delete().eq('id', log.id);
  }

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

export async function resetActiveCalories(userId: number): Promise<UserData> {
  const userData = fakeDB[userId] || initUser(userId);
  userData.activeCalories = 0;
  userData.activities = [];
  
  await syncUserToSupabase(userId);
  
  return userData;
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
