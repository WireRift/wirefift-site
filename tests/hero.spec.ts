import { expect, type Page, test } from "@playwright/test";

declare global {
  interface Window {
    heroDraws: {
      frames: number;
      arcs: number;
      packets: number;
      connections: number;
      positions: { x: number; y: number }[];
      colors: string[];
    };
  }
}

// Observe real canvas output, without adding diagnostics or test hooks to the UI.
async function observeCanvas(page: Page) {
  await page.addInitScript(() => {
    window.heroDraws = {
      frames: 0,
      arcs: 0,
      packets: 0,
      colors: [],
      connections: 0,
      positions: [],
    };
    const prototype = CanvasRenderingContext2D.prototype;
    const clear = prototype.clearRect;
    const arc = prototype.arc;
    const fill = prototype.fillRect;
    const line = prototype.lineTo;
    prototype.clearRect = function (...args) {
      if (this.canvas.classList.contains("hero-canvas")) {
        window.heroDraws.frames++;
        window.heroDraws.arcs = 0;
        window.heroDraws.packets = 0;
        window.heroDraws.colors = [];
        window.heroDraws.connections = 0;
        window.heroDraws.positions = [];
      }
      return clear.apply(this, args);
    };
    prototype.arc = function (...args) {
      if (this.canvas.classList.contains("hero-canvas"))
        window.heroDraws.arcs++;
      return arc.apply(this, args);
    };
    prototype.fillRect = function (...args) {
      if (this.canvas.classList.contains("hero-canvas")) {
        window.heroDraws.packets++;
        window.heroDraws.colors.push(String(this.fillStyle));
        const transform = this.getTransform();
        const ratio = this.canvas.width / this.canvas.clientWidth;
        window.heroDraws.positions.push({
          x: transform.e / ratio,
          y: transform.f / ratio,
        });
      }
      return fill.apply(this, args);
    };
    prototype.lineTo = function (...args) {
      if (
        this.canvas.classList.contains("hero-canvas") &&
        Math.abs(this.lineWidth - 0.65) < 0.001
      )
        window.heroDraws.connections++;
      return line.apply(this, args);
    };
  });
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await expect(page.locator(".hero-canvas")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.heroDraws.frames))
    .toBeGreaterThan(0);
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.clock.runFor(1800);
}

async function emptyPoint(page: Page) {
  const stage = await page.locator(".hero-stage").boundingBox();
  if (!stage) throw new Error("Missing hero");
  return {
    x: stage.width - 45,
    y: stage.y + Math.min(stage.height * 0.7, 500),
  };
}

test("full hero scene responds to empty clicks, bounds bursts, expires and ignores controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await observeCanvas(page);
  const stage = await page.locator(".hero-stage").boundingBox();
  const canvas = await page.locator(".hero-canvas").boundingBox();
  expect(canvas).toEqual(stage);
  expect(canvas?.width).toBe(1440);
  const packet = await page.evaluate(() =>
    window.heroDraws.positions.find(
      (point) =>
        point.x > 850 && point.x < 1300 && point.y > 100 && point.y < 550,
    ),
  );
  if (!packet || !stage) throw new Error("Missing visible packet");
  await page.mouse.move(packet.x, packet.y + stage.y);
  await page.clock.runFor(200);
  const connections = await page.evaluate(() => window.heroDraws.connections);
  expect(connections).toBeGreaterThan(0);
  expect(connections).toBeLessThanOrEqual(4);
  await page.mouse.move(1, 1);
  await page.clock.runFor(1500);
  expect(await page.evaluate(() => window.heroDraws.connections)).toBe(0);
  const point = await emptyPoint(page);
  await page.mouse.move(point.x, point.y);
  for (let i = 0; i < 16; i++) await page.mouse.click(point.x, point.y);
  await page.clock.runFor(220);
  const burst = await page.evaluate(() => window.heroDraws);
  expect(burst.arcs).toBeGreaterThan(0);
  expect(burst.arcs).toBeLessThanOrEqual(12);
  expect(burst.packets).toBeLessThanOrEqual(54 + 6 * 8);
  await page.screenshot({ path: ".qa/hero-click-light.png" });
  await page.mouse.move(1, 1);
  await page.clock.runFor(2400);
  expect(await page.evaluate(() => window.heroDraws.arcs)).toBe(0);
  expect(await page.evaluate(() => window.heroDraws.packets)).toBe(54);
  // Isolate navigation, but leave actual pointer/click/focus propagation intact.
  const link = page.getByRole("link", {
    name: "Explore the source",
    exact: true,
  });
  await link.evaluate((element) =>
    element.addEventListener("click", (event) => event.preventDefault()),
  );
  await link.click();
  await page.clock.runFor(150);
  expect(await page.evaluate(() => window.heroDraws.arcs)).toBe(0);
  await expect(link).toBeFocused();
  await page.getByRole("heading", { level: 1 }).click();
  await page.clock.runFor(150);
  expect(await page.evaluate(() => window.heroDraws.arcs)).toBe(0);
});

