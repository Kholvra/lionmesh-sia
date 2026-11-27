/**
 * Shared text coercion for untrusted database and RPC values. The local copies
 * disagree on numeric coercion and nullish handling, so callers opt into the
 * exact behavior they had instead of changing any observed output.
 */
export interface AmbilTeksOptions {
  /** Returned for nullish or non-coercible values; defaults to null. */
  fallback?: string | null;
  /** Convert numbers with String(value); defaults to false. */
  coerceNumber?: boolean;
  /** Skip non-finite numbers even when coercion is enabled; defaults to false. */
  onlyFiniteNumbers?: boolean;
  /** Convert other non-nullish primitives with String(value); defaults to false. */
  coercePrimitive?: boolean;
}

export function ambilTeks(
  value: unknown,
  options: AmbilTeksOptions & { fallback: string },
): string;
export function ambilTeks(value: unknown, options?: AmbilTeksOptions): string | null;
export function ambilTeks(value: unknown, options: AmbilTeksOptions = {}): string | null {
  const fallback = options.fallback ?? null;

  if (typeof value === "number") {
    if (options.onlyFiniteNumbers === true && !Number.isFinite(value)) return fallback;
    if (options.coerceNumber === true || options.coercePrimitive === true) {
      return String(value);
    }
    return fallback;
  }

  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  if (options.coercePrimitive === true) return String(value);
  return fallback;
}
