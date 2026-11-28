import { existsSync, readFileSync } from "node:fs";

// Single parser for scripts that fall back to .env.local. process.env always wins.
export function bacaEnvLocal({ path = ".env.local", wajib = false } = {}) {
  if (!existsSync(path)) {
    if (wajib) throw new Error(`Berkas ${path} tidak ditemukan.`);
    return {};
  }

  const hasil = {};
  for (const baris of readFileSync(path, "utf8").split("\n")) {
    const cocok = /^([A-Z0-9_]+)=(.*)$/.exec(baris.trim());
    if (cocok) hasil[cocok[1]] = cocok[2];
  }
  return hasil;
}

export function ambilEnv(nama, envLocal = {}, fallback) {
  return process.env[nama] ?? envLocal[nama] ?? fallback;
}

export function wajibEnv(nilai, nama, pesan) {
  if (nilai) return nilai;
  throw new Error(pesan ?? `${nama} wajib diisi.`);
}
