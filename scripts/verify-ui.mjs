import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(root + ".verification/package.json");
const { chromium, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH
    ? { executablePath: process.env.BROWSER_PATH }
    : {}),
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir(root + "artifacts", { recursive: true });
async function visit(path) {
  const response = await page.goto(base + path, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  expect(response.status()).toBeLessThan(400);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
}
async function audit(label) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  checks.push({ label, violations: results.violations });
  expect(results.violations, label + " accessibility").toEqual([]);
  console.log("PASS:", label);
}
try {
  await visit("/");
  await page.getByRole("tab", { name: "02 Pratiquer" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Transformez");
  await page.getByRole("tab", { name: "02 Pratiquer" }).press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "03 Progresser" }),
  ).toHaveAttribute("aria-selected", "true");
  await audit("Desktop home and interactive tabs");
  await page.screenshot({
    path: root + "artifacts/home-desktop.png",
    fullPage: true,
  });
  await page.screenshot({ path: root + "artifacts/home-hero.png" });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "No overflow at " + width,
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await expect(page.locator("#campus-mobile-nav")).toBeVisible();
  await page.getByRole("button", { name: "Fermer le menu" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".kinetic-sphere")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
  await audit("Mobile home, menu and reduced motion");
  await page.screenshot({
    path: root + "artifacts/home-mobile.png",
    fullPage: true,
  });
  await visit("/formations");
  await page
    .getByRole("textbox", { name: "Rechercher une formation" })
    .fill("zzzz-no-result-789");
  await expect(page.getByRole("status")).toContainText("0 formation", {
    timeout: 30000,
  });
  await page.getByRole("link", { name: /Réinitialiser|Effacer/ }).click();
  await expect(page.getByRole("status")).not.toContainText("0 formation", {
    timeout: 30000,
  });
  await audit("Mobile catalogue search and reset");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await audit("Desktop catalogue");
  await page.screenshot({
    path: root + "artifacts/catalogue-desktop.png",
    fullPage: true,
  });
  await page.locator(".course-card a").first().click();
  await page.waitForURL(/formations\/.+/, { timeout: 30000 });
  await audit("Training detail");
  await visit("/apprenant");
  await expect(page).toHaveURL(/connexion/);
  await audit("Sign-in and protected-route redirect");
  expect(errors).toEqual([]);
  console.log("PASS: no uncaught browser errors.");
} finally {
  await writeFile(
    root + "artifacts/browser-verification.json",
    JSON.stringify({ checks, errors }, null, 2),
  );
  await browser.close();
}