test("reduced motion is static, updates theme and resumes without an animation loop while hidden", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await observeCanvas(page);
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  const still = await page.evaluate(() => window.heroDraws.frames);
  const lightColors = await page.evaluate(() => window.heroDraws.colors);
  await page.clock.runFor(2000);
  expect(await page.evaluate(() => window.heroDraws.frames)).toBe(still);
  const point = await emptyPoint(page);
  await page.mouse.click(point.x, point.y);
  await page.clock.runFor(500);
  expect(await page.evaluate(() => window.heroDraws.frames)).toBe(still);
  await page.getByRole("button", { name: /Color theme:/ }).click();
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await page.getByRole("radio", { name: "Dark", exact: true }).press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => window.heroDraws.colors)).not.toEqual(
    lightColors,
  );
  const darkStill = await page.evaluate(() => window.heroDraws.frames);
  await page.clock.runFor(2000);
  expect(await page.evaluate(() => window.heroDraws.frames)).toBe(darkStill);
  await page.screenshot({ path: ".qa/hero-reduced-dark.png" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.runFor(150);
  expect(await page.evaluate(() => window.heroDraws.frames)).toBeGreaterThan(
    darkStill,
  );
  // Simulate the browser visibility boundary; other DOM/RAF behavior stays real.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await page.evaluate(() => window.heroDraws.frames);
  await page.clock.runFor(30_000);
  expect(await page.evaluate(() => window.heroDraws.frames)).toBe(hidden);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(150);
  expect(await page.evaluate(() => window.heroDraws.frames)).toBeGreaterThan(
    hidden,
  );
});

test.describe("high-density display", () => {
  test.use({ deviceScaleFactor: 3 });
  test("offscreen hero and client-side unmount stop drawing; resize caps high-DPI cost", async ({
    page,
  }) => {
    await observeCanvas(page);
    await page.evaluate(() =>
      window.scrollTo({ top: 2200, behavior: "instant" }),
    );
    // Native intersection delivery uses the browser render cycle, not the
    // installed JS clock. Wait for visibility before advancing animation time.
    await expect(page.locator(".hero-stage")).not.toBeInViewport();
    await page.clock.runFor(150);
    const offscreen = await page.evaluate(() => window.heroDraws.frames);
    await page.clock.runFor(10_000);
    expect(await page.evaluate(() => window.heroDraws.frames)).toBe(offscreen);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(page.locator(".hero-stage")).toBeInViewport();
    await expect
      .poll(async () => {
        await page.clock.runFor(100);
        return page.evaluate(() => window.heroDraws.frames);
      })
      .toBeGreaterThan(offscreen);
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.clock.runFor(200);
    const resolution = await page
      .locator(".hero-canvas")
      .evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        return {
          pixels: canvas.width * canvas.height,
          width: canvas.width,
          cssWidth: canvas.getBoundingClientRect().width,
        };
      });
    expect(resolution.pixels).toBeLessThanOrEqual(3_605_000);
    expect(resolution.pixels).toBeGreaterThan(3_590_000);
    expect(resolution.width / resolution.cssWidth).toBeLessThanOrEqual(1.501);
    expect(await page.evaluate(() => window.heroDraws.packets)).toBe(76);
    await page.screenshot({ path: ".qa/hero-4k.png" });
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Documentation", exact: true })
      .click();
    await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
    const unmounted = await page.evaluate(() => window.heroDraws.frames);
    await page.clock.runFor(2000);
    expect(await page.evaluate(() => window.heroDraws.frames)).toBe(unmounted);
  });
});

test("touch tap produces a bounded ripple; swipes, cancelled gestures and copy taps do not", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  try {
    await observeCanvas(page);
    expect(await page.evaluate(() => window.heroDraws.packets)).toBe(22);
    const raster = await page.locator(".hero-canvas").evaluate((element) => ({
      width: (element as HTMLCanvasElement).width,
      cssWidth: element.getBoundingClientRect().width,
      deviceDpr: devicePixelRatio,
    }));
    expect(raster.deviceDpr).toBe(3);
    // Raster dimensions are integers: 375 * 1.5 rounds to 563 pixels.
    expect(raster.width).toBeLessThanOrEqual(Math.ceil(raster.cssWidth * 1.5));
    await page.getByRole("heading", { level: 1 }).tap();
    await page.clock.runFor(150);
    expect(await page.evaluate(() => window.heroDraws.arcs)).toBe(0);
    const stage = page.locator(".hero-stage");
    const tap = {
      pointerType: "touch",
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 350,
      clientY: 760,
    };
    await page.touchscreen.tap(tap.clientX, tap.clientY);
    await page.clock.runFor(180);
    expect(await page.evaluate(() => window.heroDraws.arcs)).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => window.heroDraws.packets),
    ).toBeLessThanOrEqual(22 + 3 * 8);
    await page.screenshot({ path: ".qa/hero-mobile.png" });
    await page.clock.runFor(2000);
    await stage.dispatchEvent("pointerdown", tap);
    await stage.dispatchEvent("pointermove", { ...tap, clientY: 670 });
    await stage.dispatchEvent("pointerup", tap);
    await stage.dispatchEvent("pointerdown", tap);
    await stage.dispatchEvent("pointercancel", tap);
    await stage.dispatchEvent("pointerup", tap);
    await page.clock.runFor(200);
    expect(await page.evaluate(() => window.heroDraws.arcs)).toBe(0);
    // Native touch scrolling is never disabled by the decorative surface.
    expect(
      await page
        .locator(".hero-canvas")
        .evaluate((element) => getComputedStyle(element).pointerEvents),
    ).toBe("none");
    await expect(stage).toHaveCSS("touch-action", "auto");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(375);
  } finally {
    await context.close();
  }
});

test("missing canvas context leaves the server-rendered hero and navigation usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page
    .getByRole("link", { name: "Open your first tunnel", exact: true })
    .click();
  await expect(page).toHaveURL(/#quickstart$/);
  expect(errors).toEqual([]);
});
