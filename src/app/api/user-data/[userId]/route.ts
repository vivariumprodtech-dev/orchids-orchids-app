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

/** ISO date string 60 days ago (our data window). */
function cutoffDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 60);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Fetch pages until we've covered the last 2 months.
 *  The API returns entries newest-first, so we stop as soon as every
 *  item on a page is older than the cutoff. */
async function fetchRecentPages<T extends { date?: string }>(
  basePath: string,
  listKey: string
): Promise<T[]> {
  const cutoff = cutoffDate();
  const all: T[] = [];
  let cursor: string | undefined;

  while (true) {
    const url   = cursor ? `${basePath}?cursor=${encodeURIComponent(cursor)}` : basePath;
    const page  = await upstreamFetch(url);
    const items = (page[listKey] as T[]) ?? [];

    for (const item of items) {
      const d = item.date?.slice(0, 10);
      if (d && d >= cutoff) all.push(item);
    }

    // If the last item on this page is already before the cutoff, stop.
    const lastDate = items[items.length - 1]?.date?.slice(0, 10);
    if (!page.nextCursor || (lastDate && lastDate < cutoff)) break;

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
    // All 5 endpoints fetched in parallel, limited to the last 2 months
    const [profileRes, foodEntries, dailyGoals, healthData, activeCalories] =
      await Promise.all([
        upstreamFetch(`/users/${userId}/profile`),
        fetchRecentPages(`/users/${userId}/food-entries`,    "foodEntries"),
        fetchRecentPages(`/users/${userId}/daily-goals`,     "dailyGoals"),
        fetchRecentPages(`/users/${userId}/health-data`,     "healthData"),
        fetchRecentPages(`/users/${userId}/active-calories`, "activeCalories"),
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
