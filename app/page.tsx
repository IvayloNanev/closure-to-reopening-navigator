import type { Metadata } from "next";
import { getBoroughMap, getClosureAnalysis } from "../lib/inspections";
import { BookChapters } from "./BookChapters";
import { IntakeForm } from "./IntakeForm";
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
    <header className="new-hero journey-hero" id="top">
      <div className="hero-mark" aria-hidden="true">6</div>
      <div className="hero-content"><p className="live-label"><i/> LIVE NYC RESTAURANT CLOSURE RECORDS</p><p className="hero-overline">From closure record to what happens next.</p><h1>Your reopening story,<br/><em>in six clear steps.</em></h1><p>Six Days turns a technical public record into a guided evidence journey. Each step answers one question a restaurant owner needs to understand.</p>
        <div className="journey-chain">{[["01","Find","Why was I closed?","find"],["02","Compare","What happened to similar cases?","compare"],["03","Prioritize","Which conditions returned?","repeat"],["04","Observe","What changed at reopening?","change"],["05","Time","How long did it take?","timeline"],["06","Follow","What was recorded next?","monitor"]].map(([n,title,copy,id],index)=><a href={`#${id}`} key={n} className="journey-card"><span>{n}</span><strong>{title}</strong><p>{copy}</p>{index<5&&<i aria-hidden="true">→</i>}</a>)}</div>
        <a href="#find" className="start-button">Start with my restaurant <span>↓</span></a>
      </div>
    </header>

    <BookChapters>
      <section className="book-chapter owner-step" id="find"><Step n="01" title="Find my restaurant" question="Why was my restaurant closed?"/><p className="step-intro">Begin with the official public record. Search recent NYC closure events to see what was recorded—not an interpretation of what happened.</p>{data ? <RestaurantFinder restaurants={data.restaurantRecords}/> : <Unavailable/>}</section>

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

      <section className="book-chapter pattern-chapter" id="evidence">
        <Chapter number="07" title="The citywide evidence" />
        <div className="chapter-heading"><div><p className="eyebrow">What appears at closure</p><h2>The list is technical.<br/>The pattern is visible.</h2></div><p>The most frequent codes recorded during closure inspections provide citywide context for an owner’s individual record.</p></div>
        <div className="pattern-list">{data?.topViolations.map((item,index)=><article className="reveal" key={item.code}><span>{String(index+1).padStart(2,"0")}</span><div><div className="pattern-heading"><div><code>{item.code}</code><h3>{item.shortDescription}</h3></div><strong>{item.rate.toFixed(1)}%</strong></div><div className="pattern-track"><i style={{width:`${item.rate}%`}}/></div><p>Present in {number.format(item.count)} recorded closure events</p></div></article>)}</div>
        {data&&<details className="source-records" id="records"><summary>Inspect the source records and method <span>+</span></summary><div className="source-inner"><p>{data.dateRange} · refreshed {data.fetchedAt} · {number.format(data.closureCount)} closure events analyzed.</p><a href={data.apiUrl} target="_blank" rel="noreferrer">Open the exact API response ↗</a><a href="https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j" target="_blank" rel="noreferrer">Open NYC’s source dataset ↗</a></div></details>}
      </section>

      <section className="book-chapter service-chapter" id="how-it-works">
        <Chapter number="08" title="How Six Days helps" />
        <div className="chapter-heading"><div><p className="eyebrow">A decision-support product</p><h2>Context first.<br/>Evidence next.</h2></div><p>Six Days does not prescribe repairs. It organizes observable public records so an owner can make better-informed decisions.</p></div>
        <ol className="process-list">{[["Find the official record","Search by restaurant name or CAMIS and review the recorded closure."],["Compare the case","Explore local, borough, and citywide historical context."],["Study repeat closures","See which recorded conditions returned in later closure events."],["Observe reopening changes","Compare what appeared at closure with the next reopening record."],["Follow the live record","Watch for new inspections, actions, violations, grades, or reopening."]].map(([title,copy],index)=><li className="reveal" key={title}><span>0{index+1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
      </section>

      <section className="book-chapter deliverables-chapter" id="deliverables">
        <Chapter number="09" title="What the owner receives" />
        <div className="chapter-heading inverse"><div><p className="eyebrow">One clear view of the evidence</p><h2>Useful context,<br/>without false certainty.</h2></div><p>Every result shows its source, comparison criteria, observation period, and sample size.</p></div>
        <div className="deliverable-list">{[["Official closure summary","The restaurant’s recorded action, date, violations, and status."],["Comparable-case benchmark","Historical reopening distributions for a transparent comparison group."],["Geographic context","Neighborhood, borough, and citywide patterns."],["Repeat-closure evidence","Recorded violations that appeared again in later closures."],["Reopening transition","What changed between closure and the next reopening record."],["Live record view","New public inspections, actions, grades, and violations as recorded."]].map(([title,copy],index)=><article className="reveal" key={title}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <section className="book-chapter pricing-chapter" id="pricing">
        <Chapter number="10" title="Product access" />
        <div className="chapter-heading"><div><p className="eyebrow">MVP access model</p><h2>Start with the record.<br/>Go deeper only if useful.</h2></div><p>Pricing remains a pre-launch hypothesis and is not presented as a finished offer.</p></div>
        <div className="pricing-list"><article className="reveal"><div><span>Public context</span><h3>Restaurant Lookup</h3><p>Find a closure record and see citywide context.</p></div><strong>Free</strong><ul><li>Official-record lookup</li><li>Basic reopening benchmark</li><li>Citywide comparison</li></ul></article><article className="reveal featured"><div><span>Owner view</span><h3>Tracked Restaurant</h3><p>Save one restaurant’s complete evidence journey.</p></div><strong>Proposed</strong><ul><li>Comparable-case filters</li><li>Repeat-closure analysis</li><li>Live record monitoring</li></ul></article><article className="reveal"><div><span>Groups</span><h3>Multiple Locations</h3><p>Compare records across an operator’s locations.</p></div><strong>Future</strong><ul><li>Location comparison</li><li>Portfolio trends</li><li>Shared monitoring view</li></ul></article></div>
        <p className="placeholder-note">MVP pricing hypothesis · no purchase is available</p>
      </section>

      <section className="book-chapter trust-chapter" id="trust">
        <Chapter number="11" title="Trust and boundaries" />
        <div className="chapter-heading inverse"><div><p className="eyebrow">The record has limits</p><h2>Evidence should be clear<br/>about what it cannot say.</h2></div><p>Historical observations are not predictions, instructions, or a substitute for official DOHMH communication.</p></div>
        <div className="trust-list"><article><span>Observable</span><h3>What NYC recorded</h3><p>Inspection dates, actions, violations, scores, grades, and event sequences.</p></article><article><span>Calculated</span><h3>Historical comparisons</h3><p>Medians, distributions, recurrence rates, and sample sizes derived from public records.</p></article><article><span>Not observable</span><h3>Work performed</h3><p>The dataset does not show repairs, contractors, documents submitted, or operational decisions.</p></article><article><span>Not promised</span><h3>An individual outcome</h3><p>The product cannot guarantee a reopening date or determine whether a correction is sufficient.</p></article></div>
        <div className="legal-boundary"><strong>Important limitation</strong><p>Six Days is an independent decision-support product. Only NYC DOHMH determines required corrections and authorizes reopening.</p></div>
      </section>

      <section className="book-chapter intake-chapter" id="start">
        <Chapter number="12" title="Help shape the pilot" />
        <div className="chapter-heading"><div><p className="eyebrow">Test the owner journey</p><h2>Tell us which record<br/>you need to understand.</h2></div><p>Use this pre-launch form to identify a restaurant and the part of the public record that needs clarification.</p></div>
        <IntakeForm />
      </section>
    </BookChapters>
    <footer><a className="brand" href="#top">Six Days</a><p>Live NYC restaurant closure context</p><span>{data ? `${data.dateRange} · refreshed ${data.fetchedAt}` : "NYC Open Data"}</span></footer>
  </main>;
}

function Step({n,title,question}:{n:string;title:string;question:string}) { return <><div className="step-label"><span>STEP {n}</span><i>{title}</i></div><h2>{question}</h2></> }
function Chapter({number,title}:{number:string;title:string}) { return <div className="chapter-folio"><span>Chapter {number}</span><i>{title}</i><b>{number}</b></div> }
function Unavailable(){return <p className="data-unavailable">The NYC Open Data connection is temporarily unavailable. Please try again shortly.</p>}
