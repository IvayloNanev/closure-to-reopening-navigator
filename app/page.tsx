import type { Metadata } from "next";
import { getClosureAnalysis } from "../lib/inspections";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Six Days — NYC Restaurant Closure Data",
  description:
    "A live visualization of how NYC restaurants move from recorded closure to reopening.",
};

const formatNumber = new Intl.NumberFormat("en-US");

export default async function Home() {
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
  } = analysis;

  const maxViolationCount = Math.max(...topViolations.map((item) => item.count), 1);
  const maxBucketCount = Math.max(...timelineBuckets.map((item) => item.count), 1);

  return (
    <main>
      <nav className="nav-shell" aria-label="Primary navigation">
        <a className="brand" href="#top">Six Days</a>
        <div className="nav-links">
          <a href="#journey">The journey</a>
          <a href="#issues">The issues</a>
          <a className="nav-cta" href="#method">View the data</a>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="live-pill"><span /> Connected to NYC Open Data</div>
        <p className="hero-kicker">After a restaurant closes, every day matters.</p>
        <h1>Most reopen.<br /><span>Six days is the middle.</span></h1>
        <p className="hero-copy">
          A live look at recorded restaurant closures and reopenings across New York City—
          transformed from thousands of technical inspection rows into one human story.
        </p>
        <a className="text-link" href="#journey">Explore the insight <span aria-hidden="true">↓</span></a>
      </section>

      <section className="dark-story" id="journey">
        <div className="section-intro inverse">
          <p className="eyebrow">The closure journey</p>
          <h2>A shutdown is a moment.<br />Reopening is a process.</h2>
        </div>
        <div className="metric-stage">
          <article className="primary-metric">
            <p className="metric-value">{medianDays}</p>
            <p className="metric-label">median recorded days<br />from closure to reopening</p>
          </article>
          <div className="journey-line" aria-hidden="true">
            <span className="journey-start" />
            <span className="journey-progress" />
            <span className="journey-end" />
          </div>
          <div className="journey-labels">
            <span>Closed by DOHMH</span>
            <span>Recorded reopening</span>
          </div>
        </div>

        <div className="stat-grid">
          <article>
            <p className="stat-number">{reopeningRate.toFixed(1)}%</p>
            <p>of recorded closures had a later recorded reopening.</p>
          </article>
          <article>
            <p className="stat-number">{formatNumber.format(reopenedCount)}</p>
            <p>closure events were matched to a later reopening.</p>
          </article>
          <article>
            <p className="stat-number">{fastReopeningRate.toFixed(1)}%</p>
            <p>of matched cases reopened within seven recorded days.</p>
          </article>
        </div>
      </section>

      <section className="light-section distribution-section">
        <div className="section-intro">
          <p className="eyebrow">Time to reopen</p>
          <h2>Not every recovery<br />moves at the same speed.</h2>
          <p className="section-copy">
            The median gives us the center. The distribution shows the reality: some restaurants
            return quickly, while others remain away from the record much longer.
          </p>
        </div>
        <div className="distribution-card" role="img" aria-label="Distribution of days from recorded closure to reopening">
          <div className="bars">
            {timelineBuckets.map((bucket) => (
              <div className="bar-group" key={bucket.label}>
                <div className="bar-track">
                  <div className="bar" style={{ height: `${Math.max(8, (bucket.count / maxBucketCount) * 100)}%` }}>
                    <span>{formatNumber.format(bucket.count)}</span>
                  </div>
                </div>
                <p>{bucket.label}</p>
              </div>
            ))}
          </div>
          <div className="chart-caption"><span /> Matched closure-to-reopening events</div>
        </div>
      </section>

      <section className="issue-section" id="issues">
        <div className="section-intro narrow">
          <p className="eyebrow">What appears at closure</p>
          <h2>The list is technical.<br />The pattern is clear.</h2>
          <p className="section-copy">
            These are the most common violation codes recorded during closure inspections.
            Each event is counted once per code, even when the source contains repeated rows.
          </p>
        </div>
        <div className="violation-list">
          {topViolations.map((violation, index) => (
            <article className="violation-row" key={violation.code}>
              <div className="rank">{String(index + 1).padStart(2, "0")}</div>
              <div className="violation-content">
                <div className="violation-heading">
                  <div>
                    <span className="code">{violation.code}</span>
                    <h3>{violation.shortDescription}</h3>
                  </div>
                  <p>{violation.rate.toFixed(1)}%</p>
                </div>
                <div className="line-track">
                  <span style={{ width: `${(violation.count / maxViolationCount) * 100}%` }} />
                </div>
                <p className="row-note">Present in {formatNumber.format(violation.count)} recorded closure events</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="takeaway-section">
        <p className="eyebrow">The takeaway</p>
        <h2>A longer violation list<br />doesn’t create a clearer path.</h2>
        <p>
          Closure data tells owners what was recorded. It does not tell them what to do first.
          That gap is where the next product begins: an issue-specific plan for reopening.
        </p>
        <div className="future-product">
          <span>Next phase</span>
          <strong>Closure-to-Reopening Navigator</strong>
          <p>From inspection rows to a prioritized recovery plan.</p>
        </div>
      </section>

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
