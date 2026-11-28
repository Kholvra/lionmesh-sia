import type { z } from "zod";

import { fail, ok, type Result } from "@/lib/result";

/**
 * Parses untrusted RPC payloads with a caller-owned schema. Without a failure
 * message the caller gets null; with one it gets the shared Result shape, so
 * existing callers keep their original success and failure paths.
 */
export function parseRpcResult<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
): z.infer<TSchema> | null;
export function parseRpcResult<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
  message: string | ((value: unknown) => string),
): Result<z.infer<TSchema>>;
export function parseRpcResult<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
  message?: string | ((value: unknown) => string),
): z.infer<TSchema> | Result<z.infer<TSchema>> | null {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return message === undefined ? parsed.data : ok(parsed.data);
  }

  if (message === undefined) return null;
  return fail(typeof message === "function" ? message(value) : message);
}
