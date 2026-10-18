import { expect, type Page, test } from "@playwright/test";

declare global {
  interface Window {
    backgroundListenerCount: number;
    previousBackgroundAnimations: Animation[];
  }
}

const button = (page: Page) => page.locator(".animation-toggle");
const listeners = (page: Page) =>
  page.evaluate(() => window.backgroundListenerCount);
const liveEffects =
  '.background-burst:not([display="none"]), .background-relay:not([display="none"])';
const ambientTimes = (page: Page) =>
  page
    .locator(".background-drift")
    .evaluateAll((elements) =>
      elements.flatMap((element) =>
        element.getAnimations().map((animation) => animation.currentTime),
      ),
    );

test.beforeEach(async ({ page }) => {
  // Count passive capture handlers; React's own non-passive capture handlers
  // must remain attached when pointer effects are disabled.
  await page.addInitScript(() => {
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const active = new Map<string, Set<EventListenerOrEventListenerObject>>();
    const types = new Set([
      "pointermove",
      "pointerdown",
      "pointerup",
      "pointercancel",
    ]);
    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      const capture = typeof options === "boolean" ? options : options?.capture;
      if (
        this === document &&
        types.has(type) &&
        capture &&
        typeof options === "object" &&
        options.passive === true &&
        listener
      ) {
        if (!active.has(type)) active.set(type, new Set());
        active.get(type)?.add(listener);
      }
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      const capture = typeof options === "boolean" ? options : options?.capture;
      if (this === document && capture && listener)
        active.get(type)?.delete(listener);
      return remove.call(this, type, listener, options);
    };
    Object.defineProperty(window, "backgroundListenerCount", {
      get: () =>
        [...active.values()].reduce((sum, entries) => sum + entries.size, 0),
    });
  });
});

test("mouse toggle clears interactions and listeners while ambient motion continues", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  try {
    await page.goto("/");
    await expect(button(page)).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => listeners(page)).toBe(4);
    await page.clock.pauseAt(new Date("2026-01-01T00:01:00Z"));
    await page.mouse.move(1408, 500);
    await page.mouse.click(1408, 500);
    await page.clock.runFor(250);
    expect(await page.locator(liveEffects).count()).toBeGreaterThan(0);
    await page.evaluate(() => {
      window.previousBackgroundAnimations = Array.from(
        document.querySelectorAll(".background-drift, .interaction-drift"),
      ).flatMap((element) => element.getAnimations());
    });
    expect(
      await page.evaluate(() => window.previousBackgroundAnimations.length),
    ).toBeGreaterThan(0);
    await button(page).focus();
    await button(page).press("Space");
    await expect
      .poll(() =>
        page
          .locator(".background-drift")
          .evaluateAll(
            (elements) =>
              elements
                .flatMap((element) => element.getAnimations())
                .filter((animation) => animation.playState === "running")
                .length,
          ),
      )
      .toBeGreaterThan(0);
    await expect(
      page.getByRole("button", { name: "Fare efektlerini aç", exact: true }),
    ).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("tooltip")).toHaveText("Fare efektlerini aç");
    await expect.poll(() => listeners(page)).toBe(0);
    await expect(page.locator(liveEffects)).toHaveCount(0);
    expect(
      await page.evaluate(() =>
        window.previousBackgroundAnimations.every(
          (animation) => animation.playState === "idle",
        ),
      ),
    ).toBe(true);
    await page.clock.runFor(1500);
    const still = await page
      .locator(".background-motif")
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("transform")),
      );
    await page.mouse.move(1200, 600);
    await page.mouse.click(1408, 500);
    await page.clock.runFor(4000);
    await expect(page.locator(liveEffects)).toHaveCount(0);
    expect(
      await page
        .locator(".background-motif")
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("transform")),
        ),
    ).toEqual(still);
    expect(
      await page
        .locator(".background-drift")
        .evaluateAll(
          (elements) =>
            elements.flatMap((element) => element.getAnimations()).length,
        ),
    ).toBeGreaterThan(0);
    const ambient = await ambientTimes(page);
    await expect.poll(() => ambientTimes(page)).not.toEqual(ambient);
    expect(
      await page
        .locator(".interaction-drift")
        .evaluateAll(
          (elements) =>
            elements.flatMap((element) => element.getAnimations()).length,
        ),
    ).toBe(0);
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.clock.runFor(2000);
    expect(
      await page
        .locator(".background-motif")
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute("transform")),
        ),
    ).not.toEqual(still);
    for (let i = 0; i < 3; i++) {
      await button(page).press("Enter");
      await expect(button(page)).toHaveAttribute("aria-pressed", "true");
      await expect.poll(() => listeners(page)).toBe(4);
      await button(page).press("Space");
      await expect.poll(() => listeners(page)).toBe(0);
    }
    await button(page).press("Enter");
    await expect(
      page.getByRole("button", { name: "Fare efektlerini kapat", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => listeners(page)).toBe(4);
    await button(page).press("Escape");
    await expect(page.getByRole("tooltip")).not.toBeVisible();
  } finally {
    await page.clock.resume();
  }
});

