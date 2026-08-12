import type { Metadata } from "next";
import { ConnectedJourney } from "./ConnectedJourney";
import { SiteNav } from "./SiteNav";

export const metadata: Metadata = { title: "Six Days — Understand your NYC restaurant closure", description: "Live public records and exact-match historical comparisons for NYC restaurant owners navigating closure and reopening." };
export default function Home() {
  const today = new Date().toISOString().slice(0,10);
  const dateRange = `${new Date().getUTCFullYear()-4}-01-01–${today}`;
  return <main>
    <SiteNav />
    <ConnectedJourney episodes={[]} events={[]} boroughMap={[]} fetchedAt="" dateRange={dateRange}/>
    <footer><a className="brand" href="#top">Six Days</a><p>NYC closure context and exact-match timing benchmarks</p><span>{dateRange} · live records checked after selection</span></footer>
  </main>;
}
