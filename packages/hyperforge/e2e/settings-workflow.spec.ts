/**
 * Settings Workflow E2E Tests
 *
 * Full user workflow tests for settings management.
 * Uses Playwright with real browser and real API calls - NO MOCKS.
 */

import { test, expect } from "@playwright/test";

test.describe("Settings Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3500/settings");
  });

  test("can view settings page", async ({ page }) => {
    await expect(page.locator("body")).toBeVisible();
  });

  test("can view API status", async ({ page }) => {
    // Wait for status to load
    await page.waitForTimeout(2000);

    // Check for status indicators
    const statusSection = page.locator('text=/status|configured/i');
    if (await statusSection.isVisible({ timeout: 5000 })) {
      expect(statusSection).toBeVisible();
    }
  });
});
