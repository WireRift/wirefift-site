import { expect, type Page, test } from "@playwright/test";

const visibleBursts =
  '.site-background .background-burst:not([display="none"])';
const visibleMotifs =
  '.site-background .background-motif:not([display="none"])';

async function scene(page: Page) {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await expect(page.locator(".site-background")).toBeInViewport();
  await expect(page.locator(".background-motif").first()).toHaveAttribute(
    "transform",
    /translate/,
  );
  await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
  await page.clock.runFor(1500);
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return page
        .locator(visibleMotifs)
        .evaluateAll((elements) =>
          elements.some(
            (element) => Number(element.getAttribute("opacity")) > 0.1,
          ),
        );
    })
    .toBe(true);
}
const transforms = (page: Page) =>
  page
    .locator(".background-motif")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("transform")),
    );

const motionTimes = (page: Page) =>
  page
    .locator(".background-drift")
    .evaluateAll((elements) =>
      elements.flatMap((element) =>
        element.getAnimations().map((animation) => animation.currentTime),
      ),
    );
async function motionSettled(page: Page) {
  await page.locator(".background-drift").evaluateAll(async (elements) => {
    await Promise.all(
      elements.flatMap((element) =>
        element.getAnimations().map((animation) => animation.ready),
      ),
    );
  });
}
const allPaused = (page: Page) =>
  page.locator(".background-drift").evaluateAll((elements) => {
    const animations = elements.flatMap((element) => element.getAnimations());
    return animations.every((animation) => animation.playState === "paused");
  });

test("SVG ambient motion keeps stable nodes and bounds local pointer and click effects", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await scene(page);
  await expect(page.locator("svg.site-background")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(0);
  const poolSize = await page.locator(".site-background *").count();
  const before = await transforms(page);
  await page
    .locator(".background-motif")
    .first()
    .evaluate((element) => element.setAttribute("data-stable-node", "same"));
  const ambient = await motionTimes(page);
  await expect.poll(() => motionTimes(page)).not.toEqual(ambient);
  await page.clock.runFor(300);
  // Ambient motion runs on the native timeline without mutating SVG attributes.
  expect(await transforms(page)).toEqual(before);
  await expect(page.locator(".background-motif").first()).toHaveAttribute(
    "data-stable-node",
    "same",
  );
  const position = await page.locator(visibleMotifs).evaluateAll((elements) =>
    elements
      .map((element) => {
        const matrix = (element as SVGGraphicsElement).getCTM();
        return { x: matrix?.e ?? -1, y: matrix?.f ?? -1 };
      })
      .find(
        (point) =>
          point.x > 100 && point.x < 1300 && point.y > 150 && point.y < 850,
      ),
  );
  if (!position) throw new Error("Missing visible vector object");
  await page.mouse.move(position.x, position.y);
  await page.clock.runFor(250);
  const links = page.locator('.background-links path:not([display="none"])');
  expect(await links.count()).toBeGreaterThan(0);
  expect(await links.count()).toBeLessThanOrEqual(3);
  for (const d of await links.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("d") ?? ""),
  )) {
    const coordinates = d.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    expect(
      Math.hypot(
        coordinates[2] - coordinates[0],
        coordinates[3] - coordinates[1],
      ),
    ).toBeLessThanOrEqual(227);
  }
  await page.mouse.move(-10, -10);
  await page.clock.runFor(2200);
  await expect(links).toHaveCount(0);
  for (let i = 0; i < 18; i++) await page.mouse.click(1408, 500);
  await page.clock.runFor(180);
  await expect(page.locator(visibleBursts)).toHaveCount(5);
  expect(await page.locator(".site-background *").count()).toBe(poolSize);
  await page.screenshot({ path: ".qa/svg-background-light.png" });
  await page.clock.runFor(2600);
  await expect(page.locator(visibleBursts)).toHaveCount(0);
  const source = page.getByRole("link", {
    name: "Explore the source",
    exact: true,
  });
  await source.evaluate((element) =>
    element.addEventListener("click", (event) => event.preventDefault()),
  );
  await source.click();
  await page.getByRole("heading", { level: 1 }).click();
  await page.clock.runFor(200);
  await expect(page.locator(visibleBursts)).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.clock.resume();
});

test("one SVG persists through client navigation, document sections and footer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await scene(page);
  // Navigation/scroll checks use the real browser timeline. Leave no paused
  // virtual clock in the next document or in tracing/context teardown.
  await page.clock.resume();
  await page.evaluate(() =>
    document
      .querySelector(".site-background")
      ?.setAttribute("data-persistence-check", "same-node"),
  );
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Documentation", exact: true })
    .click();
  await expect(page).toHaveURL(/\/docs\/getting-started\/$/);
  await expect(page.locator(".site-background")).toHaveAttribute(
    "data-persistence-check",
    "same-node",
  );
  await expect(page.locator(".background-motif")).toHaveCount(28);
  for (const section of [".doc-content", ".footer-main", ".studio-section"]) {
    await page.locator(section).scrollIntoViewIfNeeded();
    await expect(page.locator(".site-background")).toBeInViewport();
    const box = await page.locator(".site-background").boundingBox();
    expect(box?.y).toBe(0);
    expect(box?.height).toBe(1000);
  }
  await page.screenshot({ path: ".qa/svg-background-footer.png" });
  expect(errors).toEqual([]);
});

