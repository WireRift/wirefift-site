type Point = { x: number; y: number };
type Color = readonly [number, number, number];
type Palette = { wire: Color; packet: Color; signal: Color; opacity: number };
type Wave = Point & { born: number; variant: number };
type Trail = Point & { born: number; angle: number };
type Packet = { lane: number; phase: number; speed: number; depth: number };
type Lane = { points: Point[]; path: Path2D };

/** All scene budgets, timing and theme colors live here, in CSS pixel units. */
export const HERO_SCENE = {
  mobileBreakpoint: 760,
  lanes: { mobile: 6, desktop: 11 },
  packets: { mobile: 22, desktop: 54, wide: 76 },
  maxDpr: 1.5,
  maxPixels: 3_600_000,
  fps: { mobile: 30, desktop: 45, idle: 24 },
  speed: 0.032,
  pointerRadius: 185,
  pointerForce: 28,
  pointerDecay: 4.5,
  maxConnections: 4,
  maxWaves: { mobile: 3, desktop: 6 },
  maxTrails: { mobile: 8, desktop: 20 },
  waveLife: 1.65,
  waveRadius: { mobile: 145, desktop: 235 },
  trailLife: 0.7,
  idleAfter: 3,
  introDuration: 1.2,
  palettes: {
    light: {
      wire: [70, 100, 82],
      packet: [190, 125, 15],
      signal: [51, 125, 97],
      opacity: 0.8,
    },
    dark: {
      wire: [134, 174, 149],
      packet: [249, 183, 58],
      signal: [123, 207, 170],
      opacity: 1,
    },
  } satisfies Record<string, Palette>,
} as const;

const TAU = Math.PI * 2;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const rgba = (color: Color, alpha: number) =>
  `rgba(${color[0]},${color[1]},${color[2]},${clamp(alpha)})`;
const controls =
  'a,button,input,select,textarea,label,[role="button"],[contenteditable]:not([contenteditable="false"])';

function cubic(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const u = 1 - t;
  return {
    x:
      u ** 3 * a.x + 3 * u ** 2 * t * b.x + 3 * u * t ** 2 * c.x + t ** 3 * d.x,
    y:
      u ** 3 * a.y + 3 * u ** 2 * t * b.y + 3 * u * t ** 2 * c.y + t ** 3 * d.y,
  };
}

