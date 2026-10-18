"use client";

import { useEffect, useRef } from "react";
import { createHeroScene } from "@/lib/hero-scene";

/** Decorative only: the server-rendered hero remains the interaction surface. */
export function HeroBackground() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const host = element?.closest<HTMLElement>("[data-hero-stage]");
    if (!element || !host) return;
    return createHeroScene(element, host);
  }, []);

  return (
    <canvas
      ref={canvas}
      className="hero-canvas"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
