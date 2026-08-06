"use client";

import { useEffect, type ReactNode } from "react";

export function BookChapters({ children }: { children: ReactNode }) {
  useEffect(() => {
    const chapters = Array.from(document.querySelectorAll<HTMLElement>(".book-chapter, .reveal"));
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }),
      { threshold: 0.035, rootMargin: "7% 0px 7% 0px" },
    );
    chapters.forEach((chapter) => observer.observe(chapter));

    return () => observer.disconnect();
  }, []);

  return <div className="book-experience">{children}</div>;
}
