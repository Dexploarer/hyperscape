/**
 * AssetUploadModal Component Tests
 *
 * Tests for the asset upload modal component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { AssetUploadModal } from "../AssetUploadModal";

describe("AssetUploadModal", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <AssetUploadModal
        isOpen={true}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeTruthy();
  });
});
