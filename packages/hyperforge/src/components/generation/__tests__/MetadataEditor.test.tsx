/**
 * MetadataEditor Component Tests
 *
 * Tests for the metadata editor component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MetadataEditor } from "../MetadataEditor";

describe("MetadataEditor", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <MetadataEditor
        category="weapon"
        initialMetadata={{
          name: "Test Asset",
          description: "Test Description",
        }}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
