import type { Metadata } from "next";
import { getBoroughMap, getClosureAnalysis } from "../lib/inspections";
import { getNavigatorData } from "../lib/navigator-data";
import { ConnectedJourney } from "./ConnectedJourney";
import { SampleLauncher } from "./SampleLauncher";
import { SiteNav } from "./SiteNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Six Days — Understand your NYC restaurant closure", description: "Live public records and historical comparisons for NYC restaurant owners navigating closure and reopening." };
export default async function Home() {
  const [analysis, boroughMap, navigator] = await Promise.all([getClosureAnalysis(), getBoroughMap(), getNavigatorData()]);
  const data = analysis.ok ? analysis : null;
  return <main>
    <SiteNav />
    <header className="new-hero" id="top">
      <div className="hero-mark" aria-hidden="true">6</div>
      <div className="hero-content"><p className="live-label"><i/> NYC restaurant closure records</p><p className="hero-overline">Let your journey to reopening begin.</p><h1>See what the data<br/><em>can tell you.</em></h1><p>Six Days helps a closed restaurant owner understand the official record, compare similar cases, learn from repeat closures, estimate a historical timeline, and follow what changes next.</p><div className="hero-actions-row"><a href="#find" className="start-button">Find my restaurant <span>↓</span></a><SampleLauncher /></div></div>
      <div className="hero-stat"><strong>{data?.medianDays ?? 6}</strong><span>median recorded days<br/>to reopening</span><small>Historical context—not a prediction</small></div>
    </header>

    <ConnectedJourney episodes={navigator.episodes} events={navigator.events} boroughMap={boroughMap} fetchedAt={navigator.fetchedAt}/>
    <footer><a className="brand" href="#top">Six Days</a><p>Live NYC restaurant closure context</p><span>{data ? `${data.dateRange} · refreshed ${data.fetchedAt}` : "NYC Open Data"}</span></footer>
  </main>;
}
