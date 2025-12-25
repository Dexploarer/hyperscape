/**
 * DialogueTreeEditor Component Tests
 *
 * Tests for the dialogue tree editor component.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DialogueTreeEditor } from "../DialogueTreeEditor";

describe("DialogueTreeEditor", () => {
  it("renders without crashing", () => {
    render(
      <DialogueTreeEditor
        npcName="Test NPC"
        npcId="test-npc"
        onSave={() => {}}
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
