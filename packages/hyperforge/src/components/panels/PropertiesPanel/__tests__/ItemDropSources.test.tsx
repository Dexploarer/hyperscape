import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ItemDropSources } from "../ItemDropSources";
import type { DropSource } from "../types";

describe("ItemDropSources", () => {
  it("returns null when dropSources is empty", () => {
    const { container } = render(<ItemDropSources dropSources={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders drop sources", () => {
    const dropSources: DropSource[] = [
      {
        npcId: "goblin_001",
        npcName: "Goblin",
        npcLevel: 5,
        minQuantity: 1,
        maxQuantity: 1,
        chance: 0.5,
        dropRarity: "common",
      },
    ];
    
    render(<ItemDropSources dropSources={dropSources} />);
    expect(screen.getByText("Dropped By")).toBeTruthy();
    expect(screen.getByText("Goblin")).toBeTruthy();
  });

  it("displays quantity range correctly", () => {
    const dropSources: DropSource[] = [
      {
        npcId: "goblin_001",
        npcName: "Goblin",
        npcLevel: 5,
        minQuantity: 1,
        maxQuantity: 5,
        chance: 0.5,
        dropRarity: "common",
      },
    ];
    
    render(<ItemDropSources dropSources={dropSources} />);
    expect(screen.getByText("×1-5")).toBeTruthy();
  });

  it("displays single quantity correctly", () => {
    const dropSources: DropSource[] = [
      {
        npcId: "goblin_001",
        npcName: "Goblin",
        npcLevel: 5,
        minQuantity: 1,
        maxQuantity: 1,
        chance: 0.5,
        dropRarity: "common",
      },
    ];
    
    render(<ItemDropSources dropSources={dropSources} />);
    expect(screen.getByText("×1")).toBeTruthy();
  });

  it("displays chance percentage correctly", () => {
    const dropSources: DropSource[] = [
      {
        npcId: "goblin_001",
        npcName: "Goblin",
        npcLevel: 5,
        minQuantity: 1,
        maxQuantity: 1,
        chance: 0.5,
        dropRarity: "common",
      },
    ];
    
    render(<ItemDropSources dropSources={dropSources} />);
    expect(screen.getByText("50%")).toBeTruthy();
  });

  it("displays 'Always' for 100% chance", () => {
    const dropSources: DropSource[] = [
      {
        npcId: "goblin_001",
        npcName: "Goblin",
        npcLevel: 5,
        minQuantity: 1,
        maxQuantity: 1,
        chance: 1,
        dropRarity: "always",
      },
    ];
    
    render(<ItemDropSources dropSources={dropSources} />);
    expect(screen.getByText("Always")).toBeTruthy();
  });
});
