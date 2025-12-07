/**
 * AI Gateway Service
 * Centralized service for Vercel AI Gateway interactions
 * Provides unified access to multiple AI providers (OpenAI, Anthropic, Google, xAI, etc.)
 */

import { createGateway, gateway } from "@ai-sdk/gateway";
import {
  generateText,
  experimental_generateImage as generateImage,
  type CoreMessage,
} from "ai";

// ==================== Types ====================

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
  modelType: "language" | "embedding" | "image";
  pricing?: {
    input: number;
    output: number;
  };
}

export interface TextGenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  messages?: CoreMessage[];
}

export interface ImageGenerationOptions {
  model?: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
  n?: number;
}

export interface VisionAnalysisOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TextGenerationResult {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ImageGenerationResult {
  images: Array<{
    base64?: string;
    url?: string;
    mediaType?: string;
  }>;
}

export interface VisionAnalysisResult {
  text: string;
  parsed?: Record<string, unknown>;
}

// ==================== Model Presets ====================

export const MODEL_PRESETS = {
  // Text models - Fast (low latency, lower cost)
  textFast: [
    "openai/gpt-4o-mini",
    "google/gemini-2.5-flash",
    "anthropic/claude-3.5-sonnet",
  ],
  // Text models - Quality (higher quality, higher cost)
  textQuality: [
    "openai/gpt-4o",
    "anthropic/claude-sonnet-4",
    "xai/grok-4",
    "google/gemini-3-pro",
  ],
  // Image models - Multimodal LLMs
  imageMultimodal: [
    "google/gemini-2.5-flash-image",
    "google/gemini-3-pro-image",
  ],
  // Image models - Dedicated
  imageDedicated: [
    "bfl/flux-2-pro",
    "google/imagen-4.0-ultra-generate-001",
    "google/imagen-4.0-generate-001",
  ],
  // Vision models (for image analysis)
  vision: ["openai/gpt-4o-mini", "openai/gpt-4o", "google/gemini-2.5-flash"],
} as const;

export const DEFAULT_MODELS = {
  text: "openai/gpt-4o",
  textFast: "openai/gpt-4o-mini",
  image: "google/gemini-2.5-flash-image",
  imageDedicated: "bfl/flux-2-pro",
  vision: "openai/gpt-4o-mini",
} as const;

// ==================== Service Configuration ====================

interface AIGatewayServiceConfig {
  apiKey?: string;
  baseURL?: string;
  defaultTextModel?: string;
  defaultImageModel?: string;
  defaultVisionModel?: string;
}

// ==================== Main Service Class ====================

export class AIGatewayService {
  private gatewayClient: ReturnType<typeof createGateway>;
  private config: AIGatewayServiceConfig;

  constructor(config: AIGatewayServiceConfig = {}) {
    const apiKey = config.apiKey || process.env.AI_GATEWAY_API_KEY;

    if (!apiKey) {
      throw new Error("AI_GATEWAY_API_KEY is required for AIGatewayService");
    }

    this.config = {
      defaultTextModel: config.defaultTextModel || DEFAULT_MODELS.text,
      defaultImageModel: config.defaultImageModel || DEFAULT_MODELS.image,
      defaultVisionModel: config.defaultVisionModel || DEFAULT_MODELS.vision,
      ...config,
    };

    this.gatewayClient = createGateway({
      apiKey,
      baseURL: config.baseURL || "https://ai-gateway.vercel.sh/v1/ai",
    });

    console.log("[AIGatewayService] Initialized with Vercel AI Gateway");
  }

  // ==================== Model Discovery ====================

  /**
   * Get all available models from the AI Gateway
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const result = await gateway.getAvailableModels();
      return result.models.map((m) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description ?? undefined,
        modelType: m.modelType as "language" | "embedding" | "image",
        pricing: m.pricing
          ? {
              input: Number(m.pricing.input),
              output: Number(m.pricing.output),
            }
          : undefined,
      }));
    } catch (error) {
      console.error(
        "[AIGatewayService] Failed to fetch available models:",
        error,
      );
      // Return preset models as fallback
      return [
        ...MODEL_PRESETS.textFast.map((id) => ({
          id,
          name: id.split("/")[1],
          modelType: "language" as const,
        })),
        ...MODEL_PRESETS.textQuality.map((id) => ({
          id,
          name: id.split("/")[1],
          modelType: "language" as const,
        })),
        ...MODEL_PRESETS.imageMultimodal.map((id) => ({
          id,
          name: id.split("/")[1],
          modelType: "image" as const,
        })),
      ];
    }
  }

  /**
   * Get models filtered by type
   */
  async getModelsByType(
    type: "language" | "embedding" | "image",
  ): Promise<ModelInfo[]> {
    const models = await this.getAvailableModels();
    return models.filter((m) => m.modelType === type);
  }

  // ==================== Text Generation ====================

