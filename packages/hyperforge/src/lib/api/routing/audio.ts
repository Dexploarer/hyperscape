/**
 * Audio Domain Routing Layer
 * 
 * Consolidated audio operations for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateSpeech,
  generateSpeechWithTimestamps,
  GAME_VOICE_PRESETS,
  getPresetVoiceSettings,
} from "@/lib/audio/elevenlabs-service";
import { storageService } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/storage/supabase-storage";
import {
  invalidateRegistryCache,
  createStandardAssetMetadata,
  type StandardAssetMetadata,
} from "@/lib/assets";
import { logger, generateAudioId } from "@/lib/utils";
import { ValidationError, StorageError } from "@/lib/api";
import type { VoiceAsset, MusicCategory, SoundEffectCategory } from "@/types/audio";
import {
  createGetRoute,
  createPostRoute,
  parseQuery,
  getQueryParam,
} from "./base";
import type { ValidatedHandler } from "./types";
import { VoiceGenerationSchema } from "@/lib/api/schemas";

const log = logger.child("API:routing:audio");

/**
 * Generate voice audio
 */
export async function generateVoice(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof VoiceGenerationSchema.parse>,
): Promise<NextResponse> {
  const {
    text,
    voiceId,
    voicePreset,
    npcId,
    dialogueNodeId,
    withTimestamps = false,
    saveToAsset = true,
  } = body;

  // Determine voice ID and settings from preset or direct ID
  let effectiveVoiceId = voiceId;
  let voiceSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
  } | null = null;

  if (!effectiveVoiceId && voicePreset) {
    const preset = GAME_VOICE_PRESETS[voicePreset];
    if (preset) {
      effectiveVoiceId = preset.voiceId;
      voiceSettings = getPresetVoiceSettings(voicePreset);
    }
  }

  if (!effectiveVoiceId) {
    throw new ValidationError("Either voiceId or voicePreset is required");
  }

  log.info("Generating voice", {
    text: text.substring(0, 50) + "...",
    voiceId: effectiveVoiceId,
    voicePreset,
    withTimestamps,
    voiceSettings,
  });

  // Generate speech
  const speechOptions = {
    voiceId: effectiveVoiceId,
    text,
    ...(voiceSettings && {
      stability: voiceSettings.stability,
      similarityBoost: voiceSettings.similarityBoost,
      style: voiceSettings.style,
    }),
  };

  const result = withTimestamps
    ? await generateSpeechWithTimestamps(speechOptions)
    : await generateSpeech(speechOptions);

  // Calculate duration
  const durationSeconds = result.audio.length / 16000;

  // Build asset metadata
  const assetId = generateAudioId(dialogueNodeId, "voice", {
    npcId,
    dialogueNodeId,
  });
  const standardMetadata = createStandardAssetMetadata(
    assetId,
    dialogueNodeId || assetId,
    "audio",
    {
      type: "voice",
      subtype: voicePreset,
      description: text.substring(0, 100) + (text.length > 100 ? "..." : ""),
      pipeline: "elevenlabs-voice",
      status: "completed",
      source: "FORGE",
    },
  );

  const asset: VoiceAsset & { metadata?: StandardAssetMetadata } = {
    id: assetId,
    name: dialogueNodeId || assetId,
    npcId,
    dialogueNodeId,
    text,
    voiceId: effectiveVoiceId,
    voicePreset,
    url: "",
    duration: durationSeconds,
    format: "mp3",
    timestamps:
      "timestamps" in result
        ? (result.timestamps as Array<{
            character: string;
            start: number;
            end: number;
          }>)
        : undefined,
    generatedAt: standardMetadata.generatedAt,
    metadata: standardMetadata,
  };

  // Save audio file using unified storage service (automatic Supabase → Local fallback)
  if (saveToAsset) {
    const uploadResult = await storageService.uploadAudio(result.audio, {
      type: "voice",
      name: dialogueNodeId || assetId,
      category: npcId || "general",
      prompt: text,
      duration: durationSeconds,
      tags: [voicePreset || "custom", effectiveVoiceId].filter(Boolean),
      npcId,
      dialogueNodeId,
      metadata: {
        voiceId: effectiveVoiceId,
        voicePreset,
        text,
        timestamps: asset.timestamps,
      },
    });

    if (uploadResult.success) {
      asset.url = uploadResult.url;
      invalidateRegistryCache();
      log.info("Voice saved", {
        url: uploadResult.url,
        backend: uploadResult.backend,
        npcId,
        dialogueNodeId,
      });
    } else {
      throw new StorageError(uploadResult.error || "Upload failed", {
        context: { npcId, dialogueNodeId },
      });
    }
  }

  // Return audio as base64
  const audioBase64 = result.audio.toString("base64");

  return NextResponse.json({
    success: true,
    asset,
    audio: `data:audio/mp3;base64,${audioBase64}`,
  });
}

