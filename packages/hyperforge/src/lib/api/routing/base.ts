/**
 * Base Routing Utilities
 * 
 * Common utilities for all domain routing layers
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  withErrorHandling,
  ValidationError,
  validationErrorResponse,
} from "@/lib/api";
import type {
  RouteHandler,
  ValidatedHandler,
  ParsedQuery,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "./types";

/**
 * Create a route handler with automatic body validation
 * 
 * Accepts any Zod schema type (ZodObject, ZodEffects, ZodDiscriminatedUnion, etc.)
 * and validates the request body against it.
 */
export function createValidatedRoute<TBody, TResponse = unknown>(
  schema: z.ZodType<TBody, z.ZodTypeDef, unknown>,
  handler: ValidatedHandler<TBody, TResponse>,
): RouteHandler<TResponse> {
  return withErrorHandling(async (request, context) => {
    const body: unknown = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(validationErrorResponse(parsed.error), {
        status: 400,
      });
    }

    return handler(request, context, parsed.data);
  }) as RouteHandler<TResponse>;
}

/**
 * Create a GET route handler (no body validation)
 */
export function createGetRoute<TResponse>(
  handler: RouteHandler<TResponse>,
): RouteHandler<TResponse> {
  return withErrorHandling(handler) as RouteHandler<TResponse>;
}

/**
 * Create a POST route handler with body validation
 * 
 * Accepts any Zod schema type (ZodObject, ZodEffects, ZodDiscriminatedUnion, etc.)
 */
export function createPostRoute<TBody, TResponse = unknown>(
  schema: z.ZodType<TBody, z.ZodTypeDef, unknown>,
  handler: ValidatedHandler<TBody, TResponse>,
): RouteHandler<TResponse> {
  return createValidatedRoute(schema, handler);
}

/**
 * Create a PUT route handler with body validation
 * 
 * Accepts any Zod schema type (ZodObject, ZodEffects, ZodDiscriminatedUnion, etc.)
 */
export function createPutRoute<TBody, TResponse = unknown>(
  schema: z.ZodType<TBody, z.ZodTypeDef, unknown>,
  handler: ValidatedHandler<TBody, TResponse>,
): RouteHandler<TResponse> {
  return createValidatedRoute(schema, handler);
}

/**
 * Create a PATCH route handler with body validation
 * 
 * Accepts any Zod schema type (ZodObject, ZodEffects, ZodDiscriminatedUnion, etc.)
 */
export function createPatchRoute<TBody, TResponse = unknown>(
  schema: z.ZodType<TBody, z.ZodTypeDef, unknown>,
  handler: ValidatedHandler<TBody, TResponse>,
): RouteHandler<TResponse> {
  return createValidatedRoute(schema, handler);
}

/**
 * Create a DELETE route handler (no body validation, typically uses query params)
 */
export function createDeleteRoute<TResponse = unknown>(
  handler: RouteHandler<TResponse>,
): RouteHandler<TResponse> {
  return createGetRoute(handler);
}

/**
 * Parse query parameters from request URL
 */
export function parseQuery(request: NextRequest): ParsedQuery {
  const { searchParams } = new URL(request.url);
  const query: ParsedQuery = {};

  for (const [key, value] of searchParams.entries()) {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  }

  return query;
}

/**
 * Get a single query parameter value
 */
export function getQueryParam(
  query: ParsedQuery,
  name: string,
): string | undefined {
  const value = query[name];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }
  return undefined;
}

/**
 * Get a required query parameter (throws if missing)
 */
export function getRequiredQueryParam(
  query: ParsedQuery,
  name: string,
): string {
  const value = getQueryParam(query, name);
  if (!value) {
    throw new ValidationError(`Missing required query parameter: ${name}`, {
      field: name,
    });
  }
  return value;
}

/**
 * Parse comma-separated query parameter into array
 */
export function getQueryArray(
  query: ParsedQuery,
  name: string,
): string[] | undefined {
  const value = getQueryParam(query, name);
  if (!value) {
    return undefined;
  }
  return value.split(",").filter(Boolean);
}

/**
 * Parse numeric query parameter
 */
export function getQueryNumber(
  query: ParsedQuery,
  name: string,
  options?: { min?: number; max?: number; default?: number },
): number | undefined {
  const value = getQueryParam(query, name);
  if (!value) {
    return options?.default;
  }

  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new ValidationError(`Invalid number for parameter: ${name}`, {
      field: name,
    });
  }

  if (options?.min !== undefined && num < options.min) {
    throw new ValidationError(
      `Parameter ${name} must be at least ${options.min}`,
      { field: name },
    );
  }

  if (options?.max !== undefined && num > options.max) {
    throw new ValidationError(
      `Parameter ${name} must be at most ${options.max}`,
      { field: name },
    );
  }

  return num;
}

/**
 * Parse boolean query parameter
 */
export function getQueryBoolean(
  query: ParsedQuery,
  name: string,
  defaultValue = false,
): boolean {
  const value = getQueryParam(query, name);
  if (value === undefined) {
    return defaultValue;
  }
  return value === "true" || value === "1";
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data });
}

/**
 * Create an error response
 */
export function errorResponse(
  error: string,
  code: string,
  status = 400,
  details?: Record<string, unknown>,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
      ...(details && { details }),
    },
    { status },
  );
}
