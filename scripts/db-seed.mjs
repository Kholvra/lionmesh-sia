#!/usr/bin/env node
// Run numbered seed files behind the local-target and version guards.
// Contracts: PRE-03, B-02, POST-04 in FND-001; AC-02, AC-07, AC-08 in FND-008.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Client } from "pg";

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SEED_DIRECTORY = "supabase/seeds";
const SEED_FILE_PATTERN = /^(\d{4})_[a-z0-9_-]+\.sql$/;

function fail(message) {
  console.error(`\n[db:seed] ${message}\n`);
  process.exit(1);
}

function listSeedFiles() {
  const fileNames = readdirSync(SEED_DIRECTORY)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const sequences = new Set();

  if (fileNames.length === 0) fail("Berkas seed bernomor tidak ditemukan.");

  for (const name of fileNames) {
    const match = name.match(SEED_FILE_PATTERN);
    if (!match) fail(`Nama berkas seed tidak valid: ${name}.`);
    if (sequences.has(match[1])) fail(`Nomor seed dipakai lebih dari sekali: ${match[1]}.`);
    sequences.add(match[1]);
  }

  return fileNames;
}

function readSeedVersion() {
  const seedVersion = readFileSync("supabase/seed-version", "utf8").trim();
  if (!/^\d{4}$/.test(seedVersion)) {
    fail("Versi seed harus empat digit di supabase/seed-version.");
  }
  return seedVersion;
}

const guardResult = spawnSync(process.execPath, ["scripts/db-guard.mjs", "seed"], {
  stdio: "inherit",
});
if (guardResult.error) fail(`Tidak bisa menjalankan penjaga database: ${guardResult.error.message}`);
if (guardResult.status !== 0) process.exit(guardResult.status ?? 1);

const fileNames = listSeedFiles();
const seedVersion = readSeedVersion();

const client = new Client({ connectionString: DB_URL });

try {
  await client.connect();
} catch {
  fail("Tidak bisa terhubung ke database lokal. Jalankan `pnpm db:setup` dulu.");
}

try {
  const { rows } = await client.query(
    "select to_regclass('public._seed_meta') as tabel",
  );

  if (rows[0].tabel) {
    const { rows: installedVersions } = await client.query(
      "select version from public._seed_meta order by version",
    );
    if (installedVersions.length > 0) {
      const installedVersionText = installedVersions.map((row) => row.version).join(", ");
      if (installedVersions.length === 1 && installedVersions[0].version === seedVersion) {
        fail("Database sudah berisi seed. Jalankan `pnpm db:reset` terlebih dahulu.");
      }
      fail(
        `Versi seed terpasang (${installedVersionText}) berbeda dari versi repo (${seedVersion}). Jalankan \`pnpm db:reset\` terlebih dahulu.`,
      );
    }
  }

  await client.query("begin");
  await client.query(readFileSync("supabase/seed.sql", "utf8"));
  for (const fileName of fileNames) {
    await client.query(readFileSync(join(SEED_DIRECTORY, fileName), "utf8"));
  }
  await client.query("insert into public._seed_meta (version) values ($1)", [seedVersion]);
  await client.query("commit");

  process.stdout.write(`[db:seed] selesai — seed versi ${seedVersion} terpasang\n`);
} catch (error) {
  await client.query("rollback").catch(() => {});
  fail(`Seed gagal. Jalankan \`pnpm db:reset\` lalu ulangi. Detail: ${error.message}`);
} finally {
  await client.end();
}
