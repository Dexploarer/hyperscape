/**
 * PropertiesPanel Component Tests
 *
 * Tests for the properties panel component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertiesPanel } from "../PropertiesPanel";
import type { AssetData } from "@/types/asset";

// Mock toast
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock CDN resolver
vi.mock("@/lib/cdn/url-resolver", () => ({
  getCDNBaseUrl: () => "https://cdn.example.com",
}));

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

describe("PropertiesPanel", () => {
  const defaultProps = {
    asset: mockAsset,
    isOpen: true,
    onClose: vi.fn(),
    onAssetDeleted: vi.fn(),
    onAssetDuplicated: vi.fn(),
  };

  it("renders without crashing", () => {
    render(<PropertiesPanel {...defaultProps} />);
    expect(screen.getByText("Test Asset")).toBeTruthy();
  });

  it("does not render when isOpen is false", () => {
    render(<PropertiesPanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByText("Test Asset")).toBeNull();
  });

  it("displays asset header", () => {
    render(<PropertiesPanel {...defaultProps} />);
    expect(screen.getByText("Test Asset")).toBeTruthy();
  });

  it("shows tabs for different views", () => {
    render(<PropertiesPanel {...defaultProps} />);
    expect(screen.getByText("Information")).toBeTruthy();
    expect(screen.getByText("Metadata")).toBeTruthy();
    expect(screen.getByText("Actions")).toBeTruthy();
  });
});
