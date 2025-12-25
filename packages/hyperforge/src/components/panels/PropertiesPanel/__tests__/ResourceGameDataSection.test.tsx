import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResourceGameDataSection } from "../ResourceGameDataSection";
import type { ResourceGameData, ItemGameData } from "../types";

describe("ResourceGameDataSection", () => {
  it("returns null when resourceData is null and not loading", () => {
    const { container } = render(
      <ResourceGameDataSection
        resourceData={null}
        toolData={null}
        isLoading={false}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state", () => {
    render(
      <ResourceGameDataSection
        resourceData={null}
        toolData={null}
        isLoading={true}
      />,
    );
    expect(screen.getByText("Loading game data...")).toBeTruthy();
  });

  it("displays harvesting requirements", () => {
    const resourceData: ResourceGameData = {
      id: "test-resource",
      name: "Test Resource",
      type: "ore",
      levelRequired: 10,
      harvestSkill: "mining",
      toolRequired: "bronze_pickaxe",
      baseCycleTicks: 100,
      depleteChance: 0.1,
      respawnTicks: 1000,
      harvestYield: [],
    };
    
    render(
      <ResourceGameDataSection
        resourceData={resourceData}
        toolData={null}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Harvesting Requirements")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy(); // Level
  });

  it("displays tool name from toolData when available", () => {
    const resourceData: ResourceGameData = {
      id: "test-resource",
      name: "Test Resource",
      type: "ore",
      levelRequired: 10,
      harvestSkill: "mining",
      toolRequired: "bronze_pickaxe",
      baseCycleTicks: 100,
      depleteChance: 0.1,
      respawnTicks: 1000,
      harvestYield: [],
    };
    
    const toolData: ItemGameData = {
      id: "bronze_pickaxe",
      name: "Bronze Pickaxe",
      type: "tool",
    };
    
    render(
      <ResourceGameDataSection
        resourceData={resourceData}
        toolData={toolData}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Bronze Pickaxe")).toBeTruthy();
  });

  it("displays harvest yields", () => {
    const resourceData: ResourceGameData = {
      id: "test-resource",
      name: "Test Resource",
      type: "ore",
      levelRequired: 10,
      harvestSkill: "mining",
      toolRequired: "bronze_pickaxe",
      baseCycleTicks: 100,
      depleteChance: 0.1,
      respawnTicks: 1000,
      harvestYield: [
        {
          itemId: "copper_ore",
          itemName: "Copper Ore",
          quantity: 1,
          chance: 1,
          xpAmount: 10,
        },
      ],
    };
    
    render(
      <ResourceGameDataSection
        resourceData={resourceData}
        toolData={null}
        isLoading={false}
      />,
    );
    expect(screen.getByText("Harvest Yields")).toBeTruthy();
  });
});
