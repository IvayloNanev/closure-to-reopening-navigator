const perspectives = {
  owner: {
    label: "Restaurant owner",
    kicker: "Your restaurant has been closed. What happens next?",
    lineOne: "Most reopen.",
    lineTwo: "Six days is the middle.",
    copy: "See how other NYC restaurants moved from recorded closure to reopening—and what their records can help you prepare for.",
    reason: "Understand the path ahead",
  },
  advisor: {
    label: "Food-safety advisor",
    kicker: "Your client needs a clear path back to service.",
    lineOne: "Find the issue.",
    lineTwo: "Focus the recovery.",
    copy: "Identify the closure-code patterns and recovery timelines that can help you prioritize a restaurant client’s work.",
    reason: "Analyze closure patterns",
  },
  support: {
    label: "Business support organization",
    kicker: "A closure puts a small business under immediate pressure.",
    lineOne: "See the scale.",
    lineTwo: "Target the support.",
    copy: "Measure how many businesses face closure, how many recover quickly, and where prolonged disruption creates a need for assistance.",
    reason: "Measure business disruption",
  },
} as const;

export type Perspective = keyof typeof perspectives;

export function PerspectiveHero({ selected }: { selected: Perspective }) {
  const content = perspectives[selected];

  return (
    <section className="hero" id="top">
      <div className="live-pill"><span /> Connected to NYC Open Data</div>
      <div className="perspective-picker" aria-label="Choose your perspective">
        <p>See the analysis as a</p>
        <div className="perspective-options" role="group" aria-label="Data perspective">
          {(Object.entries(perspectives) as Array<[Perspective, typeof perspectives[Perspective]]>).map(([key, item]) => (
            <a key={key} className={selected === key ? "active" : ""} aria-current={selected === key ? "page" : undefined} href={`?perspective=${key}#top`}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
      <div className="hero-message">
        <p className="hero-kicker">{content.kicker}</p>
        <h1>{content.lineOne}<br /><span>{content.lineTwo}</span></h1>
        <p className="hero-copy">{content.copy}</p>
        <a className="text-link" href="#journey">{content.reason} <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  );
}
