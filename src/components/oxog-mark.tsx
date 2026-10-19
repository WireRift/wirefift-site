"use client";

import { useEffect, useRef } from "react";

export function OxogMark() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const symbol = ref.current;
    if (!symbol || !("IntersectionObserver" in window)) return;
    let visible = false;
    function sync() {
      if (symbol) symbol.dataset.visible = String(visible && !document.hidden);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(symbol);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      delete symbol.dataset.visible;
    };
  }, []);
  return (
    <svg
      ref={ref}
      viewBox="0 0 200 130"
      fill="none"
      aria-hidden="true"
      className="oxog-mark"
    >
      <path
        d="M93 56 72 35C49 13 14 24 9 53 3 84 23 104 46 103"
        stroke="var(--oxog-pink)"
        strokeWidth="12"
      />
      <path
        d="M146 25c24-7 45 10 47 34 3 26-16 46-39 44-14-1-24-11-41-27"
        stroke="var(--oxog-pink)"
        strokeWidth="12"
      />
      <path
        d="M76 18c30-20 75 1 77 40 1 12-1 24-6 33M53 36c-19 41 14 84 50 79 9-1 16-3 22-7"
        stroke="var(--oxog-purple)"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d="m74 87 54-51"
        stroke="var(--oxog-pink)"
        strokeWidth="12"
        strokeLinecap="square"
      />
    </svg>
  );
}
