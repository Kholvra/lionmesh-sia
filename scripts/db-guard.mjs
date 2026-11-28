#!/usr/bin/env node
// Guard database setup, reset, and seed operations.
// - `setup` requires Docker to be running (PRE-01).
// - `reset` and `seed` require a local database target (PRE-04).

import { spawnSync } from "node:child_process";
import { gagal as gagalHarness } from "./lib/harness.mjs";
import { hostDari, hostLokal } from "./lib/local-host.mjs";

const fail = (message) => gagalHarness(message, "db-guard");

const mode = process.argv[2];

if (mode === "setup") {
  const result = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (result.status !== 0) {
    fail(
      "Docker belum berjalan. Nyalakan Docker Desktop atau daemon Docker, lalu ulangi `pnpm db:setup`.",
    );
  }
  process.stdout.write("[db-guard] Docker berjalan\n");
} else if (mode === "reset" || mode === "seed") {
  for (const key of ["SUPABASE_DB_URL", "DATABASE_URL", "PGHOST"]) {
    const value = process.env[key];
    if (!value) continue;
    const host = hostDari(value);
    if (!hostLokal(host)) {
      if (mode === "seed") {
        fail("Seed hanya boleh dijalankan di lingkungan lokal.");
      }
      fail(`${key} menunjuk ke "${host}", bukan database lokal. Reset dibatalkan.`);
    }
  }
  process.stdout.write(`[db-guard] target ${mode} lokal\n`);
} else {
  fail("mode tidak dikenal. Pakai `setup`, `reset`, atau `seed`.");
}
