/**
 * Returns the server-provided message when it is usable, otherwise the
 * caller's Indonesian fallback. Trimming matches every existing copy exactly.
 */
export function pesanKesalahan(
  error: { message?: string } | null | undefined,
  fallback: string,
): string {
  const message = error?.message?.trim();
  return message && message.length > 0 ? message : fallback;
}
