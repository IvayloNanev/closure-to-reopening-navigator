import { NextResponse } from "next/server";
import { getBoroughMap } from "../../../lib/inspections";
import { getNavigatorData } from "../../../lib/navigator-data";

export const revalidate = 21600;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [data, boroughMap] = await Promise.all([getNavigatorData(), getBoroughMap()]);
    return NextResponse.json({ episodes: data.episodes, events: [], fetchedAt: data.fetchedAt, recordCount: data.recordCount, dateRange: data.dateRange, boroughMap }, { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
  } catch (error) {
    console.error("[six-days] background comparison data unavailable", error);
    return NextResponse.json({ error: "Comparison data is temporarily unavailable." }, { status: 503 });
  }
}
