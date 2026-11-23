#!/usr/bin/env node
// C-012 verification: notifikasi in-app + antrean email.
//
// Runs against the local Docker stack only. It logs in as seeded accounts,
// creates notifications through the real RPC surface, drives the email worker
// through POST /api/notifikasi/kirim, and inspects the resulting rows.
//
// Prerequisites:
//   pnpm db:reset && pnpm db:seed:local
//   EMAIL_API_URL=http://127.0.0.1:4319/kirim NOTIFIKASI_KIRIM_TOKEN=uji-c012-lokal pnpm dev
//
// Usage:
//   node scripts/verify-c012-notifikasi.mjs

import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

const PASSWORD = process.env.FND_TEST_PASSWORD ?? "lionmesh-dev-2026";
const PORT_EMAIL = Number(process.env.C012_EMAIL_PORT ?? 4319);
const TOKEN = process.env.NOTIFIKASI_KIRIM_TOKEN ?? "uji-c012-lokal";
const NOMOR = `UJI/2026/11/${Date.now().toString().slice(-4)}`;

function readEnv() {
  const isi = readFileSync(".env.local", "utf8");
  const peta = {};
  for (const baris of isi.split("\n")) {
    const cocok = /^([A-Z0-9_]+)=(.*)$/.exec(baris.trim());
    if (cocok) peta[cocok[1]] = cocok[2];
  }
  return peta;
}

const env = readEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:3000";
const DB_URL =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

for (const [nama, nilai] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ANON,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE,
})) {
  if (!nilai) {
    console.error(`[verify-c012] ${nama} tidak ada di .env.local`);
    process.exit(1);
  }
}

const host = new URL(SUPABASE_URL).hostname;
if (!["127.0.0.1", "localhost", "[::1]"].includes(host)) {
  console.error("[verify-c012] hanya untuk database lokal");
  process.exit(1);
}

const hasil = [];
let gagal = 0;

function catat(id, nama, detail) {
  hasil.push({ detail, id, nama });
  console.log(`[PASS] ${id}: ${nama} — ${detail}`);
}

function assert(nilai, pesan) {
  if (!nilai) throw new Error(pesan);
}

async function periksa(id, nama, fn) {
  try {
    catat(id, nama, await fn());
  } catch (error) {
    gagal += 1;
    const pesan = error instanceof Error ? error.message : String(error);
    console.log(`[FAIL] ${id}: ${nama} — ${pesan}`);
  }
}

// --- fake email provider -----------------------------------------------------

const emailDiterima = [];
let modeEmail = "ok";

const serverEmail = createServer((req, res) => {
  if (req.url === "/kontrol" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      modeEmail = JSON.parse(body || "{}").mode ?? "ok";
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ mode: modeEmail }));
    });
    return;
  }

  if (req.url === "/terkirim") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(emailDiterima));
    return;
  }

  if (modeEmail === "down") {
    req.socket.destroy();
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    if (modeEmail === "gagal") {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "penyedia uji menolak" }));
      return;
    }
    emailDiterima.push(JSON.parse(body || "{}"));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
});

await new Promise((resolve) => serverEmail.listen(PORT_EMAIL, "127.0.0.1", resolve));

async function aturMode(mode) {
  const res = await fetch(`http://127.0.0.1:${PORT_EMAIL}/kontrol`, {
    body: JSON.stringify({ mode }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  assert(res.ok, `gagal mengatur mode email ke ${mode}`);
}

// --- helpers -----------------------------------------------------------------

const client = new Client({ connectionString: DB_URL });
await client.connect();

async function idPengguna(email) {
  const { rows } = await client.query("select id from auth.users where email = $1", [email]);
  assert(rows.length === 1, `akun seed ${email} tidak ditemukan; jalankan pnpm db:seed:local`);
  return rows[0].id;
}

async function login(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    body: JSON.stringify({ email, password: PASSWORD }),
    headers: { apikey: ANON, "content-type": "application/json" },
    method: "POST",
  });
  assert(res.ok, `login ${email} gagal`);
  return (await res.json()).access_token;
}

async function rpc(jwt, nama, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nama}`, {
    body: JSON.stringify(args),
    headers: {
      apikey: ANON,
      authorization: `Bearer ${jwt}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  const teks = await res.text();
  return { data: teks ? JSON.parse(teks) : null, ok: res.ok, status: res.status, teks };
}

