import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const USER_ID = '1722322879';

const PROFILE = {
  telegram_id: USER_ID,
  target_calories: 1600,
  target_protein: 110,
  target_carbs: 150,
  target_fats: 50,
  target_fiber: 25,
  target_water: 2,
  bmr: 1550,
};

type FoodEntry = {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  alcohol: number;
  meal: string;
  intake_time: string;
  is_processed: boolean;
};

type DayPlan = {
  water: number;
  active_calories: number;
  entries: FoodEntry[];
};

const DAYS: DayPlan[] = [
  // Day 0 (today -6): Light day, low calories
  {
    water: 1200,
    active_calories: 100,
    entries: [
      { name: 'Yogurt greco', grams: 150, calories: 90, protein: 15, carbs: 6, fats: 0.5, fiber: 0, alcohol: 0, meal: 'Colazione', intake_time: '08:00', is_processed: false },
      { name: 'Mela', grams: 120, calories: 63, protein: 0.3, carbs: 15, fats: 0.2, fiber: 2.5, alcohol: 0, meal: 'Colazione', intake_time: '08:15', is_processed: false },
      { name: 'Petto di pollo', grams: 130, calories: 143, protein: 30, carbs: 0, fats: 2, fiber: 0, alcohol: 0, meal: 'Pranzo', intake_time: '13:00', is_processed: false },
      { name: 'Insalata mista', grams: 100, calories: 20, protein: 1, carbs: 3, fats: 0.2, fiber: 2, alcohol: 0, meal: 'Pranzo', intake_time: '13:05', is_processed: false },
    ],
  },
  // Day -5: Good day, on target
  {
    water: 2100,
    active_calories: 220,
    entries: [
      { name: 'Avena', grams: 80, calories: 296, protein: 10, carbs: 51, fats: 5, fiber: 8, alcohol: 0, meal: 'Colazione', intake_time: '07:30', is_processed: false },
      { name: 'Latte scremato', grams: 200, calories: 68, protein: 6.6, carbs: 9.6, fats: 0.2, fiber: 0, alcohol: 0, meal: 'Colazione', intake_time: '07:30', is_processed: false },
      { name: 'Banana', grams: 100, calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, alcohol: 0, meal: 'Spuntino mattina', intake_time: '10:30', is_processed: false },
      { name: 'Riso integrale', grams: 80, calories: 280, protein: 6, carbs: 59, fats: 2, fiber: 3, alcohol: 0, meal: 'Pranzo', intake_time: '13:00', is_processed: false },
      { name: 'Tonno al naturale', grams: 120, calories: 120, protein: 28, carbs: 0, fats: 1, fiber: 0, alcohol: 0, meal: 'Pranzo', intake_time: '13:05', is_processed: false },
      { name: 'Salmone', grams: 150, calories: 255, protein: 30, carbs: 0, fats: 15, fiber: 0, alcohol: 0, meal: 'Cena', intake_time: '20:00', is_processed: false },
      { name: 'Broccoli', grams: 120, calories: 41, protein: 3.5, carbs: 5, fats: 0.4, fiber: 3.5, alcohol: 0, meal: 'Cena', intake_time: '20:05', is_processed: false },
    ],
  },
  // Day -4: Over calories
  {
    water: 1800,
    active_calories: 350,
    entries: [
      { name: 'Pancakes', grams: 200, calories: 420, protein: 10, carbs: 68, fats: 12, fiber: 2, alcohol: 0, meal: 'Colazione', intake_time: '09:00', is_processed: true },
      { name: 'Sciroppo d\'acero', grams: 30, calories: 78, protein: 0, carbs: 20, fats: 0, fiber: 0, alcohol: 0, meal: 'Colazione', intake_time: '09:00', is_processed: true },
      { name: 'Succo d\'arancia', grams: 250, calories: 113, protein: 1.7, carbs: 26, fats: 0.5, fiber: 0.5, alcohol: 0, meal: 'Colazione', intake_time: '09:05', is_processed: true },
      { name: 'Pizza margherita', grams: 350, calories: 805, protein: 28, carbs: 98, fats: 28, fiber: 4, alcohol: 0, meal: 'Pranzo', intake_time: '13:30', is_processed: true },
      { name: 'Tiramisù', grams: 120, calories: 384, protein: 7, carbs: 38, fats: 22, fiber: 0.5, alcohol: 1, meal: 'Pranzo', intake_time: '14:00', is_processed: true },
      { name: 'Petto di pollo', grams: 150, calories: 165, protein: 35, carbs: 0, fats: 2.5, fiber: 0, alcohol: 0, meal: 'Cena', intake_time: '20:30', is_processed: false },
      { name: 'Zucchine grigliate', grams: 150, calories: 39, protein: 2.5, carbs: 5, fats: 0.5, fiber: 2, alcohol: 0, meal: 'Cena', intake_time: '20:30', is_processed: false },
    ],
  },
  // Day -3: Good balanced day
  {
    water: 2200,
    active_calories: 280,
    entries: [
      { name: 'Uova strapazzate', grams: 150, calories: 210, protein: 18, carbs: 1.5, fats: 14, fiber: 0, alcohol: 0, meal: 'Colazione', intake_time: '08:00', is_processed: false },
      { name: 'Pane integrale', grams: 60, calories: 144, protein: 6, carbs: 28, fats: 1.5, fiber: 4, alcohol: 0, meal: 'Colazione', intake_time: '08:05', is_processed: false },
      { name: 'Skyr Lidl', grams: 150, calories: 90, protein: 16.5, carbs: 6, fats: 0.3, fiber: 0, alcohol: 0, meal: 'Spuntino mattina', intake_time: '10:30', is_processed: false },
      { name: 'Pasta integrale', grams: 80, calories: 280, protein: 11, carbs: 56, fats: 1.5, fiber: 7, alcohol: 0, meal: 'Pranzo', intake_time: '13:00', is_processed: false },
      { name: 'Ragù di manzo', grams: 120, calories: 204, protein: 18, carbs: 6, fats: 11, fiber: 1, alcohol: 0, meal: 'Pranzo', intake_time: '13:05', is_processed: false },
      { name: 'Mandorle', grams: 30, calories: 174, protein: 6, carbs: 5, fats: 15, fiber: 3.5, alcohol: 0, meal: 'Spuntino pomeriggio', intake_time: '16:30', is_processed: false },
      { name: 'Merluzzo al forno', grams: 180, calories: 162, protein: 36, carbs: 0, fats: 1.5, fiber: 0, alcohol: 0, meal: 'Cena', intake_time: '20:00', is_processed: false },
      { name: 'Patate al forno', grams: 150, calories: 135, protein: 3, carbs: 30, fats: 0.2, fiber: 2.5, alcohol: 0, meal: 'Cena', intake_time: '20:00', is_processed: false },
    ],
  },
  // Day -2: Moderate day
  {
    water: 1600,
    active_calories: 180,
    entries: [
      { name: 'Caffè con latte', grams: 200, calories: 52, protein: 3.4, carbs: 5, fats: 1.8, fiber: 0, alcohol: 0, meal: 'Colazione', intake_time: '07:45', is_processed: false },
      { name: 'Biscotti integrali', grams: 50, calories: 195, protein: 3.5, carbs: 34, fats: 5.5, fiber: 3, alcohol: 0, meal: 'Colazione', intake_time: '07:50', is_processed: true },
      { name: 'Insalata di pollo', grams: 250, calories: 310, protein: 32, carbs: 12, fats: 14, fiber: 4, alcohol: 0, meal: 'Pranzo', intake_time: '12:45', is_processed: false },
      { name: 'Frutta mista', grams: 150, calories: 90, protein: 1, carbs: 22, fats: 0.3, fiber: 3, alcohol: 0, meal: 'Spuntino pomeriggio', intake_time: '16:00', is_processed: false },
      { name: 'Minestrone', grams: 350, calories: 175, protein: 8, carbs: 28, fats: 3.5, fiber: 8, alcohol: 0, meal: 'Cena', intake_time: '19:45', is_processed: false },
    ],
  },
  // Day -1: Yesterday - slightly over protein
  {
    water: 2400,
    active_calories: 400,
    entries: [
      { name: 'Frullato proteico', grams: 350, calories: 350, protein: 35, carbs: 30, fats: 5, fiber: 3, alcohol: 0, meal: 'Colazione', intake_time: '07:00', is_processed: false },
      { name: 'Crackers integrali', grams: 40, calories: 152, protein: 4, carbs: 28, fats: 3, fiber: 2, alcohol: 0, meal: 'Spuntino mattina', intake_time: '10:00', is_processed: false },
      { name: 'Petto di tacchino', grams: 200, calories: 220, protein: 46, carbs: 0, fats: 2, fiber: 0, alcohol: 0, meal: 'Pranzo', intake_time: '13:00', is_processed: false },
      { name: 'Quinoa', grams: 100, calories: 368, protein: 14, carbs: 64, fats: 6, fiber: 7, alcohol: 0, meal: 'Pranzo', intake_time: '13:05', is_processed: false },
      { name: 'Cioccolato 78%', grams: 30, calories: 176, protein: 3, carbs: 9, fats: 13.5, fiber: 3.3, alcohol: 0, meal: 'Spuntino pomeriggio', intake_time: '16:30', is_processed: false },
      { name: 'Manzo alla griglia', grams: 180, calories: 360, protein: 40, carbs: 0, fats: 20, fiber: 0, alcohol: 0, meal: 'Cena', intake_time: '20:00', is_processed: false },
      { name: 'Spinaci saltati', grams: 100, calories: 35, protein: 3.5, carbs: 3, fats: 1, fiber: 2.5, alcohol: 0, meal: 'Cena', intake_time: '20:05', is_processed: false },
    ],
  },
  // Day 0 (today): Partial day - morning only
  {
    water: 900,
    active_calories: 80,
    entries: [
      { name: 'Avena', grams: 60, calories: 222, protein: 7.5, carbs: 38, fats: 3.8, fiber: 6, alcohol: 0, meal: 'Colazione', intake_time: '08:30', is_processed: false },
      { name: 'Latte di mandorla', grams: 200, calories: 52, protein: 1.2, carbs: 8, fats: 2, fiber: 0.5, alcohol: 0, meal: 'Colazione', intake_time: '08:30', is_processed: false },
      { name: 'Banana', grams: 90, calories: 80, protein: 1, carbs: 20.7, fats: 0.3, fiber: 2.3, alcohol: 0, meal: 'Spuntino mattina', intake_time: '10:30', is_processed: false },
    ],
  },
];

function getDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  try {
    // Ensure profile exists
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(PROFILE, { onConflict: 'telegram_id' });

    if (profileError) {
      return NextResponse.json({ error: 'Profile upsert failed', detail: profileError }, { status: 500 });
    }

    const results: { date: string; logId: string; entriesInserted: number }[] = [];

    for (let i = 0; i < DAYS.length; i++) {
      const daysAgo = DAYS.length - 1 - i; // 6 days ago → today
      const date = getDateString(daysAgo);
      const plan = DAYS[i];

      const totals = plan.entries.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fats: acc.fats + e.fats,
          fiber: acc.fiber + e.fiber,
          alcohol: acc.alcohol + e.alcohol,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, alcohol: 0 }
      );

      const logPayload = {
        user_id: USER_ID,
        date,
        water: plan.water,
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fats: Math.round(totals.fats * 10) / 10,
        fiber: Math.round(totals.fiber * 10) / 10,
        alcohol: Math.round(totals.alcohol * 10) / 10,
        active_calories: plan.active_calories,
        target_calories: PROFILE.target_calories,
        target_protein: PROFILE.target_protein,
        target_carbs: PROFILE.target_carbs,
        target_fats: PROFILE.target_fats,
        target_fiber: PROFILE.target_fiber,
        target_water: PROFILE.target_water,
        target_deficit: PROFILE.target_deficit,
        bmr: PROFILE.bmr,
        updated_at: new Date().toISOString(),
      };

      // Delete existing log for this date to avoid conflicts
      await supabaseAdmin
        .from('daily_logs')
        .delete()
        .eq('user_id', USER_ID)
        .eq('date', date);

      const { data: logData, error: logError } = await supabaseAdmin
        .from('daily_logs')
        .insert(logPayload)
        .select('id')
        .single();

      if (logError || !logData) {
        return NextResponse.json({ error: `Log insert failed for ${date}`, detail: logError }, { status: 500 });
      }

      const logId = logData.id;

      const foodEntries = plan.entries.map((e) => ({ ...e, log_id: logId }));
      const { error: entriesError } = await supabaseAdmin
        .from('food_entries')
        .insert(foodEntries);

      if (entriesError) {
        return NextResponse.json({ error: `Food entries insert failed for ${date}`, detail: entriesError }, { status: 500 });
      }

      results.push({ date, logId, entriesInserted: foodEntries.length });
    }

    return NextResponse.json({ success: true, userId: USER_ID, days: results });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: err?.message }, { status: 500 });
  }
}
