"use client";

export function SiteNav() {
  const goHome = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.dispatchEvent(new Event("six-days-reset"));
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <nav className="nav-shell" aria-label="Primary navigation">
      <a className="brand" href="#top" onClick={goHome}>Six Days</a>
      <span className="nav-purpose">NYC closure record explorer</span>
      <button className="nav-reset" type="button" onClick={() => { window.dispatchEvent(new Event("six-days-reset")); window.scrollTo({ top: 0, behavior: "auto" }); }}>Start another journey</button>
    </nav>
  );
}
