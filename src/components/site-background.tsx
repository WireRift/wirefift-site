"use client";

import { useEffect, useId, useRef } from "react";
import {
  useAmbientMotion,
  usePointerEffects,
} from "@/lib/animation-preference";
import { createSiteBackground } from "@/lib/site-background";

/** Sibling viewport layers escape section clipping and local stacking contexts. */
export function SiteBackground() {
  const [pointerEnabled] = usePointerEffects();
  const ambientEnabled = useAmbientMotion();
  const svg = useRef<SVGSVGElement>(null);
  const interaction = useRef<SVGSVGElement>(null);
  const id = useId().replace(/:/g, "");
  const wire = `${id}-wire`;
  const amber = `${id}-amber`;
  const glow = `${id}-glow`;
  useEffect(() => {
    if (svg.current && interaction.current)
      return createSiteBackground(
        svg.current,
        interaction.current,
        pointerEnabled,
        ambientEnabled,
      );
  }, [pointerEnabled, ambientEnabled]);

  return (
    <>
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
        </g>
      </svg>
      <svg
        ref={interaction}
        className="site-interaction"
        aria-hidden="true"
        tabIndex={-1}
        focusable="false"
        fill="none"
      >
        <defs>
          <radialGradient id={glow}>
            <stop stopColor="var(--background-amber)" stopOpacity=".12" />
            <stop
              offset=".35"
              stopColor="var(--background-amber)"
              stopOpacity=".045"
            />
            <stop
              offset="1"
              stopColor="var(--background-amber)"
              stopOpacity="0"
            />
          </radialGradient>
        </defs>
        <g className="background-pointer" opacity="0">
          <circle r="160" fill={`url(#${glow})`} stroke="none" />
          <path
            className="background-pointer-orbit"
            d="M-54 0a54 54 0 0 1 87-43M54 0a54 54 0 0 1-87 43"
          />
          <circle r="4" className="background-pointer-core" />
        </g>
        <g className="background-trail" />
        <g className="background-reactions" />
        <g className="background-links" />
        <g className="background-effects" />
      </svg>
    </>
  );
}