test("preference persists through navigation and reload and synchronizes across tabs", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(button(page)).toHaveAttribute("aria-pressed", "true");
  await button(page).click();
  expect(
    await page.evaluate(() => localStorage.getItem("wirerift-animations")),
  ).toBe("off");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Documentation", exact: true })
    .click();
  await page.reload();
  await expect(button(page)).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => listeners(page)).toBe(0);
  const other = await context.newPage();
  try {
    await other.goto("/download/");
    await expect(button(other)).toHaveAttribute("aria-pressed", "false");
    await button(page).click();
    await expect(button(other)).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(button(page)).toHaveAttribute("aria-pressed", "true");
  } finally {
    await other.close();
  }
});

test("system motion is the first-use default and an explicit choice takes precedence", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(button(page)).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => listeners(page)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(button(page)).toHaveAttribute("aria-pressed", "true");
  await button(page).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(button(page)).toHaveAttribute("aria-pressed", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button(page).click();
  await expect(button(page)).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => listeners(page)).toBe(4);
  expect(
    await page
      .locator(".background-drift")
      .evaluateAll(
        (elements) =>
          elements.flatMap((element) => element.getAnimations()).length,
      ),
  ).toBe(0);
  await page.mouse.click(1408, 500);
  await expect(page.locator(liveEffects).first()).toBeVisible();
  await page.reload();
  await expect(button(page)).toHaveAttribute("aria-pressed", "true");
});

test("stored mouse-off keeps ambient motion responsive in both themes", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("wirerift-animations", "off");
  });
  await page.goto("/");
  for (const width of [375, 768, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: width % 2 ? "light" : "dark" });
    await expect(button(page)).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => listeners(page)).toBe(0);
    await expect(page.locator(".background-drift")).toHaveCount(
      width <= 760 ? 12 : width >= 1900 ? 42 : 28,
    );
    await expect.poll(() => ambientTimes(page)).not.toEqual([]);
    const before = await ambientTimes(page);
    await expect.poll(() => ambientTimes(page)).not.toEqual(before);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator(liveEffects)).toHaveCount(0);
  }
});

test("blocked storage keeps the control usable and the mobile target is touch sized", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    }),
  );
  await page.goto("/");
  await expect(button(page)).toHaveAttribute("aria-pressed", "false");
  const bounds = await button(page).boundingBox();
  expect(bounds?.width).toBeGreaterThanOrEqual(44);
  expect(bounds?.height).toBeGreaterThanOrEqual(44);
  await button(page).click();
  await expect(button(page)).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => listeners(page)).toBe(4);
  await button(page).click();
  await expect.poll(() => listeners(page)).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: ".qa/animation-toggle-mobile.png" });
});
