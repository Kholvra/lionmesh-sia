#!/usr/bin/env node
// Exercises the session-backed inventory boundary against a disposable local Supabase project.
import { randomBytes, randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const api = process.env.FND005_TEST_API_URL;
const dbUrl = process.env.FND005_TEST_DB_URL;
const app = process.env.FND005_TEST_APP_URL;
const anon = process.env.FND005_TEST_ANON_KEY;
const service = process.env.FND005_TEST_SERVICE_KEY;
if (process.env.FND005_DISPOSABLE !== "1" || !api || !dbUrl || !app || !anon || !service) {
  throw new Error("Provide isolated test URLs, keys, and FND005_DISPOSABLE=1.");
}
for (const value of [api, dbUrl, app]) {
  const url = new URL(value);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Only local endpoints are permitted.");
  }
}
if (["54321", "54322"].includes(new URL(api).port) || ["54321", "54322"].includes(new URL(dbUrl).port)) {
  throw new Error("Do not run against the default local Supabase project.");
}

const admin = createClient(api, service, { auth: { persistSession: false } });
const db = new pg.Client({ connectionString: dbUrl });
await db.connect();
const suffix = randomBytes(6).toString("hex");
const password = randomBytes(24).toString("hex");
const accounts = {};
let failed = false;

function check(name, condition) {
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
  if (!condition) failed = true;
}

async function makeAccount(role) {
  const email = `inventory-${role.toLowerCase()}-${suffix}@lionmesh.test`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  const id = created.data.user.id;
  await db.query("update public.profiles set peran=$1 where id=$2", [role, id]);
  const jar = new Map();
  const client = createServerClient(api, anon, {
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const login = await client.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  return { id, client, cookie: Array.from(jar, ([name, value]) => `${name}=${value}`).join("; ") };
}

async function request(operation, payload, cookie = "") {
  const response = await fetch(`${app}/fnd005-security-probe`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ operation, payload }),
  });
  return { status: response.status, body: await response.json() };
}

