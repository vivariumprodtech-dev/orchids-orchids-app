import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "http://api.giada.care/v1";
const TOKEN    = "dk_namaedpfjvrtqmxbr0hr5ukw";

async function upstreamFetch(path: string) {
  const res = await fetch(`${UPSTREAM}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstream ${res.status}: ${path}`);
  return res.json();
}

/** Fetch every page of a cursor-paginated endpoint server-side. */
async function fetchAllPages<T>(basePath: string, listKey: string): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;

  while (true) {
    const url    = cursor ? `${basePath}?cursor=${encodeURIComponent(cursor)}` : basePath;
    const page   = await upstreamFetch(url);
    const items  = (page[listKey] as T[]) ?? [];
    all.push(...items);
    if (!page.nextCursor) break;
    cursor = page.nextCursor as string;
  }

  return all;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  try {
    // All 5 endpoints fetched in parallel, each fully paginated server-side
    const [profileRes, foodEntries, dailyGoals, healthData, activeCalories] =
      await Promise.all([
        upstreamFetch(`/users/${userId}/profile`),
        fetchAllPages(`/users/${userId}/food-entries`,    "foodEntries"),
        fetchAllPages(`/users/${userId}/daily-goals`,     "dailyGoals"),
        fetchAllPages(`/users/${userId}/health-data`,     "healthData"),
        fetchAllPages(`/users/${userId}/active-calories`, "activeCalories"),
      ]);

    return NextResponse.json({
      profile:        profileRes.profile,
      foodEntries,
      dailyGoals,
      healthData,
      activeCalories,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch user data" },
      { status: 502 }
    );
  }
}