/**
 * Serve audio file using unified storage (Supabase → Local fallback)
 */
export async function serveAudioFile(
  filePath: string[],
): Promise<NextResponse> {
  const { storageService } = await import("@/lib/storage");

  // Try to download from unified storage
  // Path structure: {type}/{category?}/{filename}
  const buffer = await storageService.downloadAudio(filePath);

  if (!buffer) {
    throw new StorageError("Audio file not found", {
      storageType: "unified",
      operation: "read",
      isRetryable: false,
      context: { path: filePath.join("/") },
    });
  }

  // Create file response with proper headers
  const filename = filePath[filePath.length - 1] || "audio";
  const { createFileResponse } = await import("@/lib/utils");
  return createFileResponse(buffer, filename);
}

/**
 * Generate music using ElevenLabs
 */
export async function generateMusic(
  request: NextRequest,
  _context: unknown,
): Promise<NextResponse> {
  const {
    createMusicGenerationHandler,
  } = await import("@/lib/audio/audio-route-helpers");
  const { generateMusic, MUSIC_PROMPTS } = await import(
    "@/lib/audio/elevenlabs-service"
  );
  const { MusicGenerationSchema } = await import("@/lib/api/schemas/audio");

  const handler = createMusicGenerationHandler({
    schema: MusicGenerationSchema,
    presetsMap: MUSIC_PROMPTS,
    generate: generateMusic,
  });

  // Handler from helper only takes request, wrap to match RouteHandler signature
  // The handler is already wrapped with withErrorHandling, so it returns ApiHandler
  // which expects (request, context), but the inner handler only uses request
  return handler(request, { params: Promise.resolve({}) } as { params: Promise<Record<string, string | string[]>> });
}

/**
 * Generate sound effects using ElevenLabs
 */
export async function generateSFX(
  request: NextRequest,
  _context: unknown,
): Promise<NextResponse> {
  const {
    createSFXGenerationHandler,
  } = await import("@/lib/audio/audio-route-helpers");
  const {
    generateSoundEffect,
    SFX_PROMPTS,
  } = await import("@/lib/audio/elevenlabs-service");
  const { SFXGenerationSchema } = await import("@/lib/api/schemas/audio");

  const handler = createSFXGenerationHandler({
    schema: SFXGenerationSchema,
    presetsMap: SFX_PROMPTS,
    generate: generateSoundEffect,
  });

  // Handler from helper only takes request, wrap to match RouteHandler signature
  // The handler is already wrapped with withErrorHandling, so it returns ApiHandler
  // which expects (request, context), but the inner handler only uses request
  return handler(request, { params: Promise.resolve({}) } as { params: Promise<Record<string, string | string[]>> });
}

/**
 * List music presets
 */
export async function listMusicPresets(): Promise<NextResponse> {
  const {
    createPresetsListHandler,
  } = await import("@/lib/audio/audio-route-helpers");
  const { MUSIC_PROMPTS } = await import("@/lib/audio/elevenlabs-service");

  function categorizeMusicPreset(id: string): MusicCategory {
    if (id.includes("combat") || id.includes("boss")) return "combat";
    if (id.includes("town") || id.includes("tavern")) return "town";
    if (id.includes("dungeon") || id.includes("cave")) return "dungeon";
    if (id.includes("menu")) return "menu";
    if (id.includes("victory") || id.includes("defeat")) return "victory";
    if (id.includes("emotional") || id.includes("cutscene")) return "cutscene";
    return "ambient";
  }

  const handler = createPresetsListHandler(MUSIC_PROMPTS, categorizeMusicPreset);
  return handler();
}