try {
  const valuation = await (await fetch(`${app}/fnd005-security-probe`)).json();
  check("valuation retains precision and PostgreSQL half rounding", valuation.incoming.qtyBaru === "900719925474.0993" && valuation.incoming.nilaiBaru === "90071992.55" && valuation.outgoing.qtyBaru === "0.0000" && valuation.outgoing.nilaiBaru === "0.00" && valuation.rounding.nilaiMasuk === "0.01");
  accounts.Gudang = await makeAccount("Gudang");
  accounts.Penjualan = await makeAccount("Penjualan");
  accounts.QC = await makeAccount("QC");
  const unit = (await db.query("insert into public.satuan(kode,nama) values($1,'Unit') returning id", [`UNIT-${suffix}`])).rows[0].id;
  const product = (await db.query("insert into public.produk(kode,nama,satuan_dasar_id) values($1,'Product',$2) returning id", [`PROD-${suffix}`, unit])).rows[0].id;
  const origin = (await db.query("insert into public.gudang(kode,nama) values($1,'Origin') returning id", [`ORIG-${suffix}`])).rows[0].id;
  const dest = (await db.query("insert into public.gudang(kode,nama) values($1,'Destination') returning id", [`DEST-${suffix}`])).rows[0].id;
  await db.query("select public.catat_mutasi_stok($1,$2,'2020-01-01T00:00:00Z','MASUK',10,10,'TEST',$3,null,null)", [product, origin, randomUUID()]);
  const payload = { produkId: product, gudangAsalId: origin, gudangTujuanId: dest, qty: "3" };
  let result = await request("transfer", payload);
  check("anonymous denied", result.status === 403 && !result.body.ok);
  result = await request("transfer", payload, accounts.Penjualan.cookie);
  check("wrong role denied", result.status === 403 && !result.body.ok);
  result = await request("transfer", { ...payload, actorId: accounts.Penjualan.id }, accounts.Gudang.cookie);
  check("forged actor rejected", result.status === 403 && !result.body.ok);
  result = await request("transfer", { ...payload, sumberId: randomUUID() }, accounts.Gudang.cookie);
  check("forged source rejected", result.status === 403 && !result.body.ok);
  result = await request("transfer", { ...payload, qty: "0" }, accounts.Gudang.cookie);
  check("zero quantity rejected", result.status === 403 && !result.body.ok);
  result = await request("opname", { produkId: product, gudangId: origin, qtyFisik: "-1", alasan: "Uji" }, accounts.Gudang.cookie);
  check("negative stocktake rejected", result.status === 403 && !result.body.ok);
  const before = Number((await db.query("select count(*) as n from public.mutasi_stok where produk_id=$1", [product])).rows[0].n);
  check("rejections have no stock side effects", before === 1);
  result = await request("transfer", payload, accounts.Gudang.cookie);
  check("warehouse transfer allowed", result.status === 200 && result.body.ok);
  result = await request("opname", { produkId: product, gudangId: origin, qtyFisik: "8", alasan: "Uji lokal" }, accounts.Gudang.cookie);
  check("warehouse stocktake allowed", result.status === 200 && result.body.ok);
  result = await request("adjustment", { produkId: product, gudangId: origin, qty: "-2", alasan: "Uji lokal" }, accounts.Gudang.cookie);
  check("warehouse adjustment allowed", result.status === 200 && result.body.ok);
  const balances = (await db.query("select gudang_id,qty::text from public.saldo_stok where produk_id=$1", [product])).rows;
  const movements = (await db.query("select created_by from public.mutasi_stok where produk_id=$1", [product])).rows;
  check("balances and session audit actor", Number(balances.find((row) => row.gudang_id === origin)?.qty) === 6 && Number(balances.find((row) => row.gudang_id === dest)?.qty) === 3 && movements.length === 5 && movements.filter((row) => row.created_by === accounts.Gudang.id).length === 4);
  const precisionProduct = (await db.query("insert into public.produk(kode,nama,satuan_dasar_id) values($1,'Precision',$2) returning id", [`PREC-${suffix}`, unit])).rows[0].id;
  const precise = "900719925474.0993";
  const preciseMutation = await db.query("select public.catat_mutasi_stok($1,$2,'2020-01-01T00:00:00Z','MASUK',$3,0.0001,'TEST',$4,null,null) as result", [precisionProduct, origin, precise, randomUUID()]);
  check("RPC preserves exact decimal strings", preciseMutation.rows[0].result.qty === precise && preciseMutation.rows[0].result.saldo.qty === precise);
  result = await request("transfer", { ...payload, produkId: precisionProduct, qty: precise }, accounts.Gudang.cookie);
  check("large decimal survives API and database", result.body.ok && result.body.data.saldoTujuan.qty === precise);
  const read = await accounts.Gudang.client.from("saldo_stok").select("*,qty::text,nilai::text,harga_rata::text").eq("produk_id", precisionProduct).eq("gudang_id", dest).single();
  check("read API preserves exact decimal strings", !read.error && read.data.qty === precise);
  result = await request("transfer", { ...payload, qty: 900719925474.0993 }, accounts.Gudang.cookie);
  check("JSON numbers rejected before rounding can change stock", !result.body.ok);
  result = await request("transfer", { ...payload, qty: "0.00001" }, accounts.Gudang.cookie);
  check("excess decimal places rejected", !result.body.ok);
  // This table models a document only inside the disposable test project.
  await db.query("create table if not exists public.fnd005_test_document(id uuid primary key, produk_id uuid not null, gudang_id uuid not null, qty numeric(18,4) not null, harga_satuan numeric(18,4) not null, lulus boolean not null)");
  await db.query("grant all on public.fnd005_test_document to service_role");
  await db.query("notify pgrst, 'reload schema'");
  const docId = randomUUID();
  await db.query("insert into public.fnd005_test_document values($1,$2,$3,2,10,false)", [docId, product, origin]);
  result = await request("document", { id: docId }, accounts.Gudang.cookie);
  check("warehouse cannot perform QC document action", !result.body.ok);
  result = await request("document", { id: docId, actorId: accounts.Gudang.id }, accounts.QC.cookie);
  check("document caller rejects forged actor", !result.body.ok);
  result = await request("document", { id: randomUUID() }, accounts.QC.cookie);
  check("missing source document rejected", !result.body.ok);
  result = await request("document", { id: docId }, accounts.QC.cookie);
  check("document without passed QC rejected", !result.body.ok);
  const beforeDoc = (await db.query("select count(*)::int as n from public.mutasi_stok where sumber_id=$1", [docId])).rows[0].n;
  check("rejected document calls create no movement", beforeDoc === 0);
  await db.query("update public.fnd005_test_document set lulus=true where id=$1", [docId]);
  result = await request("document", { id: docId }, accounts.QC.cookie);
  const docMovement = (await db.query("select created_by,sumber_tipe,qty::text from public.mutasi_stok where sumber_id=$1", [docId])).rows;
  check("QC source action creates movement as session actor", result.body.ok && docMovement.length === 1 && docMovement[0].created_by === accounts.QC.id && docMovement[0].sumber_tipe === "TEST_QC" && docMovement[0].qty === "2.0000");
  const direct = await accounts.Gudang.client.rpc("transfer_stok", { p_produk_id: product, p_gudang_asal_id: origin, p_gudang_tujuan_id: dest, p_qty: 1 });
  check("direct client RPC denied", !!direct.error);
  await db.query("update public.profiles set peran='Penjualan' where id=$1", [accounts.Gudang.id]);
  result = await request("transfer", payload, accounts.Gudang.cookie);
  check("revoked session denied after role change", result.status === 403 && !result.body.ok);
} finally {
  await db.end();
}
if (failed) process.exitCode = 1;
