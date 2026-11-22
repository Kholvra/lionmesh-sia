---
id: PR-007
slug: laporan-produksi-dan-efisiensi
title: Laporan produksi dan efisiensi
epic: EPIC-PR
milestone: M1
lane: active
sequence: unset # topologi hybrid (backlog.md), bukan urutan strict
type: feature
req_status: specified
delivery_status: not_started
priority: P1 # D-50: mengikuti P1 analisis §5.4
size: M # D-50: usulan paket, belum disahkan koordinator
depends_on:
  - PR-006
blocks:
  - INT-001
owner_role: kelompok Produksi # pemilik track: D-50
package: docs/product/items/PR-007-laporan-produksi-dan-efisiensi
---

# PR-007 — Laporan produksi dan efisiensi

## Masalah

Produksi, gudang, manajemen, dan accounting belum punya tampilan yang menunjukkan hasil produksi, posisi WIP, dan persediaan per periode. Tidak ada cara membandingkan rencana dan hasil.

## Outcome

Pengguna yang berwenang bisa membuka laporan produksi, WIP, dan persediaan untuk periode akuntansi yang dipilih. Angka dalam laporan sama dengan angka dari dokumen sumber. Indikator efisiensi tampil dengan rumus `D-51`(f).

## Aktor dan izin

| Aktor | Peran | Dasar |
|---|---|---|
| Produksi | membuka laporan produksi dan WIP | `D-33` |
| Gudang | membuka laporan persediaan | `D-33` |
| Manajemen | membuka semua laporan produksi | `D-33` |
| Accounting | membuka semua laporan produksi | `D-33` |

Tidak ada aktor yang menulis data dari laporan.

## Cakupan

### Termasuk

- Laporan produksi per periode: WO, jumlah diproses, lulus, rework, reject, dan kerugian produksi.
- Laporan WIP per WO dan total.
- Laporan persediaan bahan, WIP, dan barang jadi, per gudang dan total (`D-52`).
- Indikator efisiensi: yield dan efisiensi bahan (`D-51`(f)).
- Filter periode akuntansi.

### Di luar cakupan

- Laporan keuangan dan tutup buku (`C-009`, `C-010`).
- Laporan lintas siklus pendapatan dan pengeluaran (`PD-009`, `PG-*`).
- Rekonsiliasi stok, jurnal, dan laporan (`INT-003`).
- Ekspor file (`D-50`: menyusul).
- Mengubah data apa pun dari laporan.

## Sumber angka

| Angka | Sumber | Catatan |
|---|---|---|
| Qty persediaan per gudang | `saldo_stok` lewat service inventory (`D-06`) | kuantitas |
| Nilai persediaan dan WIP | buku besar akun persediaan dan WIP (`D-43`) lewat service ledger | nilai |
| Jumlah diproses, lulus, rework, reject, kerugian | catatan hasil dan keputusan QC (`PR-005`) lewat service | per WO |
| Bahan standar dan bahan aktual | BOM versi WO (`PR-001`) dan konfirmasi pemakaian (`PR-004`) | efisiensi bahan |

Nilai dan kuantitas dicocokkan: total nilai per gudang dari buku besar harus sama dengan nilai `saldo_stok` × harga rata (`[USULAN-AGEN]`, lihat AC).

## Perhitungan efisiensi (`D-51`(f))

- Yield = lolos QC ÷ jumlah diproses (per WO dan per periode).
- Efisiensi bahan = bahan standar BOM untuk output lolos ÷ bahan aktual yang dikonfirmasi.
- Bahan standar untuk output lolos = Σ(qty BOM per komponen × lulus) pada versi BOM WO.
- Pembagi nol menampilkan "belum ada data", bukan nol.

Nilai toleransi dan persen mengikuti `D-51` (mekanisme berversi); tidak ada angka ditulis di sini.

## Laporan dan layar

| Laporan | Isi | Filter |
|---|---|---|
| Produksi | WO, diproses, lulus, rework, reject, kerugian, yield, efisiensi bahan | periode akuntansi |
| WIP | nilai WIP per WO dan total | periode akuntansi, per tanggal akhir periode |
| Persediaan | bahan, WIP, barang jadi; kuantitas dan nilai; per gudang dan total | periode akuntansi |

Laporan ditampilkan di layar (`D-50`).

## Validasi dan pesan

| Kondisi gagal | Pesan yang ditampilkan | Perilaku |
|---|---|---|
| Periode awal lebih besar dari akhir | "Periode awal tidak boleh setelah periode akhir." | tolak |
| Peran tanpa hak lihat | "Peran Anda tidak punya akses ke laporan ini." | tolak |
| Data sumber belum lengkap | "Angka belum lengkap untuk periode ini. Laporan belum bisa ditampilkan." | tidak menampilkan angka parsial |
| Pembagi nol pada indikator | "Belum ada data untuk menghitung indikator ini." | tampilkan keterangan, bukan nol |

## Success

- Laporan produksi dan WIP untuk satu periode bisa dibuka; angkanya cocok dengan dokumen sumber.
- Indikator efisiensi tampil dengan rumus tertulis.
- Nilai persediaan per gudang sama dengan total buku besar untuk akun persediaan.

## Edge cases

- WO lintas periode: tampil di periode tempat transaksinya dibukukan (`D-44` (5)).
- Gudang tanpa mutasi pada periode: laporan menampilkan nol, bukan kosong.
- Satu gudang (seed): pilihan gudang tidak tampil (`D-52`).

## Decision references

- `D-06`, `D-25`, `D-33`, `D-43`, `D-44` (5), `D-50`, `D-51`(f), `D-52`.
- `docs/product/epics/EPIC-PR.md`, gate selesai 1 dan 3.
- `docs/product/reference/analisis-sia.md` §5.4, §7.3, §9.2 G14. Referensi, bukan normatif.
