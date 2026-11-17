#!/usr/bin/env node
// Penjaga sebelum menyentuh database.
// - mode `setup`: Docker harus berjalan (PRE-01).
// - mode `reset`: target harus database lokal (PRE-04).

import { spawnSync } from "node:child_process";

const mode = process.argv[2];

function gagal(pesan) {
  console.error(`\n[db-guard] ${pesan}\n`);
  process.exit(1);
}

function lokal(host) {
  return ["localhost", "127.0.0.1", "::1", "0.0.0.0", "host.docker.internal"].includes(
    host,
  );
}

function hostDari(nilai) {
  try {
    return new URL(nilai).hostname;
  } catch {
    return nilai;
  }
}

if (mode === "setup") {
  const hasil = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (hasil.status !== 0) {
    gagal(
      "Docker belum berjalan. Nyalakan Docker Desktop atau daemon Docker, lalu ulangi `pnpm db:setup`.",
    );
  }
  console.log("[db-guard] Docker berjalan");
} else if (mode === "reset") {
  for (const kunci of ["SUPABASE_DB_URL", "DATABASE_URL", "PGHOST"]) {
    const nilai = process.env[kunci];
    if (!nilai) continue;
    const host = hostDari(nilai);
    if (!lokal(host)) {
      gagal(
        `${kunci} menunjuk ke "${host}", bukan database lokal. Reset dibatalkan.`,
      );
    }
  }
  console.log("[db-guard] target reset lokal");
} else {
  gagal("mode tidak dikenal. Pakai `setup` atau `reset`.");
}
