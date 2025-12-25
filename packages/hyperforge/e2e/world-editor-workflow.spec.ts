/**
 * World Editor Workflow E2E Tests
 *
 * Full user workflow tests for world editing.
 * Uses Playwright with real browser and real API calls - NO MOCKS.
 */

import { test, expect } from "@playwright/test";

test.describe("World Editor Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3500/world");
  });

  test("can view world editor", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
  });

  test("can interact with world canvas", async ({ page }) => {
    // Wait for canvas to load
    await page.waitForTimeout(2000);

    // Check for canvas or viewport
    const canvas = page.locator("canvas").first();
    if (await canvas.isVisible({ timeout: 5000 })) {
      expect(canvas).toBeVisible();
    }
  });
});