async function pilih(jwt, path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON, authorization: `Bearer ${jwt}` },
  });
  const teks = await res.text();
  assert(res.ok, `gagal membaca ${path}: ${teks}`);
  return JSON.parse(teks);
}

async function jalankanPemroses() {
  const res = await fetch(`${APP_URL}/api/notifikasi/kirim`, {
    headers: { "x-notifikasi-token": TOKEN },
    method: "POST",
  });
  const teks = await res.text();
  assert(
    res.ok,
    `pemroses email menolak (${res.status}): ${teks}. Pastikan dev server berjalan dengan NOTIFIKASI_KIRIM_TOKEN dan EMAIL_API_URL.`,
  );
  return JSON.parse(teks).data;
}

async function buat(aktorJwt, jenis, penerimaIds, nomor = null, tautan = null) {
  const res = await rpc(aktorJwt, "buat_notifikasi", {
    p_jenis: jenis,
    p_nomor_dokumen: nomor,
    p_penerima_ids: penerimaIds,
    p_tautan: tautan,
  });
  assert(res.ok, `buat_notifikasi gagal: ${res.teks}`);
  return res.data.notifikasi_ids[0];
}

async function barisNotifikasi(id) {
  const { rows } = await client.query(
    `select n.id, n.penerima_id, n.jenis, n.judul, n.kanal_email, n.dibaca_at,
            e.id as email_id, e.alamat, e.status, e.percobaan, e.alasan, e.jadwal_berikutnya
     from public.notifikasi n
     left join public.pengiriman_email e on e.notifikasi_id = n.id
     where n.id = $1`,
    [id],
  );
  assert(rows.length === 1, `notifikasi ${id} tidak ada`);
  return rows[0];
}

async function majukanJadwal(id) {
  await client.query(
    "update public.pengiriman_email set jadwal_berikutnya = now() - interval '1 minute' where notifikasi_id = $1",
    [id],
  );
}

// --- data uji ----------------------------------------------------------------

const purchasing = await login("purchasing@lionmesh.test");
const manajemen = await login("manajemen@lionmesh.test");
const hr = await login("hr@lionmesh.test");

const idManajemen = await idPengguna("manajemen@lionmesh.test");
const idPurchasing = await idPengguna("purchasing@lionmesh.test");
const idHr = await idPengguna("hr@lionmesh.test");

const emailTanpaAlamat = `c012-tanpa-email-${randomUUID().slice(0, 8)}@lionmesh.test`;
const idTanpaEmail = randomUUID();
await client.query(
  `insert into auth.users (
     instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
     raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
     confirmation_token, recovery_token, email_change_token_new, email_change
   ) values (
     '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
     extensions.crypt($3, extensions.gen_salt('bf')), '2026-01-01 00:00:00+00',
     '{"provider":"email","providers":["email"]}'::jsonb,
     jsonb_build_object('display_name', 'Tanpa Email'), '2026-01-01 00:00:00+00',
     '2026-01-01 00:00:00+00', '', '', '', ''
   )`,
  [idTanpaEmail, emailTanpaAlamat, PASSWORD],
);
await client.query("update public.profiles set peran = 'Manajemen' where id = $1", [idTanpaEmail]);
await client.query("update auth.users set email = null where id = $1", [idTanpaEmail]);

console.log("=== C-012 verification ===");
console.log(`Supabase : ${SUPABASE_URL}`);
console.log(`Nomor uji: ${NOMOR}\n`);

// AC-01 -----------------------------------------------------------------------
let notifManajemen;
await periksa("AC-01", "kejadian pemicu membuat notifikasi in-app untuk penerima", async () => {
  notifManajemen = await buat(
    purchasing,
    "DOKUMEN_MENUNGGU_PERSETUJUAN",
    [idManajemen],
    NOMOR,
    `/pengeluaran/permintaan-pembelian/${NOMOR}`,
  );
  const baris = await barisNotifikasi(notifManajemen);
  assert(baris.penerima_id === idManajemen, "penerima salah");
  assert(baris.jenis === "DOKUMEN_MENUNGGU_PERSETUJUAN", "jenis salah");
  assert(baris.judul.includes(NOMOR), `judul tanpa nomor: ${baris.judul}`);

  const daftar = await pilih(
    manajemen,
    `notifikasi?select=id,judul,dibaca_at&id=eq.${notifManajemen}`,
  );
  assert(daftar.length === 1, "penerima tidak melihat notifikasinya lewat RLS");
  return `id ${notifManajemen}, judul "${baris.judul}"`;
});

