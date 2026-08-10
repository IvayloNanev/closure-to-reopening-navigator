import type { Metadata } from "next";
import { getBoroughMap } from "../lib/inspections";
import { getNavigatorData } from "../lib/navigator-data";
import { ConnectedJourney } from "./ConnectedJourney";
import { SiteNav } from "./SiteNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Six Days — Understand your NYC restaurant closure", description: "Live public records and exact-match historical comparisons for NYC restaurant owners navigating closure and reopening." };
export default async function Home() {
  const [boroughMap, navigator] = await Promise.all([getBoroughMap(), getNavigatorData()]);
  return <main>
    <SiteNav />
    <ConnectedJourney episodes={navigator.episodes} events={navigator.events} boroughMap={boroughMap} fetchedAt={navigator.fetchedAt}/>
    <footer><a className="brand" href="#top">Six Days</a><p>NYC closure context and exact-match timing benchmarks</p><span>{navigator.dateRange} · retrieved {navigator.fetchedAt}</span></footer>
  </main>;
}
