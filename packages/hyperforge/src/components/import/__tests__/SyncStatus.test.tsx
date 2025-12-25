/**
 * SyncStatus Component Tests
 *
 * Tests for the sync status component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SyncStatus } from "../SyncStatus";

describe("SyncStatus", () => {
  it("renders without crashing", () => {
    const { container } = render(<SyncStatus />);
    expect(container).toBeTruthy();
  });
});