// AC-02 -----------------------------------------------------------------------
await periksa("AC-02", "pengguna lain tidak melihat notifikasi itu", async () => {
  const daftar = await pilih(hr, `notifikasi?select=id&id=eq.${notifManajemen}`);
  assert(daftar.length === 0, `notifikasi bocor ke HR: ${JSON.stringify(daftar)}`);
  return "RLS menyembunyikan baris milik penerima lain";
});

// AC-03 / AC-09 ---------------------------------------------------------------
await periksa("AC-03", "email terkirim lewat adaptor tunggal dan antrean berstatus terkirim", async () => {
  await aturMode("ok");
  const sebelum = emailDiterima.length;
  await majukanJadwal(notifManajemen);
  const hasilProses = await jalankanPemroses();
  const baris = await barisNotifikasi(notifManajemen);

  assert(baris.status === "terkirim", `status antrean ${baris.status}`);
  assert(baris.alamat === "manajemen@lionmesh.test", `alamat ${baris.alamat}`);
  assert(emailDiterima.length === sebelum + 1, "penyedia uji tidak menerima email");
  const terakhir = emailDiterima.at(-1);
  assert(terakhir.to === "manajemen@lionmesh.test", "penerima email salah");
  return `status terkirim, tujuan ${baris.alamat}, diproses ${hasilProses.diproses}`;
});

