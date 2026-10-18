type Point = { x: number; y: number };
type Motif = {
  element: SVGGElement;
  animation: Animation | undefined;
  x: number;
  y: number;
  depth: number;
  visible: boolean;
};
type Burst = Point & { born: number; variant: number };

export const BACKGROUND = {
  breakpoint: 760,
  objects: { mobile: 12, desktop: 28, wide: 42 },
  radius: 200,
  force: 26,
  scrollParallax: 0.08,
  drift: 20,
  speed: 0.12,
  margin: 130,
  fps: { mobile: 30, desktop: 60, idle: 20 },
  idleAfter: 3,
  burstLife: 2.2,
  burstRadius: { mobile: 135, desktop: 220 },
  maxBursts: { mobile: 3, desktop: 5 },
  burstPackets: 8,
  maxLinks: 3,
} as const;

const NS = "http://www.w3.org/2000/svg";
const TAU = Math.PI * 2;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const number = (n: number) => n.toFixed(2);
const interactive =
  'a,button,input,select,textarea,summary,label,[role="button"],[role="dialog"],[role="menu"],[role="tablist"],[contenteditable]:not([contenteditable="false"])';
const copy = `${interactive},p,h1,h2,h3,h4,h5,h6,li,pre,code,table,blockquote,figcaption,.hero-copy,[data-no-background-effect]`;
const motifs = [
  "M-13-5H8l5 5v5h-26zM-7-1H5M-7 2H0",
  "M-23 0H-8L4-12H20M-8 0L4 12H20M17-15h6v6h-6zM17 9h6v6h-6z",
  "M0-21L18-10v20L0 21l-18-11v-20zM-7 0H7M0-7V7",
  "M-28-5H-12L-3 3M28 5H12L3-3M5-17L-6 1H4L-4 18",
  "M-25 0C-25-17 25-17 25 0S-25 17-25 0M0-24V-16M0 16V24M-4-4h8v8h-8z",
  "M-18-10v-8h8M10-18h8v8M18 10v8h-8M-10 18h-8v-8M-7 0H7M0-7V7",
];

function node<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
) {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs))
    element.setAttribute(key, value);
  return element;
}

