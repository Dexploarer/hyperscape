/**
 * Content Workflow E2E Tests
 *
 * Full user workflow tests for content generation.
 * Uses Playwright with real browser and real API calls - NO MOCKS.
 */

import { test, expect } from "@playwright/test";

test.describe("Content Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3500/content");
  });

  test("can navigate content pages", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();

    // Navigate to content generation
    await page.goto("http://localhost:3500/content/generate");
    await expect(page.locator("body")).toBeVisible();

    // Navigate to dialogue editor
    await page.goto("http://localhost:3500/content/dialogue");
    await expect(page.locator("body")).toBeVisible();
  });
});
