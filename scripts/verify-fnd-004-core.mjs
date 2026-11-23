#!/usr/bin/env node
// FND-004 core lifecycle and numbering checks.

import { Client } from "pg";

import {
  assert,
  createAccount,
  createDocument,
  createVerificationClient,
  expectError,
  history,
  printSummary,
  recordResult,
  registerType,
} from "./fnd004-verification-helpers.mjs";

const { client, dbUrl, suffix } = await createVerificationClient();
const results = [];

console.log("=== FND-004 core verification ===");
const { rows: versionRows } = await client.query("select version()");
console.log(`Database: ${versionRows[0].version}`);

const creator = await createAccount(client, "Gudang", suffix);
const reviewer = await createAccount(client, "Purchasing", suffix);
const genericStatuses = [
  "DRAFT",
  "DIAJUKAN",
  "DIPERIKSA",
  "DISETUJUI",
  "DIPROSES",
  "SELESAI",
  "REVISI",
  "DITOLAK",
  "DIBATALKAN",
];

await registerType(client, {
  tipe: "UJI",
  initial: "DRAFT",
  statuses: genericStatuses,
  actor: creator,
});

let firstDocument;
await recordResult(results, "AC-01", "nomor pertama per tipe/periode", async () => {
  const result = await createDocument(client, {
    tipe: "UJI",
    actor: creator,
    date: "2026-11-15",
  });
  firstDocument = result.dokumen;
  assert(firstDocument.nomor === "UJI/2026/11/0001", `Nomor salah: ${firstDocument.nomor}`);
  return firstDocument.nomor;
});

await recordResult(results, "AC-03", "riwayat BUAT pertama memakai aktor dan waktu server", async () => {
  const rows = await history(client, firstDocument.id);
  assert(rows.length === 1, `Riwayat awal harus satu baris, dapat ${rows.length}`);
  assert(rows[0].aksi === "BUAT", `Aksi harus BUAT, dapat ${rows[0].aksi}`);
  assert(rows[0].actor_id === creator, "Aktor riwayat bukan aktor dokumen");
  assert(rows[0].created_at instanceof Date, "Waktu server tidak tersimpan");
  return `aktor=${rows[0].actor_id}, aksi=BUAT, waktu=${rows[0].created_at.toISOString()}`;
});

await recordResult(results, "AC-04", "transisi di luar tabel ditolak tanpa perubahan", async () => {
  const before = firstDocument;
  const message = await expectError(
    () =>
      client.query("select public.pindah_status_dokumen($1, $2, 'SELESAI', 'SELESAI', $3)", [
        before.id,
        before.versi,
        creator,
      ]),
    "Status DRAFT tidak bisa diubah menjadi SELESAI.",
  );
  const { rows } = await client.query("select status, versi from public.dokumen where id = $1", [
    before.id,
  ]);
  assert(
    rows[0].status === "DRAFT" && Number(rows[0].versi) === Number(before.versi),
    "Dokumen berubah",
  );
  return message;
});

await recordResult(
  results,
  "AC-05",
  "tiga transisi sah menambah tiga riwayat tanpa mengubah baris lama",
  async () => {
    const before = await history(client, firstDocument.id);
    let current = firstDocument;
    let result = await client.query("select public.ajukan_dokumen($1, $2, $3) as result", [
      current.id,
      current.versi,
      reviewer,
    ]);
    current = result.rows[0].result.dokumen;
    result = await client.query("select public.periksa_dokumen($1, $2, $3) as result", [
      current.id,
      current.versi,
      reviewer,
    ]);
    current = result.rows[0].result.dokumen;
    result = await client.query("select public.proses_dokumen($1, $2, $3) as result", [
      current.id,
      current.versi,
      reviewer,
    ]);
    current = result.rows[0].result.dokumen;
    const after = await history(client, current.id);
    assert(after.length === before.length + 3, `Riwayat harus +3, ${before.length} -> ${after.length}`);
    assert(
      JSON.stringify(after.slice(0, before.length)) === JSON.stringify(before),
      "Baris riwayat lama berubah",
    );
    assert(after.at(-1).status_asal === "DISETUJUI", "Status asal riwayat salah");
    return `riwayat ${before.length} -> ${after.length}; status akhir ${current.status}`;
  },
);

