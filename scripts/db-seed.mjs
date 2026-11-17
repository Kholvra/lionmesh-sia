#!/usr/bin/env node
// Menjalankan supabase/seed.sql dengan penjaga: menolak bila data dasar sudah ada.
// Kontrak: PRE-03, B-02, POST-04 pada FND-001.

import { readFileSync } from "node:fs";
import { Client } from "pg";

const DB_URL =
  process.env.SUPABASE_DB_URL ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

function gagal(pesan) {
  console.error(`\n[db:seed] ${pesan}\n`);
  process.exit(1);
}

const client = new Client({ connectionString: DB_URL });

try {
  await client.connect();
} catch {
  gagal("Tidak bisa terhubung ke database lokal. Jalankan `pnpm db:setup` dulu.");
}

try {
  const { rows } = await client.query(
    "select to_regclass('public._seed_meta') as tabel",
  );

  if (rows[0].tabel) {
    const { rows: hitung } = await client.query(
      "select count(*)::int as jumlah from public._seed_meta",
    );
    if (hitung[0].jumlah > 0) {
      gagal("Data dasar sudah terpasang. Jalankan `pnpm db:reset` dulu, lalu seed ulang.");
    }
  }

  const sql = readFileSync("supabase/seed.sql", "utf8");

  await client.query("begin");
  await client.query(sql);
  await client.query("commit");

  console.log("[db:seed] selesai — data dasar terpasang");
} catch (error) {
  await client.query("rollback").catch(() => {});
  gagal(error.message);
} finally {
  await client.end();
}
