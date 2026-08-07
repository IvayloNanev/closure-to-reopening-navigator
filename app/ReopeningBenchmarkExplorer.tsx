"use client";

import { useMemo, useState } from "react";
import type { BoroughMapPath } from "../lib/inspections";

type Record = {
  borough: string;
  closureDate: string;
  reopeningDays: number | null;
  codes: string[];
};

const codeLabels: globalThis.Record<string, string> = {
  "08A": "08A · Pest-conducive conditions",
  "04L": "04L · Evidence of mice",
  "04N": "04N · Flies or refuse conditions",
  "06D": "06D · Food-contact sanitation",
  "10F": "10F · Surface sanitation",
  "06C": "06C · Food-contact surface condition",
  "02G": "02G · Cold food temperature",
};

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function percent(value: number, total: number) {
  return total ? `${((value / total) * 100).toFixed(1)}%` : "—";
}

export function ReopeningBenchmarkExplorer({ records, boroughMap }: { records: Record[]; boroughMap: BoroughMapPath[] }) {
  const [borough, setBorough] = useState("All boroughs");
  const [code, setCode] = useState("All violations");
  const [year, setYear] = useState("All years");
  const [lens, setLens] = useState<"time" | "coverage">("time");
  const [showTable, setShowTable] = useState(false);

  const boroughs = useMemo(() => [...new Set(records.map((item) => item.borough))].filter((item) => item !== "Borough unavailable").sort(), [records]);
  const years = useMemo(() => [...new Set(records.map((item) => item.closureDate.slice(0, 4)))].sort().reverse(), [records]);
  const codes = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((item) => item.codes.forEach((itemCode) => counts.set(itemCode, (counts.get(itemCode) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([itemCode]) => itemCode);
  }, [records]);

  const filtered = useMemo(() => records.filter((item) =>
    (borough === "All boroughs" || item.borough === borough) &&
    (code === "All violations" || item.codes.includes(code)) &&
    (year === "All years" || item.closureDate.startsWith(year))
  ), [records, borough, code, year]);

  const mapRecords = useMemo(() => records.filter((item) =>
    (code === "All violations" || item.codes.includes(code)) &&
    (year === "All years" || item.closureDate.startsWith(year))
  ), [records, code, year]);
  const boroughMetrics = useMemo(() => boroughs.map((name) => {
    const items = mapRecords.filter((item) => item.borough === name);
    const reopened = items.filter((item) => item.reopeningDays !== null);
    const value = lens === "time"
      ? median(reopened.map((item) => item.reopeningDays as number))
      : (items.length ? (reopened.length / items.length) * 100 : null);
    return { name, value, count: items.length };
  }), [boroughs, mapRecords, lens]);
  const mapValues = boroughMetrics.map((item) => item.value).filter((value): value is number => value !== null);
  const mapMin = Math.min(...mapValues, 0);
  const mapMax = Math.max(...mapValues, 1);

  function mapColor(value: number | null) {
    if (value === null) return "#d8d2c5";
    const strength = (value - mapMin) / Math.max(mapMax - mapMin, 1);
    return `hsl(42 58% ${78 - strength * 42}%)`;
  }

  const matched = filtered.filter((item) => item.reopeningDays !== null);
  const matchedDays = matched.map((item) => item.reopeningDays as number);
  const unmatched = filtered.length - matched.length;
  const med = median(matchedDays);
  const smallSample = filtered.length > 0 && filtered.length < 30;
  const delayMetrics = [7, 14, 30].map((days) => {
    const cutoff = Date.now() - days * 86_400_000;
    const eligible = filtered.filter((item) => new Date(`${item.closureDate}T00:00:00Z`).getTime() <= cutoff);
    return {
      days,
      count: eligible.filter((item) => item.reopeningDays === null || item.reopeningDays > days).length,
      total: eligible.length,
    };
  });

  return (
    <div className="benchmark-explorer">
      <div className="benchmark-toolbar">
        <div className="benchmark-lenses" aria-label="Choose analysis view">
          <button type="button" className={lens === "time" ? "active" : ""} onClick={() => setLens("time")}>Reopening time</button>
          <button type="button" className={lens === "coverage" ? "active" : ""} onClick={() => setLens("coverage")}>Data coverage</button>
        </div>
        <p>Live NYC Open Data · closure events from the last four calendar years</p>
      </div>

      <div className="benchmark-filters">
        <label>Borough<select value={borough} onChange={(event) => setBorough(event.target.value)}><option>All boroughs</option>{boroughs.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Violation at closure<select value={code} onChange={(event) => setCode(event.target.value)}><option>All violations</option>{codes.map((item) => <option value={item} key={item}>{codeLabels[item] || item}</option>)}</select></label>
        <label>Closure year<select value={year} onChange={(event) => setYear(event.target.value)}><option>All years</option>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>

      <div className="borough-map-panel">
        <div className="borough-map-copy"><p className="map-kicker">Borough comparison</p><h3>{lens === "time" ? "Median days to a recorded reopening" : "Matched reopening coverage"}</h3><p>Select a borough on the map to focus every result. Choose it again to return to all boroughs.</p><div className="map-legend"><span>Lower</span><i /><span>Higher</span></div></div>
        <div className="borough-map" role="group" aria-label="Filter results using the NYC borough map">
          {boroughMap.length ? <svg viewBox="0 0 720 430" role="img" aria-label="Official NYC borough boundaries shaded by the selected benchmark">
            {boroughMap.map((shape) => {
              const item = boroughMetrics.find((metric) => metric.name === shape.name);
              if (!item) return null;
              const label = item.value === null ? "—" : lens === "time" ? `${item.value}d` : `${item.value.toFixed(0)}%`;
              return <g key={shape.name} className={borough === shape.name ? "map-borough selected" : "map-borough"}>
                <path
                  d={shape.path}
                  fill={mapColor(item.value)}
                  fillRule="evenodd"
                  role="button"
                  tabIndex={0}
                  aria-pressed={borough === shape.name}
                  aria-label={`${shape.name}: ${item.value === null ? "no result" : lens === "time" ? `${item.value} median days` : `${item.value.toFixed(1)}% matched`}; ${item.count} closure events`}
                  onClick={() => setBorough(borough === shape.name ? "All boroughs" : shape.name)}
                  onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setBorough(borough === shape.name ? "All boroughs" : shape.name); } }}
                />
                <g className="map-label" transform={`translate(${shape.labelX} ${shape.labelY})`} aria-hidden="true"><text className="map-name">{shape.name}</text><text className="map-value" y="18">{label}</text><text className="map-count" y="31">n={item.count}</text></g>
              </g>;
            })}
          </svg> : <p className="map-unavailable">NYC boundary geometry is temporarily unavailable. Use the borough filter above.</p>}
          <p className="map-source">NYC Department of City Planning · shoreline-clipped borough boundaries</p>
        </div>
      </div>

      {filtered.length ? <>
        {smallSample && <p className="sample-warning" role="status">Small sample: treat this selection as directional, not predictive.</p>}
        {lens === "time" ? <div className="benchmark-results">
          <article className="benchmark-lead"><span>Median recorded reopening</span><strong>{med === null ? "—" : med}</strong><p>{med === 1 ? "day" : "days"} · among matched closures</p></article>
          <div className="delay-grid">{delayMetrics.map((metric) => <article key={metric.days}><strong>{percent(metric.count, metric.total)}</strong><p>had no reopening recorded within {metric.days} days</p></article>)}</div>
        </div> : <div className="coverage-results">
          <article><strong>{percent(matched.length, filtered.length)}</strong><p>Matched to a later reopening</p><i style={{ width: percent(matched.length, filtered.length) }} /></article>
          <article><strong>{percent(unmatched, filtered.length)}</strong><p>No later reopening matched</p><i style={{ width: percent(unmatched, filtered.length) }} /></article>
        </div>}
        <div className="benchmark-footer"><p><strong>{filtered.length.toLocaleString()}</strong> closure events in this selection · <strong>{matched.length.toLocaleString()}</strong> matched reopenings</p><a href="#start">Turn my closure report into a reopening plan →</a></div>
        <button className="table-toggle" type="button" aria-expanded={showTable} onClick={() => setShowTable(!showTable)}>{showTable ? "Hide data table" : "View as data table"}</button>
        {showTable && <div className="benchmark-table-wrap"><table><caption>Benchmark results for the current selection</caption><thead><tr><th>Measure</th><th>Result</th><th>Base</th></tr></thead><tbody><tr><td>Median reopening time</td><td>{med === null ? "Not available" : `${med} days`}</td><td>{matched.length} matched</td></tr>{delayMetrics.map((metric) => <tr key={metric.days}><td>No reopening within {metric.days} days</td><td>{percent(metric.count, metric.total)}</td><td>{metric.total} eligible closures</td></tr>)}<tr><td>Matched coverage</td><td>{percent(matched.length, filtered.length)}</td><td>{filtered.length} closures</td></tr></tbody></table></div>}
      </> : <p className="benchmark-empty">No closure events match this combination. Try widening one filter.</p>}

      <details className="benchmark-method"><summary>How to read this benchmark <span>+</span></summary><div><p>One record represents one DOHMH closure event. A closure is “matched” when a later DOHMH reopening action appears for the same restaurant. Median time uses matched records only; each delay percentage excludes closures too recent to have reached that threshold.</p><p>These figures describe public records, not an expected outcome. Unmatched closures may later be updated, and the data does not show every operational step between closure and reopening.</p></div></details>
    </div>
  );
}
