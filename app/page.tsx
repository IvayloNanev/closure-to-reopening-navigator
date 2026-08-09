import type { Metadata } from "next";
import { getBoroughMap, getClosureAnalysis } from "../lib/inspections";
import { getNavigatorData } from "../lib/navigator-data";
import { ConnectedJourney } from "./ConnectedJourney";
import { SiteNav } from "./SiteNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Six Days — Understand your NYC restaurant closure", description: "Live public records and historical comparisons for NYC restaurant owners navigating closure and reopening." };
export default async function Home() {
  const [analysis, boroughMap, navigator] = await Promise.all([getClosureAnalysis(), getBoroughMap(), getNavigatorData()]);
  const data = analysis.ok ? analysis : null;
  return <main>
    <SiteNav />
    <ConnectedJourney episodes={navigator.episodes} events={navigator.events} boroughMap={boroughMap} fetchedAt={navigator.fetchedAt} medianDays={data?.medianDays??6}/>
    <footer><a className="brand" href="#top">Six Days</a><p>Live NYC restaurant closure context</p><span>{data ? `${data.dateRange} · refreshed ${data.fetchedAt}` : "NYC Open Data"}</span></footer>
  </main>;
}