test("reduced motion is static through scrolling and theme changes, hidden SVG stops and resumes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await scene(page);
  await motionSettled(page);
  expect(await allPaused(page)).toBe(true);
  const still = await transforms(page);
  const stillTimes = await motionTimes(page);
  await page.clock.runFor(3000);
  await page.mouse.click(1408, 500);
  await page.evaluate(() =>
    window.scrollTo({ top: 1800, behavior: "instant" }),
  );
  await page.clock.runFor(1000);
  expect(await transforms(page)).toEqual(still);
  expect(await motionTimes(page)).toEqual(stillTimes);
  await expect(page.locator(visibleBursts)).toHaveCount(0);
  const amber = page.locator(".background-motif.background-amber").first();
  const light = await amber.evaluate(
    (element) => getComputedStyle(element).stroke,
  );
  await page.getByRole("button", { name: /Color theme:/ }).click();
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await page.getByRole("radio", { name: "Dark", exact: true }).press("Escape");
  await expect(amber).toHaveCSS("stroke", "rgb(245, 189, 82)");
  expect(light).not.toBe("rgb(245, 189, 82)");
  expect(await transforms(page)).toEqual(still);
  await page.screenshot({ path: ".qa/svg-background-dark.png" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return transforms(page);
    })
    .not.toEqual(still);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await motionSettled(page);
  expect(await allPaused(page)).toBe(true);
  const hidden = await transforms(page);
  const hiddenTimes = await motionTimes(page);
  await page.clock.runFor(30_000);
  expect(await transforms(page)).toEqual(hidden);
  expect(await motionTimes(page)).toEqual(hiddenTimes);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await motionSettled(page);
  await expect.poll(() => motionTimes(page)).not.toEqual(hiddenTimes);
  // Hiding the layer itself also stops its animation loop.
  await page
    .locator(".site-background")
    .evaluate((element) => element.setAttribute("style", "display:none"));
  await expect(page.locator(".site-background")).not.toBeInViewport();
  await page.clock.runFor(100);
  await expect.poll(() => allPaused(page)).toBe(true);
  const offscreen = await transforms(page);
  await page.clock.runFor(5000);
  expect(await transforms(page)).toEqual(offscreen);
  await page.clock.resume();
});

test("mobile density is lower, native taps are bounded, swipes and cancelled gestures stay quiet", async ({
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
    await scene(page);
    await expect(page.locator(".background-motif")).toHaveCount(12);
    await expect(page.locator(".site-background")).toHaveCSS(
      "pointer-events",
      "none",
    );
    await expect(page.locator("body")).toHaveCSS("touch-action", "auto");
    await page.touchscreen.tap(365, 770);
    await page.clock.runFor(200);
    await expect(page.locator(visibleBursts)).toHaveCount(1);
    await page.clock.runFor(2600);
    const touch = {
      pointerType: "touch",
      pointerId: 1,
      isPrimary: true,
      button: 0,
      clientX: 365,
      clientY: 770,
    };
    await page.locator("body").dispatchEvent("pointerdown", touch);
    await page
      .locator("body")
      .dispatchEvent("pointermove", { ...touch, clientY: 650 });
    await page.locator("body").dispatchEvent("pointerup", touch);
    await page.locator("body").dispatchEvent("pointerdown", touch);
    await page.locator("body").dispatchEvent("pointercancel", touch);
    await page.locator("body").dispatchEvent("pointerup", touch);
    await page.clock.runFor(250);
    await expect(page.locator(visibleBursts)).toHaveCount(0);
    for (let i = 0; i < 9; i++) await page.touchscreen.tap(365, 770);
    await page.clock.runFor(150);
    await expect(page.locator(visibleBursts)).toHaveCount(3);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(375);
    await page.screenshot({ path: ".qa/svg-background-mobile.png" });
  } finally {
    if (!page.isClosed()) await page.clock.resume();
    await context.close();
  }
});

test("wide displays keep a bounded SVG pool at any pixel density", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 3840, height: 2160 },
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/brand/");
    await expect(page.locator(".background-motif")).toHaveCount(42);
    expect(await motionTimes(page)).toEqual([]);
    await expect(page.locator("canvas")).toHaveCount(0);
    const size = await page.locator(".site-background").boundingBox();
    expect(size?.width).toBe(3840);
    expect(size?.height).toBe(2160);
    expect(await page.locator(".site-background *").count()).toBeLessThan(150);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(3840);
  } finally {
    await context.close();
  }
});

test("server-rendered content and vector fallback work without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".background-contours path")).toHaveCount(2);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Download", exact: true })
      .click();
    await expect(page).toHaveURL(/\/download\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  } finally {
    await context.close();
  }
});
