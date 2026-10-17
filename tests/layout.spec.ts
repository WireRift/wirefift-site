import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1024, 1440, 1920, 2560]) {
  test(`balanced layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of [
      "/",
      "/docs/",
      "/docs/api/",
      "/download/",
      "/brand/",
      "/changelog/",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const frame = await page.locator(".header-inner").boundingBox();
      expect(frame).not.toBeNull();
      if (!frame) throw new Error("Missing shared page frame");
      expect(frame.x).toBeGreaterThanOrEqual(15);
      expect(frame.x + frame.width).toBeLessThanOrEqual(width - 15);
      if (width >= 1920) {
        expect(frame.width).toBeGreaterThanOrEqual(1680);
        expect(frame.width).toBeLessThanOrEqual(1750);
      } else if (width === 1440) {
        expect(frame.width).toBeGreaterThanOrEqual(1320);
      }
      await expect(page.locator("html")).toHaveCSS("font-size", "16px");
      for (const selector of [
        "main.container",
        ".hero",
        ".terminal-section",
        ".footer-main",
        ".studio-section",
        ".footer-bottom",
      ]) {
        const element = page.locator(selector);
        if (!(await element.count())) continue;
        const box = await element.boundingBox();
        if (!box) continue;
        expect(
          Math.abs(box.x - frame.x),
          `${path} ${selector}: left alignment`,
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(box.width - frame.width),
          `${path} ${selector}: width`,
        ).toBeLessThanOrEqual(1);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path}: horizontal overflow`,
      ).toBe(true);
      if (path === "/" && width >= 1024) {
        expect(
          await page
            .locator("h1 > span")
            .evaluate((el) => el.getClientRects().length),
          "hero title stays on its intended line",
        ).toBe(1);
      }
      if (path === "/docs/api/" && width >= 1440) {
        const prose = await page
          .locator(".doc-section > p")
          .first()
          .boundingBox();
        const data = await page.locator(".doc-table-wrap").boundingBox();
        expect(prose?.width).toBeLessThanOrEqual(720);
        expect(data?.width).toBeGreaterThan(prose?.width ?? 0);
      }
      if (path === "/brand/" && width >= 1440) {
        const cards = await page.locator(".brand-card").all();
        const boxes = await Promise.all(
          cards.map((card) => card.boundingBox()),
        );
        expect(boxes[0]?.y).toBe(boxes[2]?.y);
      }
      if (["/", "/docs/api/", "/brand/"].includes(path)) {
        await page.screenshot({
          path: `.qa/layout-${width}-${path === "/" ? "home" : path.split("/").filter(Boolean).join("-")}.png`,
          fullPage: path === "/" && width === 1440,
          animations: "disabled",
        });
      }
    }
    expect(errors).toEqual([]);
  });
}
