/**
 * Meshy Schemas Tests
 *
 * Tests for Meshy API schemas.
 * Uses real implementations - NO MOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  MeshyTaskStatusSchema,
  MeshyTaskCreationResponseSchema,
  MeshyTaskResponseSchema,
  parseMeshyTaskCreation,
  parseMeshyTaskStatus,
} from "../meshy";

describe("MeshySchemas", () => {
  it("validates task status", () => {
    const result = MeshyTaskStatusSchema.safeParse("SUCCEEDED");
    expect(result.success).toBe(true);
  });

  it("validates task creation response with result field", () => {
    const result = MeshyTaskCreationResponseSchema.safeParse({
      result: "task-123",
    });
    expect(result.success).toBe(true);
  });

  it("validates task creation response with task_id field", () => {
    const result = MeshyTaskCreationResponseSchema.safeParse({
      task_id: "task-123",
    });
    expect(result.success).toBe(true);
  });

  it("validates task creation response with id field", () => {
    const result = MeshyTaskCreationResponseSchema.safeParse({
      id: "task-123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects task creation response without any ID field", () => {
    const result = MeshyTaskCreationResponseSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("validates task response", () => {
    const result = MeshyTaskResponseSchema.safeParse({
      id: "task-123",
      status: "SUCCEEDED",
      model_urls: {
        glb: "https://example.com/model.glb",
      },
    });
    expect(result.success).toBe(true);
  });

  it("parses task creation response", () => {
    const taskId = parseMeshyTaskCreation({ result: "task-123" });
    expect(taskId).toBe("task-123");
  });

  it("parses task status", () => {
    const task = parseMeshyTaskStatus({
      id: "task-123",
      status: "SUCCEEDED",
    });
    expect(task.id).toBe("task-123");
    expect(task.status).toBe("SUCCEEDED");
  });
});
