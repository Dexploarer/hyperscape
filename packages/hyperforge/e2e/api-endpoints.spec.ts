/**
 * API Endpoints E2E Tests
 *
 * Full integration tests for API endpoints.
 * Uses Playwright to test actual HTTP requests - NO MOCKS.
 */

import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:3500/api";

test.describe("API Endpoints", () => {
  test("GET /api/assets returns asset list", async ({ request }) => {
    const response = await request.get(`${API_BASE}/assets`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("success");
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data?.assets || body.assets)).toBe(true);
  });

  test("GET /api/assets validates query parameters", async ({ request }) => {
    const response = await request.get(`${API_BASE}/assets?limit=5&category=weapon`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test("POST /api/assets validates request body", async ({ request }) => {
    const response = await request.post(`${API_BASE}/assets`, {
      data: {},
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("GET /api/settings/status returns API status", async ({ request }) => {
    const response = await request.get(`${API_BASE}/settings/status`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("success");
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
  });

  test("GET /api/game/manifests returns manifests", async ({ request }) => {
    const response = await request.get(`${API_BASE}/game/manifests?type=items`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty("success");
    expect(body.success).toBe(true);
  });
});