/** No React frame updates; bounded SVG pools, time-based motion, full disposal. */
export function createSiteBackground(svg: SVGSVGElement) {
  const objectLayer = svg.querySelector<SVGGElement>(".background-objects");
  const links = svg.querySelector<SVGGElement>(".background-links");
  const effectLayer = svg.querySelector<SVGGElement>(".background-effects");
  if (!objectLayer || !links || !effectLayer) return;
  const objects = objectLayer;
  const effects = effectLayer;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let motionReduced = reduced.matches;
  let width = 1;
  let height = 1;
  let mobile = false;
  let shapes: Motif[] = [];
  let bursts: Burst[] = [];
  let burstNodes: {
    group: SVGGElement;
    ring: SVGCircleElement;
    hex: SVGPathElement;
    packets: SVGPathElement;
  }[] = [];
  const linkNodes = Array.from({ length: BACKGROUND.maxLinks }, () =>
    node("path", { display: "none" }),
  );
  links.replaceChildren(...linkNodes);
  let raf = 0;
  let lastPaint = 0;
  let time = 0;
  let intro = 0;
  let scroll = window.scrollY;
  let activeAt = -BACKGROUND.idleAfter;
  let inView = false;
  let disposed = false;
  let sequence = 0;
  const pointer = { x: 0, y: 0, strength: 0, target: 0 };
  let down: (Point & { id: number; at: number; moved: boolean }) | undefined;

  function hideBursts() {
    bursts = [];
    for (const item of burstNodes) item.group.setAttribute("display", "none");
  }
  function leave() {
    down = undefined;
    pointer.target = 0;
  }
  // Readability is computed on small vectors, avoiding full-viewport masks.
  function density(x: number) {
    return 0.38 + 0.62 * clamp(Math.abs(x / width - 0.5) * 2) ** 1.3;
  }
  function resize() {
    if (disposed) return;
    const bounds = svg.getBoundingClientRect();
    const nextWidth = Math.max(1, bounds.width);
    const nextHeight = Math.max(1, bounds.height);
    if (
      shapes.length &&
      width === nextWidth &&
      height === nextHeight &&
      motionReduced === reduced.matches
    )
      return;
    width = nextWidth;
    height = nextHeight;
    motionReduced = reduced.matches;
    mobile = width <= BACKGROUND.breakpoint;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const count = mobile
      ? BACKGROUND.objects.mobile
      : width >= 1900
        ? BACKGROUND.objects.wide
        : BACKGROUND.objects.desktop;
    for (const shape of shapes) shape.animation?.cancel();
    shapes = Array.from({ length: count }, (_, i) => {
      const element = node("g", {
        class: `background-motif ${i % 3 === 0 ? "background-amber" : "background-wire"}`,
      });
      const floating = node("path", {
        class: "background-drift",
        d: motifs[i % motifs.length],
        "vector-effect": "non-scaling-stroke",
      });
      element.append(floating);
      const depth = 0.4 + ((i * 5) % 11) / 17;
      const speed = BACKGROUND.speed * (0.5 + (i % 5) / 5);
      const reach = BACKGROUND.drift * depth;
      const duration = (TAU / speed) * 1000;
      const animation = reduced.matches
        ? undefined
        : floating.animate(
            [
              { transform: `translate(${-reach * 0.6}px, 0px) rotate(-6deg)` },
              {
                transform: `translate(${reach * 0.5}px, ${-reach * 0.7}px) rotate(0deg)`,
              },
              {
                transform: `translate(${reach}px, ${reach * 0.2}px) rotate(6deg)`,
              },
              { transform: `translate(0px, ${reach * 0.7}px) rotate(0deg)` },
              { transform: `translate(${-reach * 0.6}px, 0px) rotate(-6deg)` },
            ],
            { duration, iterations: Infinity, easing: "ease-in-out" },
          );
      if (animation) {
        animation.pause();
        animation.currentTime = ((i * 0.381966) % 1) * duration;
      }
      return {
        element,
        animation,
        x: ((i * 0.61803398875 + 0.09) % 1) * width,
        y:
          ((i * 0.754877666 + 0.16) % 1) * (height + BACKGROUND.margin * 2) -
          BACKGROUND.margin,
        depth,
        visible: true,
      };
    });
    objects.replaceChildren(...shapes.map((shape) => shape.element));
    burstNodes = Array.from(
      {
        length: mobile
          ? BACKGROUND.maxBursts.mobile
          : BACKGROUND.maxBursts.desktop,
      },
      () => {
        const group = node("g", { class: "background-burst", display: "none" });
        const ring = node("circle", {
          r: "1",
          "vector-effect": "non-scaling-stroke",
        });
        const hex = node("path", {
          d: "M1 0L.5 .866L-.5 .866L-1 0L-.5-.866L.5-.866Z",
          "vector-effect": "non-scaling-stroke",
        });
        // One compound vector path replaces eight individually updated nodes.
        const packets = node("path", { class: "background-packets" });
        group.append(ring, hex, packets);
        return { group, ring, hex, packets };
      },
    );
    effects.replaceChildren(...burstNodes.map((item) => item.group));
    hideBursts();
    leave();
    render(0);
    syncMotion();
    wake();
  }

  function syncMotion() {
    for (const shape of shapes) {
      if (!shape.animation) continue;
      if (
        !disposed &&
        inView &&
        !document.hidden &&
        !reduced.matches &&
        shape.visible
      ) {
        if (shape.animation.playState !== "running") shape.animation.play();
      } else if (shape.animation.playState !== "paused")
        shape.animation.pause();
    }
  }

  function attribute(element: SVGElement, name: string, value: string) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }

  function render(dt: number) {
    time += dt;
    const awake = time - activeAt < BACKGROUND.idleAfter;
    intro = reduced.matches ? 1 : Math.min(1, intro + dt / 1.1);
    pointer.strength = mix(
      pointer.strength,
      awake ? pointer.target : 0,
      1 - Math.exp(-dt * 4.5),
    );
    scroll = reduced.matches
      ? 0
      : mix(scroll, window.scrollY, 1 - Math.exp(-dt * 6));
    const near: (Point & { distance: number; alpha: number })[] = [];
    for (const shape of shapes) {
      const span = height + BACKGROUND.margin * 2;
      let y =
        ((((shape.y +
          BACKGROUND.margin -
          scroll * BACKGROUND.scrollParallax * shape.depth) %
          span) +
          span) %
          span) -
        BACKGROUND.margin;
      let x = shape.x;
      if (y < -45 || y > height + 45 || x < -45 || x > width + 45) {
        if (shape.visible) {
          shape.element.setAttribute("display", "none");
          shape.animation?.pause();
        }
        shape.visible = false;
        continue;
      }
      if (!shape.visible) {
        shape.element.removeAttribute("display");
        if (!reduced.matches && inView && !document.hidden)
          shape.animation?.play();
      }
      shape.visible = true;
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const influence =
        (1 - clamp(distance / BACKGROUND.radius)) ** 2 * pointer.strength;
      x += (dx / (distance || 1)) * influence * BACKGROUND.force * shape.depth;
      y += (dy / (distance || 1)) * influence * BACKGROUND.force * shape.depth;
      const edge = clamp(Math.min(x, width - x, y, height - y) / 70);
      const alpha =
        edge *
        intro *
        density(x) *
        (0.32 + shape.depth * 0.45 + influence * 0.2);
      attribute(
        shape.element,
        "transform",
        `translate(${number(x)} ${number(y)}) rotate(${number(influence * 18)}) scale(${number(0.7 + shape.depth * 0.6)})`,
      );
      attribute(shape.element, "opacity", number(alpha));
      if (influence > 0.015)
        near.push({
          x,
          y,
          distance,
          alpha: (1 - distance / BACKGROUND.radius) * pointer.strength * intro,
        });
    }
    near.sort((a, b) => a.distance - b.distance);
    linkNodes.forEach((line, index) => {
      const target = near[index];
      if (!target || reduced.matches) {
        attribute(line, "display", "none");
        return;
      }
      line.removeAttribute("display");
      line.setAttribute(
        "d",
        `M${number(pointer.x)} ${number(pointer.y)}L${number(target.x)} ${number(target.y)}`,
      );
      line.setAttribute(
        "opacity",
        number(target.alpha * 0.45 * density((target.x + pointer.x) / 2)),
      );
    });
    bursts = bursts.filter(
      (burst) =>
        time - burst.born < BACKGROUND.burstLife &&
        burst.y - window.scrollY > -BACKGROUND.burstRadius.desktop &&
        burst.y - window.scrollY < height + BACKGROUND.burstRadius.desktop,
    );
    burstNodes.forEach((item, index) => {
      const burst = bursts[index];
      if (!burst) {
        attribute(item.group, "display", "none");
        return;
      }
      const progress = clamp((time - burst.born) / BACKGROUND.burstLife);
      const radius = Math.max(
        0.1,
        (mobile
          ? BACKGROUND.burstRadius.mobile
          : BACKGROUND.burstRadius.desktop) *
          (1 - (1 - progress) ** 3),
      );
      item.group.removeAttribute("display");
      item.group.setAttribute(
        "transform",
        `translate(${number(burst.x)} ${number(burst.y - window.scrollY)})`,
      );
      item.group.setAttribute(
        "opacity",
        number(
          (Math.sin(Math.PI * progress) *
            (1 - progress) *
            0.85 *
            density(burst.x) *
            clamp(
              Math.min(
                burst.y - window.scrollY,
                height - burst.y + window.scrollY,
              ) /
                (height * 0.1),
            )) /
            Math.sqrt(bursts.length),
        ),
      );
      item.ring.setAttribute(
        "transform",
        `scale(${number(radius * (burst.variant === 1 ? 0.76 : 1))})`,
      );
      item.hex.setAttribute(
        "transform",
        `rotate(${number(progress * 12 + burst.variant * 30)}) scale(${number(radius * (burst.variant === 1 ? 1 : 0.76))})`,
      );
      item.hex.setAttribute("opacity", burst.variant === 0 ? "0.3" : "0.75");
      item.packets.setAttribute(
        "d",
        Array.from({ length: BACKGROUND.burstPackets }, (_, i) => {
          const angle =
            (i / BACKGROUND.burstPackets) * TAU + burst.variant * 0.3;
          const reach = radius * (i % 2 ? 1 : 0.88);
          const x = Math.cos(angle) * reach;
          const y = Math.sin(angle) * reach;
          const size = 2 * (1 - progress * 0.65);
          return i % 2
            ? `M${number(x - size)} ${number(y - size)}h${number(size * 2)}v${number(size * 2)}h-${number(size * 2)}Z`
            : `M${number(x)} ${number(y - size * 1.4)}l${number(size * 1.4)} ${number(size * 1.4)}l-${number(size * 1.4)} ${number(size * 1.4)}l-${number(size * 1.4)} -${number(size * 1.4)}Z`;
        }).join(""),
      );
    });
  }

  function tick(now: number) {
    raf = 0;
    if (disposed || document.hidden || !inView || reduced.matches) return;
    const fps =
      time - activeAt > BACKGROUND.idleAfter
        ? BACKGROUND.fps.idle
        : mobile
          ? BACKGROUND.fps.mobile
          : BACKGROUND.fps.desktop;
    if (!lastPaint || now - lastPaint >= 1000 / fps - 0.5) {
      const dt = lastPaint ? Math.min((now - lastPaint) / 1000, 0.06) : 1 / fps;
      lastPaint = now;
      render(dt);
    }
    if (
      intro < 1 ||
      pointer.strength > 0.001 ||
      (time - activeAt < BACKGROUND.idleAfter && pointer.target > 0) ||
      bursts.length > 0 ||
      Math.abs(scroll - window.scrollY) > 0.1
    )
      raf = requestAnimationFrame(tick);
    else lastPaint = 0;
  }
  function wake() {
    if (!raf && !disposed && inView && !document.hidden && !reduced.matches)
      raf = requestAnimationFrame(tick);
  }
  function playback() {
    cancelAnimationFrame(raf);
    raf = 0;
    lastPaint = 0;
    if (motionReduced !== reduced.matches) resize();
    syncMotion();
    if (disposed || document.hidden || !inView) {
      leave();
      return;
    }
    if (reduced.matches) {
      leave();
      hideBursts();
      pointer.strength = 0;
      render(0);
    } else wake();
  }
  function blocked(event: PointerEvent, includeCopy = false) {
    return (
      event.target instanceof Element &&
      !!event.target.closest(includeCopy ? copy : interactive)
    );
  }
  function move(event: PointerEvent) {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 10)
      down.moved = true;
    if (
      reduced.matches ||
      event.pointerType === "touch" ||
      !event.isPrimary ||
      blocked(event)
    ) {
      pointer.target = 0;
      return;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.target = 1;
    activeAt = time;
    wake();
  }
  function press(event: PointerEvent) {
    down = undefined;
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      reduced.matches ||
      blocked(event, true) ||
      document.hidden ||
      !inView
    )
      return;
    down = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      at: performance.now(),
      moved: false,
    };
  }
  function release(event: PointerEvent) {
    const start = down;
    down = undefined;
    if (
      !start ||
      start.id !== event.pointerId ||
      !event.isPrimary ||
      event.button !== 0 ||
      start.moved ||
      performance.now() - start.at > 650 ||
      reduced.matches ||
      document.hidden ||
      !inView ||
      blocked(event, true) ||
      !window.getSelection()?.isCollapsed ||
      Math.hypot(start.x - event.clientX, start.y - event.clientY) > 10
    )
      return;
    activeAt = time;
    bursts.push({
      x: event.clientX,
      y: event.clientY + window.scrollY,
      born: time,
      variant: sequence++ % 3,
    });
    bursts = bursts.slice(
      -(mobile ? BACKGROUND.maxBursts.mobile : BACKGROUND.maxBursts.desktop),
    );
    wake();
  }
  function scrolled() {
    leave();
    wake();
  }
  function out(event: PointerEvent) {
    if (!event.relatedTarget) leave();
  }
  const observer = new ResizeObserver(resize);
  // Observe HTML layout, not animated SVG geometry. Rebuild only on real size changes.
  observer.observe(document.documentElement);
  window.addEventListener("resize", resize, { passive: true });
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    playback();
  });
  visibility.observe(svg);
  resize();
  document.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerdown", press, { passive: true });
  document.addEventListener("pointerup", release, { passive: true });
  document.addEventListener("pointercancel", leave, { passive: true });
  window.addEventListener("pointerout", out, { passive: true });
  window.addEventListener("blur", leave);
  window.addEventListener("scroll", scrolled, { passive: true });
  document.addEventListener("visibilitychange", playback);
  reduced.addEventListener("change", playback);
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener("resize", resize);
    visibility.disconnect();
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerdown", press);
    document.removeEventListener("pointerup", release);
    document.removeEventListener("pointercancel", leave);
    window.removeEventListener("pointerout", out);
    window.removeEventListener("blur", leave);
    window.removeEventListener("scroll", scrolled);
    document.removeEventListener("visibilitychange", playback);
    reduced.removeEventListener("change", playback);
    for (const shape of shapes) shape.animation?.cancel();
    objects.replaceChildren();
    links.replaceChildren();
    effects.replaceChildren();
    bursts = [];
    shapes = [];
    burstNodes = [];
  };
}