/** Owns its canvas, listeners, observers and clock; returns complete disposal. */
export function createHeroScene(canvas: HTMLCanvasElement, host: HTMLElement) {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  const ctx = context;
  const mask = document.createElement("canvas");
  const maskContext = mask.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const systemDark = matchMedia("(prefers-color-scheme: dark)");
  let width = 1;
  let height = 1;
  let dpr = 1;
  let mobile = false;
  let lanes: Lane[] = [];
  let packets: Packet[] = [];
  let waves: Wave[] = [];
  let trails: Trail[] = [];
  let frame = 0;
  let lastPaint = 0;
  let elapsed = 0;
  let flowTime = 0;
  let intro = 0;
  let lastInteraction = -HERO_SCENE.idleAfter;
  let lastTrail = 0;
  let clickSequence = 0;
  let inView = false;
  let disposed = false;
  let dark = 0;
  let targetDark = 0;
  let activity = 0;
  const pointer = { x: 0, y: 0, strength: 0, target: 0 };
  let down: (Point & { id: number; at: number; moved: boolean }) | undefined;

  function readTheme() {
    const theme = document.documentElement.dataset.theme;
    targetDark =
      theme === "dark" || (theme !== "light" && systemDark.matches) ? 1 : 0;
    if (reduced.matches) {
      dark = targetDark;
      if (inView && !document.hidden) draw(0);
    }
  }

  function palette(): Palette {
    const a = HERO_SCENE.palettes.light;
    const b = HERO_SCENE.palettes.dark;
    const blend = (first: Color, second: Color): Color => [
      Math.round(mix(first[0], second[0], dark)),
      Math.round(mix(first[1], second[1], dark)),
      Math.round(mix(first[2], second[2], dark)),
    ];
    return {
      wire: blend(a.wire, b.wire),
      packet: blend(a.packet, b.packet),
      signal: blend(a.signal, b.signal),
      opacity: mix(a.opacity, b.opacity, dark),
    };
  }

  function resize() {
    if (disposed) return;
    const rect = host.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    mobile = width <= HERO_SCENE.mobileBreakpoint;
    dpr = Math.min(
      devicePixelRatio || 1,
      HERO_SCENE.maxDpr,
      Math.sqrt(HERO_SCENE.maxPixels / (width * height)),
    );
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const core = host.querySelector(".rift-core")?.getBoundingClientRect();
    const hub = core
      ? {
          x: core.x + core.width / 2 - rect.x,
          y: core.y + core.height / 2 - rect.y,
        }
      : { x: width * 0.75, y: height * 0.5 };
    const count = mobile ? HERO_SCENE.lanes.mobile : HERO_SCENE.lanes.desktop;
    lanes = Array.from({ length: count }, (_, i) => {
      const row = (i + 0.5) / count;
      const start = { x: -70, y: height * row };
      const end = { x: width + 70, y: height * (1 - row) };
      const join = { x: hub.x, y: hub.y + (row - 0.5) * (mobile ? 140 : 220) };
      const b = { x: hub.x * 0.28, y: start.y };
      const c = { x: hub.x * 0.64, y: join.y + (row - 0.5) * height * 0.7 };
      const e = { x: mix(hub.x, width, 0.5), y: join.y };
      const f = { x: mix(hub.x, width, 0.65), y: end.y };
      const path = new Path2D();
      path.moveTo(start.x, start.y);
      path.bezierCurveTo(b.x, b.y, c.x, c.y, join.x, join.y);
      path.bezierCurveTo(e.x, e.y, f.x, f.y, end.x, end.y);
      const points = Array.from({ length: 121 }, (_, n) =>
        n <= 70
          ? cubic(start, b, c, join, n / 70)
          : cubic(join, e, f, end, (n - 70) / 50),
      );
      return { path, points };
    });
    const budget = mobile
      ? HERO_SCENE.packets.mobile
      : width >= 1900
        ? HERO_SCENE.packets.wide
        : HERO_SCENE.packets.desktop;
    packets = Array.from({ length: budget }, (_, i) => ({
      lane: i % count,
      phase: (i * 0.61803398875) % 1,
      speed:
        HERO_SCENE.speed *
        (0.65 + ((i * 7) % 11) / 12) *
        (i % 3 === 0 ? -1 : 1),
      depth: 0.45 + ((i * 3) % 7) / 12,
    }));

    // A cached feathered cutout keeps every line and effect quiet behind copy.
    mask.width = Math.ceil(width);
    mask.height = Math.ceil(height);
    const copy = host.querySelector(".hero-copy")?.getBoundingClientRect();
    if (maskContext && copy) {
      maskContext.filter = "blur(24px)";
      maskContext.fillStyle = "rgba(0,0,0,.96)";
      maskContext.fillRect(
        copy.x - rect.x - 20,
        copy.y - rect.y - 14,
        copy.width + 40,
        copy.height + 28,
      );
    }
    waves = [];
    trails = [];
    down = undefined;
    if (inView && !document.hidden) draw(0);
  }

  function edgeAlpha(x: number, y: number) {
    return clamp(Math.min(x, width - x, y, height - y) / 55);
  }

  function sample(lane: Lane, t: number) {
    const index = clamp(t) * (lane.points.length - 1);
    const a = lane.points[Math.floor(index)];
    const b =
      lane.points[Math.min(Math.floor(index) + 1, lane.points.length - 1)];
    return {
      x: mix(a.x, b.x, index % 1),
      y: mix(a.y, b.y, index % 1),
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    };
  }

  function draw(dt: number) {
    elapsed += dt;
    flowTime += dt * mix(0.55, 1, activity);
    intro = reduced.matches
      ? 1
      : Math.min(1, intro + dt / HERO_SCENE.introDuration);
    dark = mix(dark, targetDark, 1 - Math.exp(-dt * 6));
    const awake = elapsed - lastInteraction < HERO_SCENE.idleAfter;
    pointer.strength = mix(
      pointer.strength,
      awake ? pointer.target : 0,
      1 - Math.exp(-dt * HERO_SCENE.pointerDecay),
    );
    activity = mix(activity, awake ? 1 : 0, 1 - Math.exp(-dt * 2));
    const colors = palette();
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = intro * colors.opacity;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < lanes.length; i++) {
      ctx.strokeStyle = rgba(
        i % 3 === 0 ? colors.packet : colors.wire,
        i % 3 === 0 ? 0.23 : 0.13,
      );
      ctx.stroke(lanes[i].path);
      // Little routing junctions distinguish this from a generic particle cloud.
      for (const t of [0.14, 0.34, 0.88]) {
        const point = sample(lanes[i], t);
        ctx.strokeStyle = rgba(colors.wire, 0.25 * edgeAlpha(point.x, point.y));
        ctx.strokeRect(point.x - 2, point.y - 2, 4, 4);
      }
    }

    const nearby: (Point & { distance: number })[] = [];
    for (const packet of packets) {
      const t = (((packet.phase + flowTime * packet.speed) % 1) + 1) % 1;
      const point = sample(lanes[packet.lane], t);
      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const influence =
        (1 - clamp(distance / HERO_SCENE.pointerRadius)) ** 2 *
        pointer.strength;
      point.x +=
        (dx / (distance || 1)) *
        influence *
        HERO_SCENE.pointerForce *
        packet.depth;
      point.y +=
        (dy / (distance || 1)) *
        influence *
        HERO_SCENE.pointerForce *
        packet.depth;
      for (const wave of waves) {
        const progress = clamp((elapsed - wave.born) / HERO_SCENE.waveLife);
        const radius =
          (mobile
            ? HERO_SCENE.waveRadius.mobile
            : HERO_SCENE.waveRadius.desktop) *
          (1 - (1 - progress) ** 3);
        const wx = point.x - wave.x;
        const wy = point.y - wave.y;
        const length = Math.hypot(wx, wy);
        const force =
          (1 - clamp(Math.abs(length - radius) / 42)) * (1 - progress) * 14;
        point.x += (wx / (length || 1)) * force;
        point.y += (wy / (length || 1)) * force;
      }
      const alpha =
        edgeAlpha(point.x, point.y) * packet.depth * (0.55 + activity * 0.3);
      if (influence > 0.02) nearby.push({ ...point, distance });
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(point.angle + (packet.speed < 0 ? Math.PI : 0));
      for (let tail = 3; tail > 0; tail--) {
        ctx.strokeStyle = rgba(colors.packet, alpha * (0.18 / tail));
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-tail * 9, 0);
        ctx.lineTo(-tail * 9 + 8, 0);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(
        packet.lane % 4 === 0 ? colors.signal : colors.packet,
        alpha,
      );
      ctx.fillRect(-3.5 * packet.depth, -1.5, 7 * packet.depth, 3);
      ctx.restore();
    }

    nearby.sort((a, b) => a.distance - b.distance);
    for (const point of nearby.slice(0, HERO_SCENE.maxConnections)) {
      ctx.lineWidth = 0.65;
      ctx.strokeStyle = rgba(
        colors.packet,
        (1 - point.distance / HERO_SCENE.pointerRadius) *
          pointer.strength *
          0.4,
      );
      ctx.beginPath();
      ctx.moveTo(pointer.x, pointer.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    trails = trails.filter(
      (trail) => elapsed - trail.born < HERO_SCENE.trailLife,
    );
    for (const trail of trails) {
      const progress = (elapsed - trail.born) / HERO_SCENE.trailLife;
      ctx.save();
      ctx.translate(trail.x, trail.y);
      ctx.rotate(trail.angle);
      ctx.strokeStyle = rgba(
        colors.packet,
        (1 - progress) ** 2 * 0.4 * edgeAlpha(trail.x, trail.y),
      );
      ctx.lineWidth = 1 - progress * 0.7;
      ctx.strokeRect(-5 - progress * 9, -2, 10 + progress * 18, 4);
      ctx.restore();
    }
    waves = waves.filter((wave) => elapsed - wave.born < HERO_SCENE.waveLife);
    for (const wave of waves) {
      const progress = clamp((elapsed - wave.born) / HERO_SCENE.waveLife);
      const radius =
        (mobile
          ? HERO_SCENE.waveRadius.mobile
          : HERO_SCENE.waveRadius.desktop) *
        (1 - (1 - progress) ** 3);
      const alpha =
        (Math.sin(Math.PI * progress) * (1 - progress) * 0.85) /
        Math.sqrt(waves.length);
      ctx.strokeStyle = rgba(colors.packet, alpha);
      ctx.lineWidth = 1.2 * (1 - progress) + 0.3;
      ctx.beginPath();
      if (wave.variant === 1) {
        for (let i = 0; i <= 6; i++) {
          const angle = (i / 6) * TAU + progress * 0.15;
          const x = wave.x + Math.cos(angle) * radius;
          const y = wave.y + Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        ctx.arc(
          wave.x,
          wave.y,
          radius,
          progress,
          TAU - (wave.variant === 2 ? 0.8 : 0) + progress,
        );
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(colors.wire, alpha * 0.6);
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, radius * 0.76, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * TAU + wave.variant * 0.4;
        const x = wave.x + Math.cos(angle) * radius;
        const y = wave.y + Math.sin(angle) * radius;
        ctx.fillStyle = rgba(
          i % 3 === 0 ? colors.signal : colors.packet,
          alpha * edgeAlpha(x, y),
        );
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }
    ctx.globalAlpha = 1;
    if (maskContext) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(mask, 0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function tick(now: number) {
    frame = 0;
    if (disposed || !inView || document.hidden || reduced.matches) return;
    const fps =
      elapsed - lastInteraction > HERO_SCENE.idleAfter
        ? HERO_SCENE.fps.idle
        : mobile
          ? HERO_SCENE.fps.mobile
          : HERO_SCENE.fps.desktop;
    if (!lastPaint || now - lastPaint >= 1000 / fps) {
      const dt = lastPaint ? Math.min((now - lastPaint) / 1000, 0.06) : 1 / fps;
      lastPaint = now;
      draw(dt);
    }
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastPaint = 0;
    if (disposed || !inView || document.hidden) {
      leave();
      return;
    }
    if (reduced.matches) {
      leave();
      waves = [];
      trails = [];
      pointer.strength = pointer.target = 0;
      dark = targetDark;
      draw(0);
    } else frame = requestAnimationFrame(tick);
  }

  function position(event: PointerEvent): Point {
    const rect = host.getBoundingClientRect();
    return { x: event.clientX - rect.x, y: event.clientY - rect.y };
  }
  function blocked(event: PointerEvent, copy = false) {
    return (
      event.target instanceof Element &&
      !!event.target.closest(copy ? `${controls},.hero-copy` : controls)
    );
  }
  function move(event: PointerEvent) {
    const point = position(event);
    if (down && Math.hypot(point.x - down.x, point.y - down.y) > 10)
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
    const angle = Math.atan2(point.y - pointer.y, point.x - pointer.x);
    const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.target = 1;
    lastInteraction = elapsed;
    if (elapsed - lastTrail > 0.035 && distance > 7) {
      trails.push({ ...point, born: elapsed, angle });
      trails = trails.slice(
        -(mobile ? HERO_SCENE.maxTrails.mobile : HERO_SCENE.maxTrails.desktop),
      );
      lastTrail = elapsed;
    }
  }
  function press(event: PointerEvent) {
    down = undefined;
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      !inView ||
      document.hidden ||
      reduced.matches ||
      blocked(event, true)
    )
      return;
    down = {
      ...position(event),
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
      !event.isPrimary ||
      event.button !== 0 ||
      reduced.matches ||
      !inView ||
      document.hidden ||
      start.id !== event.pointerId ||
      start.moved ||
      performance.now() - start.at > 600 ||
      blocked(event, true) ||
      !window.getSelection()?.isCollapsed
    )
      return;
    const point = position(event);
    if (Math.hypot(point.x - start.x, point.y - start.y) > 10) return;
    lastInteraction = elapsed;
    waves.push({
      ...point,
      born: elapsed,
      variant: (Math.floor(point.x / 180) + clickSequence++) % 3,
    });
    waves = waves.slice(
      -(mobile ? HERO_SCENE.maxWaves.mobile : HERO_SCENE.maxWaves.desktop),
    );
  }
  function leave() {
    pointer.target = 0;
    down = undefined;
  }

  readTheme();
  dark = targetDark;
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const copy = host.querySelector(".hero-copy");
  if (copy) observer.observe(copy);
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (!inView) leave();
    syncPlayback();
  });
  visibility.observe(host);
  const themeObserver = new MutationObserver(readTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  host.addEventListener("pointermove", move, { passive: true });
  host.addEventListener("pointerdown", press, { passive: true });
  host.addEventListener("pointerup", release, { passive: true });
  host.addEventListener("pointerleave", leave, { passive: true });
  host.addEventListener("pointercancel", leave, { passive: true });
  window.addEventListener("scroll", leave, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", syncPlayback);
  reduced.addEventListener("change", syncPlayback);
  systemDark.addEventListener("change", readTheme);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    visibility.disconnect();
    themeObserver.disconnect();
    host.removeEventListener("pointermove", move);
    host.removeEventListener("pointerdown", press);
    host.removeEventListener("pointerup", release);
    host.removeEventListener("pointerleave", leave);
    host.removeEventListener("pointercancel", leave);
    window.removeEventListener("scroll", leave);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", syncPlayback);
    reduced.removeEventListener("change", syncPlayback);
    systemDark.removeEventListener("change", readTheme);
    waves = [];
    trails = [];
  };
}
