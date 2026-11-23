#!/usr/bin/env node
// FND-004 approval, cancellation, and concurrency checks.

import { Client } from "pg";

import {
  addRule,
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

console.log("=== FND-004 approval verification ===");
const creator = await createAccount(client, "Gudang", suffix);
const reviewer = await createAccount(client, "Purchasing", suffix);
const approverA = await createAccount(client, "Manajemen", suffix);
const approverB = await createAccount(client, "Manajemen", suffix);
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
  tipe: "UJI_BATAL",
  initial: "DRAFT",
  statuses: genericStatuses,
  actor: creator,
});
await registerType(client, {
  tipe: "UJI_APPROVAL1",
  initial: "DRAFT",
  statuses: genericStatuses,
  needsApproval: true,
  waiting: "DIPERIKSA",
  actor: creator,
});
await addRule(client, { tipe: "UJI_APPROVAL1", level: 1, role: "Manajemen", actor: creator });
await registerType(client, {
  tipe: "UJI_APPROVAL2",
  initial: "DRAFT",
  statuses: genericStatuses,
  needsApproval: true,
  waiting: "DIPERIKSA",
  actor: creator,
});
await addRule(client, { tipe: "UJI_APPROVAL2", level: 1, role: "Manajemen", actor: creator });
await addRule(client, { tipe: "UJI_APPROVAL2", level: 2, role: "Manajemen", actor: creator });
await registerType(client, {
  tipe: "PERMINTAAN_PEMBELIAN",
  initial: "DIAJUKAN",
  statuses: ["DIAJUKAN", "REVISI", "MENUNGGU_PERSETUJUAN", "DISETUJUI", "DITOLAK", "DIBATALKAN"],
  needsApproval: true,
  waiting: "MENUNGGU_PERSETUJUAN",
  actor: creator,
});
await addRule(client, {
  tipe: "PERMINTAAN_PEMBELIAN",
  level: 1,
  role: "Manajemen",
  actor: creator,
});

await recordResult(
  results,
  "AC-06",
  "dua approver paralel: satu menang, satu mendapat pesan konflik",
  async () => {
    let current = (await createDocument(client, { tipe: "UJI_APPROVAL1", actor: creator })).dokumen;
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
    const historyBefore = (await history(client, current.id)).length;

    const parallelA = new Client({ connectionString: dbUrl });
    const parallelB = new Client({ connectionString: dbUrl });
    await Promise.all([parallelA.connect(), parallelB.connect()]);
    try {
      const settled = await Promise.allSettled(
        [parallelA, parallelB].map((db) =>
          db.query("select public.setujui_dokumen($1, $2, $3) as result", [
            current.id,
            current.versi,
            approverA,
          ]),
        ),
      );
      const fulfilled = settled.filter((entry) => entry.status === "fulfilled");
      const rejected = settled.filter((entry) => entry.status === "rejected");
      assert(
        fulfilled.length === 1 && rejected.length === 1,
        "Konkurensi tidak menghasilkan satu pemenang",
      );
      assert(
        rejected[0].reason.message.includes(
          "Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru.",
        ),
        `Pesan konflik salah: ${rejected[0].reason.message}`,
      );
      const historyAfter = (await history(client, current.id)).length;
      const { rows } = await client.query("select status from public.dokumen where id = $1", [
        current.id,
      ]);
      assert(historyAfter === historyBefore + 1, "Riwayat bertambah lebih dari satu");
      assert(rows[0].status === "DISETUJUI", `Status akhir ${rows[0].status}`);
      return "satu berhasil; satu mendapat pesan konflik; riwayat +1";
    } finally {
      await Promise.all([parallelA.end(), parallelB.end()]);
    }
  },
);

