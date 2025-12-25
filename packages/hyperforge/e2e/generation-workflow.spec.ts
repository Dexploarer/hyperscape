/**
 * Generation Workflow E2E Tests
 *
 * Full user workflow tests for asset generation.
 * Uses Playwright with real browser and real API calls - NO MOCKS.
 */

import { test, expect } from "@playwright/test";

test.describe("Generation Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to generation page
    await page.goto("http://localhost:3500/generate");
  });

  test("can generate a weapon asset", async ({ page }) => {
    // Select weapon category
    await page.click('button:has-text("Weapon")');

    // Fill in generation form
    await page.fill('textarea[placeholder*="prompt"]', "A fantasy sword with glowing runes");
    await page.selectOption('select[name="quality"]', "medium");
    await page.fill('input[name="name"]', "Rune Sword");

    // Submit generation
    await page.click('button:has-text("Generate")');

    // Wait for generation to start
    await expect(page.locator('text=/generating|processing/i')).toBeVisible({ timeout: 10000 });

    // Wait for completion or timeout
    await page.waitForTimeout(30000); // 30 second timeout for generation

    // Check for success message or result
    const successIndicator = page.locator('text=/success|complete|ready/i');
    await expect(successIndicator).toBeVisible({ timeout: 60000 });
  });

  test("validates required fields before generation", async ({ page }) => {
    // Select weapon category
    await page.click('button:has-text("Weapon")');

    // Try to submit without filling required fields
    await page.click('button:has-text("Generate")');

    // Should show validation errors
    await expect(page.locator('text=/required|missing/i')).toBeVisible();
  });
});
