"use client";

export function SampleLauncher() {
  return (
    <button className="hero-sample" type="button" onClick={() => {
      window.dispatchEvent(new CustomEvent("six-days-load-sample"));
      document.getElementById("find")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }}>
      <span>See how it works</span>
      <strong>Explore a sample restaurant</strong>
      <b aria-hidden="true">→</b>
    </button>
  );
}