await recordResult(
  results,
  "AC-07",
  "approval dua level tidak selesai sebelum level kedua",
  async () => {
    let current = (await createDocument(client, { tipe: "UJI_APPROVAL2", actor: creator })).dokumen;
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
    current = (
      await client.query("select public.setujui_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        approverA,
      ])
    ).rows[0].result.dokumen;
    assert(current.status === "DIPERIKSA", `Status setelah level 1: ${current.status}`);
    const message = await expectError(
      () =>
        client.query(
          "select public.pindah_status_dokumen($1, $2, 'DISETUJUI', 'SETUJUI', $3)",
          [current.id, current.versi, approverB],
        ),
      "Persetujuan level 2 belum lengkap.",
    );
    current = (
      await client.query("select public.setujui_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        approverB,
      ])
    ).rows[0].result.dokumen;
    assert(current.status === "DISETUJUI", `Status akhir: ${current.status}`);
    return `level 1 tetap DIPERIKSA; percobaan dini ditolak; ${message}`;
  },
);

await recordResult(
  results,
  "AC-08",
  "pemohon tidak bisa menyetujui dokumennya sendiri",
  async () => {
    let own = (await createDocument(client, { tipe: "UJI_APPROVAL1", actor: approverA })).dokumen;
    own = (
      await client.query("select public.ajukan_dokumen($1, $2, $3) as result", [
        own.id,
        own.versi,
        reviewer,
      ])
    ).rows[0].result.dokumen;
    own = (
      await client.query("select public.periksa_dokumen($1, $2, $3) as result", [
        own.id,
        own.versi,
        reviewer,
      ])
    ).rows[0].result.dokumen;
    const firstMessage = await expectError(
      () =>
        client.query("select public.setujui_dokumen($1, $2, $3)", [
          own.id,
          own.versi,
          approverA,
        ]),
      "Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri.",
    );

    let purchaseRequest = (
      await createDocument(client, { tipe: "PERMINTAAN_PEMBELIAN", actor: approverA })
    ).dokumen;
    purchaseRequest = (
      await client.query("select public.periksa_dokumen($1, $2, $3) as result", [
        purchaseRequest.id,
        purchaseRequest.versi,
        reviewer,
      ])
    ).rows[0].result.dokumen;
    const secondMessage = await expectError(
      () =>
        client.query("select public.setujui_dokumen($1, $2, $3)", [
          purchaseRequest.id,
          purchaseRequest.versi,
          approverA,
        ]),
      "Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri.",
    );
    return `${firstMessage}; ${secondMessage}`;
  },
);

await recordResult(results, "AC-10", "pembatalan sebelum posting wajib alasan", async () => {
  const cancellable = (await createDocument(client, { tipe: "UJI_BATAL", actor: creator })).dokumen;
  const cancelled = (
    await client.query("select public.batalkan_dokumen($1, $2, $3, $4) as result", [
      cancellable.id,
      cancellable.versi,
      creator,
      "Salah input",
    ])
  ).rows[0].result.dokumen;
  assert(cancelled.status === "DIBATALKAN", `Status batal: ${cancelled.status}`);
  const lastHistory = (await history(client, cancellable.id)).at(-1);
  assert(lastHistory.aksi === "BATAL", `Aksi batal: ${lastHistory.aksi}`);

  const missingReason = (await createDocument(client, { tipe: "UJI_BATAL", actor: creator })).dokumen;
  const message = await expectError(
    () =>
      client.query("select public.batalkan_dokumen($1, $2, $3, $4)", [
        missingReason.id,
        missingReason.versi,
        creator,
        "   ",
      ]),
    "Isi alasan untuk membatalkan dokumen.",
  );
  const { rows } = await client.query("select status from public.dokumen where id = $1", [
    missingReason.id,
  ]);
  assert(rows[0].status !== "DIBATALKAN", "Dokumen tanpa alasan berubah status");
  return `${cancelled.status}; ${message}`;
});

