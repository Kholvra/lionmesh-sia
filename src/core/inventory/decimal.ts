import { parseDecimal, type DecimalOptions } from "../ledger/money.ts";

// PostgreSQL numeric(18,4) values cross the JavaScript boundary as decimal strings.
const PILIHAN_DESIMAL: DecimalOptions = {
  scale: 4,
  allowNegative: true,
  rejectExcessPrecision: true,
  maxWholeDigits: 14,
};
const PILIHAN_POSITIF: DecimalOptions = { ...PILIHAN_DESIMAL, allowNegative: false };

export function isDecimal(value: unknown, allowZero: boolean, allowNegative = true): value is string {
  const hasil = parseDecimal(value, allowNegative ? PILIHAN_DESIMAL : PILIHAN_POSITIF);
  return hasil !== null && (allowZero || hasil !== BigInt(0));
}
