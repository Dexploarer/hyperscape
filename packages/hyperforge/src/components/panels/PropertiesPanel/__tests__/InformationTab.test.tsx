import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InformationTab } from "../InformationTab";
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
  description: "A test weapon",
};

describe("InformationTab", () => {
  const defaultProps = {
    asset: mockAsset,
    meshStats: null,
    isLoadingMeshStats: false,
    materialPresets: [],
    gameStyles: {},
    isLoadingPresets: false,
    resourceData: null,
    npcData: null,
    toolData: null,
    isLoadingGameData: false,
    dropSources: [],
    storeInfo: [],
  };

  it("renders without crashing", () => {
    render(<InformationTab {...defaultProps} />);
    expect(screen.getByText("Test Asset")).toBeTruthy();
  });

  it("displays asset name", () => {
    render(<InformationTab {...defaultProps} />);
    expect(screen.getByText("Test Asset")).toBeTruthy();
  });

  it("displays asset category", () => {
    render(<InformationTab {...defaultProps} />);
    expect(screen.getByText("weapon")).toBeTruthy();
  });

  it("displays asset source", () => {
    render(<InformationTab {...defaultProps} />);
    expect(screen.getByText("LOCAL")).toBeTruthy();
  });

  it("displays description when present", () => {
    render(<InformationTab {...defaultProps} />);
    expect(screen.getByText("A test weapon")).toBeTruthy();
  });

  it("does not display description section when description is missing", () => {
    const assetWithoutDesc = { ...mockAsset, description: undefined };
    render(<InformationTab {...defaultProps} asset={assetWithoutDesc} />);
    expect(screen.queryByText("Description")).toBeNull();
  });
});
