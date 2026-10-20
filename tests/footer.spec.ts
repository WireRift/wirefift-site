import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`OXOG reference banner stays compact, accessible and responsive (${theme})`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("wirerift-animations", "off");
    });
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    const banner = page.locator(".studio");
    const mark = banner.locator(".oxog-mark");
    await expect(banner).toHaveAttribute("href", "https://oxog.net");
    await expect(banner.getByRole("heading")).toHaveText(
      "Small studio. Big ideas.",
    );
    await expect(banner.locator("p")).toHaveText(
      "Explore the tools and infrastructure from Oxog.",
    );
    await expect(banner.locator(".eyebrow")).toHaveText(
      "PART OF A BIGGER PICTURE",
    );
    await expect(banner.locator(".studio-link")).toHaveText("Meet oxog.net");
    await expect(banner.locator("a")).toHaveCount(0);
    await expect(
      page.locator(".studio-projects, .studio-signature"),
    ).toHaveCount(0);
    await expect(mark.locator("path")).toHaveCount(4);
    for (const width of [375, 768, 1024, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      await banner.scrollIntoViewIfNeeded();
      await expect(mark).toHaveAttribute("data-visible", "true");
      await expect(mark).toHaveCSS("width", width <= 520 ? "65px" : "105px");
      await expect(banner.getByRole("heading")).toHaveCSS(
        "font-family",
        /Space Grotesk/,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const bannerBox = await banner.boundingBox();
      const ctaBox = await banner.locator(".studio-link").boundingBox();
      expect(bannerBox).not.toBeNull();
      expect(ctaBox).not.toBeNull();
      if (!bannerBox || !ctaBox) throw new Error("Missing footer layout");
      expect(ctaBox.x).toBeGreaterThanOrEqual(bannerBox.x);
      expect(ctaBox.x + ctaBox.width).toBeLessThanOrEqual(
        bannerBox.x + bannerBox.width,
      );
      expect(ctaBox.y + ctaBox.height).toBeLessThanOrEqual(
        bannerBox.y + bannerBox.height,
      );
    }
    // The mouse toggle does not stop the studio's ambient logo animation.
    await expect(page.locator(".animation-toggle")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(mark.locator("path").first()).toHaveCSS(
      "animation-duration",
      "6s",
    );
    await expect(mark.locator("path").last()).toHaveCSS(
      "animation-delay",
      "0.45s",
    );
    await expect(mark.locator("path").first()).toHaveCSS(
      "animation-iteration-count",
      "infinite",
    );
    const results = await new AxeBuilder({ page })
      .include(".site-footer")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    await page.setViewportSize({ width: 1440, height: 900 });
    await banner.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `.qa/oxog-footer-${theme}.png` });
    await page.keyboard.press("Control+Home");
    await expect(mark).toHaveAttribute("data-visible", "false");
    await expect(mark.locator("path").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await banner.scrollIntoViewIfNeeded();
    await expect(mark).toHaveAttribute("data-visible", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(mark.locator("path").first()).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(mark.locator("path").first()).toHaveCSS(
      "stroke-dashoffset",
      "0px",
    );
  });
}
