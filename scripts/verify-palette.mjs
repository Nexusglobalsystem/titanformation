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
  if (results.violations.length) {
    console.log(JSON.stringify(results.violations.map(v => ({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),null,2));
    throw new Error(label + " accessibility failed");
  }
  console.log("PASS:", label);
}
try {
  await visit("/");
  const toggle = page.getByRole("button", { name: "Palette claire", exact: true });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await audit("Original dark palette");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".campus-root")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await audit("White palette desktop");
  await page.screenshot({path: root + "artifacts/palette-light-desktop.png", fullPage: true});
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  for (const width of [320, 390, 768, 1024]) {
    await page.setViewportSize({width, height: 844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const controls = await page.locator(".campus-header-actions").boundingBox();
    expect(controls.x + controls.width).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({width: 390, height: 844});
  await audit("White palette mobile");
  await page.screenshot({path: root + "artifacts/palette-light-mobile.png", fullPage: true});
  await page.getByRole("button", {name: "Ouvrir le menu"}).click();
  await page.locator("#campus-mobile-nav").getByRole("link", {name: /Les formations/}).click();
  await expect(page).toHaveURL(/formations/, {timeout: 60000});
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await audit("White palette catalogue");
  await page.locator(".course-card a").first().click();
  await page.waitForURL(/formations\/.+/, {timeout:30000});
  await audit("White palette training detail");
  await visit("/connexion");
  await audit("White palette sign-in");
  await visit("/inscription");
  await audit("White palette registration");
  await toggle.click();
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await audit("Restored dark palette");
  expect(errors).toEqual([]);
  console.log("PASS: keyboard toggle, reload, navigation, responsive layout, no browser errors");
} finally {
  await writeFile(root + "artifacts/palette-verification.json", JSON.stringify({checks, errors}, null, 2));
  await browser.close();
}
