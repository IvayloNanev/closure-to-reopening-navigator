const perspectives = {
  owner: {
    label: "Restaurant owner",
    kicker: "When your restaurant closes, the costs keep moving.",
    lineOne: "Closed doors.",
    lineTwo: "Revenue stops.",
    copy: "Every day can mean lost sales, disrupted staff, food and inventory risk, and pressure on your reputation. See what NYC records reveal about the path back to service.",
    reason: "Understand the path ahead",
  },
  advisor: {
    label: "Food-safety advisor",
    kicker: "A closed client is losing time, revenue, and trust.",
    lineOne: "Every lost day.",
    lineTwo: "Raises the stakes.",
    copy: "Your client may be balancing corrective work with payroll pressure, perishable inventory, and reputational risk. Use recorded patterns to focus the recovery.",
    reason: "Analyze closure patterns",
  },
  support: {
    label: "Business support organization",
    kicker: "A restaurant closure reaches far beyond the inspection.",
    lineOne: "One closure.",
    lineTwo: "Many consequences.",
    copy: "Lost income affects owners, workers, suppliers, and neighborhoods. Measure where prolonged disruption may create the greatest need for business support.",
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
