import { NextRequest, NextResponse } from "next/server";
import { syncAirtableToSupabase } from "@/lib/airtable";

export async function POST(req: NextRequest) {
  try {
    const result = await syncAirtableToSupabase();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Sync failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
