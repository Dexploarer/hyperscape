/**
 * Weapon API Router
 * 
 * Handles weapon detection operations (handle, orientation)
 */

import { NextRequest, NextResponse } from "next/server";
import { createPostRoute } from "./base";
import { ValidationError, WeaponHandleDetectSchema, WeaponOrientationDetectSchema } from "@/lib/api";
import type { ValidatedHandler } from "./types";

/**
 * Detect weapon handle position
 */
export async function detectHandle(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof WeaponHandleDetectSchema.parse>,
): Promise<NextResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const { image } = body;

  if (!OPENAI_API_KEY) {
    // Heuristic fallback
    return NextResponse.json({
      success: true,
      gripBounds: {
        minX: 200,
        minY: 350,
        maxX: 312,
        maxY: 440,
        x: 200,
        y: 350,
        width: 112,
        height: 90,
      },
      confidence: 0.5,
      weaponType: "sword",
      gripDescription: "Heuristic detection - handle assumed at bottom third",
    });
  }

  // Use OpenAI Vision API
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Analyze weapon images to identify grip/handle areas. Return JSON with gripBounds.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify the grip/handle area of this weapon." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new ValidationError("Failed to detect handle", {
      context: { status: response.status },
    });
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new ValidationError("Invalid response from AI", {});
  }

  try {
    const result = JSON.parse(content);
    return NextResponse.json({ success: true, ...result });
  } catch {
    throw new ValidationError("Failed to parse AI response", {});
  }
}

/**
 * Detect weapon orientation
 */
export async function detectOrientation(
  request: NextRequest,
  _context: unknown,
  body: ReturnType<typeof WeaponOrientationDetectSchema.parse>,
): Promise<NextResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const { image } = body;

  if (!OPENAI_API_KEY) {
    return NextResponse.json({
      success: true,
      needsFlip: false,
      reason: "Heuristic: assuming correct orientation",
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Determine if weapon needs to be flipped. Blade should point UP, handle DOWN.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Does this weapon need to be flipped 180 degrees?" },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new ValidationError("Failed to detect orientation", {
      context: { status: response.status },
    });
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new ValidationError("Invalid response from AI", {});
  }

  try {
    const result = JSON.parse(content);
    return NextResponse.json({ success: true, ...result });
  } catch {
    throw new ValidationError("Failed to parse AI response", {});
  }
}

/**
 * Weapon API routes
 */
export const weaponRoutes = {
  POST: {
    detectHandle: createPostRoute(
      WeaponHandleDetectSchema,
      detectHandle as ValidatedHandler<
        ReturnType<typeof WeaponHandleDetectSchema.parse>
      >,
    ),
    detectOrientation: createPostRoute(
      WeaponOrientationDetectSchema,
      detectOrientation as ValidatedHandler<
        ReturnType<typeof WeaponOrientationDetectSchema.parse>
      >,
    ),
  },
};
