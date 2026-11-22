#!/usr/bin/env node
// Print local seed row counts and key values for AC-01 comparison.

import { spawnSync } from "node:child_process";
import { Client } from "pg";

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const guardResult = spawnSync(process.execPath, ["scripts/db-guard.mjs", "seed"], {
  stdio: "inherit",
});
if (guardResult.error || guardResult.status !== 0) process.exit(guardResult.status ?? 1);

const client = new Client({ connectionString: DB_URL });
try {
  await client.connect();
  const satuan = (await client.query(
    "select id, kode, nama from public.satuan order by id",
  )).rows;
  const gudang = (await client.query(
    "select id, kode, nama from public.gudang order by id",
  )).rows;
  const profiles = (await client.query(
    "select id, display_name, peran, aktif, created_at, updated_at from public.profiles order by id",
  )).rows;
  const seedVersion = (await client.query(
    "select version from public._seed_meta order by version",
  )).rows;

  process.stdout.write(
    `${JSON.stringify(
      {
        satuan: { count: satuan.length, rows: satuan },
        gudang: { count: gudang.length, rows: gudang },
        profiles: { count: profiles.length, rows: profiles },
        seedVersion,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  console.error(`[db:seed-snapshot] ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
