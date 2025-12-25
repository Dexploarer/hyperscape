/**
 * AssetListItem Component Tests
 *
 * Tests for the asset list item component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AssetListItem } from "../AssetListItem";
import type { LibraryAsset } from "@/hooks/useCDNAssets";

describe("AssetListItem", () => {
  it("renders without crashing", () => {
    const asset: LibraryAsset = {
      id: "test-asset",
      name: "Test Asset",
      category: "weapon",
      source: "LOCAL",
    };

    render(<AssetListItem asset={asset} />);
    expect(document.body).toBeTruthy();
  });
});
