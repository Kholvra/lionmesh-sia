// Single local-target allowlist for guards and verification scripts.
const HOST_LOKAL = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0",
  "host.docker.internal",
]);

export function hostDari(nilai) {
  try {
    return new URL(nilai).hostname;
  } catch {
    return nilai;
  }
}

export function hostLokal(host) {
  return HOST_LOKAL.has(host);
}

export function validasiLokal(nilai, pesan) {
  if (!hostLokal(hostDari(nilai))) throw new Error(pesan);
}
