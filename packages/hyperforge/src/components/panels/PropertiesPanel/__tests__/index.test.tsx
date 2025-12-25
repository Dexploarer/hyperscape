import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertiesPanel } from "../index";
import type { AssetData } from "@/types/asset";

// Mock dependencies
vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/lib/cdn/url-resolver", () => ({
  getCDNBaseUrl: () => "https://cdn.example.com",
}));

const mockAsset: AssetData = {
  id: "test-asset",
  name: "Test Asset",
  source: "LOCAL",
  category: "weapon",
  status: "draft",
};

describe("PropertiesPanel", () => {
  it("renders without crashing", () => {
    render(
      <PropertiesPanel
        asset={mockAsset}
        isOpen
        onClose={vi.fn()}
        onAssetDeleted={vi.fn()}
        onAssetDuplicated={vi.fn()}
      />,
    );
    expect(screen.getByText("Test Asset")).toBeTruthy();
  });

  it("does not render when closed", () => {
    const { container } = render(
      <PropertiesPanel
        asset={mockAsset}
        isOpen={false}
        onClose={vi.fn()}
        onAssetDeleted={vi.fn()}
        onAssetDuplicated={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
