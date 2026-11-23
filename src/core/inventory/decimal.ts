// PostgreSQL numeric(18,4) values cross the JavaScript boundary as decimal strings.
export function isDecimal(value: unknown, allowZero: boolean, allowNegative = true): value is string {
  if (typeof value !== "string" || !/^-?(?:0|[1-9]\d{0,13})(?:\.\d{1,4})?$/.test(value)) return false;
  if (!allowNegative && value.startsWith("-")) return false;
  if (!allowZero && /^-?0(?:\.0+)?$/.test(value)) return false;
  return true;
}
