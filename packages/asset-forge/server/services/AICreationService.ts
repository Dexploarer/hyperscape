/**
 * AI Creation Service for Server
 * Provides image generation and Meshy integration with TypeScript
 */

import { getGenerationPrompts } from "../utils/promptLoader";

// Type for fetch function (compatible with both global fetch and node-fetch)
type FetchFunction = typeof fetch;

// ==================== Configuration Interfaces ====================

interface OpenAIConfig {
  apiKey: string;
  model?: string;
  imageServerBaseUrl?: string;
  fetchFn?: FetchFunction;
}

interface MeshyConfig {
  apiKey: string;
  baseUrl?: string;
  fetchFn?: FetchFunction;
}

interface AIServiceConfig {
  openai: OpenAIConfig;
  meshy: MeshyConfig;
  fetchFn?: FetchFunction;
}

// ==================== Image Generation Interfaces ====================

interface ImageMetadata {
  model: string;
  resolution: string;
  quality: string;
  timestamp: string;
}

interface ImageGenerationResult {
  imageUrl: string;
  prompt: string;
  metadata: ImageMetadata;
}

interface OpenAIImageResponse {
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

// ==================== Meshy API Interfaces ====================

interface ImageTo3DOptions {
  enable_pbr?: boolean;
  ai_model?: string;
  topology?: string;
  targetPolycount?: number;
  texture_resolution?: number;
}

interface RetextureInput {
  inputTaskId?: string;
  modelUrl?: string;
}

interface RetextureStyle {
  textStylePrompt?: string;
  imageStyleUrl?: string;
}

interface RetextureOptions {
  artStyle?: string;
  aiModel?: string;
  enableOriginalUV?: boolean;
}

interface RiggingInput {
  inputTaskId?: string;
  modelUrl?: string;
}

interface RiggingOptions {
  heightMeters?: number;
}

interface MeshyTaskResult {
  task_id?: string;
  id?: string;
  status?: string;
  model_url?: string;
  thumbnail_url?: string;
  progress?: number;
  error?: string;
}

interface MeshyTaskResponse {
  task_id?: string;
  id?: string;
  result?: MeshyTaskResult;
}

interface MeshyStatusResult {
  status?: string;
  progress?: number;
  model_url?: string;
  thumbnail_url?: string;
  task_id?: string;
  id?: string;
  error?: string;
}

interface MeshyStatusResponse {
  result?: MeshyStatusResult;
  status?: string;
  progress?: number;
  model_url?: string;
  thumbnail_url?: string;
  task_id?: string;
  id?: string;
}

interface AIGatewayImageResponse {
  choices: Array<{
    message: {
      images?: Array<{
        image_url: {
          url: string;
        };
      }>;
    };
  }>;
}

// ==================== Generation Prompts Interface ====================

interface GenerationPrompts {
  imageGeneration?: {
    base?: string;
    fallbackEnhancement?: string;
  };
  posePrompts?: Record<string, unknown>;
}

// ==================== Main Service Class ====================

export class AICreationService {
  private config: AIServiceConfig;
  private imageService: ImageGenerationService;
  private meshyService: MeshyService;

  constructor(config: AIServiceConfig) {
    this.config = config;
    // Pass fetchFn to child services, defaulting to global fetch
    const fetchFn = config.fetchFn || fetch;
    this.imageService = new ImageGenerationService({
      ...config.openai,
      fetchFn,
    });
    this.meshyService = new MeshyService({ ...config.meshy, fetchFn });
  }

  getImageService(): ImageGenerationService {
    return this.imageService;
  }

  getMeshyService(): MeshyService {
    return this.meshyService;
  }
}

// ==================== Image Generation Service ====================

class ImageGenerationService {
  private model: string;
  private imageServerBaseUrl?: string;

  constructor(config: OpenAIConfig) {
    this.model = config.model || "google/gemini-2.5-flash-image";
    this.imageServerBaseUrl = config.imageServerBaseUrl;
  }