await recordResult(
  results,
  "AC-11",
  "revisi menggugurkan approval lama dan mengulang dari level 1",
  async () => {
    let current = (await createDocument(client, { tipe: "UJI_APPROVAL2", actor: creator })).dokumen;
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
    current = (
      await client.query("select public.setujui_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        approverA,
      ])
    ).rows[0].result.dokumen;
    const historyBefore = await history(client, current.id);

    current = (
      await client.query("select public.revisi_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        approverB,
      ])
    ).rows[0].result.dokumen;
    current = (
      await client.query("select public.selesaikan_revisi_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        creator,
      ])
    ).rows[0].result.dokumen;
    current = (
      await client.query("select public.ajukan_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        creator,
      ])
    ).rows[0].result.dokumen;
    current = (
      await client.query("select public.periksa_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        reviewer,
      ])
    ).rows[0].result.dokumen;

    const { rows: approvedRows } = await client.query(
      `select count(distinct level)::int as count
       from public.riwayat_status
       where dokumen_id = $1 and siklus_approval = $2 and aksi = 'SETUJUI'`,
      [current.id, current.siklus_approval],
    );
    assert(approvedRows[0].count === 0, "Approval siklus baru masih dihitung");
    const historyAfter = await history(client, current.id);
    assert(
      historyAfter.slice(0, historyBefore.length).every(
        (row, index) => JSON.stringify(row) === JSON.stringify(historyBefore[index]),
      ),
      "Riwayat lama berubah setelah revisi",
    );

    current = (
      await client.query("select public.setujui_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        approverA,
      ])
    ).rows[0].result.dokumen;
    assert(current.status === "DIPERIKSA", "Level 1 siklus baru tidak tercatat");
    current = (
      await client.query("select public.setujui_dokumen($1, $2, $3) as result", [
        current.id,
        current.versi,
        approverB,
      ])
    ).rows[0].result.dokumen;
    assert(current.status === "DISETUJUI", `Status akhir revisi: ${current.status}`);
    return `siklus ${historyBefore.at(-1).siklus_approval} -> ${current.siklus_approval}`;
  },
);

await recordResult(results, "AC-12", "penolakan wajib alasan dan final", async () => {
  let current = (await createDocument(client, { tipe: "UJI_APPROVAL1", actor: creator })).dokumen;
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
  const noReason = await expectError(
    () =>
      client.query("select public.tolak_dokumen($1, $2, $3, $4)", [
        current.id,
        current.versi,
        approverA,
        "",
      ]),
    "Isi alasan untuk menolak dokumen.",
  );
  current = (
    await client.query("select public.tolak_dokumen($1, $2, $3, $4) as result", [
      current.id,
      current.versi,
      approverA,
      "Harga tidak sesuai",
    ])
  ).rows[0].result.dokumen;
  assert(current.status === "DITOLAK", `Status tolak: ${current.status}`);
  const finalMessage = await expectError(
    () =>
      client.query("select public.proses_dokumen($1, $2, $3)", [
        current.id,
        current.versi,
        approverA,
      ]),
    "Status DITOLAK tidak bisa diubah menjadi DIPROSES.",
  );
  return `${noReason}; ${finalMessage}`;
});

await recordResult(results, "AC-13", "pembatalan setelah posting ditolak", async () => {
  const posted = (await createDocument(client, { tipe: "UJI_BATAL", actor: creator })).dokumen;
  const advanced = (
    await client.query(
      "select public.pindah_status_dokumen($1, $2, 'DIAJUKAN', 'AJUKAN', $3, null, true, null) as result",
      [posted.id, posted.versi, creator],
    )
  ).rows[0].result.dokumen;
  const message = await expectError(
    () =>
      client.query("select public.batalkan_dokumen($1, $2, $3, $4)", [
        advanced.id,
        advanced.versi,
        creator,
        "Tidak jadi",
      ]),
    "Dokumen sudah diposting. Batalkan lewat jurnal pembalik.",
  );
  const { rows } = await client.query("select status, diposting from public.dokumen where id = $1", [
    advanced.id,
  ]);
  assert(rows[0].status === "DIAJUKAN" && rows[0].diposting === true, "Status dokumen posted berubah");
  return message;
});

await recordResult(results, "AC-14", "status di luar D-46/D-47 tidak tersedia", async () => {
  const message = await expectError(
    () =>
      client.query("select public.tambah_status_jenis_dokumen('UJI_BATAL', 'TERKONFIRMASI_PELANGGAN', $1)", [
        creator,
      ]),
    "Status TERKONFIRMASI_PELANGGAN tidak tersedia.",
  );
  const { rows } = await client.query(
    "select count(*)::int as count from public.jenis_dokumen_status where tipe = 'UJI_BATAL' and status = 'TERKONFIRMASI_PELANGGAN'",
  );
  assert(rows[0].count === 0, "Status terlarang tersimpan");
  return message;
});

printSummary(results);
await client.end();
