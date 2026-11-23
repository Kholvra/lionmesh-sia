import { connection } from "next/server";

import { formatPeriode } from "./format";

/**
 * The current period is request-time data. Keeping it in its own Suspense
 * boundary lets the rest of the dashboard render without baking `Date.now()`
 * into the static shell.
 */
export async function PeriodeSekarang() {
  await connection();
  return <>{formatPeriode(new Date())}</>;
}