/**
 * List SFX presets
 */
export async function listSFXPresets(): Promise<NextResponse> {
  const {
    createPresetsListHandler,
  } = await import("@/lib/audio/audio-route-helpers");
  const { SFX_PROMPTS } = await import("@/lib/audio/elevenlabs-service");

  function categorizeSFXPreset(id: string): SoundEffectCategory {
    if (
      id.includes("sword") ||
      id.includes("bow") ||
      id.includes("arrow") ||
      id.includes("magic") ||
      id.includes("fire") ||
      id.includes("heal")
    ) {
      return "combat";
    }
    if (
      id.includes("coin") ||
      id.includes("item") ||
      id.includes("inventory") ||
      id.includes("potion") ||
      id.includes("chest")
    ) {
      return "item";
    }
    if (
      id.includes("door") ||
      id.includes("footstep") ||
      id.includes("water") ||
      id.includes("campfire") ||
      id.includes("wind") ||
      id.includes("rain")
    ) {
      return "environment";
    }
    if (
      id.includes("ui") ||
      id.includes("level") ||
      id.includes("quest") ||
      id.includes("achievement")
    ) {
      return "ui";
    }
    return "custom";
  }

  const handler = createPresetsListHandler(SFX_PROMPTS, categorizeSFXPreset);
  return handler();
}

/**
 * List voices
 */
export async function listVoices(request: NextRequest): Promise<NextResponse> {
  const { VoicesQuerySchema } = await import("@/lib/api/schemas/audio");
  const {
    getVoices,
    searchVoices,
    getSharedVoices,
    GAME_VOICE_PRESETS,
  } = await import("@/lib/audio/elevenlabs-service");

  const query = parseQuery(request);
  const queryData = {
    type: getQueryParam(query, "type") || undefined,
    search: getQueryParam(query, "search") || undefined,
    gender: getQueryParam(query, "gender") || undefined,
    category: getQueryParam(query, "category") || undefined,
    pageSize: getQueryParam(query, "pageSize") || undefined,
  };

  const parsed = VoicesQuerySchema.safeParse(queryData);
  if (!parsed.success) {
    throw new ValidationError("Invalid query parameters", {
      validationDetails: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    });
  }

  const { type, search, gender, category, pageSize } = parsed.data;

  if (type === "presets") {
    const presets = Object.entries(GAME_VOICE_PRESETS).map(([key, value]) => ({
      id: key,
      voiceId: value.voiceId,
      name: key
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      description: value.description,
    }));
    return NextResponse.json({ voices: presets, type: "presets" });
  }

  if (type === "search") {
    if (!search) {
      throw new ValidationError("Search query is required when type=search", {
        field: "search",
      });
    }
    const voices = await searchVoices({ search, gender, category, pageSize });
    return NextResponse.json({ voices, type: "search" });
  }

  if (type === "shared") {
    const voices = await getSharedVoices({ gender, category, pageSize });
    return NextResponse.json({ voices, type: "shared" });
  }

  try {
    const voices = await getVoices();
    return NextResponse.json({ voices, type: "all" });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("ELEVENLABS_API_KEY")
    ) {
      const { NetworkError } = await import("@/lib/api");
      throw new NetworkError("ElevenLabs API key not configured", {
        statusCode: 503,
        context: { message: error.message },
      });
    }
    throw error;
  }
}

/**
 * Export route handlers for audio domain
 */
export const audioRoutes = {
  POST: {
    generateVoice: createPostRoute(
      VoiceGenerationSchema,
      generateVoice as ValidatedHandler<
        ReturnType<typeof VoiceGenerationSchema.parse>
      >,
    ),
    generateMusic: generateMusic,
    generateSFX: generateSFX,
  },
  GET: {
    file: (filePath: string[]) =>
      createGetRoute(async () => serveAudioFile(filePath)),
    musicPresets: createGetRoute(async () => listMusicPresets()),
    sfxPresets: createGetRoute(async () => listSFXPresets()),
    voices: createGetRoute(listVoices),
  },
};
