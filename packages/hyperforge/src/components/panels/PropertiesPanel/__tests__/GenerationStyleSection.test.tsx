import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GenerationStyleSection } from "../GenerationStyleSection";
import type { AssetData } from "@/types/asset";

const mockAsset: AssetData = {
  id: "test-asset",
  name: "Test Asset",
  category: "weapon",
  source: "LOCAL",
  hasVRM: false,
  hasHandRigging: false,
  rarity: "common",
  status: "draft",
};

describe("GenerationStyleSection", () => {
  it("renders without crashing", () => {
    render(
      <GenerationStyleSection
        asset={mockAsset}
        materialPresets={[]}
        gameStyles={{}}
        isLoading={false}
      />,
    );
  });

  it("returns null when no style info and not loading", () => {
    const { container } = render(
      <GenerationStyleSection
        asset={mockAsset}
        materialPresets={[]}
        gameStyles={{}}
        isLoading={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <GenerationStyleSection
        asset={mockAsset}
        materialPresets={[]}
        gameStyles={{}}
        isLoading={true}
      />,
    );
    expect(screen.getByText("Loading style info...")).toBeTruthy();
  });

  it("displays game style when present", () => {
    const assetWithStyle: AssetData = {
      ...mockAsset,
      generationParams: { gameStyle: "runescape" },
    } as AssetData;
    
    render(
      <GenerationStyleSection
        asset={assetWithStyle}
        materialPresets={[]}
        gameStyles={{
          runescape: {
            id: "runescape",
            name: "RuneScape",
            base: "Classic MMORPG style",
          },
        }}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Generation Style")).toBeTruthy();
    expect(screen.getByText("RuneScape")).toBeTruthy();
  });

  it("displays material when present", () => {
    const assetWithMaterial: AssetData = {
      ...mockAsset,
      generationParams: { materialPresetId: "bronze" },
    } as AssetData;
    
    render(
      <GenerationStyleSection
        asset={assetWithMaterial}
        materialPresets={[
          {
            id: "bronze",
            name: "bronze",
            displayName: "Bronze",
            category: "metal",
            tier: 1,
            color: "#cd7f32",
            stylePrompt: "bronze material",
          },
        ]}
        gameStyles={{}}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Material Used")).toBeTruthy();
    expect(screen.getByText("Bronze")).toBeTruthy();
  });
});