await recordResult(results, "AC-02", "dua pembuatan paralel mendapat nomor berbeda", async () => {
  const before = await client.query(
    "select urut_terakhir from public.dokumen_counter where tipe = 'UJI' and periode = '2026-11-01'",
  );
  const parallelA = new Client({ connectionString: dbUrl });
  const parallelB = new Client({ connectionString: dbUrl });
  await Promise.all([parallelA.connect(), parallelB.connect()]);
  try {
    const calls = [parallelA, parallelB].map((db, index) =>
      db.query("select public.buat_dokumen('UJI', $1, 1000, $2) as result", [
        creator,
        index === 0 ? "2026-11-20" : "2026-11-21",
      ]),
    );
    const responses = await Promise.all(calls);
    const numbers = responses.map((response) => response.rows[0].result.dokumen.nomor);
    assert(new Set(numbers).size === 2, `Nomor duplikat: ${numbers.join(", ")}`);
    const after = await client.query(
      "select urut_terakhir from public.dokumen_counter where tipe = 'UJI' and periode = '2026-11-01'",
    );
    assert(
      after.rows[0].urut_terakhir === before.rows[0].urut_terakhir + 2,
      `Counter tidak naik dua: ${before.rows[0].urut_terakhir} -> ${after.rows[0].urut_terakhir}`,
    );
    return numbers.join(", ");
  } finally {
    await Promise.all([parallelA.end(), parallelB.end()]);
  }
});

await recordResult(results, "AC-15", "urutan bulan berikutnya kembali ke 0001", async () => {
  const november = await createDocument(client, {
    tipe: "UJI",
    actor: creator,
    date: "2026-11-30",
  });
  const december = await createDocument(client, {
    tipe: "UJI",
    actor: creator,
    date: "2026-12-01",
  });
  assert(november.dokumen.nomor.startsWith("UJI/2026/11/"), "Nomor November salah");
  assert(december.dokumen.nomor === "UJI/2026/12/0001", `Nomor Desember: ${december.dokumen.nomor}`);
  return `${november.dokumen.nomor} -> ${december.dokumen.nomor}`;
});

await recordResult(
  results,
  "AC-16",
  "jenis tanpa aturan approval selesai tanpa baris SETUJUI",
  async () => {
    let current = (await createDocument(client, { tipe: "UJI", actor: creator })).dokumen;
    current = (
      await client.query("select public.ajukan_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        reviewer,
      ])
    ).rows[0].result.dokumen;
    current = (
      await client.query("select public.periksa_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        reviewer,
      ])
    ).rows[0].result.dokumen;
    assert(current.status === "DISETUJUI", `Status tanpa approval: ${current.status}`);
    const { rows } = await client.query(
      "select count(*)::int as count from public.riwayat_status where dokumen_id = $1 and aksi = 'SETUJUI'",
      [current.id],
    );
    assert(rows[0].count === 0, "Ada baris SETUJUI pada jenis tanpa approval");
    return current.status;
  },
);

await recordResult(
  results,
  "AC-09",
  "dokumen tidak dapat dihapus oleh pengguna biasa maupun service",
  async () => {
    let authenticatedMessage = "";
    try {
      await client.query("begin");
      await client.query("set local role authenticated");
      await client.query("delete from public.dokumen where id = $1", [firstDocument.id]);
      await client.query("commit");
    } catch (error) {
      authenticatedMessage = error instanceof Error ? error.message : String(error);
      await client.query("rollback").catch(() => {});
    }
    assert(
      authenticatedMessage.toLowerCase().includes("permission denied"),
      `DELETE authenticated tidak ditolak: ${authenticatedMessage}`,
    );
    const serviceMessage = await expectError(
      () => client.query("delete from public.dokumen where id = $1", [firstDocument.id]),
      "Dokumen tidak bisa dihapus. Gunakan pembatalan.",
    );
    const { rows } = await client.query(
      "select count(*)::int as count from public.dokumen where id = $1",
      [firstDocument.id],
    );
    assert(rows[0].count === 1, "Dokumen hilang setelah percobaan hapus");
    return `${authenticatedMessage}; ${serviceMessage}`;
  },
);

printSummary(results);
await client.end();
