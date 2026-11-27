/**
 * Shared query-parameter unwrap for App Router pages. Repeated parameters
 * arrive as arrays; callers opt into their original array handling so the
 * migration keeps every observed output unchanged.
 */
export interface FirstParamOptions {
  /** Return the first item of a repeated parameter. Defaults to true. */
  takeFirst?: boolean;
}

export type QueryParamValue = string | readonly string[] | null | undefined;

export function firstParam(
  value: QueryParamValue,
  options: FirstParamOptions = {},
): string | undefined {
  if (Array.isArray(value)) {
    return options.takeFirst === false ? undefined : value[0];
  }
  return typeof value === "string" ? value : undefined;
}
