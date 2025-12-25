/**
 * Settings API Router
 * 
 * Handles user preferences and application settings
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  saveModelPreferences,
  loadModelPreferences,
  isSupabaseConfigured,
  type StoredModelPreferences,
} from "@/lib/storage/supabase-storage";
import type { StatusResponse, AIModel, ModelsByCapability } from "@/lib/api/schemas";
import {
  createGetRoute,
  createPostRoute,
  parseQuery,
  getQueryParam,
} from "./base";
import {
  ValidationError,
  StorageError,
  PreferencesQuerySchema,
  PreferencesUpdateSchema,
} from "@/lib/api";
import type { ValidatedHandler } from "./types";

/**
 * Load user preferences
 */
export async function loadPreferences(
  request: NextRequest,
): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: false,
      error: "Supabase is not configured",
      preferences: null,
    });
  }

  const query = parseQuery(request);
  const rawType = getQueryParam(query, "type");
  const rawUserId = getQueryParam(query, "userId") || "default";

  const parseResult = PreferencesQuerySchema.safeParse({
    type: rawType,
    userId: rawUserId,
  });

  if (!parseResult.success) {
    throw new ValidationError("Invalid preference type", {
      validationDetails: parseResult.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const { type, userId } = parseResult.data;

  if (type === "model-preferences") {
    const preferences = await loadModelPreferences(userId);

    return NextResponse.json({
      success: true,
      preferences,
      userId,
    });
  }

  throw new ValidationError(`Unsupported preference type: ${type}`);
}

/**
 * Save user preferences
 */
export async function savePreferences(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof PreferencesUpdateSchema.parse>,
): Promise<NextResponse> {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      success: false,
      error: "Supabase is not configured",
    });
  }

  const { type, userId, data } = body;

  if (type === "model-preferences") {
    const preferences = data as StoredModelPreferences;
    const result = await saveModelPreferences(userId, preferences);

    if (!result.success) {
      throw new StorageError(result.error || "Failed to save preferences", {
        storageType: "supabase",
        operation: "write",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Preferences saved",
      userId,
    });
  }

  throw new ValidationError(`Unsupported preference type: ${type}`);
}

/**
 * Get API status
 */
export async function getStatus(): Promise<NextResponse> {

  const aiGatewayKey =
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

  const status: StatusResponse = {
    meshy: {
      configured: !!process.env.MESHY_API_KEY,
      keyPrefix: process.env.MESHY_API_KEY
        ? `${process.env.MESHY_API_KEY.substring(0, 8)}...`
        : null,
    },
    openai: {
      configured: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY
        ? `${process.env.OPENAI_API_KEY.substring(0, 8)}...`
        : null,
    },
    elevenlabs: {
      configured: !!process.env.ELEVENLABS_API_KEY,
      keyPrefix: process.env.ELEVENLABS_API_KEY
        ? `${process.env.ELEVENLABS_API_KEY.substring(0, 8)}...`
        : null,
    },
    supabase: {
      configured: !!(
        process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
      ),
      url: process.env.SUPABASE_URL
        ? process.env.SUPABASE_URL.replace(/^https?:\/\//, "").split(".")[0] +
          "..."
        : null,
    },
    aiGateway: {
      configured: !!aiGatewayKey,
      keyPrefix: aiGatewayKey ? `${aiGatewayKey.substring(0, 8)}...` : null,
    },
  };

  return NextResponse.json(status);
}

/**
 * Get ElevenLabs subscription info
 */
export async function getElevenLabsStatus(): Promise<NextResponse> {
  const { NetworkError } = await import("@/lib/api");

  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      error: "ELEVENLABS_API_KEY environment variable is not set",
    });
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/user/subscription",
    {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new NetworkError(
      `Failed to fetch subscription: ${response.status} ${response.statusText}`,
      {
        statusCode: response.status,
        endpoint: "https://api.elevenlabs.io/v1/user/subscription",
        context: { details: errorData },
      }
    );
  }

  const data = await response.json();
  const usagePercent =
    data.character_limit > 0
      ? Math.round((data.character_count / data.character_limit) * 100)
      : 0;
  const resetDate = data.next_character_count_reset_unix
    ? new Date(data.next_character_count_reset_unix * 1000).toLocaleDateString()
    : null;

  return NextResponse.json({
    configured: true,
    tier: data.tier,
    status: data.status,
    characterCount: data.character_count,
    characterLimit: data.character_limit,
    usagePercent,
    voiceLimit: data.voice_limit,
    voicesUsed: data.voice_add_edit_counter,
    canExtendLimit: data.can_extend_character_limit,
    currency: data.currency,
    billingPeriod: data.billing_period,
    resetDate,
    features: {
      instantVoiceCloning: data.can_use_instant_voice_cloning,
      professionalVoiceCloning: data.can_use_professional_voice_cloning,
    },
  });
}

/**
 * Get Meshy balance
 */
export async function getBalance(): Promise<NextResponse> {
  const { NetworkError } = await import("@/lib/api");

  const apiKey = process.env.MESHY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      error: "MESHY_API_KEY environment variable is not set",
    });
  }

  const response = await fetch("https://api.meshy.ai/openapi/v1/balance", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new NetworkError(
      `Failed to fetch balance: ${response.status} ${response.statusText}`,
      {
        statusCode: response.status,
        endpoint: "https://api.meshy.ai/openapi/v1/balance",
        context: { details: errorData },
      }
    );
  }

  const data = await response.json();

  return NextResponse.json({
    configured: true,
    balance: data.balance,
  });
}

