import assert from "node:assert/strict";
import test from "node:test";

import type { Peran } from "@/lib/auth/types";
import {
  bolehMenindaklanjuti,
  hitungKartu,
  levelMenunggu,
  sumberPerSiklus,
  susunAntrean,
} from "./antrean.ts";
import type { DokumenMenunggu, PersetujuanTercatat } from "./types.ts";

function dokumen(
  overrides: Partial<DokumenMenunggu> & Pick<DokumenMenunggu, "id">,
): DokumenMenunggu {
  return {
    tipe: "PERMINTAAN_PEMBELIAN",
    nomor: "PR/2026/11/0001",
    status: "MENUNGGU_PERSETUJUAN",
    pembuatId: "pembuat",
    namaJenis: "Permintaan pembelian",
    perluApproval: true,
    statusMenungguApproval: "MENUNGGU_PERSETUJUAN",
    approvalSnapshot: [{ level: 1, peran: "Manajemen" }],
    siklusApproval: 0,
    mulaiMenunggu: "2026-11-20T08:00:00.000Z",
    ...overrides,
  };
}

function setujui(
  overrides: Partial<PersetujuanTercatat> & Pick<PersetujuanTercatat, "level" | "actorId">,
): PersetujuanTercatat {
  return {
    dokumenId: "d1",
    siklusApproval: 0,
    ...overrides,
  };
}

const AKTOR_MANAJEMEN = { id: "manajer", peran: "Manajemen" as Peran };

test("hanya peran pada level berikutnya yang melihat dokumen", () => {
  const d1 = dokumen({ id: "d1" });

  assert.equal(bolehMenindaklanjuti(d1, [], AKTOR_MANAJEMEN), true);
  assert.equal(
    bolehMenindaklanjuti(d1, [], { id: "purchasing", peran: "Purchasing" }),
    false,
  );
});

test("pemohon tidak melihat dokumen yang dia ajukan sendiri", () => {
  const d1 = dokumen({ id: "d1", pembuatId: "manajer" });

  assert.equal(bolehMenindaklanjuti(d1, [], AKTOR_MANAJEMEN), false);
});

test("level berikutnya harus disetujui orang yang berbeda", () => {
  const d1 = dokumen({
    id: "d1",
    approvalSnapshot: [
      { level: 1, peran: "Manajemen" },
      { level: 2, peran: "Direksi" },
    ],
  });
  const riwayat = [setujui({ level: 1, actorId: "manajer" })];

  assert.equal(
    bolehMenindaklanjuti(d1, riwayat, { id: "manajer", peran: "Direksi" }),
    false,
  );
  assert.equal(
    bolehMenindaklanjuti(d1, riwayat, { id: "direktur", peran: "Direksi" }),
    true,
  );
});

test("dokumen keluar dari antrean setelah semua level disetujui", () => {
  const d1 = dokumen({
    id: "d1",
    approvalSnapshot: [
      { level: 1, peran: "Manajemen" },
      { level: 2, peran: "Direksi" },
    ],
  });
  const riwayat = [
    setujui({ level: 1, actorId: "manajer" }),
    setujui({ level: 2, actorId: "direktur" }),
  ];

  assert.equal(levelMenunggu(d1, riwayat), null);
  assert.equal(
    bolehMenindaklanjuti(d1, riwayat, { id: "direktur2", peran: "Direksi" }),
    false,
  );
});

