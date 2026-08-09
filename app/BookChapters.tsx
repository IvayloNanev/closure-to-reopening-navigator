"use client";

import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";

const labels = ["Start", "My closure", "Compare similar closures", "Reopening changes", "Historical timeline", "Latest record"];

export function BookChapters({ children, unlockedThrough = 1 }: { children: ReactNode; unlockedThrough?: number }) {
  const pages = useMemo(() => Children.toArray(children).filter(isValidElement) as ReactElement<{ id?: string; className?: string }>[], [children]);
  const [active, setActive] = useState(0);

  const go = useCallback((index: number) => {
    const next = Math.max(0, Math.min(pages.length - 1, index));
    if (next > unlockedThrough) return;
    setActive(next);
    const id = pages[next]?.props.id;
    if (id) history.replaceState(null, "", `#${id}`);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, [pages, unlockedThrough]);

  useEffect(() => {
    const selectHash = () => {
      const index = pages.findIndex(page => page.props.id === location.hash.slice(1));
      if (index >= 0 && index <= unlockedThrough) setActive(index);
    };
    const selectEvent = (event: Event) => {
      const index = pages.findIndex(page => page.props.id === (event as CustomEvent<string>).detail);
      if (index >= 0) go(index);
    };
    selectHash();
    window.addEventListener("hashchange", selectHash);
    window.addEventListener("six-days-go-step", selectEvent);
    return () => {
      window.removeEventListener("hashchange", selectHash);
      window.removeEventListener("six-days-go-step", selectEvent);
    };
  }, [pages, unlockedThrough, go]);

  const blockedMessage = active === 1 ? "Select a restaurant to continue" : active === 2 ? "Confirm a comparison group to continue" : "Complete this step to continue";

  return <div className="guided-journey">
    <nav className="journey-rail" aria-label="Journey progress"><strong className="rail-title">YOUR REOPENING JOURNEY</strong>
      {pages.map((page, index) => <div className="rail-stop" key={page.props.id ?? index}>
        {index > 0 && <i aria-hidden="true" />}
        <button type="button" className={index === active ? "current" : index < active ? "complete" : ""} disabled={index > unlockedThrough} onClick={() => go(index)} aria-current={index === active ? "step" : undefined}>
          <span>{index === 0 ? "0" : index}</span><small>{labels[index]}</small>
        </button>
      </div>)}
    </nav>
    {pages.map((page, index) => <div className="journey-page" key={page.props.id ?? index} hidden={index !== active}>
      {cloneElement(page, { className: `${page.props.className ?? ""} guided-card is-visible` })}
      <div className="page-arrows">
        {index > 0 ? <button type="button" className="back-arrow" onClick={() => go(index - 1)}>← <span>{index === 1 ? "Start" : `Step ${index - 1}`}</span></button> : <span />}
        {index < pages.length - 1 ? <div className="forward-wrap"><button type="button" className="forward-arrow" disabled={index + 1 > unlockedThrough} onClick={() => go(index + 1)}><span>{index === 0 ? "Step 1 · Find my restaurant" : `Step ${index + 1} · ${labels[index + 1]}`}</span> →</button>{index + 1 > unlockedThrough && <small>{blockedMessage}</small>}</div> : <button type="button" className="forward-arrow" onClick={() => go(0)}><span>Start another journey</span> ↻</button>}
      </div>
    </div>)}
  </div>;
}
