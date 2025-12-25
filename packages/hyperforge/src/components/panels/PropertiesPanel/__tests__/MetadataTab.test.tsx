import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetadataTab } from "../MetadataTab";
import type { AssetData } from "@/types/asset";

describe("MetadataTab", () => {
  it("renders CDN asset metadata", () => {
    const cdnAsset: AssetData = {
      id: "cdn-asset",
      name: "CDN Asset",
      category: "weapon",
      source: "CDN",
      modelPath: "models/test.glb",
      hasVRM: true,
      hasHandRigging: false,
      rarity: "common",
    };
    
    render(<MetadataTab asset={cdnAsset} />);
    expect(screen.getByText("IS BASE MODEL")).toBeTruthy();
    expect(screen.getByText("IS VARIANT")).toBeTruthy();
    expect(screen.getByText("HAS VRM")).toBeTruthy();
  });

  it("renders LOCAL asset metadata", () => {
    const localAsset: AssetData = {
      id: "local-asset",
      name: "Local Asset",
      category: "weapon",
      source: "LOCAL",
      hasVRM: false,
      hasHandRigging: false,
      rarity: "common",
      status: "draft",
      createdAt: "2024-01-01T00:00:00Z",
    };
    
    render(<MetadataTab asset={localAsset} />);
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText("Created")).toBeTruthy();
  });

  it("displays VRM status correctly", () => {
    const assetWithVRM: AssetData = {
      id: "test",
      name: "Test",
      category: "weapon",
      source: "CDN",
      modelPath: "models/test.glb",
      hasVRM: true,
      hasHandRigging: false,
      rarity: "common",
    };
    
    render(<MetadataTab asset={assetWithVRM} />);
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("displays hand rigging status correctly", () => {
    const assetWithHandRigging: AssetData = {
      id: "test",
      name: "Test",
      category: "weapon",
      source: "CDN",
      modelPath: "models/test.glb",
      hasVRM: false,
      hasHandRigging: true,
      rarity: "common",
    };
    
    render(<MetadataTab asset={assetWithHandRigging} />);
    const handRiggingRow = screen.getByText("HAND RIGGING").closest("div");
    expect(handRiggingRow?.textContent).toContain("Yes");
  });
});
