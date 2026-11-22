---
id: PD-005
slug: faktur-piutang
title: Faktur penjualan dan piutang
epic: EPIC-PD
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: P0
size: L
depends_on:
  - FND-006
  - PD-004
blocks:
  - PD-006
  - PD-007
  - PD-008
  - PD-009
owner_role: kelompok Pendapatan, track PD-C (orang belum ditetapkan)
package: docs/product/items/PD-005-faktur-piutang
---

# PD-005 — Faktur penjualan dan piutang

## Masalah

Barang sudah dikirim, tetapi tagihan belum diterbitkan dan piutang belum tercatat. Accounting tidak tahu jatuh tempo, dan laporan piutang tidak bisa dibuat.

## Outcome

Accounting menerbitkan faktur dari satu pengiriman yang sudah dikirim. Faktur menampilkan nilai barang, diskon, DPP, PPN, total, nomor faktur pajak, dan jatuh tempo. Piutang pelanggan bertambah, dan daftar piutang menampilkan umur tiap faktur.

## Aktor

| Aktor | Peran |
|---|---|
| Accounting | membuat, menerbitkan, dan membatalkan faktur; mengisi nomor faktur pajak (`D-33`) |
| Manajemen | melihat piutang (`D-33`) |
| Penjualan | tidak melihat piutang (`D-33`) |

## Cakupan

### Termasuk

- Menerbitkan faktur dari satu pengiriman `DIKIRIM`.
- Menghitung nilai faktur dari qty kirim dan harga serta diskon baris pesanan.
- PPN per baris dari tarif berversi pada tanggal faktur (`D-51(a)`).
- Input nomor faktur pajak secara manual, tanpa validasi format.
- Jatuh tempo dari termin.
- Daftar piutang per pelanggan dan umur (aging) dengan bucket parameter (`D-51(f)`).
- Pembatalan faktur (dibatalkan, tidak dihapus).

### Tidak termasuk

- Integrasi e-Faktur (`D-24`).
- Penerimaan pembayaran dan alokasi (`PD-006`).
- Retur dan kredit memo (`PD-007`).
- Jurnal penjualan lengkap (`PD-008`); item ini hanya memicu jurnal faktur.
- Laporan piutang ke layar laporan (`PD-009`).

## States

Status faktur:

| Dari | Ke | Oleh | Syarat | Efek |
|---|---|---|---|---|
| — | `DRAFT` | Accounting | pengiriman `DIKIRIM` belum punya faktur | belum ada piutang |
| `DRAFT` | `DITERBITKAN` | Accounting | nomor faktur pajak terisi; tarif berlaku ada; periode tidak terkunci | piutang bertambah; jurnal diposting |
| `DITERBITKAN` | `SEBAGIAN_LUNAS` | sistem via `PD-006` | pembayaran parsial | sisa piutang turun |
| `DITERBITKAN` / `SEBAGIAN_LUNAS` | `LUNAS` | sistem via `PD-006` | sisa = 0 | — |
| `DRAFT` | `DIBATALKAN` | Accounting; alasan wajib | — | tidak ada jurnal |
| `DITERBITKAN` | `DIBATALKAN` | Accounting; alasan wajib (`[USULAN-AGEN]` `PQ-08`) | belum ada pembayaran | jurnal pembalik; pengiriman dilepas dari faktur |

Setiap transisi menulis `riwayat_status` dengan aktor dan waktu (`D-08`). Pesanan pindah ke `DIFAKTURKAN` bila seluruh pengirimannya sudah memiliki faktur `DITERBITKAN` (`[USULAN-AGEN]` `PQ-01`), dan ke `SELESAI` bila seluruh faktur `LUNAS` (`D-46`).

## Rumus

Per baris faktur: nilai kotor = qty kirim × harga baris pesanan; diskon = nilai kotor × persen diskon baris; DPP baris = nilai kotor − diskon; PPN baris = DPP baris × T, T dari `konfigurasi_pajak` yang berlaku pada tanggal faktur (`D-51(a)`); dibulatkan dua desimal per baris.
Per faktur: DPP = Σ DPP baris; PPN = Σ PPN baris; total = DPP + PPN.
Jatuh tempo = tanggal faktur + termin pesanan (`D-14`, `D-49`).

## Jurnal saat terbit (`D-44` (3), `D-43`)

- Dr `piutang_usaha` = total faktur.
- Cr `penjualan` = DPP.
- Cr `ppn_keluaran` = PPN.
Jurnal dibentuk lewat `postJournal()` dan langsung diposting (`D-43`).

## Umur piutang (`D-51(f)`)

Umur = hari lewat jatuh tempo pada tanggal laporan (`[USULAN-AGEN]`). Bucket: belum jatuh tempo (umur ≤ 0), 1–30, 31–60, 61–90, lebih dari 90 hari. Bucket adalah parameter, bukan hardcode.

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Pengiriman belum dikirim | "Faktur hanya dapat dibuat dari pengiriman yang sudah dikirim." |
| Pengiriman sudah difakturkan | "Pengiriman ini sudah memiliki faktur." |
| Tarif PPN tidak ditemukan untuk tanggal faktur | "Tarif PPN belum tersedia untuk tanggal ini." |
| Nomor faktur pajak kosong saat terbit | "Nomor faktur pajak wajib diisi sebelum faktur diterbitkan." |
| Termin kosong | "Termin pembayaran wajib diisi." |
| Periode akuntansi terkunci | "Periode {bulan} sudah ditutup. Faktur tidak dapat diterbitkan." |
| Batal faktur yang sudah dibayar | "Faktur yang sudah menerima pembayaran tidak dapat dibatalkan." |
| Batal tanpa alasan | "Alasan pembatalan wajib diisi." |
| Pengguna bukan Accounting menerbitkan | "Anda tidak berwenang menerbitkan faktur." |

Nomor faktur pajak tidak divalidasi formatnya (`D-51(a)`).

## Batasan

- Jurnal hanya lewat `postJournal()` (`D-07`); langsung diposting tanpa draft dan tidak bisa diubah (`D-43`).
- Periode akuntansi terkunci menolak penerbitan (`ARCH-001` `PRE-02`).
- Modul tidak membaca tabel modul lain (`D-25`).
- Faktur tidak dihapus (`analisis-sia.md` §7.1).

## Dependensi

- `PD-004` — pengiriman `DIKIRIM`.
- `FND-006` — ledger: peran akun, `postJournal()`, periode.
- Gate fondasi `FND-001`–`FND-006` dan `FND-007`.

## Yang membuka jalan

- `PD-006` — pembayaran terhadap faktur.
- `PD-007` — retur mengacu faktur.
- `PD-008` — jurnal penjualan.
- `PD-009` — laporan piutang.

## Catatan serah terima

Nilai tarif PPN ditetapkan melalui mekanisme berversi (`D-51(a)`) dan diverifikasi serta dikutip sumbernya saat implementasi. Akun `ppn_keluaran` menunggu nomor di `FND-006`.
