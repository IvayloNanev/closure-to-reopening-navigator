"use client";

import { useMemo, useState } from "react";

type Restaurant = {
  camis: string; name: string; borough: string; closureDate: string;
  reopeningDate: string | null; reopeningDays: number | null;
  codes: Array<{ code: string; description: string }>; laterClosureCount: number;
};

export function RestaurantFinder({ restaurants }: { restaurants: Restaurant[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return restaurants.filter((item) => `${item.name} ${item.camis} ${item.borough}`.toLowerCase().includes(needle)).slice(0, 7);
  }, [query, restaurants]);

  return <div className="finder">
    <label htmlFor="restaurant-search">Restaurant name or CAMIS number</label>
    <div className="search-row"><input id="restaurant-search" value={query} onChange={(event) => { setQuery(event.target.value); setSelected(null); }} placeholder="Start typing a restaurant name…" autoComplete="off"/><span>LIVE NYC DATA</span></div>
    {matches.length > 0 && !selected && <ul className="search-results">{matches.map((item) => <li key={`${item.camis}-${item.closureDate}`}><button onClick={() => { setSelected(item); setQuery(item.name); }}><strong>{item.name}</strong><span>{item.borough} · closed {item.closureDate} · CAMIS {item.camis}</span></button></li>)}</ul>}
    {query.trim().length >= 2 && matches.length === 0 && !selected && <p className="no-match">No recent closure record matches that search. Try the official restaurant name or CAMIS number.</p>}
    {selected && <div className="record-card">
      <div className="record-top"><div><span>OFFICIAL RECORDED CLOSURE</span><h3>{selected.name}</h3><p>{selected.borough} · CAMIS {selected.camis}</p></div><strong className={selected.reopeningDate ? "status-open" : "status-closed"}>{selected.reopeningDate ? "REOPENED" : "NO REOPENING RECORDED"}</strong></div>
      <div className="record-facts"><article><span>Closure</span><strong>{selected.closureDate}</strong></article><article><span>Later reopening</span><strong>{selected.reopeningDate ?? "Not recorded"}</strong></article><article><span>Elapsed time</span><strong>{selected.reopeningDays === null ? "—" : `${selected.reopeningDays} days`}</strong></article><article><span>Later closures</span><strong>{selected.laterClosureCount}</strong></article></div>
      <h4>Violations recorded at closure</h4>
      <div className="code-list">{selected.codes.length ? selected.codes.map((item) => <article key={item.code}><code>{item.code}</code><p>{item.description}</p></article>) : <p>No violation code was included in this public record.</p>}</div>
      <p className="record-boundary">This view reports what appears in NYC Open Data. It does not determine required corrections or authorize reopening.</p>
    </div>}
  </div>;
}
