import assert from "node:assert/strict";
import test from "node:test";

import { JENIS_NOTIFIKASI, isJenisNotifikasi } from "./kejadian.ts";
import { susunEmail } from "./isi.ts";

test("daftar kejadian mengikuti PT-01 dan menolak nama lain", () => {
  assert.deepEqual([...JENIS_NOTIFIKASI].sort(), [
    "DOKUMEN_MENUNGGU_PERSETUJUAN",
    "PAYROLL_DIBAYAR",
    "PAYROLL_DISETUJUI",
    "PAYROLL_DIVERIFIKASI",
    "PR_DISETUJUI",
    "PR_DITOLAK",
  ]);

  assert.equal(isJenisNotifikasi("PAYROLL_DIBAYAR"), true);
  assert.equal(isJenisNotifikasi("WHATSAPP_BLAST"), false);
  assert.equal(isJenisNotifikasi(null), false);
});

test("subjek email memakai judul kejadian dari notifikasi", () => {
  const email = susunEmail({
    judul: "Dokumen menunggu persetujuan Anda — PR/2026/11/0007",
    nomorDokumen: "PR/2026/11/0007",
    tautan: "/pengeluaran/permintaan-pembelian/PR/2026/11/0007",
  });

  assert.equal(email.subjek, "Dokumen menunggu persetujuan Anda — PR/2026/11/0007");
});

test("isi email memuat nomor dokumen dan tautan", () => {
  const email = susunEmail({
    judul: "Permintaan pembelian disetujui",
    nomorDokumen: "PR/2026/11/0007",
    tautan: "/pengeluaran/permintaan-pembelian/PR/2026/11/0007",
  });

  assert.match(email.teks, /Nomor dokumen: PR\/2026\/11\/0007/);
  assert.match(email.teks, /\/pengeluaran\/permintaan-pembelian\/PR\/2026\/11\/0007/);
});

test("tautan absolut dibentuk dari basis URL bila disediakan", () => {
  const email = susunEmail({
    basisUrl: "https://sia.lionmesh.test",
    judul: "Payroll menunggu persetujuan Direksi",
    nomorDokumen: null,
    tautan: "/penggajian/periode-gaji",
  });

  assert.match(email.teks, /https:\/\/sia\.lionmesh\.test\/penggajian\/periode-gaji/);
});

test("kejadian tanpa nomor dokumen tidak menulis baris nomor", () => {
  const email = susunEmail({
    judul: "Gaji sudah dibayar; terbitkan slip",
    nomorDokumen: null,
    tautan: "/penggajian/slip-gaji",
  });

  assert.doesNotMatch(email.teks, /Nomor dokumen/);
  assert.doesNotMatch(email.teks, /null|undefined/);
});

// PT-05 dan AC-09: isi email hanya judul, nomor dokumen, dan tautan.
test("isi email tidak memuat angka keuangan walau pemanggil membawa nominal", () => {
  const notifikasi = {
    judul: "Permintaan pembelian disetujui — PR/2026/11/0007",
    nominal: "1500000",
    jumlah: 1500000,
    nomorDokumen: "PR/2026/11/0007",
    tautan: "/pengeluaran/permintaan-pembelian/PR/2026/11/0007",
  };

  const email = susunEmail(notifikasi);

  assert.doesNotMatch(email.teks, /1500000/);
  assert.doesNotMatch(email.teks, /1\.500\.000/);
  assert.doesNotMatch(email.teks, /Rp/);
});

test("teks email tidak membuka angka lain di luar nomor dokumen", () => {
  const nomor = "PO/2026/11/0042";
  const tautan = "/pengeluaran/purchase-order/PO/2026/11/0042";
  const email = susunEmail({
    judul: `Dokumen menunggu persetujuan Anda — ${nomor}`,
    nomorDokumen: nomor,
    tautan,
  });

  const tanpaNomor = email.teks.replaceAll(nomor, "").replaceAll(tautan, "");

  assert.doesNotMatch(tanpaNomor, /\d{2,}/);
});
