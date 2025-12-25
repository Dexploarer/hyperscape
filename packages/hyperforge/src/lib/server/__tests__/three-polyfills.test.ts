/**
 * Three.js Polyfills Tests
 *
 * Tests for Three.js server-side polyfills.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import { ensureThreePolyfills } from "../three-polyfills";

describe("ThreePolyfills", () => {
  it("ensures polyfills are loaded", () => {
    // This function exists to ensure module execution
    expect(typeof ensureThreePolyfills).toBe("function");
    expect(() => ensureThreePolyfills()).not.toThrow();
  });

  it("provides ProgressEvent polyfill", () => {
    ensureThreePolyfills();
    expect(typeof globalThis.ProgressEvent).toBe("function");
  });

  it("provides FileReader polyfill", () => {
    ensureThreePolyfills();
    expect(typeof globalThis.FileReader).toBe("function");
  });

  it("provides self polyfill", () => {
    ensureThreePolyfills();
    expect(globalThis.self).toBeDefined();
  });
});
