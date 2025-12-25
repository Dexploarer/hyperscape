/**
 * API Routing Types
 * 
 * Consolidated type definitions for domain-specific routing layers.
 * All route handlers use these types for consistency and type safety.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Route handler context (Next.js 15 compatible)
 * 
 * Next.js 15 route handlers receive params as a Promise that must be awaited.
 */
export interface RouteContext {
  params: Promise<Record<string, string | string[]>>;
}

/**
 * Route handler function signature
 * 
 * Base handler for routes that don't require body validation (GET, DELETE).
 * 
 * @template TResponse - The response data type (defaults to unknown)
 * 
 * @example
 * ```typescript
 * const handler: RouteHandler<{ items: Asset[] }> = async (request, context) => {
 *   const items = await getAssets();
 *   return NextResponse.json({ success: true, data: { items } });
 * };
 * ```
 */
export type RouteHandler<TResponse = unknown> = (
  request: NextRequest,
  context: RouteContext,
) => Promise<NextResponse<TResponse>>;

/**
 * Validated request handler (after schema validation)
 * 
 * Handler for routes that require body validation (POST, PUT, PATCH).
 * The body is already validated and typed according to the schema.
 * 
 * @template TBody - The validated request body type (from Zod schema)
 * @template TResponse - The response data type (defaults to unknown)
 * 
 * @example
 * ```typescript
 * const handler: ValidatedHandler<{ name: string }, { id: string }> = async (
 *   request,
 *   context,
 *   body // body.name is typed as string
 * ) => {
 *   const asset = await createAsset(body.name);
 *   return NextResponse.json({ success: true, data: { id: asset.id } });
 * };
 * ```
 */
export type ValidatedHandler<TBody, TResponse = unknown> = (
  request: NextRequest,
  context: RouteContext,
  body: TBody,
) => Promise<NextResponse<TResponse>>;

/**
 * Query parameter parser result
 * 
 * Query parameters can be:
 * - Single value: `?id=123` → `{ id: "123" }`
 * - Multiple values: `?tags=a&tags=b` → `{ tags: ["a", "b"] }`
 * - Missing: `?other=value` → `{ id: undefined }`
 */
export interface ParsedQuery {
  [key: string]: string | string[] | undefined;
}

/**
 * Standard API success response
 * 
 * All successful API responses follow this format.
 * 
 * @template T - The response data type
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Standard API error response
 * 
 * All error responses follow this format.
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Validation error response format
 * 
 * Specialized error response for validation failures.
 * Includes structured validation details for each field.
 */
export interface ValidationErrorResponse extends ApiErrorResponse {
  code: "VALIDATION_ERROR";
  details: {
    validationDetails: Record<string, string[]>;
  };
}

/**
 * Route factory function types
 * 
 * These types represent the return values of route factory functions:
 * - `createGetRoute` → `RouteHandler<TResponse>`
 * - `createPostRoute` → `RouteHandler<TResponse>`
 * - `createPutRoute` → `RouteHandler<TResponse>`
 * - `createPatchRoute` → `RouteHandler<TResponse>`
 * - `createDeleteRoute` → `RouteHandler<TResponse>`
 * 
 * All factory functions wrap handlers with:
 * - Automatic error handling via `withErrorHandling`
 * - Body validation (for POST/PUT/PATCH)
 * - Consistent response formatting
 */