test("antrean berisi tahap dan diurutkan dari yang paling lama menunggu", () => {
  const d1 = dokumen({
    id: "d1",
    nomor: "PR/2026/11/0002",
    mulaiMenunggu: "2026-11-21T09:00:00.000Z",
  });
  const d2 = dokumen({
    id: "d2",
    nomor: "PR/2026/11/0001",
    mulaiMenunggu: "2026-11-20T08:00:00.000Z",
    approvalSnapshot: [
      { level: 1, peran: "Manajemen" },
      { level: 2, peran: "Direksi" },
    ],
  });

  const hasil = susunAntrean([d1, d2], [], AKTOR_MANAJEMEN);

  assert.deepEqual(
    hasil.antrean.map((item) => item.nomor),
    ["PR/2026/11/0001", "PR/2026/11/0002"],
  );
  assert.equal(hasil.antrean[0].tahap, "Persetujuan level 1 dari 2");
  assert.equal(hasil.antrean[1].tahap, "Persetujuan level 1 dari 1");
  assert.equal(hasil.antrean[0].siklus, "Pengeluaran");
  assert.equal(hasil.antrean[0].tautan, null);
});

test("kartu menghitung dokumen berbeda dari himpunan antrean yang sama", () => {
  const dokumenList = [
    dokumen({ id: "d1", nomor: "PR/2026/11/0001" }),
    dokumen({ id: "d2", nomor: "PR/2026/11/0002" }),
    dokumen({
      id: "d3",
      nomor: "PERIODE_GAJI/2026/11/0001",
      tipe: "PERIODE_GAJI",
      pembuatId: "hr",
      approvalSnapshot: [{ level: 1, peran: "Manajemen" }],
    }),
  ];
  const { antrean } = susunAntrean(dokumenList, [], AKTOR_MANAJEMEN);
  const kartu = hitungKartu(antrean, {
    Pendapatan: "belum-tersedia",
    Pengeluaran: "tersedia",
    Produksi: "belum-tersedia",
    Penggajian: "tersedia",
  });

  assert.equal(kartu.find((item) => item.siklus === "Pengeluaran")?.jumlah, 2);
  assert.equal(kartu.find((item) => item.siklus === "Penggajian")?.jumlah, 1);
  assert.equal(
    kartu.find((item) => item.siklus === "Pendapatan")?.status,
    "belum-tersedia",
  );
  assert.equal(kartu.find((item) => item.siklus === "Pendapatan")?.jumlah, null);
});

test("sumber gagal tidak disajikan sebagai nol", () => {
  const kartu = hitungKartu([], {
    Pendapatan: "belum-tersedia",
    Pengeluaran: "gagal",
    Produksi: "belum-tersedia",
    Penggajian: "tersedia",
  });

  assert.equal(kartu.find((item) => item.siklus === "Pengeluaran")?.status, "gagal");
  assert.equal(kartu.find((item) => item.siklus === "Pengeluaran")?.jumlah, null);
  assert.equal(kartu.find((item) => item.siklus === "Penggajian")?.jumlah, 0);
});

test("sumber hanya tersedia untuk siklus yang punya jenis dokumen terdaftar", () => {
  const sumber = sumberPerSiklus(["PERMINTAAN_PEMBELIAN"], false);

  assert.equal(sumber.Pengeluaran, "tersedia");
  assert.equal(sumber.Penggajian, "belum-tersedia");
  assert.equal(sumber.Pendapatan, "belum-tersedia");
  assert.equal(sumber.Produksi, "belum-tersedia");
});

test("sumber yang gagal ditandai gagal, bukan nol atau belum tersedia", () => {
  const sumber = sumberPerSiklus(["PERMINTAAN_PEMBELIAN"], true);

  assert.equal(sumber.Pengeluaran, "gagal");
  assert.equal(sumber.Penggajian, "belum-tersedia");
});

test("dokumen yang belum menunggu approval tidak masuk antrean", () => {
  const d1 = dokumen({ id: "d1", status: "DIAJUKAN" });

  assert.equal(
    bolehMenindaklanjuti(d1, [], AKTOR_MANAJEMEN),
    false,
  );
});

test("tipe dokumen tanpa pemetaan siklus tidak dihitung diam-diam", () => {
  const d1 = dokumen({ id: "d1", tipe: "TIPE_BARU" });

  const hasil = susunAntrean([d1], [], AKTOR_MANAJEMEN);

  assert.equal(hasil.antrean.length, 0);
  assert.equal(hasil.tanpaSiklus, 1);
});
