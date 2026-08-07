import type { Metadata } from "next";
import { getBoroughMap, getClosureAnalysis } from "../lib/inspections";
import { BookChapters } from "./BookChapters";
import { IntakeForm } from "./IntakeForm";
import { SiteNav } from "./SiteNav";
import { ReopeningBenchmarkExplorer } from "./ReopeningBenchmarkExplorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Six Days — Restaurant Reopening Service",
  description: "Affordable online support for NYC restaurants preparing to reopen after a DOHMH closure.",
};

const number = new Intl.NumberFormat("en-US");

export default async function Home() {
  const [analysis, boroughMap] = await Promise.all([getClosureAnalysis(), getBoroughMap()]);
  const data = analysis.ok ? analysis : null;
  const closureCount = data?.closureCount ?? 0;
  const reopeningRate = data?.reopeningRate ?? 0;
  const medianDays = data?.medianDays ?? 0;
  const fastRate = data?.fastReopeningRate ?? 0;
  const reopenedCount = data?.reopenedCount ?? 0;
  const timelineBuckets = data?.timelineBuckets ?? [];
  const topViolations = data?.topViolations ?? [];
  const maxBucket = Math.max(...timelineBuckets.map((item) => item.count), 1);
  const maxViolation = Math.max(...topViolations.map((item) => item.count), 1);

  return (
    <main>
      <SiteNav />

      <header className="hero" id="top">
        <div className="service-pill"><span /> NYC restaurant closures · live public records</div>
        <p className="hero-kicker">Sales stop. Rent, payroll, and spoilage do not.</p>
        <h1>Closed by DOHMH?<br /><span>Let’s get you back open.</span></h1>
        <p className="hero-copy">A DOHMH closure creates an immediate business crisis: lost revenue, disrupted staff, inventory at risk, and an unfamiliar correction process while every closed day adds pressure.</p>
        <div className="hero-actions">
          <a className="button primary" href="#evidence">See what the data shows</a>
          <a className="button secondary" href="#how-it-works">See our solution <span aria-hidden="true">↓</span></a>
        </div>
        <p className="authority-note">Six Days helps restaurants prepare. Only NYC DOHMH can authorize reopening.</p>
      </header>

      <BookChapters>
        <section className="book-chapter insight-chapter" id="evidence">
          <Chapter number="01" title="The closure journey" />
          <div className="chapter-heading inverse"><div><p className="eyebrow">The central insight</p><h2>Most reopen.<br /><span>Six days is the middle.</span></h2></div><p>Live NYC inspection rows become matched closure-to-reopening journeys. The result gives owners context—not a guarantee.</p></div>
          {data ? <><div className="primary-insight"><strong>{medianDays}</strong><p>median recorded days<br />from closure to reopening</p></div><div className="journey-rule" aria-hidden="true"><i /><span /></div><div className="journey-labels"><span>Closed by DOHMH</span><span>Later reopening recorded</span></div><div className="insight-stats"><Metric value={`${reopeningRate.toFixed(1)}%`} label="of closures had a later reopening" /><Metric value={number.format(reopenedCount)} label="events matched to a later reopening" /><Metric value={`${fastRate.toFixed(1)}%`} label="of matched cases reopened within 7 days" /></div></> : <p className="data-unavailable">The live NYC Open Data connection is temporarily unavailable.</p>}
        </section>

        <section className="book-chapter distribution-chapter">
          <Chapter number="02" title="Time to reopen" />
          <div className="chapter-heading"><div><p className="eyebrow">The median is only the center</p><h2>Not every recovery moves at the same speed.</h2></div><p>The distribution reveals the range: many restaurants return quickly, while others remain away from the record much longer.</p></div>
          <div className="distribution-visual" role="img" aria-label="Distribution of matched days from recorded closure to reopening">{timelineBuckets.map((bucket) => <div className="distribution-bar" key={bucket.label}><div><i style={{ height: `${Math.max(7, bucket.count / maxBucket * 100)}%` }}><span>{number.format(bucket.count)}</span></i></div><p>{bucket.label}</p></div>)}</div>
          <p className="data-caption"><span /> Matched closure-to-reopening events from NYC Open Data</p>
          {data && <>
            <div className="benchmark-divider"><span>Personalize the citywide insight</span></div>
            <div className="chapter-heading benchmark-heading"><div><p className="eyebrow">Reopening benchmark explorer</p><h2>See the pattern closest to your closure.</h2></div><p>Filter the same closure-event analysis by place, issue, and year—then check how complete the public record is.</p></div>
            <ReopeningBenchmarkExplorer records={data.benchmarkRecords} boroughMap={boroughMap} />
          </>}
        </section>

        <section className="book-chapter pattern-chapter">
          <Chapter number="03" title="What appears at closure" />
          <div className="chapter-heading"><div><p className="eyebrow">The correction burden</p><h2>The list is technical.<br />The pattern is clear.</h2></div><p>These are the most frequent codes recorded during closure inspections. Each restaurant still needs a plan based on its own official record.</p></div>
          <div className="pattern-list">{topViolations.map((item,index) => <article className="reveal" key={item.code}><span>{String(index+1).padStart(2,"0")}</span><div><div className="pattern-heading"><div><code>{item.code}</code><h3>{item.shortDescription}</h3></div><strong>{item.rate.toFixed(1)}%</strong></div><div className="pattern-track"><i style={{width:`${item.count/maxViolation*100}%`}} /></div><p>Present in {number.format(item.count)} recorded closure events</p></div></article>)}</div>
          {data && <details className="source-records" id="records"><summary>Inspect the source records and method <span>+</span></summary><div className="source-inner"><p>{data.dateRange} · refreshed {data.fetchedAt} · {number.format(data.closureCount)} closure events analyzed.</p><a href={data.apiUrl} target="_blank" rel="noreferrer">Open the exact API response ↗</a><a href="https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j" target="_blank" rel="noreferrer">Open NYC’s source dataset ↗</a></div></details>}
          <div className="data-takeaway"><p className="eyebrow">The gap the data exposes</p><h3>A longer violation list does not create a clearer path.</h3><p>Closure data tells an owner what was recorded. It does not tell them what to do first, what evidence to collect, or how to organize the work.</p><a href="#how-it-works">That is where Six Days begins →</a></div>
        </section>

        <section className="book-chapter service-chapter" id="how-it-works">
          <Chapter number="04" title="The Six Days solution" />
          <div className="chapter-heading">
            <div><p className="eyebrow">You hire us to create order</p><h2>From closure record<br />to reopening plan.</h2></div>
            <p>Built for independent operators who need clear next steps without beginning with the expense of traditional full-service consulting.</p>
          </div>
          <ol className="process-list">
            {[
              ["Submit your restaurant", "Send the restaurant name, address, or CAMIS number and your closure document."],
              ["We review the inspection", "Six Days organizes the recorded violations into clear corrective priorities."],
              ["Receive your action plan", "Work through a practical checklist tailored to the issues recorded at closure."],
              ["Document corrections", "Collect the photos, invoices, logs, and other evidence supporting completed work."],
              ["Assess readiness", "Review what is complete, what remains, and what to prepare before reinspection."],
            ].map(([title, copy], index) => <li className="reveal" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}
          </ol>
        </section>

        <section className="book-chapter deliverables-chapter" id="deliverables">
          <Chapter number="05" title="What you receive" />
          <div className="chapter-heading inverse">
            <div><p className="eyebrow">A concrete service—not another report</p><h2>Everything organized<br />around your inspection.</h2></div>
            <p>Your restaurant’s official record remains the authority. We make the work easier to understand, sequence, and document.</p>
          </div>
          <div className="deliverable-list">
            {[
              ["Closure-inspection review", "Your recorded closure event and cited conditions, assembled in one place."],
              ["Plain-language breakdown", "Technical violation language translated into understandable issue groups."],
              ["Prioritized corrective checklist", "A clear order of work based on the conditions in your inspection."],
              ["Evidence checklist", "Guidance on the records, photos, and supporting documents to organize."],
              ["Readiness review", "A final structured review before you proceed toward reinspection."],
              ["Specialist escalation", "A path to qualified professional support when online guidance is not enough."],
            ].map(([title, copy], index) => <article className="reveal" key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section className="book-chapter pricing-chapter" id="pricing">
          <Chapter number="06" title="Engagement and pricing" />
          <div className="chapter-heading">
            <div><p className="eyebrow">Choose the level of support</p><h2>Start online.<br />Escalate only if needed.</h2></div>
            <p>Pricing has not been finalized. The placeholders below show the intended packages and will be replaced before launch.</p>
          </div>
          <div className="pricing-list">
            <article className="reveal"><div><span>Essential</span><h3>Reopening Review</h3><p>For owners who need a clear interpretation of the closure record.</p></div><strong>$___</strong><ul><li>Inspection review</li><li>Plain-language issue summary</li><li>Target response: ___ business days</li></ul></article>
            <article className="reveal featured"><div><span>Guided</span><h3>Guided Reopening Plan</h3><p>For owners who want a corrective plan and readiness structure.</p></div><strong>$___</strong><ul><li>Everything in Reopening Review</li><li>Prioritized action and evidence checklists</li><li>Readiness review</li></ul></article>
            <article className="reveal"><div><span>Complex cases</span><h3>Specialist Support</h3><p>For situations requiring high-touch or on-site professional expertise.</p></div><strong>Custom quote</strong><ul><li>Qualified-specialist referral</li><li>Scope confirmed before engagement</li><li>No automatic escalation charges</li></ul></article>
          </div>
          <p className="placeholder-note">Pre-launch pricing placeholders · no purchase is available yet</p>
        </section>

        <section className="book-chapter trust-chapter" id="trust">
          <Chapter number="07" title="Trust and boundaries" />
          <div className="chapter-heading inverse"><div><p className="eyebrow">High-stakes help should be transparent</p><h2>Know who is helping—and where authority rests.</h2></div><p>These launch requirements are intentionally marked as placeholders until verified business information is supplied.</p></div>
          <div className="trust-list">
            <article><span>Required before launch</span><h3>Named advisor credentials</h3><p>Add verified food-safety, restaurant operations, and compliance experience.</p></article>
            <article><span>Required before launch</span><h3>Sample deliverable</h3><p>Show a redacted example of the review, action plan, and evidence checklist.</p></article>
            <article><span>Required before launch</span><h3>Pilot result or testimonial</h3><p>Use only an attributable, approved customer statement or documented pilot result.</p></article>
            <article><span>Service commitment</span><h3>Privacy and response time</h3><p>Closure documents are treated as confidential. Confirm the response-time promise before launch.</p></article>
          </div>
          <div className="legal-boundary"><strong>Important limitation</strong><p>Six Days provides organizational and preparation support. It does not represent NYC DOHMH, provide legal advice, guarantee an outcome, or authorize a restaurant to reopen.</p></div>
        </section>

        <section className="book-chapter intake-chapter" id="start">
          <Chapter number="08" title="Start your reopening review" />
          <div className="chapter-heading"><div><p className="eyebrow">Begin with the closure record</p><h2>Tell us where<br />your restaurant stands.</h2></div><p>Complete the intake below so the service can identify the restaurant, understand the closure, and determine the appropriate level of support.</p></div>
          <IntakeForm />
        </section>
      </BookChapters>

      <footer><a className="brand" href="#top">Six Days</a><p>Online reopening preparation for independent NYC restaurants.</p><span>Pre-launch service preview</span></footer>
    </main>
  );
}

function Chapter({ number: n, title }: { number: string; title: string }) {
  return <div className="chapter-folio"><span>Chapter {n}</span><i>{title}</i><b>{n}</b></div>;
}

function Metric({ value, label }: { value: string; label: string }) {
  return <article className="reveal"><strong>{value}</strong><p>{label}</p></article>;
}
