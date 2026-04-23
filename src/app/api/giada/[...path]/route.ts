import { NextRequest, NextResponse } from "next/server";

const UPSTREAM = "http://api.giada.care/v1";
const TOKEN    = "dk_namaedpfjvrtqmxbr0hr5ukw";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Reconstruct the upstream path + query string
  const { path: pathSegments } = await params;
  const upstreamPath = pathSegments.join("/");
  const search       = _req.nextUrl.search ?? "";
  const url          = `${UPSTREAM}/${upstreamPath}${search}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      // Disable Next.js fetch cache so we always get fresh data
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Proxy error" },
      { status: 502 }
    );
  }
}
