import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActionsTab } from "../ActionsTab";
import type { AssetData } from "@/types/asset";
import type { SyncStatus, SpawnLocationId } from "../types";

const mockAsset: AssetData = {
  id: "test-asset",
  name: "Test Asset",
  source: "LOCAL",
  category: "weapon",
  status: "draft",
  hasVRM: false,
  hasHandRigging: false,
  rarity: "common",
};

describe("ActionsTab", () => {
  const defaultProps = {
    asset: mockAsset,
    isDownloading: false,
    onDownload: vi.fn(),
    isExporting: false,
    onExport: vi.fn(),
    isTestingInGame: false,
    onTestInGame: vi.fn(),
    selectedSpawnLocation: "town_center" as SpawnLocationId,
    onSpawnLocationChange: vi.fn(),
    showSpawnPicker: false,
    onShowSpawnPickerChange: vi.fn(),
    syncStatus: "draft" as SyncStatus,
    isAddingToWorld: false,
    onAddToWorld: vi.fn(),
    isDuplicating: false,
    onDuplicate: vi.fn(),
    isDeleting: false,
    showDeleteConfirm: false,
    onDelete: vi.fn(),
    onCancelDelete: vi.fn(),
  };

  it("renders without crashing", () => {
    render(<ActionsTab {...defaultProps} />);
    expect(screen.getByText("Download Model")).toBeTruthy();
  });

  it("calls onDownload when download button is clicked", () => {
    const onDownload = vi.fn();
    render(<ActionsTab {...defaultProps} onDownload={onDownload} />);
    
    fireEvent.click(screen.getByText("Download Model"));
    expect(onDownload).toHaveBeenCalled();
  });

  it("calls onExport when export button is clicked", () => {
    const onExport = vi.fn();
    render(<ActionsTab {...defaultProps} onExport={onExport} />);
    
    fireEvent.click(screen.getByText("Export to Game"));
    expect(onExport).toHaveBeenCalled();
  });

  it("shows loading state when downloading", () => {
    render(<ActionsTab {...defaultProps} isDownloading={true} />);
    expect(screen.getByText("Downloading...")).toBeTruthy();
  });

  it("shows delete confirmation when showDeleteConfirm is true", () => {
    render(<ActionsTab {...defaultProps} showDeleteConfirm={true} />);
    expect(screen.getByText("Confirm Delete")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("calls onCancelDelete when cancel is clicked", () => {
    const onCancelDelete = vi.fn();
    render(
      <ActionsTab
        {...defaultProps}
        showDeleteConfirm={true}
        onCancelDelete={onCancelDelete}
      />,
    );
    
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancelDelete).toHaveBeenCalled();
  });

  it("shows spawn location picker when showSpawnPicker is true", () => {
    render(<ActionsTab {...defaultProps} showSpawnPicker={true} />);
    // Spawn location options should be visible
    expect(screen.getByText("Test in Game")).toBeTruthy();
  });

  it("shows VRM test button when asset has VRM", () => {
    render(
      <ActionsTab
        {...defaultProps}
        asset={{ ...mockAsset, hasVRM: true }}
      />,
    );
    expect(screen.getByText("Test Animations (VRM)")).toBeTruthy();
  });
});
