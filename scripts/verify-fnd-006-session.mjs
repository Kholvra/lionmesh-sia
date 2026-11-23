#!/usr/bin/env node
// Exercises the FND-006 session boundary against a disposable local Supabase project.

import { randomBytes, randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import pg from "pg";

const api = process.env.FND006_TEST_API_URL;
const dbUrl = process.env.FND006_TEST_DB_URL;
const app = process.env.FND006_TEST_APP_URL;
const anon = process.env.FND006_TEST_ANON_KEY;
const password = process.env.FND006_TEST_PASSWORD;

if (
  process.env.FND006_DISPOSABLE !== "1" ||
  !api ||
  !dbUrl ||
  !app ||
  !anon ||
  !password
) {
  throw new Error(
    "Provide isolated test URLs, anon key, password, and FND006_DISPOSABLE=1.",
  );
}

for (const value of [api, dbUrl, app]) {
  const url = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Only local endpoints are permitted.");
  }
}
for (const value of [api, dbUrl]) {
  const port = new URL(value).port;
  if (["54321", "54322"].includes(port)) {
    throw new Error("Do not run against the default local Supabase project.");
  }
}

const db = new pg.Client({ connectionString: dbUrl });
await db.connect();
const sourceType = "UJI_SESI_FND_006";
const checks = [];
let failed = false;

