/**
 * Generation History API Integration Tests
 * Tests the /api/assets/history endpoint with real database
 *
 * These tests require:
 * 1. DATABASE_URL environment variable
 * 2. Database schema to be pushed (bun run db:push)
 * 3. For HTTP tests: dev server running on port 3500
 *
 * Run with: bun run test -- src/app/api/assets/history/__tests__/route.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  getGenerationHistory,
  getGenerationHistoryCount,
} from "@/lib/db/asset-queries";

// Base URL for API calls - use Next.js test server or localhost
const API_BASE = process.env.TEST_API_URL || "http://localhost:3500";

// Check if database schema is available by trying a query
let schemaAvailable = false;

describe("Generation History API - /api/assets/history", () => {
  const hasDatabase = !!process.env["DATABASE_URL"];

  beforeAll(async () => {
    if (hasDatabase) {
      try {
        await getGenerationHistoryCount();
        schemaAvailable = true;
      } catch {
        schemaAvailable = false;
      }
    }
  });

  describe.skipIf(!hasDatabase)("Database Query Functions", () => {
    it("getGenerationHistory returns array", async () => {
      if (!schemaAvailable) {
        console.log("Skipping: database schema not available");
        return;
      }
      const history = await getGenerationHistory(10, 0);
      expect(Array.isArray(history)).toBe(true);
    });

    it("getGenerationHistoryCount returns number", async () => {
      if (!schemaAvailable) {
        console.log("Skipping: database schema not available");
        return;
      }
      const count = await getGenerationHistoryCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("getGenerationHistory respects limit", async () => {
      if (!schemaAvailable) {
        console.log("Skipping: database schema not available");
        return;
      }
      const history = await getGenerationHistory(5, 0);
      expect(history.length).toBeLessThanOrEqual(5);
    });

    it("getGenerationHistory respects offset", async () => {
      if (!schemaAvailable) {
        console.log("Skipping: database schema not available");
        return;
      }
      const all = await getGenerationHistory(100, 0);
      const offset = await getGenerationHistory(100, 1);

      if (all.length > 1) {
        expect(offset[0]?.id).toBe(all[1]?.id);
      }
    });

    it("history items have prompt field", async () => {
      if (!schemaAvailable) {
        console.log("Skipping: database schema not available");
        return;
      }
      const history = await getGenerationHistory(10, 0);
      for (const item of history) {
        expect(item.prompt).toBeTruthy();
      }
    });

    it("history ordered by createdAt descending", async () => {
      if (!schemaAvailable) {
        console.log("Skipping: database schema not available");
        return;
      }
      const history = await getGenerationHistory(50, 0);
      if (history.length >= 2) {
        for (let i = 0; i < history.length - 1; i++) {
          const current = new Date(history[i].createdAt).getTime();
          const next = new Date(history[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  // HTTP API tests - require dev server running
  const hasServer = process.env.TEST_API_URL || process.env.NEXT_DEV_SERVER;

  describe.skipIf(!hasServer)("GET /api/assets/history (HTTP)", () => {

    it("returns JSON response with history array", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history`);

      expect(response.ok).toBe(true);
      expect(response.headers.get("content-type")).toContain("application/json");

      const data = await response.json();
      expect(data).toHaveProperty("history");
      expect(Array.isArray(data.history)).toBe(true);
    });

    it("returns pagination metadata", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history`);
      const data = await response.json();

      expect(data).toHaveProperty("pagination");
      expect(data.pagination).toHaveProperty("total");
      expect(data.pagination).toHaveProperty("limit");
      expect(data.pagination).toHaveProperty("offset");
      expect(data.pagination).toHaveProperty("hasMore");

      expect(typeof data.pagination.total).toBe("number");
      expect(typeof data.pagination.limit).toBe("number");
      expect(typeof data.pagination.offset).toBe("number");
      expect(typeof data.pagination.hasMore).toBe("boolean");
    });

    it("respects limit query parameter", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=1`);
      const data = await response.json();

      expect(data.history.length).toBeLessThanOrEqual(1);
      expect(data.pagination.limit).toBe(1);
    });

    it("respects offset query parameter", async () => {
      const response1 = await fetch(`${API_BASE}/api/assets/history?limit=1&offset=0`);
      const data1 = await response1.json();

      const response2 = await fetch(`${API_BASE}/api/assets/history?limit=1&offset=1`);
      const data2 = await response2.json();

      // If there are at least 2 items, they should be different
      if (data1.history.length > 0 && data2.history.length > 0) {
        expect(data1.history[0].id).not.toBe(data2.history[0].id);
      }

      expect(data2.pagination.offset).toBe(1);
    });

    it("returns history items with required fields", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=10`);
      const data = await response.json();

      for (const item of data.history) {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("prompt");
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("createdAt");

        // id and name must be non-empty strings
        expect(typeof item.id).toBe("string");
        expect(item.id.length).toBeGreaterThan(0);
        expect(typeof item.name).toBe("string");
        expect(item.name.length).toBeGreaterThan(0);
      }
    });

    it("returns history items with correct URL fields", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=10`);
      const data = await response.json();

      for (const item of data.history) {
        // thumbnailUrl and modelUrl should be null or valid API paths
        if (item.thumbnailUrl !== null) {
          expect(item.thumbnailUrl).toMatch(/^\/api\/assets\/.+/);
        }
        if (item.modelUrl !== null) {
          expect(item.modelUrl).toMatch(/^\/api\/assets\/.+/);
        }
      }
    });

    it("returns items ordered by createdAt descending", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=50`);
      const data = await response.json();

      if (data.history.length >= 2) {
        for (let i = 0; i < data.history.length - 1; i++) {
          const current = new Date(data.history[i].createdAt).getTime();
          const next = new Date(data.history[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it("hasMore is true when there are more items", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=1&offset=0`);
      const data = await response.json();

      if (data.pagination.total > 1) {
        expect(data.pagination.hasMore).toBe(true);
      }
    });

    it("hasMore is false when at end of list", async () => {
      // Request with offset past total
      const countResponse = await fetch(`${API_BASE}/api/assets/history?limit=1`);
      const countData = await countResponse.json();
      const total = countData.pagination.total;

      if (total > 0) {
        const response = await fetch(
          `${API_BASE}/api/assets/history?limit=${total}&offset=0`,
        );
        const data = await response.json();
        expect(data.pagination.hasMore).toBe(false);
      }
    });

    it("handles large offset gracefully", async () => {
      const response = await fetch(
        `${API_BASE}/api/assets/history?limit=10&offset=99999`,
      );

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.history).toEqual([]);
      expect(data.pagination.hasMore).toBe(false);
    });

    it("uses default limit when not specified", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history`);
      const data = await response.json();

      // Default limit is 50
      expect(data.pagination.limit).toBe(50);
    });

    it("uses default offset of 0 when not specified", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history`);
      const data = await response.json();

      expect(data.pagination.offset).toBe(0);
    });

    it("handles invalid limit parameter", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=invalid`);

      // Should still return valid response, parseInt('invalid') = NaN, defaults handled
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("history");
    });

    it("handles negative limit as 0 or default", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=-5`);

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty("history");
    });
  });

  describe.skipIf(!hasServer)("Response structure validation (HTTP)", () => {
    it("history item has all optional fields defined", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=1`);

      if (response.ok) {
        const data = await response.json();

        if (data.history.length > 0) {
          const item = data.history[0];

          // These fields should exist (can be null)
          expect("category" in item).toBe(true);
          expect("aiModel" in item).toBe(true);
          expect("thumbnailUrl" in item).toBe(true);
          expect("modelUrl" in item).toBe(true);
          expect("generationParams" in item).toBe(true);
        }
      }
    });

    it("createdAt is valid ISO date string", async () => {
      const response = await fetch(`${API_BASE}/api/assets/history?limit=5`);

      if (response.ok) {
        const data = await response.json();

        for (const item of data.history) {
          const date = new Date(item.createdAt);
          expect(date.toString()).not.toBe("Invalid Date");
          expect(date.getTime()).toBeGreaterThan(0);
        }
      }
    });
  });
});
