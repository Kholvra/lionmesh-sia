#!/usr/bin/env node
// PG-001 round trip: save a large nominal, read it back, re-save the read value,
// and prove the database still holds the digits the user typed.
//
// Needs the local stack (`pnpm db:reset` + `pnpm db:seed`) and uses a fresh name
// each run, so it can be repeated without cleaning up (suppliers are never deleted).

const AUTH_URL = process.env.SUPABASE_AUTH_URL ?? "http://127.0.0.1:54321";
const REST_URL = process.env.SUPABASE_REST_URL ?? "http://127.0.0.1:54321/rest/v1";
const KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const EMAIL = process.env.FND_TEST_EMAIL ?? "purchasing@lionmesh.test";
const PASSWORD = process.env.FND_TEST_PASSWORD ?? "lionmesh-dev-2026";

const NOMINAL = "9007199254740993";
const NAMA = `PT Presisi ${Date.now()}`;

function fail(pesan) {
  console.error(`\n[verify-pg001] GAGAL: ${pesan}\n`);
  process.exit(1);
}

const login = await fetch(`${AUTH_URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: KEY, "content-type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
const session = await login.json();
if (!login.ok) fail(`login ${login.status} ${session.error_code ?? session.msg}`);
const headers = {
  apikey: KEY,
  authorization: `Bearer ${session.access_token}`,
  "content-type": "application/json",
};

async function rpc(fn, body) {
  const res = await fetch(`${REST_URL}/rpc/${fn}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) fail(`${fn} ${res.status} ${text}`);
  return text.replace(/^"|"$/g, "");
}

async function baca(nama) {
  const res = await fetch(
    `${REST_URL}/pemasok_aman?select=nama,toleransi_nominal,toleransi_persen&nama=eq.${encodeURIComponent(nama)}`,
    { headers },
  );
  const rows = await res.json();
  if (!res.ok) fail(`baca ${res.status} ${JSON.stringify(rows)}`);
  if (rows.length !== 1) fail(`harap 1 baris, dapat ${rows.length}`);
  return rows[0];
}

const id = await rpc("create_pemasok", {
  p_nama: NAMA,
  p_termin_hari: 30,
  p_toleransi_persen: 0.5,
  p_toleransi_nominal: NOMINAL,
});
console.log(`simpan      : id=${id} nominal=${NOMINAL}`);

const pertama = await baca(NAMA);
console.log(
  `baca        : typeof=${typeof pertama.toleransi_nominal} nilai=${pertama.toleransi_nominal}`,
);
if (typeof pertama.toleransi_nominal !== "string") {
  fail("nominal harus datang sebagai string, bukan number JSON");
}
if (pertama.toleransi_nominal !== NOMINAL) {
  fail(`nominal berubah saat dibaca: ${pertama.toleransi_nominal}`);
}

// Simulate the edit form: submit the value that was just read back.
await rpc("update_pemasok", {
  p_id: id,
  p_nama: NAMA,
  p_termin_hari: 30,
  p_toleransi_persen: 0.5,
  p_toleransi_nominal: pertama.toleransi_nominal,
});
const kedua = await baca(NAMA);
console.log(`simpan ulang: nominal=${kedua.toleransi_nominal}`);
if (kedua.toleransi_nominal !== NOMINAL) {
  fail(`nilai tertimpa setelah simpan ulang: ${kedua.toleransi_nominal}`);
}

const persen = kedua.toleransi_persen;
if (typeof persen !== "string" || persen !== "0.5") {
  fail(`persen harus string "0.5", dapat ${typeof persen} ${persen}`);
}

console.log("\n[verify-pg001] lolos — nilai besar bertahan pada simpan → baca → simpan ulang\n");