function check(name, condition, detail = "") {
  checks.push({ name, condition, detail });
  console.log(`${condition ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  if (!condition) failed = true;
}

async function login(email) {
  const jar = new Map();
  const client = createServerClient(api, anon, {
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (cookies) =>
        cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  return {
    client,
    cookie: Array.from(jar, ([name, value]) => `${name}=${value}`).join("; "),
  };
}

async function call(operation, payload, cookie = "") {
  const response = await fetch(`${app}/fnd006-security-probe`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ operation, payload }),
  });
  return { status: response.status, body: await response.json() };
}

async function journalCount() {
  const { rows } = await db.query("select count(*)::int as count from public.jurnal");
  return rows[0].count;
}

function payload(overrides = {}) {
  return {
    tanggal: "2026-11-22T10:00:00+07:00",
    sumberTipe: sourceType,
    sumberId: randomUUID(),
    sumberNomor: `SESI-${randomBytes(4).toString("hex")}`,
    sumberPemicu: "UJI_SESI_FND_006",
    mataUang: "IDR",
    baris: [
      { akunPeran: "kas_bank", debit: "10", kredit: "0" },
      { akunPeran: "penjualan", debit: "0", kredit: "10" },
    ],
    ...overrides,
  };
}

try {
  await db.query(
    `
      insert into public.jenis_sumber_jurnal (kode, nama, peran_berhak)
      values ($1, 'Sumber uji sesi FND-006', array['Accounting']::text[])
      on conflict (kode) do update set
        nama = excluded.nama,
        peran_berhak = excluded.peran_berhak,
        aktif = true
    `,
    [sourceType],
  );

  const { rows: akunRows } = await db.query(
    "select id, email from auth.users where email in ($1, $2)",
    ["accounting@lionmesh.test", "gudang@lionmesh.test"],
  );
  const accounting = akunRows.find((row) => row.email === "accounting@lionmesh.test");
  const gudang = akunRows.find((row) => row.email === "gudang@lionmesh.test");
  if (!accounting || !gudang) throw new Error("Seed accounts are missing.");

  const noSession = await call("post", payload());
  check(
    "tanpa sesi ditolak",
    noSession.status === 403 &&
      noSession.body.ok === false &&
      noSession.body.message.includes("Sesi Anda sudah berakhir"),
    noSession.body.message,
  );

  const accountingLogin = await login("accounting@lionmesh.test");
  const beforePost = await journalCount();
  const accountingPost = await call("post", payload(), accountingLogin.cookie);
  check(
    "Accounting dapat memposting lewat sesi",
    accountingPost.status === 200 && accountingPost.body.ok === true,
    accountingPost.body.message ?? accountingPost.body.data?.jurnalId,
  );
  const afterPost = await journalCount();
  check(
    "satu jurnal tersimpan",
    afterPost === beforePost + 1,
    `${beforePost} -> ${afterPost}`,
  );

  const { rows: actorRows } = await db.query(
    "select created_by from public.jurnal where id = $1",
    [accountingPost.body.data.jurnalId],
  );
  check(
    "aktor diambil dari sesi",
    actorRows[0]?.created_by === accounting.id,
    actorRows[0]?.created_by,
  );

  const spoofBefore = await journalCount();
  const spoof = await call(
    "post",
    payload({ actorId: gudang.id }),
    accountingLogin.cookie,
  );
  check(
    "actorId dari payload ditolak",
    spoof.body.ok === false &&
      spoof.body.message === "Data jurnal tidak valid." &&
      (await journalCount()) === spoofBefore,
    spoof.body.message,
  );

  const gudangLogin = await login("gudang@lionmesh.test");
  const gudangBefore = await journalCount();
  const gudangPost = await call("post", payload(), gudangLogin.cookie);
  check(
    "peran tidak berhak ditolak oleh core",
    gudangPost.status === 403 &&
      gudangPost.body.ok === false &&
      gudangPost.body.message ===
        "Anda tidak berwenang memposting transaksi ini." &&
      (await journalCount()) === gudangBefore,
    gudangPost.body.message,
  );

  const orphanBefore = await journalCount();
  const orphan = await call(
    "post",
    payload({
      sumberTipe: "PEMBALIKAN",
      sumberPemicu: "PEMBALIKAN_UJI_SESI",
    }),
    accountingLogin.cookie,
  );
  check(
    "jurnal PEMBALIKAN tanpa jurnal asal ditolak",
    orphan.body.ok === false &&
      orphan.body.message === "Jurnal pembalik wajib merujuk jurnal asal." &&
      (await journalCount()) === orphanBefore,
    orphan.body.message,
  );

  const reversal = await call(
    "reverse",
    {
      jurnalId: accountingPost.body.data.jurnalId,
      tanggal: "2026-11-23T10:00:00+07:00",
      sumberId: randomUUID(),
      sumberNomor: `BATAL-SESI-${randomBytes(4).toString("hex")}`,
      sumberPemicu: "PEMBATALAN_UJI_SESI",
    },
    accountingLogin.cookie,
  );
  check(
    "jurnal pembalik dapat dibuat lewat sesi",
    reversal.status === 200 && reversal.body.ok === true,
    reversal.body.message ?? reversal.body.data?.jurnalId,
  );

  const { rows: reversalRows } = await db.query(
    "select jurnal_asal_id, created_by from public.jurnal where id = $1",
    [reversal.body.data.jurnalId],
  );
  check(
    "pembalik merujuk jurnal asal dengan aktor sesi",
    reversalRows[0]?.jurnal_asal_id === accountingPost.body.data.jurnalId &&
      reversalRows[0]?.created_by === accounting.id,
    JSON.stringify(reversalRows[0]),
  );

  const rpc = await accountingLogin.client.rpc("post_journal", {
    p_tanggal: "2026-11-23T11:00:00+07:00",
    p_sumber_tipe: sourceType,
    p_sumber_id: randomUUID(),
    p_sumber_nomor: "RPC-KLIEN",
    p_sumber_pemicu: "UJI_SESI_FND_006",
    p_baris: [
      { akun_peran: "kas_bank", debit: "1", kredit: "0" },
      { akun_peran: "penjualan", debit: "0", kredit: "1" },
    ],
    p_mata_uang: "IDR",
    p_actor_id: accounting.id,
  });
  check(
    "RPC langsung oleh klien ditolak",
    Boolean(rpc.error) && /permission denied/i.test(rpc.error.message),
    rpc.error?.message,
  );
} finally {
  await db.end();
}

if (failed) process.exitCode = 1;
