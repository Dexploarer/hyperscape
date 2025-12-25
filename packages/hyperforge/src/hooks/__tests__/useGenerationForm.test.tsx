/**
 * useGenerationForm Hook Tests
 *
 * Tests for the unified generation form hook.
 * Uses React Testing Library with real implementations.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useGenerationForm } from "../useGenerationForm";
import { z } from "zod";
import type { GenerationConfig } from "@/components/generation/GenerationFormRouter";

const TestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  count: z.number().int().positive().default(1),
});

type TestFormData = z.infer<typeof TestSchema>;

describe("useGenerationForm", () => {
  describe("form initialization", () => {
    it("initializes with default values", () => {
      const { result } = renderHook(() =>
        useGenerationForm({
          category: "weapon",
          schema: TestSchema,
          defaultValues: { name: "Test Item", count: 5 },
          onGenerate: async () => ({ success: true }),
          onCancel: () => {},
        }),
      );

      expect(result.current.form.getValues("name")).toBe("Test Item");
      expect(result.current.form.getValues("count")).toBe(5);
    });

    it("uses schema defaults when no defaultValues provided", () => {
      const { result } = renderHook(() =>
        useGenerationForm({
          category: "weapon",
          schema: TestSchema,
          onGenerate: async () => ({ success: true }),
          onCancel: () => {},
        }),
      );

      expect(result.current.form.getValues("count")).toBe(1);
    });
  });

  describe("form validation", () => {
    it("validates required fields", async () => {
      const { result } = renderHook(() =>
        useGenerationForm({
          category: "weapon",
          schema: TestSchema,
          onGenerate: async () => ({ success: true }),
          onCancel: () => {},
        }),
      );

      const isValid = await result.current.form.trigger();
      expect(isValid).toBe(false);

      result.current.form.setValue("name", "Valid Name");
      const isValidAfter = await result.current.form.trigger();
      expect(isValidAfter).toBe(true);
    });

    it("validates number constraints", async () => {
      const { result } = renderHook(() =>
        useGenerationForm({
          category: "weapon",
          schema: TestSchema,
          onGenerate: async () => ({ success: true }),
          onCancel: () => {},
        }),
      );

      result.current.form.setValue("name", "Test");
      result.current.form.setValue("count", -1);

      const isValid = await result.current.form.trigger("count");
      expect(isValid).toBe(false);

      result.current.form.setValue("count", 10);
      const isValidAfter = await result.current.form.trigger("count");
      expect(isValidAfter).toBe(true);
    });
  });

  describe("form submission", () => {
    it("calls onSubmit with validated data", async () => {
      const onSubmit = async (data: TestFormData) => {
        expect(data.name).toBe("Test Item");
        expect(data.count).toBe(5);
        return { success: true };
      };

      const { result } = renderHook(() =>
        useGenerationForm({
          category: "weapon",
          schema: TestSchema,
          defaultValues: { name: "Test Item", count: 5 },
          onGenerate: async (config: GenerationConfig) => {
            await onSubmit({ name: config.metadata?.name || "", count: 5 });
          },
          onCancel: () => {},
        }),
      );

      result.current.handlers.handleSubmit();

      await waitFor(() => {
        expect(result.current.form.formState.isSubmitting).toBe(false);
      });
    });

    it("prevents submission with invalid data", async () => {
      const onSubmit = async (_data: TestFormData) => {
        throw new Error("Should not be called");
      };

      const { result } = renderHook(() =>
        useGenerationForm({
          category: "weapon",
          schema: TestSchema,
          onGenerate: async (config: GenerationConfig) => {
            await onSubmit({ name: config.metadata?.name || "", count: 0 });
          },
          onCancel: () => {},
        }),
      );

      // Try to submit without required field
      result.current.handlers.handleSubmit();

      await waitFor(() => {
        expect(result.current.form.formState.isSubmitting).toBe(false);
        expect(result.current.form.formState.errors.name).toBeDefined();
      });
    });
  });

  describe("form state", () => {
    it("tracks dirty state", () => {
      const { result } = renderHook(() =>
        useGenerationForm({
          category: "weapon",
          schema: TestSchema,
          defaultValues: { name: "Original" },
          onGenerate: async () => ({ success: true }),
          onCancel: () => {},
        }),
      );

      expect(result.current.form.formState.isDirty).toBe(false);
      result.current.form.setValue("name", "Modified");
      expect(result.current.form.formState.isDirty).toBe(true);
    });

    it("tracks touched fields", () => {
      const { result } = renderHook(() =>
        useGenerationForm({
          category: "weapon",
          schema: TestSchema,
          onGenerate: async () => ({ success: true }),
          onCancel: () => {},
        }),
      );

      expect(result.current.form.formState.touchedFields.name).toBeUndefined();
      result.current.form.setFocus("name");
      result.current.form.setValue("name", "Test");
      expect(result.current.form.formState.touchedFields.name).toBe(true);
    });
  });
});