  async generateImage(
    description: string,
    assetType: string,
    style?: string,
  ): Promise<ImageGenerationResult> {
    // Import AI SDK for image generation
    const { generateText } = await import("ai");

    if (!process.env.AI_GATEWAY_API_KEY) {
      throw new Error("AI_GATEWAY_API_KEY required for image generation");
    }

    // Load generation prompts
    const generationPrompts =
      (await getGenerationPrompts()) as GenerationPrompts | null;
    const promptTemplate: string =
      generationPrompts?.imageGeneration?.base ||
      '${description}. ${style || "game-ready"} style, ${assetType}, clean geometry suitable for 3D conversion.';

    // Replace template variables
    const prompt = promptTemplate
      .replace("${description}", description)
      .replace('${style || "game-ready"}', style || "game-ready")
      .replace("${assetType}", assetType);

    // Use model from config or default to multimodal image model
    const modelName = this.model;

    console.log(
      `🎨 Using Vercel AI Gateway for image generation (model: ${modelName})`,
    );

    // Use AI SDK's generateText with multimodal image models
    // Models like google/gemini-2.5-flash-image return images in result.files
    const result = await generateText({
      model: modelName,
      prompt: `Generate an image: ${prompt}`,
    });

    // Extract images from result.files (multimodal models)
    const imageFiles =
      result.files?.filter((f) => f.mediaType?.startsWith("image/")) || [];

    let imageUrl: string;

    if (imageFiles.length > 0) {
      // Convert to data URL from base64
      const file = imageFiles[0];
      if (file.base64) {
        imageUrl = `data:${file.mediaType || "image/png"};base64,${file.base64}`;
      } else if (file.uint8Array) {
        const base64 = Buffer.from(file.uint8Array).toString("base64");
        imageUrl = `data:${file.mediaType || "image/png"};base64,${base64}`;
      } else {
        throw new Error("No image data in response files");
      }
    } else {
      // Fallback: check if response text contains image URL (some models)
      console.error("No images found in result.files. Full result:", result);
      throw new Error("No image data returned from AI Gateway");
    }

    return {
      imageUrl: imageUrl,
      prompt: prompt,
      metadata: {
        model: modelName,
        resolution: "1024x1024",
        quality: "high",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// ==================== Meshy Service ====================

class MeshyService {
  private apiKey: string;
  private baseUrl: string;
  private fetchFn: FetchFunction;

  constructor(config: MeshyConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.meshy.ai";
    this.fetchFn = config.fetchFn || fetch;
  }

  async startImageTo3D(
    imageUrl: string,
    options: ImageTo3DOptions,
  ): Promise<string | MeshyTaskResult> {
    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/image-to-3d`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_url: imageUrl,
          enable_pbr: options.enable_pbr ?? false,
          ai_model: options.ai_model || "meshy-4",
          topology: options.topology || "quad",
          target_polycount: options.targetPolycount || 2000,
          texture_resolution: options.texture_resolution || 512,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meshy API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as MeshyTaskResponse;
    // Normalize to task id string for polling
    const taskId =
      data.task_id ||
      data.id ||
      (data.result && (data.result.task_id || data.result.id));
    if (!taskId) {
      // Fallback to previous behavior but this will likely break polling
      return data.result || data;
    }
    return taskId;
  }

  async getTaskStatus(taskId: string): Promise<MeshyStatusResult> {
    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/image-to-3d/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meshy API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as MeshyStatusResponse;
    return data.result || data;
  }

  async startRetextureTask(
    input: RetextureInput,
    style: RetextureStyle,
    options: RetextureOptions,
  ): Promise<string | MeshyTaskResult> {
    const body: Record<string, string | boolean | undefined> = {
      art_style: options.artStyle || "realistic",
      ai_model: options.aiModel || "meshy-5",
      enable_original_uv: options.enableOriginalUV ?? true,
    };

    if (input.inputTaskId) {
      body.input_task_id = input.inputTaskId;
    } else {
      body.model_url = input.modelUrl;
    }

    if (style.textStylePrompt) {
      body.text_style_prompt = style.textStylePrompt;
    } else {
      body.image_style_url = style.imageStyleUrl;
    }

    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/retexture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Meshy Retexture API error: ${response.status} - ${error}`,
      );
    }

    const data = (await response.json()) as MeshyTaskResponse;
    // Normalize to task id string for polling
    const taskId =
      data.task_id ||
      data.id ||
      (data.result && (data.result.task_id || data.result.id));
    if (!taskId) {
      return data.result || data;
    }
    return taskId;
  }

  async getRetextureTaskStatus(taskId: string): Promise<MeshyStatusResult> {
    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/retexture/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meshy API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as MeshyStatusResponse;
    return data.result || data;
  }

  // Rigging methods for auto-rigging avatars
  async startRiggingTask(
    input: RiggingInput,
    options: RiggingOptions = {},
  ): Promise<string | MeshyTaskResult> {
    const body: Record<string, string | number | undefined> = {
      height_meters: options.heightMeters || 1.7,
    };

    if (input.inputTaskId) {
      body.input_task_id = input.inputTaskId;
    } else if (input.modelUrl) {
      body.model_url = input.modelUrl;
    } else {
      throw new Error("Either inputTaskId or modelUrl must be provided");
    }

    const response = await this.fetchFn(`${this.baseUrl}/openapi/v1/rigging`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meshy rigging API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as MeshyTaskResponse;
    // Normalize to task id string for polling
    const taskId =
      data.task_id ||
      data.id ||
      (data.result && (data.result.task_id || data.result.id));
    if (!taskId) {
      return data.result || data;
    }
    return taskId;
  }

  async getRiggingTaskStatus(taskId: string): Promise<MeshyStatusResult> {
    const response = await this.fetchFn(
      `${this.baseUrl}/openapi/v1/rigging/${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Meshy rigging status error: ${response.status} - ${error}`,
      );
    }

    return await response.json();
  }
}

// ==================== Type Exports ====================

export type {
  AIServiceConfig,
  OpenAIConfig,
  MeshyConfig,
  ImageGenerationResult,
  ImageMetadata,
  ImageTo3DOptions,
  RetextureInput,
  RetextureStyle,
  RetextureOptions,
  RiggingInput,
  RiggingOptions,
  GenerationPrompts,
};
