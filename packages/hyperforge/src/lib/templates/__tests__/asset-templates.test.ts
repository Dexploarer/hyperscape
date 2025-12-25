/**
 * Asset Templates Tests
 *
 * Tests for asset template system.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  MATERIAL_TIERS,
  WEAPON_TEMPLATES,
  ARMOR_TEMPLATES,
  MOB_TEMPLATES,
  createItemFromTemplate,
  createMobFromTemplate,
} from "../asset-templates";

describe("AssetTemplates", () => {
  it("exports material tiers", () => {
    expect(MATERIAL_TIERS).toBeDefined();
    expect(MATERIAL_TIERS.bronze).toBeDefined();
    expect(MATERIAL_TIERS.iron).toBeDefined();
  });

  it("exports weapon templates", () => {
    expect(WEAPON_TEMPLATES).toBeDefined();
    expect(Object.keys(WEAPON_TEMPLATES).length).toBeGreaterThan(0);
  });

  it("exports armor templates", () => {
    expect(ARMOR_TEMPLATES).toBeDefined();
    expect(Object.keys(ARMOR_TEMPLATES).length).toBeGreaterThan(0);
  });

  it("creates item from template", () => {
    const template = WEAPON_TEMPLATES.sword;
    const material = MATERIAL_TIERS.bronze;

    const item = createItemFromTemplate(template, material.id);

    expect(item).toBeDefined();
    expect(item.id).toBeDefined();
    expect(item.name).toBeDefined();
  });

  it("creates mob from template", () => {
    const template = MOB_TEMPLATES.goblin;

    const mob = createMobFromTemplate(template, "weak");

    expect(mob).toBeDefined();
    expect(mob.id).toBe("goblin");
    expect(mob.name).toBe("Goblin");
  });
});
