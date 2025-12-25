import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssetHeader } from "../AssetHeader";
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

describe("AssetHeader", () => {
  it("renders without crashing", () => {
    render(<AssetHeader asset={mockAsset} syncStatus="draft" />);
    expect(screen.getByText("Test Asset")).toBeTruthy();
  });

  it("displays asset name and category", () => {
    render(<AssetHeader asset={mockAsset} syncStatus="draft" />);
    expect(screen.getByText("Test Asset")).toBeTruthy();
    expect(screen.getByText("weapon")).toBeTruthy();
  });

  it("shows draft badge when syncStatus is draft", () => {
    render(<AssetHeader asset={mockAsset} syncStatus="draft" />);
    expect(screen.getByText("Draft")).toBeTruthy();
  });

  it("shows exported badge when syncStatus is exported", () => {
    render(<AssetHeader asset={mockAsset} syncStatus="exported" />);
    expect(screen.getByText("Exported")).toBeTruthy();
  });

  it("shows in game badge when syncStatus is in_game", () => {
    render(<AssetHeader asset={mockAsset} syncStatus="in_game" />);
    expect(screen.getByText("In Game")).toBeTruthy();
  });

  it("shows VRM badge when asset has VRM", () => {
    render(
      <AssetHeader
        asset={{ ...mockAsset, hasVRM: true }}
        syncStatus="draft"
      />,
    );
    expect(screen.getByText("VRM")).toBeTruthy();
  });

  it("shows hand rigging badge when asset has hand rigging", () => {
    render(
      <AssetHeader
        asset={{ ...mockAsset, hasHandRigging: true }}
        syncStatus="draft"
      />,
    );
    expect(screen.getByText("Hand Bones")).toBeTruthy();
  });

  it("shows rarity badge", () => {
    render(<AssetHeader asset={mockAsset} syncStatus="draft" />);
    expect(screen.getByText("common")).toBeTruthy();
  });

  it("shows CDN badge when source is CDN", () => {
    const cdnAsset: AssetData = {
      id: "test-asset",
      name: "Test Asset",
      source: "CDN",
      category: "weapon",
      modelPath: "models/test.glb",
    };
    render(
      <AssetHeader
        asset={cdnAsset}
        syncStatus="draft"
      />,
    );
    expect(screen.getByText("CDN Asset")).toBeTruthy();
  });
});
