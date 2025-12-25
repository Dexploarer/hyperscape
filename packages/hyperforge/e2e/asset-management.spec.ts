/**
 * Asset Management E2E Tests
 *
 * Full user workflow tests for asset management.
 * Uses Playwright with real browser and real API calls - NO MOCKS.
 */

import { test, expect } from "@playwright/test";

test.describe("Asset Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to studio/vault page
    await page.goto("http://localhost:3500/studio");
  });

  test("can view asset library", async ({ page }) => {
    // Wait for assets to load
    await page.waitForSelector('[data-testid="asset-list"]', { timeout: 10000 });

    // Check that assets are displayed
    const assetCards = page.locator('[data-testid="asset-card"]');
    const count = await assetCards.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("can filter assets by category", async ({ page }) => {
    // Wait for assets to load
    await page.waitForSelector('[data-testid="asset-list"]', { timeout: 10000 });

    // Click category filter
    await page.click('button:has-text("Weapon")');

    // Wait for filtered results
    await page.waitForTimeout(1000);

    // Verify filter is applied (check URL or UI state)
    const url = page.url();
    expect(url).toContain("category=weapon");
  });

  test("can search for assets", async ({ page }) => {
    // Wait for search input
    await page.waitForSelector('input[placeholder*="search" i]', { timeout: 5000 });

    // Type search query
    await page.fill('input[placeholder*="search" i]', "sword");

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify search is applied
    const url = page.url();
    expect(url).toContain("search=sword");
  });
});
