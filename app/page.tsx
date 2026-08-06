import type { Metadata } from "next";
import { getClosureAnalysis } from "../lib/inspections";
import { PerspectiveHero, type Perspective } from "./PerspectiveHero";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Six Days — NYC Restaurant Closure Data",
  description:
    "A live visualization of how NYC restaurants move from recorded closure to reopening.",
};

const formatNumber = new Intl.NumberFormat("en-US");

export default async function Home({ searchParams }: { searchParams: Promise<{ perspective?: string }> }) {
  const requestedPerspective = (await searchParams).perspective;
  const perspective: Perspective = requestedPerspective === "advisor" || requestedPerspective === "support" ? requestedPerspective : "owner";
  const analysis = await getClosureAnalysis();

  if (!analysis.ok) {
    return (
      <main className="error-page">
        <p className="eyebrow">NYC restaurant inspection data</p>
        <h1>The live connection needs a moment.</h1>
        <p>{analysis.message}</p>
        <a href="/">Try again</a>
      </main>
    );
  }

  const {
    closureCount,
    reopenedCount,
    reopeningRate,
    medianDays,
    fastReopeningRate,
    topViolations,
    timelineBuckets,
    dateRange,
    fetchedAt,
    apiUrl,
    sampleJourneys,
  } = analysis;

  const leadingViolation = topViolations[0];
  const prolongedCount = timelineBuckets.find((bucket) => bucket.label === "31+ days")?.count || 0;
  const prolongedRate = reopenedCount ? (prolongedCount / reopenedCount) * 100 : 0;
  const unmatchedCount = closureCount - reopenedCount;
  const withinSevenCount = timelineBuckets.slice(0, 2).reduce((sum, bucket) => sum + bucket.count, 0);
  const eightToThirtyCount = timelineBuckets.slice(2, 4).reduce((sum, bucket) => sum + bucket.count, 0);

  const view = perspective === "owner" ? {
    journeyEyebrow: "Your reopening outlook",
    journeyTitle: <>A closure is a moment.<br />Your reopening is a process.</>,
    primaryValue: medianDays,
    primaryLabel: <>median recorded days<br />from closure to reopening</>,
    stats: [
      [`${reopeningRate.toFixed(1)}%`, "of recorded closures had a later recorded reopening."],
      [formatNumber.format(reopenedCount), "restaurant closures were matched to a later reopening."],
      [`${fastReopeningRate.toFixed(1)}%`, "of matched restaurants reopened within seven recorded days."],
    ],
    issueEyebrow: "What owners should prepare for",
    issueTitle: <>Know what commonly<br />appears at closure.</>,
    issueCopy: "These frequently recorded codes show the types of conditions owners may need to address—not a personalized checklist or legal determination.",
    takeaway: <>The data can set expectations.<br />Your plan must fit your inspection.</>,
    takeawayCopy: "Use comparable timelines and common issues to prepare questions, organize work, and verify your own record with the city.",
  } : perspective === "advisor" ? {
    journeyEyebrow: "Case-planning benchmark",
    journeyTitle: <>Prioritize the pattern.<br />Then plan the recovery.</>,
    primaryValue: leadingViolation ? `${leadingViolation.rate.toFixed(0)}%` : "—",
    primaryLabel: <>of closure events included<br />the leading recorded code</>,
    stats: [
      [`${medianDays}`, "median recorded days available for coordinating corrective work."],
      [`${fastReopeningRate.toFixed(1)}%`, "of matched cases reopened within seven recorded days."],
      [formatNumber.format(topViolations.length), "leading code patterns surfaced for case comparison."],
    ],
    issueEyebrow: "Advisor pattern view",
    issueTitle: <>Start with recurring<br />closure conditions.</>,
    issueCopy: "Code frequency helps an advisor recognize common closure contexts, while the client’s actual inspection remains the authority for corrective work.",
    takeaway: <>Frequency guides attention.<br />It does not replace inspection detail.</>,
    takeawayCopy: "Use the citywide pattern to ask sharper questions, then build the recovery sequence from the client’s cited conditions and official guidance.",
  } : {
    journeyEyebrow: "Small-business disruption",
    journeyTitle: <>Measure the scale.<br />Find prolonged need.</>,
    primaryValue: formatNumber.format(closureCount),
    primaryLabel: <>recorded closure events<br />in the current analysis window</>,
    stats: [
      [formatNumber.format(unmatchedCount), "closures without a later reopening in the available records."],
      [`${prolongedRate.toFixed(1)}%`, "of matched recoveries took more than 30 recorded days."],
      [`${fastReopeningRate.toFixed(1)}%`, "of matched businesses returned within seven recorded days."],
    ],
    issueEyebrow: "Where support may concentrate",
    issueTitle: <>See the conditions<br />behind business disruption.</>,
    issueCopy: "Frequent closure codes can help support organizations shape education, referrals, and preparedness resources around recurring needs.",
    takeaway: <>Fast recovery is common.<br />Prolonged disruption still matters.</>,
    takeawayCopy: "The unmatched and 31-plus-day groups are signals for deeper research into where technical assistance or small-business support may be most valuable.",
  };

  return (
    <main>
      <nav className="nav-shell" aria-label="Primary navigation">
        <a className="brand" href="#top">Six Days</a>
        <div className="nav-links">
          <a href="#journey">The story</a>
          <a href="#records">Live records</a>
          <a className="nav-cta" href="#method">View the data</a>
        </div>
      </nav>

      <PerspectiveHero selected={perspective} />

      <section className={`outcome-story perspective-${perspective}`} id="journey">
        <div className="story-heading">
          <div><p className="eyebrow">One connected story</p><h2>{view.journeyTitle}</h2></div>
          <p>{view.takeawayCopy}</p>
        </div>

        <div className="flow-start">
          <span>Recorded closure events</span>
          <strong>{formatNumber.format(closureCount)}</strong>
        </div>
        <div className="flow-connector"><span /></div>

        <div className="outcome-split">
          <article className="outcome-card reopened">
            <span>Later reopening recorded</span>
            <strong>{reopeningRate.toFixed(1)}%</strong>
            <p>{formatNumber.format(reopenedCount)} events</p>
          </article>
          <article className="outcome-card unmatched">
            <span>No later reopening in available data</span>
            <strong>{closureCount ? ((unmatchedCount / closureCount) * 100).toFixed(1) : "0.0"}%</strong>
            <p>{formatNumber.format(unmatchedCount)} events</p>
          </article>
        </div>

        <div className="story-arrow" aria-hidden="true"><span /><i>Next: how long reopening took</i></div>

        <div className="time-story">
          <div className="time-heading"><span>Among matched reopenings</span><strong>Median: {medianDays} days</strong></div>
          <div className="time-bar" role="img" aria-label="Matched reopenings grouped by recovery time">
            <div className="time-fast" style={{ width: `${reopenedCount ? (withinSevenCount / reopenedCount) * 100 : 0}%` }} />
            <div className="time-middle" style={{ width: `${reopenedCount ? (eightToThirtyCount / reopenedCount) * 100 : 0}%` }} />
            <div className="time-long" style={{ width: `${reopenedCount ? (prolongedCount / reopenedCount) * 100 : 0}%` }} />
          </div>
          <div className="time-legend">
            <div><span className="legend-fast" /><strong>{fastReopeningRate.toFixed(1)}%</strong><p>within 7 days</p></div>
            <div><span className="legend-middle" /><strong>{reopenedCount ? ((eightToThirtyCount / reopenedCount) * 100).toFixed(1) : "0.0"}%</strong><p>8–30 days</p></div>
            <div><span className="legend-long" /><strong>{prolongedRate.toFixed(1)}%</strong><p>31+ days</p></div>
          </div>
        </div>

        <div className="story-arrow" aria-hidden="true"><span /><i>Next: what appeared at closure</i></div>

        <div className="issue-story">
          <div><p className="eyebrow">What appears at closure</p><h3>{view.issueTitle}</h3><p>{view.issueCopy}</p></div>
          <div className="issue-compact-list">
            {topViolations.slice(0, 3).map((violation) => (
              <article key={violation.code}>
                <div><span>{violation.code}</span><strong>{violation.rate.toFixed(1)}%</strong></div>
                <p>{violation.shortDescription}</p>
                <div className="compact-track"><span style={{ width: `${violation.rate}%` }} /></div>
              </article>
            ))}
          </div>
        </div>

        <div className="story-arrow" aria-hidden="true"><span /><i>What this means for you</i></div>

        <div className="story-conclusion">
          <span>{perspective === "owner" ? "For your next decision" : perspective === "advisor" ? "For case planning" : "For targeting support"}</span>
          <h3>{view.takeaway}</h3>
          <a href="#records">Verify with source records ↓</a>
        </div>
      </section>

      <details className="records-section" id="records">
        <summary>Verify with live source records <span>+</span></summary>
        <div className="records-inner">
        <div className="records-header">
          <div>
            <div className="api-status"><span /> API connected</div>
            <p className="eyebrow">Real records from the source</p>
            <h2>See what the<br />analysis is built on.</h2>
          </div>
          <p>
            These are recent matched journeys returned by the NYC Open Data API—not demo data.
            CAMIS is the city’s unique restaurant identifier.
          </p>
        </div>
        <div className="records-table-wrap">
          <table className="records-table">
            <thead><tr><th>Restaurant</th><th>CAMIS</th><th>Closed</th><th>Reopened</th><th>Days</th><th>Codes at closure</th></tr></thead>
            <tbody>
              {sampleJourneys.map((journey) => (
                <tr key={`${journey.camis}-${journey.closureDate}`}>
                  <td><strong>{journey.name}</strong></td>
                  <td className="mono">{journey.camis}</td>
                  <td>{journey.closureDate}</td>
                  <td>{journey.reopeningDate}</td>
                  <td><span className="days-chip">{journey.days}</span></td>
                  <td className="codes-cell">{journey.codes.length ? journey.codes.join(" · ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="api-proof">
          <div><span>Endpoint</span><code>data.cityofnewyork.us/resource/43nn-pn8j.json</code></div>
          <div><span>Response scope</span><p>Closures + reopenings · {dateRange} · up to 50,000 rows</p></div>
          <a href={apiUrl} target="_blank" rel="noreferrer">Open this exact API response ↗</a>
        </div>
        </div>
      </details>

      <section className="method-section" id="method">
        <div>
          <p className="eyebrow">Connected methodology</p>
          <h2>Calculated from the source.</h2>
        </div>
        <div className="method-grid">
          <article><span>01</span><h3>Live source</h3><p>DOHMH New York City Restaurant Inspection Results via NYC Open Data.</p></article>
          <article><span>02</span><h3>Event grouping</h3><p>Repeated rows are grouped by restaurant, inspection date, action, and inspection type.</p></article>
          <article><span>03</span><h3>Journey matching</h3><p>Each closure is matched to the next later recorded reopening for the same CAMIS.</p></article>
          <article><span>04</span><h3>Current window</h3><p>{dateRange}. Refreshed {fetchedAt}.</p></article>
        </div>
        <div className="source-footer">
          <p>{formatNumber.format(closureCount)} closure events analyzed</p>
          <a href="https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j" target="_blank" rel="noreferrer">Open the source dataset ↗</a>
        </div>
      </section>
    </main>
  );
}
