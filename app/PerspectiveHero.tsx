"use client";

import { useState } from "react";

const perspectives = {
  owner: {
    label: "Restaurant owner",
    kicker: "Your restaurant has been closed. What happens next?",
    lineOne: "Most reopen.",
    lineTwo: "Six days is the middle.",
    copy: "See how other NYC restaurants moved from recorded closure to reopening—and which issues appeared most often when every day mattered.",
    reason: "Understand the path ahead",
  },
  advisor: {
    label: "Food-safety advisor",
    kicker: "Your client needs a clear path back to service.",
    lineOne: "See the pattern.",
    lineTwo: "Guide the recovery.",
    copy: "Compare recorded reopening timelines and closure-code patterns to give restaurant clients clearer, evidence-informed support.",
    reason: "Explore comparable cases",
  },
  support: {
    label: "Business support organization",
    kicker: "A closure puts a small business under immediate pressure.",
    lineOne: "Find the need.",
    lineTwo: "Focus the support.",
    copy: "Use citywide closure and reopening patterns to understand where independent restaurants may need faster, more targeted assistance.",
    reason: "See where support matters",
  },
} as const;

type Perspective = keyof typeof perspectives;

export function PerspectiveHero() {
  const [selected, setSelected] = useState<Perspective>("owner");
  const content = perspectives[selected];

  return (
    <section className="hero" id="top">
      <div className="live-pill"><span /> Connected to NYC Open Data</div>
      <div className="perspective-picker" aria-label="Choose your perspective">
        <p>See the data as a</p>
        <div className="perspective-options" role="group" aria-label="Data perspective">
          {(Object.entries(perspectives) as Array<[Perspective, typeof perspectives[Perspective]]>).map(([key, item]) => (
            <button
              key={key}
              type="button"
              className={selected === key ? "active" : ""}
              aria-pressed={selected === key}
              onClick={() => setSelected(key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="hero-message" key={selected}>
        <p className="hero-kicker">{content.kicker}</p>
        <h1>{content.lineOne}<br /><span>{content.lineTwo}</span></h1>
        <p className="hero-copy">{content.copy}</p>
        <a className="text-link" href="#journey">{content.reason} <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}
