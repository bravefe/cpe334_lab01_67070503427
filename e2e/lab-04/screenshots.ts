import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 991, height: 900 },
  { name: "mobile", width: 767, height: 900 },
] as const;

/** Captures reproducible Lab 3 visual-review evidence outside Playwright's transient results. */
export async function captureScreen(page: Page, area: string, state: string) {
  const directory = join(process.cwd(), "artifacts", "lab-03", "screenshots", area);
  mkdirSync(directory, { recursive: true });
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.screenshot({ path: join(directory, `${state}-${viewport.name}.png`), fullPage: true });
  }
}
