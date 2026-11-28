const DECIMAL_PATTERN = /^(-?)(\d+)(?:\.(\d+))?$/;

export interface DecimalOptions {
  readonly scale: number;
  readonly allowNegative: boolean;
  readonly rejectExcessPrecision: boolean;
  readonly maxWholeDigits?: number;
  readonly allowLeadingZeros?: boolean;
  readonly trim?: boolean;
}

/**
 * Money is whole rupiah: scale 0 means no sen is accepted. A fraction made
 * only of zeros (",00") is padding and stays valid. The cents representation
 * is kept for persistence and reports by multiplying the parsed rupiah by 100.
 */
const MONEY_OPTIONS: DecimalOptions = {
  scale: 0,
  allowNegative: false,
  rejectExcessPrecision: false,
  maxWholeDigits: 16,
};
const MONEY_OPTIONS_SIGNED: DecimalOptions = { ...MONEY_OPTIONS, allowNegative: true };

export function isMoney(value: unknown): value is string {
  return parseDecimal(value, MONEY_OPTIONS) !== null;
}

/**
 * Parses transactional money into cents. Sign is rejected by default; reports
 * may opt in for stored balances that are legitimately negative.
 */
export function moneyToCents(value: string, allowNegative = false): bigint {
  const rupiah = parseDecimal(
    value,
    allowNegative ? MONEY_OPTIONS_SIGNED : MONEY_OPTIONS,
  );
  if (rupiah === null) {
    throw new Error(`Nominal uang tidak valid: ${value}. Nominal harus bulat tanpa sen.`);
  }
  return rupiah * BigInt(100);
}

/** Half-up rounding at the persist/post boundary: cents → whole rupiah. */
export function roundToWholeRupiah(cents: bigint): bigint {
  const negatif = cents < BigInt(0);
  const absolut = negatif ? -cents : cents;
  const bulat = ((absolut + BigInt(50)) / BigInt(100)) * BigInt(100);
  return negatif ? -bulat : bulat;
}

/**
 * One parse/validate/convert primitive. Extra fractional digits are never
 * truncated: with rejectExcessPrecision they are rejected, otherwise they are
 * accepted only when they are padding zeros.
 */
export function parseDecimal(value: unknown, options: DecimalOptions): bigint | null {
  if (typeof value !== "string") return null;
  const input = options.trim ? value.trim() : value;
  const parts = DECIMAL_PATTERN.exec(input);
  if (!parts) return null;

  const [, sign, whole, fraction = ""] = parts;
  if (sign && !options.allowNegative) return null;
  if (options.maxWholeDigits !== undefined && whole.length > options.maxWholeDigits) return null;
  if (!options.allowLeadingZeros && whole.length > 1 && whole[0] === "0") return null;
  if (fraction.length > options.scale) {
    if (options.rejectExcessPrecision || /[1-9]/.test(fraction.slice(options.scale))) return null;
  }

  const units =
    BigInt(whole) * BigInt(10) ** BigInt(options.scale) +
    BigInt(fraction.slice(0, options.scale).padEnd(options.scale, "0"));
  return sign ? -units : units;
}

export type SignConvention =
  | "debit-minus-credit"
  | "quantity-sign"
  | "first-minus-second";

/** One signed-sum mechanism; the convention only selects how a pair is weighted. */
export function sumSigned(
  pasangan: Iterable<readonly [bigint, bigint]>,
  convention: SignConvention,
  awal = BigInt(0),
): bigint {
  let total = awal;
  for (const [first, second] of pasangan) {
    if (convention === "quantity-sign") {
      total += first > BigInt(0) ? second : -second;
    } else {
      total += first - second;
    }
  }
  return total;
}

/** Compact cents for validation messages; canonical UI display is formatRupiah. */
export function formatCents(value: bigint): string {
  const sign = value < BigInt(0) ? "-" : "";
  const absolute = value < BigInt(0) ? -value : value;
  const whole = absolute / BigInt(100);
  const fraction = (absolute % BigInt(100)).toString().padStart(2, "0");
  const trimmed = fraction.replace(/0+$/, "");
  return `${sign}${whole.toString()}${trimmed ? `.${trimmed}` : ""}`;
}
