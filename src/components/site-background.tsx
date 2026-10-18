"use client";

import { useEffect, useId, useRef } from "react";
import { createSiteBackground } from "@/lib/site-background";

/** One persistent, decorative SVG behind every route and section. */
export function SiteBackground() {
  const svg = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");
  const wire = `${id}-wire`;
  const amber = `${id}-amber`;
  useEffect(() => {
    if (svg.current) return createSiteBackground(svg.current);
  }, []);

  return (
    <svg
      ref={svg}
      className="site-background"
      aria-hidden="true"
      tabIndex={-1}
      focusable="false"
      fill="none"
    >
      <defs>
        {[
          { id: wire, color: "var(--background-wire)" },
          { id: amber, color: "var(--background-amber)" },
        ].map((gradient) => (
          <linearGradient id={gradient.id} key={gradient.id}>
            <stop stopColor={gradient.color} stopOpacity="0" />
            <stop offset=".2" stopColor={gradient.color} stopOpacity=".8" />
            <stop offset=".5" stopColor={gradient.color} stopOpacity=".38" />
            <stop offset=".8" stopColor={gradient.color} stopOpacity=".8" />
            <stop offset="1" stopColor={gradient.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      <g>
        <svg
          className="background-contours"
          width="100%"
          height="100%"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="none"
        >
          <path
            stroke={`url(#${wire})`}
            d="M-90 95C390 95 365 405 890 305S1280 90 1680 160M-80 520C340 520 535 165 1050 490S1340 780 1690 620M-100 930C440 930 355 570 940 730S1350 1040 1700 860"
          />
          <path
            stroke={`url(#${amber})`}
            d="M-100 230C300 230 610 580 1000 380S1370 215 1680 300M-70 790C400 790 560 440 1060 650S1350 915 1690 780"
          />
        </svg>
        <g className="background-objects" />
        <g className="background-links" />
        <g className="background-effects" />
      </g>
    </svg>
  );
}
