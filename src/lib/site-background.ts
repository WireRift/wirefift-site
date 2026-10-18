type Point = { x: number; y: number };
type Motif = {
  element: SVGGElement;
  reaction: SVGGElement;
  animation: Animation | undefined;
  reactionAnimation: Animation | undefined;
  x: number;
  y: number;
  depth: number;
  visible: boolean;
  phase: number;
  offset: Point;
  velocity: Point;
};
type Burst = Point & { born: number; variant: number };
type Relay = {
  origin: Point;
  source: number | undefined;
  target: number;
  born: number;
  travel: number;
  energy: number;
};
type Trail = Point & { born: number };

export const BACKGROUND = {
  breakpoint: 760,
  objects: { mobile: 12, desktop: 28, wide: 42 },
  radius: 330,
  force: 78,
  scrollParallax: 0.08,
  drift: 20,
  speed: 0.12,
  margin: 130,
  fps: { mobile: 30, desktop: 60, idle: 20 },
  idleAfter: 3,
  burstLife: 1.8,
  burstRadius: { mobile: 185, desktop: 350 },
  burstForce: 95,
  trailLife: 0.65,
  maxTrail: 12,
  maxBursts: { mobile: 3, desktop: 5 },
  burstPackets: 8,
  maxLinks: 3,
  orbitSpeed: 1.35,
  maxOffset: { mobile: 85, desktop: 140 },
  chain: {
    limit: { mobile: 3, desktop: 6 },
    distance: { mobile: 180, desktop: 250 },
    reach: { mobile: 300, desktop: 540 },
    speed: 650,
    response: 0.85,
    decay: 0.58,
  },
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
export function createSiteBackground(
  svg: SVGSVGElement,
  foreground: SVGSVGElement,
  pointerEnabled = true,
  ambientEnabled = true,
) {
  const objectLayer = svg.querySelector<SVGGElement>(".background-objects");
  const links = foreground.querySelector<SVGGElement>(".background-links");
  const effectLayer = foreground.querySelector<SVGGElement>(
    ".background-effects",
  );
  const reactions = foreground.querySelector<SVGGElement>(
    ".background-reactions",
  );
  const trailLayer = foreground.querySelector<SVGGElement>(".background-trail");
  const field = foreground.querySelector<SVGGElement>(".background-pointer");
  if (
    !objectLayer ||
    !links ||
    !effectLayer ||
    !reactions ||
    !trailLayer ||
    !field
  )
    return;
  const objects = objectLayer;
  const effects = effectLayer;
  const connectionLayer = links;
  const traces = trailLayer;
  const reactionLayer = reactions;
  const pointerField = field;
  // Ambient motion follows the OS preference independently of the mouse toggle.
  // Explicit pointer opt-in still works without enabling ambient drift.
  const motionStopped = !ambientEnabled && !pointerEnabled;
  let width = 1;
  let height = 1;
  let mobile = false;
  let shapes: Motif[] = [];
  let bursts: Burst[] = [];
  let trail: Trail[] = [];
  let relays: Relay[] = [];
  // Fixed, reusable pool. A click schedules at most two fading generations.
  const relayLayer = node("g", { class: "background-relays" });
  const relayNodes = Array.from(
    { length: BACKGROUND.chain.limit.desktop },
    () => {
      const group = node("g", { class: "background-relay", display: "none" });
      const line = node("path");
      const pulse = node("circle", { r: "2.5" });
      group.append(line, pulse);
      relayLayer.append(group);
      return { group, line, pulse };
    },
  );
  foreground.append(relayLayer);
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
  const trailNodes = Array.from({ length: BACKGROUND.maxTrail }, () =>
    node("path", { display: "none" }),
  );
  trailLayer.replaceChildren(...trailNodes);
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
    relays = [];
    for (const item of burstNodes) item.group.setAttribute("display", "none");
    for (const item of relayNodes) item.group.setAttribute("display", "none");
  }
  function leave() {
    down = undefined;
    pointer.target = 0;
  }
  // Readability is computed on small vectors, avoiding full-viewport masks.
  function density(x: number) {
    return 0.55 + 0.45 * clamp(Math.abs(x / width - 0.5) * 2) ** 1.3;
  }
  function resize() {
    if (disposed) return;
    const bounds = svg.getBoundingClientRect();
    const nextWidth = Math.max(1, bounds.width);
    const nextHeight = Math.max(1, bounds.height);
    if (shapes.length && width === nextWidth && height === nextHeight) return;
    width = nextWidth;
    height = nextHeight;
    mobile = width <= BACKGROUND.breakpoint;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    foreground.setAttribute("viewBox", `0 0 ${width} ${height}`);
    const count = mobile
      ? BACKGROUND.objects.mobile
      : width >= 1900
        ? BACKGROUND.objects.wide
        : BACKGROUND.objects.desktop;
    for (const shape of shapes) {
      shape.animation?.cancel();
      shape.reactionAnimation?.cancel();
    }
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
      const reaction = node("g", {
        class: `interaction-motif ${i % 3 === 0 ? "background-amber" : "background-wire"}`,
        opacity: "0",
      });
      const echo = floating.cloneNode(true) as SVGPathElement;
      echo.setAttribute("class", "interaction-drift");
      reaction.append(echo);
      const depth = 0.4 + ((i * 5) % 11) / 17;
      const speed = BACKGROUND.speed * (0.5 + (i % 5) / 5);
      const reach = BACKGROUND.drift * depth;
      const duration = (TAU / speed) * 1000;
      const animation = !ambientEnabled
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
      const reactionAnimation =
        pointerEnabled && animation
          ? echo.animate((animation.effect as KeyframeEffect).getKeyframes(), {
              duration,
              iterations: Infinity,
              easing: "ease-in-out",
            })
          : undefined;
      if (reactionAnimation) {
        reactionAnimation.pause();
        reactionAnimation.currentTime = ((i * 0.381966) % 1) * duration;
      }
      return {
        element,
        reaction,
        animation,
        reactionAnimation,
        x: ((i * 0.61803398875 + 0.09) % 1) * width,
        y:
          ((i * 0.754877666 + 0.16) % 1) * (height + BACKGROUND.margin * 2) -
          BACKGROUND.margin,
        depth,
        visible: true,
        phase: 0,
        offset: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
      };
    });
    objects.replaceChildren(...shapes.map((shape) => shape.element));
    reactionLayer.replaceChildren(...shapes.map((shape) => shape.reaction));
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
    trail = [];
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
        ambientEnabled &&
        shape.visible
      ) {
        if (shape.animation.playState !== "running") shape.animation.play();
      } else if (shape.animation.playState !== "paused")
        shape.animation.pause();
      if (shape.reactionAnimation) {
        if (
          shape.animation.playState === "running" &&
          Number(shape.reaction.getAttribute("opacity")) > 0.005
        ) {
          shape.reactionAnimation.currentTime = shape.animation.currentTime;
          if (shape.reactionAnimation.playState !== "running")
            shape.reactionAnimation.play();
        } else if (shape.reactionAnimation.playState !== "paused")
          shape.reactionAnimation.pause();
      }
    }
  }

  function attribute(element: SVGElement, name: string, value: string) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  }

  function baseY(shape: Motif) {
    const span = height + BACKGROUND.margin * 2;
    return (
      ((((shape.y +
        BACKGROUND.margin -
        scroll * BACKGROUND.scrollParallax * shape.depth) %
        span) +
        span) %
        span) -
      BACKGROUND.margin
    );
  }

  // Exact critically damped spring: smooth momentum at both 30 and 60 fps,
  // without unstable integration or perpetual per-frame work after settling.
  function follow(shape: Motif, target: Point, dt: number) {
    const omega = 11 + shape.depth * 2;
    const damping = Math.exp(-omega * dt);
    for (const axis of ["x", "y"] as const) {
      const delta = shape.offset[axis] - target[axis];
      const impulse = shape.velocity[axis] + omega * delta;
      shape.offset[axis] = target[axis] + (delta + impulse * dt) * damping;
      shape.velocity[axis] =
        (shape.velocity[axis] - omega * impulse * dt) * damping;
      if (
        target[axis] === 0 &&
        Math.abs(shape.offset[axis]) < 0.025 &&
        Math.abs(shape.velocity[axis]) < 0.15
      ) {
        shape.offset[axis] = 0;
        shape.velocity[axis] = 0;
      }
    }
  }

  function chain(origin: Point) {
    const positions = shapes.map((shape) => ({
      x: shape.x + shape.offset.x,
      y: baseY(shape) + shape.offset.y + window.scrollY,
    }));
    const seen = new Set<number>();
    const limit = mobile
      ? BACKGROUND.chain.limit.mobile
      : BACKGROUND.chain.limit.desktop;
    const distance = mobile
      ? BACKGROUND.chain.distance.mobile
      : BACKGROUND.chain.distance.desktop;
    const reach = mobile
      ? BACKGROUND.chain.reach.mobile
      : BACKGROUND.chain.reach.desktop;
    let frontier: {
      point: Point;
      source: number | undefined;
      born: number;
      energy: number;
    }[] = [{ point: origin, source: undefined, born: time, energy: 1 }];
    const nextRelays: Relay[] = [];
    for (let hop = 0; hop < 2 && nextRelays.length < limit; hop++) {
      const next: typeof frontier = [];
      for (const parent of frontier) {
        const nearby = positions
          .map((point, index) => ({
            point,
            index,
            gap: Math.hypot(point.x - parent.point.x, point.y - parent.point.y),
          }))
          .filter(
            ({ point, index, gap }) =>
              !seen.has(index) &&
              shapes[index].visible &&
              gap < distance &&
              Math.hypot(point.x - origin.x, point.y - origin.y) < reach,
          )
          .sort((a, b) => a.gap - b.gap)
          .slice(0, 2);
        for (const candidate of nearby) {
          if (nextRelays.length >= limit) break;
          seen.add(candidate.index);
          const travel = Math.max(0.12, candidate.gap / BACKGROUND.chain.speed);
          const energy = parent.energy * BACKGROUND.chain.decay;
          nextRelays.push({
            origin,
            source: parent.source,
            target: candidate.index,
            born: parent.born,
            travel,
            energy,
          });
          next.push({
            point: candidate.point,
            source: candidate.index,
            born: parent.born + travel + 0.07,
            energy,
          });
        }
      }
      frontier = next;
    }
    relays = [...relays, ...nextRelays].slice(-limit);
  }

  function render(dt: number) {
    time += dt;
    const awake = time - activeAt < BACKGROUND.idleAfter;
    intro = motionStopped ? 1 : Math.min(1, intro + dt / 1.1);
    pointer.strength = mix(
      pointer.strength,
      awake ? pointer.target : 0,
      1 - Math.exp(-dt * (awake && pointer.target ? 10 : 4.5)),
    );
    scroll = !ambientEnabled
      ? 0
      : mix(scroll, window.scrollY, 1 - Math.exp(-dt * 6));
    const near: (Point & { distance: number; alpha: number })[] = [];
    bursts = bursts.filter(
      (burst) =>
        time - burst.born < BACKGROUND.burstLife &&
        burst.y - window.scrollY > -BACKGROUND.burstRadius.desktop &&
        burst.y - window.scrollY < height + BACKGROUND.burstRadius.desktop,
    );
    relays = relays.filter(
      (relay) => time - relay.born < relay.travel + BACKGROUND.chain.response,
    );
    for (const shape of shapes) {
      let y = baseY(shape);
      let x = shape.x;
      if (y < -45 || y > height + 45 || x < -45 || x > width + 45) {
        if (shape.visible) {
          shape.element.setAttribute("display", "none");
          shape.animation?.pause();
          shape.reactionAnimation?.pause();
        }
        attribute(shape.reaction, "opacity", "0");
        shape.offset.x =
          shape.offset.y =
          shape.velocity.x =
          shape.velocity.y =
            0;
        shape.phase = 0;
        shape.visible = false;
        continue;
      }
      if (!shape.visible) {
        shape.element.removeAttribute("display");
        if (ambientEnabled && inView && !document.hidden)
          shape.animation?.play();
      }
      shape.visible = true;
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const influence =
        (1 - clamp(distance / BACKGROUND.radius)) ** 2 * pointer.strength;
      const falloff = 1 - clamp(distance / BACKGROUND.radius);
      const flow = falloff * falloff * (3 - 2 * falloff) * pointer.strength;
      if (flow > 0.005)
        shape.phase +=
          dt * BACKGROUND.orbitSpeed * (0.65 + shape.depth * 0.35) * flow;
      else shape.phase *= Math.exp(-dt * 5);
      const angle = shape.phase;
      const push = influence * BACKGROUND.force * shape.depth * 0.6;
      const scale = (distance + push) / (distance || 1);
      const target = {
        x: ((Math.cos(angle) * dx - Math.sin(angle) * dy) * scale - dx) * flow,
        y: ((Math.sin(angle) * dx + Math.cos(angle) * dy) * scale - dy) * flow,
      };
      let shock = 0;
      for (const burst of bursts) {
        const progress = clamp((time - burst.born) / BACKGROUND.burstLife);
        const reach =
          (mobile
            ? BACKGROUND.burstRadius.mobile
            : BACKGROUND.burstRadius.desktop) *
          (1 - (1 - progress) ** 3);
        const bx = x - burst.x;
        const by = y - (burst.y - window.scrollY);
        const gap = Math.hypot(bx, by);
        const pulse =
          Math.exp(-(((gap - reach) / 62) ** 2)) * (1 - progress) ** 1.4;
        shock += pulse;
        target.x +=
          (bx / (gap || 1)) * pulse * BACKGROUND.burstForce * shape.depth;
        target.y +=
          (by / (gap || 1)) * pulse * BACKGROUND.burstForce * shape.depth;
      }
      for (const relay of relays) {
        if (shapes[relay.target] !== shape) continue;
        const age =
          (time - relay.born - relay.travel) / BACKGROUND.chain.response;
        if (age <= 0 || age >= 1) continue;
        const pulse = Math.sin(Math.PI * age) * (1 - age) * relay.energy;
        const source =
          relay.source === undefined ? undefined : shapes[relay.source];
        const sx = source ? source.x : relay.origin.x;
        const sy = source ? baseY(source) : relay.origin.y - window.scrollY;
        const direction = Math.atan2(y - sy, x - sx) + 0.45;
        target.x += Math.cos(direction) * pulse * 80;
        target.y += Math.sin(direction) * pulse * 80;
        shock += pulse;
      }
      const offsetLimit = mobile
        ? BACKGROUND.maxOffset.mobile
        : BACKGROUND.maxOffset.desktop;
      const length = Math.hypot(target.x, target.y);
      if (length > offsetLimit) {
        target.x *= offsetLimit / length;
        target.y *= offsetLimit / length;
      }
      if (pointer.strength < 0.001 && !bursts.length && !relays.length) {
        target.x = 0;
        target.y = 0;
      }
      if (!pointerEnabled) {
        shape.offset.x =
          shape.offset.y =
          shape.velocity.x =
          shape.velocity.y =
            0;
      } else follow(shape, target, dt);
      x += shape.offset.x;
      y += shape.offset.y;
      const edge = clamp(Math.min(x, width - x, y, height - y) / 70);
      const alpha =
        edge *
        intro *
        density(x) *
        (0.32 + shape.depth * 0.45 + influence * 0.2);
      const transform = `translate(${number(x)} ${number(y)}) rotate(${number(flow * Math.sin(shape.phase) * 32 + shock * 24)}) scale(${number(0.7 + shape.depth * 0.6 + influence * 0.15 + shock * 0.1)})`;
      attribute(shape.element, "transform", transform);
      attribute(shape.element, "opacity", number(alpha));
      attribute(shape.reaction, "transform", transform);
      const reactionAlpha = !pointerEnabled
        ? 0
        : edge * intro * Math.min(0.65, influence * 0.9 + shock * 0.65);
      attribute(shape.reaction, "opacity", number(reactionAlpha));
      if (shape.reactionAnimation && shape.animation) {
        if (reactionAlpha > 0.005 && inView && !document.hidden) {
          if (shape.reactionAnimation.playState !== "running") {
            shape.reactionAnimation.currentTime = shape.animation.currentTime;
            shape.reactionAnimation.play();
          }
        } else if (shape.reactionAnimation.playState !== "paused")
          shape.reactionAnimation.pause();
      }
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
      if (!target || !pointerEnabled) {
        attribute(line, "display", "none");
        return;
      }
      line.removeAttribute("display");
      line.setAttribute(
        "d",
        `M${number(pointer.x)} ${number(pointer.y)}L${number(target.x)} ${number(target.y)}`,
      );
      line.setAttribute("opacity", number(target.alpha * 0.26));
    });
    attribute(
      pointerField,
      "transform",
      `translate(${number(pointer.x)} ${number(pointer.y)})`,
    );
    attribute(
      pointerField,
      "opacity",
      number(pointerEnabled ? pointer.strength * intro : 0),
    );
    trail = trail.filter((point) => time - point.born < BACKGROUND.trailLife);
    trailNodes.forEach((line, index) => {
      const a = trail[index];
      const b = trail[index + 1];
      if (!a || !b || !pointerEnabled) {
        attribute(line, "display", "none");
        return;
      }
      line.removeAttribute("display");
      attribute(
        line,
        "d",
        `M${number(a.x)} ${number(a.y)}L${number(b.x)} ${number(b.y)}`,
      );
      attribute(
        line,
        "opacity",
        number((1 - clamp((time - a.born) / BACKGROUND.trailLife)) ** 2 * 0.32),
      );
    });
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
          (Math.sin(Math.PI * progress) * (1 - progress) * 1.35) /
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
    relayNodes.forEach((item, index) => {
      const relay = relays[index];
      const age = relay ? time - relay.born : -1;
      if (!relay || age < 0 || !pointerEnabled) {
        attribute(item.group, "display", "none");
        return;
      }
      const target = shapes[relay.target];
      const source =
        relay.source === undefined ? undefined : shapes[relay.source];
      if (!target.visible || (source && !source.visible)) {
        attribute(item.group, "display", "none");
        return;
      }
      const start = source
        ? { x: source.x + source.offset.x, y: baseY(source) + source.offset.y }
        : { x: relay.origin.x, y: relay.origin.y - window.scrollY };
      const end = {
        x: target.x + target.offset.x,
        y: baseY(target) + target.offset.y,
      };
      const bend = Math.min(
        34,
        Math.hypot(end.x - start.x, end.y - start.y) * 0.14,
      );
      const control = {
        x: (start.x + end.x) / 2 - bend,
        y: (start.y + end.y) / 2 + bend,
      };
      const travel = clamp(age / relay.travel);
      const fade =
        (1 - clamp((age - relay.travel) / BACKGROUND.chain.response)) ** 2;
      item.group.removeAttribute("display");
      attribute(item.group, "opacity", number(relay.energy * fade * 0.45));
      attribute(
        item.line,
        "d",
        `M${number(start.x)} ${number(start.y)}Q${number(control.x)} ${number(control.y)} ${number(end.x)} ${number(end.y)}`,
      );
      attribute(
        item.pulse,
        "cx",
        number(
          (1 - travel) ** 2 * start.x +
            2 * (1 - travel) * travel * control.x +
            travel ** 2 * end.x,
        ),
      );
      attribute(
        item.pulse,
        "cy",
        number(
          (1 - travel) ** 2 * start.y +
            2 * (1 - travel) * travel * control.y +
            travel ** 2 * end.y,
        ),
      );
      attribute(
        item.pulse,
        "r",
        number(
          2 +
            Math.sin(
              Math.PI * clamp((age - relay.travel) / BACKGROUND.chain.response),
            ) *
              9,
        ),
      );
    });
  }

  function tick(now: number) {
    raf = 0;
    if (disposed || document.hidden || !inView || motionStopped) return;
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
      relays.length > 0 ||
      trail.length > 0 ||
      shapes.some(
        (shape) =>
          Math.abs(shape.offset.x) +
            Math.abs(shape.offset.y) +
            Math.abs(shape.velocity.x) +
            Math.abs(shape.velocity.y) >
          0.01,
      ) ||
      (ambientEnabled && Math.abs(scroll - window.scrollY) > 0.1)
    )
      raf = requestAnimationFrame(tick);
    else lastPaint = 0;
  }
  function wake() {
    if (!raf && !disposed && inView && !document.hidden && !motionStopped)
      raf = requestAnimationFrame(tick);
  }
  function playback() {
    cancelAnimationFrame(raf);
    raf = 0;
    lastPaint = 0;
    syncMotion();
    if (disposed || document.hidden || !inView) {
      leave();
      hideBursts();
      trail = [];
      pointer.strength = 0;
      attribute(pointerField, "opacity", "0");
      for (const line of [...linkNodes, ...trailNodes])
        attribute(line, "display", "none");
      for (const shape of shapes) attribute(shape.reaction, "opacity", "0");
      return;
    }
    if (motionStopped) {
      leave();
      hideBursts();
      trail = [];
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
    if (!pointerEnabled || event.pointerType === "touch" || !event.isPrimary) {
      pointer.target = 0;
      return;
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(last.x - pointer.x, last.y - pointer.y) > 7) {
      trail.push({ x: pointer.x, y: pointer.y, born: time });
      trail = trail.slice(-(mobile ? 6 : BACKGROUND.maxTrail));
    }
    pointer.target = 1;
    activeAt = time;
    wake();
  }
  function press(event: PointerEvent) {
    down = undefined;
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      !pointerEnabled ||
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
      !pointerEnabled ||
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
    chain({ x: event.clientX, y: event.clientY + window.scrollY });
    bursts = bursts.slice(
      -(mobile ? BACKGROUND.maxBursts.mobile : BACKGROUND.maxBursts.desktop),
    );
    wake();
  }
  function scrolled() {
    down = undefined;
    if (pointer.target > 0) activeAt = time;
    wake();
  }
  function out(event: PointerEvent) {
    if (!event.relatedTarget) leave();
  }
  let observer: ResizeObserver | undefined;
  let visibility: IntersectionObserver | undefined;
  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    observer?.disconnect();
    window.removeEventListener("resize", resize);
    visibility?.disconnect();
    document.removeEventListener("pointermove", move, true);
    document.removeEventListener("pointerdown", press, true);
    document.removeEventListener("pointerup", release, true);
    document.removeEventListener("pointercancel", leave, true);
    window.removeEventListener("pointerout", out);
    window.removeEventListener("blur", leave);
    window.removeEventListener("scroll", scrolled);
    document.removeEventListener("visibilitychange", playback);
    for (const shape of shapes) {
      shape.animation?.cancel();
      shape.reactionAnimation?.cancel();
    }
    objects.replaceChildren();
    connectionLayer.replaceChildren();
    effects.replaceChildren();
    reactionLayer.replaceChildren();
    traces.replaceChildren();
    relayLayer.remove();
    attribute(pointerField, "opacity", "0");
    trail = [];
    bursts = [];
    relays = [];
    shapes = [];
    burstNodes = [];
  }
  observer = new ResizeObserver(resize);
  // Observe HTML layout, not animated SVG geometry. Rebuild only on real size changes.
  observer.observe(document.documentElement);
  window.addEventListener("resize", resize, { passive: true });
  visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    playback();
  });
  visibility.observe(svg);
  resize();
  if (pointerEnabled) {
    document.addEventListener("pointermove", move, {
      passive: true,
      capture: true,
    });
    document.addEventListener("pointerdown", press, {
      passive: true,
      capture: true,
    });
    document.addEventListener("pointerup", release, {
      passive: true,
      capture: true,
    });
    document.addEventListener("pointercancel", leave, {
      passive: true,
      capture: true,
    });
    window.addEventListener("pointerout", out, { passive: true });
    window.addEventListener("blur", leave);
  }
  window.addEventListener("scroll", scrolled, { passive: true });
  document.addEventListener("visibilitychange", playback);
  return dispose;
}
