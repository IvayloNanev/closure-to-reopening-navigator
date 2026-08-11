import type { Metadata } from "next";
import { getBoroughMap } from "../lib/inspections";
import { getNavigatorData } from "../lib/navigator-data";
import { ConnectedJourney } from "./ConnectedJourney";
import { SiteNav } from "./SiteNav";

export const revalidate = 21600;
export const metadata: Metadata = { title: "Six Days — Understand your NYC restaurant closure", description: "Live public records and exact-match historical comparisons for NYC restaurant owners navigating closure and reopening." };
export default async function Home() {
  const [mapResult, dataResult] = await Promise.allSettled([getBoroughMap(), getNavigatorData()]);
  if (mapResult.status === "rejected") console.error("[six-days] borough map unavailable", mapResult.reason);
  if (dataResult.status === "rejected") console.error("[six-days] navigator data unavailable", dataResult.reason);
  if (dataResult.status === "rejected") return <main>
    <SiteNav />
    <section className="data-unavailable" role="alert">
      <span>NYC OPEN DATA CONNECTION</span>
      <h1>Live restaurant data is temporarily unavailable</h1>
      <p>Six Days could not retrieve the closure records needed to search or build comparisons. Your search has not been submitted.</p>
      <a href="/">Try loading the data again →</a>
      <small>If the problem continues, check the official NYC restaurant inspection site and return later.</small>
    </section>
  </main>;
  const navigator = dataResult.value;
  const boroughMap = mapResult.status === "fulfilled" ? mapResult.value : [];
  return <main>
    <SiteNav />
    <ConnectedJourney episodes={navigator.episodes} events={navigator.events} boroughMap={boroughMap} fetchedAt={navigator.fetchedAt}/>
    <footer><a className="brand" href="#top">Six Days</a><p>NYC closure context and exact-match timing benchmarks</p><span>{navigator.dateRange} · retrieved {navigator.fetchedAt}</span></footer>
  </main>;
}