  /**
   * Generate text using AI Gateway
   */
  async generateText(
    prompt: string,
    options: TextGenerationOptions = {},
  ): Promise<TextGenerationResult> {
    const model = options.model || this.config.defaultTextModel!;

    console.log(`[AIGatewayService] Generating text with model: ${model}`);

    const result = await generateText({
      model,
      prompt,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    return {
      text: result.text,
      usage: result.usage
        ? {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
    };
  }

  /**
   * Generate text with message history (chat-style)
   */
  async chat(
    messages: CoreMessage[],
    options: TextGenerationOptions = {},
  ): Promise<TextGenerationResult> {
    const model = options.model || this.config.defaultTextModel!;

    console.log(`[AIGatewayService] Chat with model: ${model}`);

    const result = await generateText({
      model,
      messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    return {
      text: result.text,
      usage: result.usage
        ? {
            promptTokens: result.usage.promptTokens,
            completionTokens: result.usage.completionTokens,
            totalTokens: result.usage.totalTokens,
          }
        : undefined,
    };
  }

  // ==================== Image Generation ====================

  /**
   * Generate images using AI Gateway
   * Supports both multimodal LLMs and dedicated image models
   */
  async generateImage(
    prompt: string,
    options: ImageGenerationOptions = {},
  ): Promise<ImageGenerationResult> {
    const model = options.model || this.config.defaultImageModel!;
    const isMultimodal = MODEL_PRESETS.imageMultimodal.includes(model as any);

    console.log(
      `[AIGatewayService] Generating image with ${isMultimodal ? "multimodal" : "dedicated"} model: ${model}`,
    );

    if (isMultimodal) {
      // Use generateText for multimodal models (Nano Banana, etc.)
      const result = await generateText({
        model,
        prompt: `Generate an image: ${prompt}`,
      });

      // Extract images from result.files
      const imageFiles =
        result.files?.filter((f) => f.mediaType?.startsWith("image/")) || [];

      return {
        images: imageFiles.map((f) => ({
          base64: f.base64,
          mediaType: f.mediaType,
        })),
      };
    } else {
      // Use experimental_generateImage for dedicated image models
      const result = await generateImage({
        model,
        prompt,
        n: options.n || 1,
        aspectRatio: options.aspectRatio || "1:1",
      });

      return {
        images: result.images.map((img) => ({
          base64: img.base64,
          mediaType: img.mediaType,
        })),
      };
    }
  }

  // ==================== Vision Analysis ====================

  /**
   * Analyze an image using vision-capable models
   */
  async analyzeImage(
    imageData: string, // base64 or URL
    prompt: string,
    options: VisionAnalysisOptions = {},
  ): Promise<VisionAnalysisResult> {
    const model = options.model || this.config.defaultVisionModel!;

    console.log(`[AIGatewayService] Analyzing image with model: ${model}`);

    // Determine if it's a URL or base64
    const isUrl = imageData.startsWith("http");
    const isDataUrl = imageData.startsWith("data:");

    const imageContent = isUrl
      ? { type: "image" as const, image: new URL(imageData) }
      : isDataUrl
        ? { type: "image" as const, image: imageData }
        : {
            type: "image" as const,
            image: `data:image/png;base64,${imageData}`,
          };

    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [imageContent, { type: "text", text: prompt }],
        },
      ],
      temperature: options.temperature || 0.3,
      maxTokens: options.maxTokens || 500,
    });

    // Try to parse JSON from response
    let parsed: Record<string, unknown> | undefined;
    try {
      // Extract JSON from response
      let jsonStr = result.text.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      // Not JSON, that's fine
    }

    return {
      text: result.text,
      parsed,
    };
  }

  // ==================== Quality Presets ====================

  /**
   * Get model for a quality level
   */
  getModelForQuality(
    type: "text" | "image",
    quality: "fast" | "balanced" | "quality",
  ): string {
    if (type === "text") {
      switch (quality) {
        case "fast":
          return MODEL_PRESETS.textFast[0];
        case "quality":
          return MODEL_PRESETS.textQuality[0];
        default:
          return MODEL_PRESETS.textQuality[0];
      }
    } else {
      switch (quality) {
        case "fast":
          return MODEL_PRESETS.imageMultimodal[0];
        case "quality":
          return MODEL_PRESETS.imageDedicated[0];
        default:
          return MODEL_PRESETS.imageMultimodal[0];
      }
    }
  }
}

// ==================== Singleton Instance ====================

let instance: AIGatewayService | null = null;

export function getAIGatewayService(
  config?: AIGatewayServiceConfig,
): AIGatewayService {
  if (!instance) {
    instance = new AIGatewayService(config);
  }
  return instance;
}

// Allow creating fresh instances (useful for user-provided API keys)
export function createAIGatewayService(
  config: AIGatewayServiceConfig,
): AIGatewayService {
  return new AIGatewayService(config);
}
