import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NPCGameDataSection } from "../NPCGameDataSection";
import type { NPCGameData } from "../types";

describe("NPCGameDataSection", () => {
  it("returns null when npcData is null", () => {
    const { container } = render(<NPCGameDataSection npcData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders combat stats", () => {
    const npcData: NPCGameData = {
      id: "test-npc",
      name: "Test NPC",
      category: "mob",
      stats: {
        level: 10,
        health: 100,
        attack: 15,
        defense: 12,
        strength: 14,
      },
      combat: {
        attackable: true,
        aggressive: false,
      },
      drops: {},
    };
    
    render(<NPCGameDataSection npcData={npcData} />);
    expect(screen.getByText("Combat Stats")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy(); // Level
    expect(screen.getByText("100")).toBeTruthy(); // Health
  });

  it("shows aggressive badge when npc is aggressive", () => {
    const npcData: NPCGameData = {
      id: "test-npc",
      name: "Test NPC",
      category: "mob",
      stats: {
        level: 10,
        health: 100,
        attack: 15,
        defense: 12,
        strength: 14,
      },
      combat: {
        attackable: true,
        aggressive: true,
      },
      drops: {},
    };
    
    render(<NPCGameDataSection npcData={npcData} />);
    expect(screen.getByText("Aggressive")).toBeTruthy();
  });

  it("displays drop table", () => {
    const npcData: NPCGameData = {
      id: "test-npc",
      name: "Test NPC",
      category: "mob",
      stats: {
        level: 10,
        health: 100,
        attack: 15,
        defense: 12,
        strength: 14,
      },
      combat: {
        attackable: true,
        aggressive: false,
      },
      drops: {
        common: [
          {
            itemId: "gold_coin",
            minQuantity: 1,
            maxQuantity: 5,
            chance: 0.5,
            rarity: "common",
          },
        ],
      },
    };
    
    render(<NPCGameDataSection npcData={npcData} />);
    expect(screen.getByText("Drop Table")).toBeTruthy();
  });
});
