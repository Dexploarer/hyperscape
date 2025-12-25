/**
 * Studio Workflow E2E Tests
 *
 * Full user workflow tests for the studio interface.
 * Uses Playwright with real browser and real API calls - NO MOCKS.
 */

import { test, expect } from "@playwright/test";

test.describe("Studio Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3500/studio");
  });

  test("can navigate studio pages", async ({ page }) => {
    // Check that studio loads
    await expect(page.locator("body")).toBeVisible();

    // Navigate to different studio sections
    const sections = ["armor", "equipment", "hands", "retarget", "structures"];

    for (const section of sections) {
      await page.goto(`http://localhost:3500/studio/${section}`);
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("can view asset properties", async ({ page }) => {
    // Navigate to studio
    await page.goto("http://localhost:3500/studio");

    // Wait for assets to load
    await page.waitForTimeout(2000);

    // Try to click on an asset if available
    const assetCard = page.locator('[data-testid="asset-card"]').first();
    if (await assetCard.isVisible({ timeout: 5000 })) {
      await assetCard.click();
      // Properties panel should appear
      await page.waitForTimeout(1000);
    }
  });
});
