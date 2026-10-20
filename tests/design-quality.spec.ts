import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { docs } from "../src/lib/docs";

const routes = [
  "/",
  "/docs/",
  "/download/",
  "/brand/",
  "/changelog/",
  ...docs.map((doc) => `/docs/${doc.slug}/`),
  "/does-not-exist/",
];
const widths = [320, 375, 390, 768, 1024, 1280, 1440, 1920, 2560];

test("cold font loading stays within the layout shift budget", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const target = window as unknown as { fontLoadShift: number };
    target.fontLoadShift = 0;
    new PerformanceObserver((records) => {
      for (const record of records.getEntries()) {
        const shift = record as PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        };
        if (!shift.hadRecentInput) target.fontLoadShift += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  const shift = await page.evaluate(
    () => (window as unknown as { fontLoadShift: number }).fontLoadShift,
  );
  test
    .info()
    .annotations.push({ type: "font-load-cls", description: String(shift) });
  expect(shift).toBeLessThanOrEqual(0.1);
});

test("typography uses the requested UI and code fonts", async ({ page }) => {
  await page.goto("/docs/api/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Dashboard API",
  );
  await expect(page.locator("body")).toHaveCSS("font-family", /Space Grotesk/);
  await expect(page.locator("pre code").first()).toHaveCSS(
    "font-family",
    /JetBrains Mono/,
  );
  expect(
    await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('16px "Space Grotesk"', "İıŞşĞğÇçÖöÜü"),
        document.fonts.load('16px "JetBrains Mono"', "İıŞşĞğÇçÖöÜü"),
      ]);
      await document.fonts.ready;
      return (
        document.fonts.check('16px "Space Grotesk"', "İıŞşĞğÇçÖöÜü") &&
        document.fonts.check('16px "JetBrains Mono"', "İıŞşĞğÇçÖöÜü")
      );
    }),
  ).toBe(true);
});

test("inspector provides a manual command when clipboard access fails", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("denied");
        },
      },
    }),
  );
  await page.goto("/");
  const inspector = page.locator(".inspector");
  await inspector.getByRole("button", { name: /GET \/api\/projects/ }).click();
  await expect(
    inspector.getByRole("region", { name: "Inspector payload" }),
  ).toContainText("No request body");
  await inspector
    .getByRole("button", { name: "Copy cURL", exact: true })
    .click();
  await expect(
    inspector.locator(".inspector-bottom").getByRole("status"),
  ).toContainText("Clipboard unavailable");
  await expect(
    inspector.getByRole("region", { name: "cURL command code" }),
  ).toContainText("curl -X GET 'http://localhost:3000/api/projects'");
});

test("inspector ignores a clipboard completion from a previous request", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            Object.defineProperty(window, "finishInspectorCopy", {
              value: resolve,
              configurable: true,
            });
          }),
      },
    }),
  );
  await page.goto("/");
  const inspector = page.locator(".inspector");
  await inspector
    .getByRole("button", { name: "Copy cURL", exact: true })
    .click();
  await inspector.getByRole("button", { name: /GET \/api\/projects/ }).click();
  await page.evaluate(() =>
    (
      window as unknown as { finishInspectorCopy: () => void }
    ).finishInspectorCopy(),
  );
  await expect(
    inspector.getByRole("button", { name: "Copy cURL", exact: true }),
  ).toBeVisible();
  await expect(
    inspector.getByRole("button", { name: "Copied", exact: true }),
  ).toHaveCount(0);
});

test("regression: long search queries wrap without a horizontal scrollbar", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Search documentation",
    exact: true,
  });
  await trigger.click();
  await page.getByRole("textbox").fill("notfound");
  await expect(page.locator(".search-empty")).toContainText("No results");
  expect(
    await page
      .locator(".search-results")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.getByRole("textbox").fill("a".repeat(180));
  await expect(page.locator(".search-empty")).toContainText("a".repeat(180));
  expect(
    await page
      .locator(".search-results")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.getByRole("textbox").press("Escape");
  await expect(trigger).toBeFocused();
});

test("regression: mobile menu Escape returns focus and short screens remain scrollable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 320 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu", exact: true });
  await toggle.click();
  const menu = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(menu).toBeVisible();
  await menu.getByRole("link").first().focus();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await toggle.click();
  const bounds = await menu.boundingBox();
  expect(bounds && bounds.y + bounds.height).toBeLessThanOrEqual(320);
  await menu.getByRole("link").last().focus();
  await expect(menu.getByRole("link").last()).toBeInViewport();
});

test("regression: appearance choices fit a short viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 320 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /Color theme:/ });
  await toggle.click();
  const panel = page.getByRole("dialog", { name: "Appearance" });
  await expect(panel).toBeVisible();
  const bounds = await panel.boundingBox();
  expect(bounds && bounds.y + bounds.height).toBeLessThanOrEqual(320);
  await page.getByRole("radio", { name: "Dark", exact: true }).check();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
});

test("regression: narrow header has readable branding and adequate icon targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await expect(page.locator(".header-inner .rift-mark")).toBeVisible();
  for (const control of await page.locator(".header-actions button").all()) {
    if (!(await control.isVisible())) continue;
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
  const wordmark = page.locator(".header-inner .logo-type");
  if (await wordmark.isVisible())
    expect((await wordmark.boundingBox())?.width).toBeGreaterThanOrEqual(80);
});

for (const theme of ["light", "dark"] as const) {
  for (const width of widths) {
    test(`all routes reflow at ${width}px (${theme})`, async ({ page }) => {
      test.setTimeout(90000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const route of routes) {
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect
          .soft(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `${route}: page overflow at ${width}`,
          )
          .toBe(true);
        const header = await page.locator(".header-inner").boundingBox();
        expect
          .soft(
            header && header.x + header.width <= width,
            `${route}: header containment`,
          )
          .toBe(true);
      }
      expect(errors).toEqual([]);
      await page.goto("/");
      await page.screenshot({
        path: `.qa/design-${theme}-${width}-home.png`,
        fullPage: width === 1440,
      });
    });
  }
  for (const width of [375, 1440]) {
    test(`all routes WCAG automated review ${width}px (${theme})`, async ({
      page,
    }) => {
      test.setTimeout(180000);
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      for (const route of routes) {
        await page.goto(route);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect.soft(results.violations, `${route} accessibility`).toEqual([]);
      }
    });
  }
}

test("breakpoints and mobile landscape preserve page containment", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [
    364, 365, 366, 519, 520, 521, 679, 680, 681, 759, 760, 761, 849, 850, 851,
    979, 980, 981, 1099, 1100, 1101, 1199, 1200, 1201, 1279, 1281,
  ]) {
    await page.setViewportSize({ width, height: width < 800 ? 320 : 600 });
    for (const route of [
      "/",
      "/docs/api/",
      "/download/",
      "/brand/",
      "/changelog/",
    ]) {
      await page.goto(route);
      expect
        .soft(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} at ${width}`,
        )
        .toBe(true);
    }
  }
});
