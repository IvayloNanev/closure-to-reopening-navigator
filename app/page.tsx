import type { Metadata } from "next";
import { getBoroughMap, getClosureAnalysis } from "../lib/inspections";
import { BookChapters } from "./BookChapters";
import { RestaurantFinder } from "./RestaurantFinder";
import { ReopeningBenchmarkExplorer } from "./ReopeningBenchmarkExplorer";
import { SiteNav } from "./SiteNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Six Days — Understand your NYC restaurant closure", description: "Live public records and historical comparisons for NYC restaurant owners navigating closure and reopening." };
const number = new Intl.NumberFormat("en-US");

export default async function Home() {
  const [analysis, boroughMap] = await Promise.all([getClosureAnalysis(), getBoroughMap()]);
  const data = analysis.ok ? analysis : null;
  return <main>
    <SiteNav />
    <header className="new-hero search-hero" id="top">
      <div className="hero-mark" aria-hidden="true">6</div>
      <div className="hero-content"><p className="live-label"><i/> STEP 01 · LIVE NYC RESTAURANT CLOSURE RECORDS</p><p className="hero-overline">Start with your official record.</p><h1>Why was my restaurant<br/><em>closed?</em></h1><p>Find your restaurant to see the closure date, violations, recorded reopening status, and what NYC’s public data says happened next.</p>{data ? <RestaurantFinder restaurants={data.restaurantRecords}/> : <Unavailable/>}<a href="#compare" className="journey-link">Then compare my case with other restaurants <span>↓</span></a></div>
    </header>

    <BookChapters>
      <section className="book-chapter owner-step context-step" id="compare"><Step n="02" title="Explore the context" question="What happened to similarly closed restaurants?"/><p className="step-intro">Move from your case to its context. Compare closure records by borough, violation, and year, then see the same pattern across NYC.</p>{data ? <ReopeningBenchmarkExplorer records={data.benchmarkRecords} boroughMap={boroughMap}/> : <Unavailable/>}</section>

      <section className="book-chapter owner-step dark-step" id="repeat"><Step n="03" title="Learn from repeat closures" question="Which recorded conditions came back?"/><p className="step-intro">For restaurants with a later recorded closure, we compare the violation codes at the first and later closure. Repeated codes become an evidence-based attention list—not repair instructions.</p>
        <div className="repeat-grid">{data?.repeatClosurePatterns.length ? data.repeatClosurePatterns.map((item, index) => <article key={item.code}><span>0{index+1}</span><code>{item.code}</code><h3>{item.description}</h3><strong>{item.repeatRate.toFixed(0)}%</strong><p>repeated in a later closure among eligible repeat-closure records · {item.repeatedCount} observed repeats</p></article>) : <p>Repeat-closure patterns are temporarily unavailable.</p>}</div>
        <div className="evidence-rule"><strong>What this supports</strong><p>These codes deserve attention because they appeared again in the public record. The data does not reveal the repair performed between inspections.</p></div>
      </section>

      <section className="book-chapter owner-step" id="change"><Step n="04" title="Study the reopening record" question="What changed before reopening was recorded?"/><p className="step-intro">Compare the closure event with the next recorded reopening event: which codes no longer appear, which remain, the elapsed time, and the resulting public action.</p>
        <div className="transition"><div><span>CLOSURE RECORD</span><strong>Recorded violations</strong><p>Codes, descriptions, date and inspection action</p></div><i>→</i><div><span>NEXT REOPENING RECORD</span><strong>Observed change</strong><p>Present or absent codes, elapsed days and reopening action</p></div></div>
        <p className="plain-note">A code disappearing from a later record does not prove which correction was made. It shows only what NYC recorded at each event.</p>
      </section>

      <section className="book-chapter owner-step timeline-step" id="timeline"><Step n="05" title="Understand the timeline" question="How long did comparable cases take?"/>{data ? <><div className="timeline-lead"><strong>{data.medianDays}</strong><div><h3>days is the citywide median</h3><p>among {number.format(data.reopenedCount)} closure events matched to a later reopening record.</p></div></div><div className="timeline-bars">{data.timelineBuckets.map((bucket) => <article key={bucket.label}><strong>{number.format(bucket.count)}</strong><i style={{width:`${Math.max(8,bucket.count/Math.max(...data.timelineBuckets.map(x=>x.count))*100)}%`}}/><span>{bucket.label}</span></article>)}</div><p className="plain-note">Your filtered comparison in Step 2 is more relevant than the citywide median. Every figure is a historical benchmark, never a promised reopening date.</p></> : <Unavailable/>}</section>

      <section className="book-chapter owner-step monitor-step" id="monitor"><Step n="06" title="Follow my live record" question="What has NYC recorded next?"/><p className="step-intro">Return to one calm timeline. Each update is an observable change in the public dataset—not a hidden prediction.</p><div className="monitor-flow">{[["Inspection","A new inspection date or type appears"],["Action","Closure or reopening status changes"],["Violations","A code appears, remains, or disappears"],["Grade","A grade or grade date is recorded"],["Later closure","Another closure event appears"]].map(([title,copy],i)=><article key={title}><b>{i+1}</b><div><strong>{title}</strong><p>{copy}</p></div></article>)}</div><div className="final-boundary"><strong>Six Days informs. The owner decides.</strong><p>Only NYC DOHMH determines required corrections and authorizes reopening.</p></div></section>
    </BookChapters>
    <footer><a className="brand" href="#top">Six Days</a><p>Live NYC restaurant closure context</p><span>{data ? `${data.dateRange} · refreshed ${data.fetchedAt}` : "NYC Open Data"}</span></footer>
  </main>;
}

function Step({n,title,question}:{n:string;title:string;question:string}) { return <><div className="step-label"><span>STEP {n}</span><i>{title}</i></div><h2>{question}</h2></> }
function Unavailable(){return <p className="data-unavailable">The NYC Open Data connection is temporarily unavailable. Please try again shortly.</p>}