/**
 * Get AI Gateway credits
 */
export async function getAIGatewayCredits(): Promise<NextResponse> {
  const { NetworkError, ValidationError } = await import("@/lib/api");

  const apiKey =
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      error:
        "AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN environment variable is not set",
    });
  }

  const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new NetworkError(
      `Failed to fetch credits: ${response.status} ${response.statusText}`,
      {
        statusCode: response.status,
        endpoint: "https://ai-gateway.vercel.sh/v1/credits",
        context: { details: errorData },
      }
    );
  }

  const data = await response.json();

  if (typeof data.balance === "undefined" || typeof data.total_used === "undefined") {
    throw new ValidationError("Invalid response from AI Gateway", {
      context: { receivedFields: Object.keys(data) },
    });
  }

  return NextResponse.json({
    configured: true,
    balance: parseFloat(data.balance),
    totalUsed: parseFloat(data.total_used),
  });
}

/**
 * Get AI Gateway models
 */
export async function getAIGatewayModels(): Promise<NextResponse> {
  const { NetworkError } = await import("@/lib/api");

  const apiKey =
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      error: "AI_GATEWAY_API_KEY environment variable is not set",
      models: null,
    });
  }

  const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new NetworkError(
      `Failed to fetch models: ${response.status} ${response.statusText}`,
      {
        statusCode: response.status,
        endpoint: "https://ai-gateway.vercel.sh/v1/models",
        context: { details: errorData },
      }
    );
  }

  const data = await response.json();
  const rawModels = Array.isArray(data) ? data : data.data || data.models || [];

  function inferCapabilities(model: { id: string }): string[] {
    const caps: string[] = [];
    const id = model.id.toLowerCase();
    if (id.includes("embed")) {
      caps.push("embedding");
      return caps;
    }
    if (id.includes("whisper") || id.includes("tts")) {
      caps.push("audio");
      return caps;
    }
    if (id.includes("dall-e") || id.includes("imagen") || id.includes("flash-image")) {
      caps.push("image");
      return caps;
    }
    caps.push("text");
    if (id.includes("vision") || id.includes("-4o") || id.includes("claude-3")) {
      caps.push("vision");
    }
    if (id.includes("code") || id.includes("claude") || id.includes("gpt-4")) {
      caps.push("code");
    }
    if (id.includes("o1") || id.includes("o3") || id.includes("claude-sonnet-4")) {
      caps.push("reasoning");
    }
    return caps;
  }

  function extractProvider(modelId: string): string {
    const parts = modelId.split("/");
    return parts.length > 1 ? parts[0] : "unknown";
  }

  function generateDisplayName(modelId: string): string {
    const parts = modelId.split("/");
    const modelName = parts.length > 1 ? parts[1] : modelId;
    return modelName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  const models: AIModel[] = rawModels.map((raw: { id: string; context_length?: number; max_output_tokens?: number; input_cost_per_token?: number; output_cost_per_token?: number }) => ({
    id: raw.id,
    provider: extractProvider(raw.id),
    name: generateDisplayName(raw.id),
    capabilities: inferCapabilities(raw),
    contextLength: raw.context_length,
    maxOutputTokens: raw.max_output_tokens,
    costPer1kInput: raw.input_cost_per_token ? raw.input_cost_per_token * 1000 : undefined,
    costPer1kOutput: raw.output_cost_per_token ? raw.output_cost_per_token * 1000 : undefined,
  }));

  const modelsByCapability: ModelsByCapability = {
    text: models.filter((m) => m.capabilities.includes("text")),
    image: models.filter((m) => m.capabilities.includes("image")),
    vision: models.filter((m) => m.capabilities.includes("vision")),
    code: models.filter((m) => m.capabilities.includes("code")),
    embedding: models.filter((m) => m.capabilities.includes("embedding")),
    all: models,
  };

  for (const key of Object.keys(modelsByCapability) as Array<keyof ModelsByCapability>) {
    modelsByCapability[key].sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.name.localeCompare(b.name);
    });
  }

  return NextResponse.json({
    configured: true,
    models: modelsByCapability,
    totalCount: models.length,
    counts: {
      text: modelsByCapability.text.length,
      image: modelsByCapability.image.length,
      vision: modelsByCapability.vision.length,
      code: modelsByCapability.code.length,
      embedding: modelsByCapability.embedding.length,
    },
  });
}

/**
 * Settings API routes
 */
export const settingsRoutes = {
  GET: {
    preferences: createGetRoute(loadPreferences),
    status: createGetRoute(getStatus),
    elevenlabs: createGetRoute(getElevenLabsStatus),
    balance: createGetRoute(getBalance),
    aiGateway: createGetRoute(getAIGatewayCredits),
    aiGatewayModels: createGetRoute(getAIGatewayModels),
  },
  POST: {
    preferences: createPostRoute(
      PreferencesUpdateSchema as z.ZodType<ReturnType<typeof PreferencesUpdateSchema.parse>, z.ZodTypeDef, unknown>,
      savePreferences as ValidatedHandler<
        ReturnType<typeof PreferencesUpdateSchema.parse>
      >,
    ),
  },
};
