---
id: INT-002
slug: rantai-end-to-end
title: Rantai end-to-end dari db:reset dan db:seed
epic: EPIC-INT
milestone: M2
lane: active
sequence: n/a
type: chore
req_status: specified
delivery_status: not_started
priority: P0
size: L
depends_on:
  - FND-008
  - INT-001
blocks: []
owner_role: tech lead
package: docs/product/items/INT-002-rantai-end-to-end
---

# INT-002 — Rantai end-to-end dari db:reset dan db:seed

## Masalah

Setiap siklus bisa berjalan di lingkungan yang sudah berisi data sisa. Akibatnya, tidak ada yang tahu apakah dokumen dari satu siklus bisa dilanjutkan oleh siklus berikutnya dari kondisi awal yang bersih.

## Outcome

Dari `db:reset` lalu `db:seed`, satu rantai dokumen dapat dijalankan dari pesanan sampai laporan, tanpa perubahan database manual:

1. pesanan penjualan dibuat dan lolos cek kredit dan stok (sesuai PT-04);
2. kebutuhan bahan menjadi permintaan pembelian, lalu PO, lalu penerimaan;
3. perintah produksi dijalankan, bahan dipakai, dan hasil dicatat;
4. payroll periode itu dihitung, diperiksa, dan dibayar;
5. laporan keuangan menampilkan angka yang sesuai dengan nilai yang diharapkan.

Setiap perpindahan status tercatat. Setiap posting menghasilkan jurnal yang balance. Nama status mengikuti `D-46`.

Skenario uji: skenario kawat dari analisis §6 (500 lembar wire mesh, stok 200, satu karyawan lembur) sebagai data ilustratif, plus tiga jalur gagal: batas kredit, permintaan ditolak, dan QC gagal (`D-51` (g)).

## Aktor

| Aktor | Peran |
|---|---|
| Penguji | menjalankan rantai dan memeriksa hasilnya; tech lead atau yang ditunjuk (PT-07, `[USULAN-AGEN]`) |
| Setiap siklus | menjalankan langkah masing-masing lewat aturan core |
| Sistem (core) | mencatat riwayat dan jurnal |

## Cakupan

### Termasuk

- Rantai pesanan → pengadaan → produksi → payroll → laporan.
- Pemeriksaan status akhir setiap dokumen dalam rantai.
- Pemeriksaan jurnal balance per perpindahan status yang memposting.
- Pemeriksaan angka laporan terhadap nilai yang diharapkan.
- Tiga jalur gagal: batas kredit, permintaan ditolak, QC gagal (`D-51` (g)).

### Tidak termasuk

- Skenario acuan: `D-51` (g), terjawab (PT-01). Nilai yang diharapkan: PT-02 (`[USULAN-AGEN]`).
- Pemeriksaan jurnal gabungan: milik `INT-001`.
- Rekonsiliasi stok: milik `INT-003`.
- Logika setiap langkah: milik item siklus masing-masing.

## Status dan transisi

Status akhir setiap dokumen dalam rantai ditentukan sebelum rantai dijalankan (PT-02, `[USULAN-AGEN]`). Status yang diharapkan dicatat di `05-evidence.md` sebelum run.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Langkah rantai gagal | rantai berhenti; menyebut langkah dan dokumen |
| Jurnal tidak balance pada langkah tertentu | rantai berhenti; menyebut jurnal |
| Status akhir berbeda dari yang diharapkan | pemeriksaan gagal; menyebut dokumen dan status |
| Data uji belum diseed | rantai menolak jalan; sebut `pnpm db:seed` |

Teks final ditentukan implementasi.

## Batasan

- Tidak ada perubahan database manual selama rantai (`EPIC-INT` gate 5).
- Data uji hanya dari `db:reset` + `db:seed` (`D-30`).
- Reset berakhir di skema `siap`; seed berjalan dari kondisi itu (`D-30`).
- Nilai yang diharapkan ditulis sebelum rantai dijalankan (`[USULAN]`).

## Dependensi

- `INT-001` harus `done`.
- `FND-008` (seed) ada di `depends_on` backlog. `FND-008` menyeed seluruh master rantai (PT-03, `[USULAN-AGEN]`).
- Seluruh siklus yang dilalui rantai harus `done` (transitif lewat `INT-001`).

## Yang membuka jalan

- Tidak ada item di backlog yang `depends on` `INT-002`.

## Catatan serah terima

`sequence` tidak diisi karena item ini berada di level join (level 10). Lihat `INT-001`.

Skenario analisis §6 hanya dipakai sebagai data ilustratif (`D-51` (g)), tidak sebagai fakta perusahaan. Nilai yang diharapkan dihitung tangan (PT-02).
