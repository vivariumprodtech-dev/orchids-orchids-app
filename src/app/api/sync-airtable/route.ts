import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fetchAirtable(table: string) {
  let allRecords: any[] = [];
  let offset = "";

  do {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${table}${offset ? `?offset=${offset}` : ""}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Airtable error (${table}): ${error}`);
    }

    const data = await res.json();
    allRecords = [...allRecords, ...data.records];
    offset = data.offset;
  } while (offset);

  return allRecords.map((r: any) => ({ ...r.fields, airtable_id: r.id }));
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting Airtable Sync...");

    // 1. Fetch Daily Summaries
    const dailySummaries = await fetchAirtable("Export_Daily_Summary");
    console.log(`Fetched ${dailySummaries.length} daily summaries.`);

    // 2. Fetch Meal Details
    const mealDetails = await fetchAirtable("Export_Meal_Details");
    console.log(`Fetched ${mealDetails.length} meal details.`);

      // 3. Sync Daily Logs
      // We group by user_id and date to ensure we have one log per day
      for (const summary of dailySummaries) {
        const { 
          user_id, 
          date, 
          water, 
          active_calories, 
          alcohol, 
          target_calories,
          target_protein,
          target_carbs,
          target_fats,
          target_fiber,
          target_water,
          target_deficit,
          bmr
        } = summary;
        
        if (!user_id || !date) continue;

        // Upsert daily log
        const { data: log, error: logError } = await supabase
          .from("daily_logs")
          .upsert(
            {
              user_id: String(user_id),
              date,
              water: water || 0,
              active_calories: active_calories || 0,
              alcohol: alcohol || 0,
              target_calories: target_calories || null,
              target_protein: target_protein || null,
              target_carbs: target_carbs || null,
              target_fats: target_fats || null,
              target_fiber: target_fiber || null,
              target_water: target_water || null,
              target_deficit: target_deficit || null,
              bmr: bmr || null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,date" }
          )
          .select()
          .single();

      if (logError) {
        console.error(`Error upserting log for ${user_id} on ${date}:`, logError);
        continue;
      }

      // 4. Sync Food Entries for this log
      // Filter meal details for this user and date
      const mealsForDay = mealDetails.filter(
        (m: any) => String(m.user_id) === String(user_id) && m.date === date
      );

      if (mealsForDay.length > 0) {
        // Delete existing entries for this log to prevent duplicates
        await supabase.from("food_entries").delete().eq("log_id", log.id);

        const foodEntries = mealsForDay.map((m: any) => ({
          log_id: log.id,
          name: m.name,
          meal: m.meal,
          grams: Number(m.grams) || 0,
          calories: Number(m.calories) || 0,
          protein: Number(m.protein) || 0,
          carbs: Number(m.carbs) || 0,
          fats: Number(m.fats) || 0,
          fiber: Number(m.fiber) || 0,
          alcohol: Number(m.alcohol) || 0,
          is_processed: m.is_processed === "Sì" || m.is_processed === true,
          intake_time: m.intake_time || null,
        }));

        const { error: foodError } = await supabase.from("food_entries").insert(foodEntries);
        if (foodError) {
          console.error(`Error inserting food entries for ${user_id} on ${date}:`, foodError);
        }

        // 5. Recalculate daily totals from food entries
        const totals = foodEntries.reduce(
          (acc, curr) => ({
            calories: acc.calories + curr.calories,
            protein: acc.protein + curr.protein,
            carbs: acc.carbs + curr.carbs,
            fats: acc.fats + curr.fats,
            fiber: acc.fiber + curr.fiber,
            alcohol: acc.alcohol + curr.alcohol,
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, alcohol: 0 }
        );

        await supabase
          .from("daily_logs")
          .update({
            calories: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fats: totals.fats,
            fiber: totals.fiber,
            alcohol: totals.alcohol,
          })
          .eq("id", log.id);
      }
    }

    return NextResponse.json({ success: true, message: "Sync completed successfully" });
  } catch (error: any) {
    console.error("Sync failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
