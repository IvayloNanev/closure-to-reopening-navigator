"use client";

import { useState } from "react";

const links = [
  ["My record", "top"],
  ["Compare", "compare"],
  ["Repeat closures", "repeat"],
  ["Timeline", "timeline"],
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);

  const go = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    setOpen(false);
    if (target instanceof HTMLDetailsElement) target.open = true;
    history.pushState(null, "", `#${id}`);
    requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <nav className="nav-shell" aria-label="Primary navigation">
      <a className="brand" href="#top" onClick={go("top")}>Six Days</a>
      <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="site-menu" onClick={() => setOpen(!open)}>
        <span>{open ? "Close" : "Menu"}</span><i aria-hidden="true" />
      </button>
      <div className={`nav-links ${open ? "open" : ""}`} id="site-menu">
        {links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={go(id)}>{label}</a>)}
        <a className="nav-cta" href="#monitor" onClick={go("monitor")}>Follow my record</a>
      </div>
    </nav>
  );
}