await periksa("AC-09", "isi email tanpa angka keuangan", async () => {
  const terakhir = emailDiterima.at(-1);
  assert(!/Rp/.test(terakhir.text), "isi email memuat Rp");
  assert(!/1\.500\.000/.test(terakhir.text), "isi email memuat nominal");
  assert(terakhir.text.includes(NOMOR), "isi email tanpa nomor dokumen");
  assert(/https?:\/\//.test(terakhir.text), "tautan email tidak absolut");
  return `subjek "${terakhir.subject}"`;
});

// AC-04 -----------------------------------------------------------------------
await periksa("AC-04", "empat percobaan gagal menandai status gagal dengan alasan", async () => {
  const id = await buat(purchasing, "PR_DITOLAK", [idHr], `${NOMOR}-TOLAK`, "/pengeluaran/permintaan-pembelian");
  await aturMode("gagal");

  const jejak = [];
  for (let i = 0; i < 4; i += 1) {
    await majukanJadwal(id);
    await jalankanPemroses();
    const baris = await barisNotifikasi(id);
    jejak.push(`${i + 1}:${baris.status}/${baris.percobaan}`);

    if (i < 3) {
      assert(baris.status === "menunggu", `percobaan ${i + 1} seharusnya menunggu, dapat ${baris.status}`);
      assert(baris.jadwal_berikutnya !== null, "jadwal berikutnya kosong saat menunggu");
    } else {
      assert(baris.status === "gagal", `percobaan 4 seharusnya gagal, dapat ${baris.status}`);
      assert(baris.jadwal_berikutnya === null, "status gagal masih punya jadwal");
      assert(/tiga percobaan otomatis/.test(baris.alasan ?? ""), `alasan: ${baris.alasan}`);
    }
  }

  await aturMode("ok");
  return jejak.join(" → ");
});

// AC-05 -----------------------------------------------------------------------
await periksa("AC-05", "penerima tanpa alamat email membuat kiriman gagal, in-app tetap ada", async () => {
  const id = await buat(
    purchasing,
    "PR_DISETUJUI",
    [idTanpaEmail],
    `${NOMOR}-TANPA-EMAIL`,
    "/pengeluaran/permintaan-pembelian",
  );
  const baris = await barisNotifikasi(id);
  assert(baris.email_id !== null, "baris antrean email tidak dibuat");
  assert(baris.status === "gagal", `status ${baris.status}`);
  assert(/alamat email penerima belum diisi/i.test(baris.alasan ?? ""), `alasan: ${baris.alasan}`);
  assert(baris.dibaca_at === null, "notifikasi in-app tidak ada");

  const { rows } = await client.query("select count(*)::int as jumlah from public.notifikasi where id = $1", [id]);
  assert(rows[0].jumlah === 1, "notifikasi in-app hilang");
  return `status gagal, alasan "${baris.alasan}", notifikasi in-app tetap ada`;
});

// AC-06 -----------------------------------------------------------------------
await periksa("AC-06", "penyedia email mati tidak menggagalkan kejadian pemicu", async () => {
  await aturMode("down");
  const id = await buat(
    purchasing,
    "PAYROLL_DIVERIFIKASI",
    [idManajemen],
    `${NOMOR}-PAYROLL`,
    "/penggajian/periode-gaji",
  );
  const baris = await barisNotifikasi(id);
  assert(baris.status === "menunggu", `status awal ${baris.status}`);

  await majukanJadwal(id);
  const proses = await jalankanPemroses();
  const sesudah = await barisNotifikasi(id);
  assert(sesudah.status === "menunggu", `status setelah gagal kirim ${sesudah.status}`);
  assert(sesudah.percobaan === 1, `percobaan ${sesudah.percobaan}`);

  await aturMode("ok");
  return `kejadian tetap tersimpan; status menunggu setelah percobaan pertama (diproses ${proses.diproses})`;
});

// AC-07 -----------------------------------------------------------------------
await periksa("AC-07", "notifikasi yang dibuka ditandai sudah dibaca", async () => {
  const hasilRpc = await rpc(manajemen, "tandai_notifikasi_dibaca", {
    p_notifikasi_id: notifManajemen,
  });
  assert(hasilRpc.ok, `rpc tandai gagal: ${hasilRpc.teks}`);
  const baris = await barisNotifikasi(notifManajemen);
  assert(baris.dibaca_at !== null, "dibaca_at kosong setelah ditandai");
  const daftar = await pilih(manajemen, `notifikasi?select=id,dibaca_at&id=eq.${notifManajemen}`);
  assert(daftar[0].dibaca_at !== null, "layar tidak melihat status baca");
  return `dibaca_at ${baris.dibaca_at.toISOString()}`;
});

// AC-08 -----------------------------------------------------------------------
await periksa("AC-08", "tidak ada transisi gagal ke menunggu di database", async () => {
  const { rows } = await client.query(
    "select id from public.pengiriman_email where status = 'gagal' order by created_at desc limit 1",
  );
  assert(rows.length === 1, "tidak ada baris gagal untuk diuji");

  let pesan = "";
  try {
    await client.query("update public.pengiriman_email set status = 'menunggu', jadwal_berikutnya = now() where id = $1", [
      rows[0].id,
    ]);
  } catch (error) {
    pesan = error instanceof Error ? error.message : String(error);
  }
  assert(/tidak bisa dikirim ulang/i.test(pesan), `transisi gagal tidak ditolak: ${pesan}`);
  return "database menolak transisi gagal → menunggu";
});

// AC-10 -----------------------------------------------------------------------
await periksa("AC-10", "pengguna lain tidak bisa membuka notifikasi lewat id", async () => {
  const baca = await pilih(hr, `notifikasi?select=id&id=eq.${notifManajemen}`);
  assert(baca.length === 0, "HR bisa membaca notifikasi milik Manajemen");

  const tandai = await rpc(hr, "tandai_notifikasi_dibaca", { p_notifikasi_id: notifManajemen });
  assert(!tandai.ok, "HR bisa menandai notifikasi milik Manajemen");
  assert(/tidak ditemukan untuk akun/i.test(tandai.teks), `pesan: ${tandai.teks}`);
  return "baca dan tandai ditolak untuk bukan penerima";
});

// Ekstra: Karyawan tidak boleh mengirim notifikasi (D-53).
await periksa("EXTRA", "Karyawan tidak bisa mengirim notifikasi", async () => {
  const karyawan = await login("karyawan@lionmesh.test");
  const hasilRpc = await rpc(karyawan, "buat_notifikasi", {
    p_jenis: "PR_DISETUJUI",
    p_nomor_dokumen: null,
    p_penerima_ids: [idPurchasing],
    p_tautan: null,
  });
  assert(!hasilRpc.ok, "Karyawan bisa mengirim notifikasi");
  assert(/tidak berwenang/i.test(hasilRpc.teks), `pesan: ${hasilRpc.teks}`);
  return "RPC menolak peran Karyawan";
});

await client.query("update auth.users set email = $1 where id = $2", [emailTanpaAlamat, idTanpaEmail]).catch(() => {});
await client.end();
await new Promise((resolve) => serverEmail.close(resolve));

console.log("\n=== Ringkasan ===");
for (const item of hasil) console.log(`${item.id}: PASS — ${item.nama}`);
if (gagal > 0) {
  console.error(`\n${gagal} pemeriksaan gagal.`);
  process.exit(1);
}
console.log(`\n${hasil.length} pemeriksaan lulus.`);
