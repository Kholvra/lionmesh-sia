---
id: PD-006
slug: penerimaan-pembayaran
title: Penerimaan pembayaran pelanggan
epic: EPIC-PD
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: P0
size: M
depends_on:
  - FND-006
  - PD-005
blocks:
  - PD-008
  - PD-009
owner_role: kelompok Pendapatan, track PD-C (orang belum ditetapkan)
package: docs/product/items/PD-006-penerimaan-pembayaran
---

# PD-006 — Penerimaan pembayaran pelanggan

## Masalah

Uang sudah masuk dari pelanggan, tetapi tidak ada catatan yang menghubungkannya ke faktur mana. Piutang tetap terlihat belum dibayar, dan Accounting tidak bisa memverifikasi kas.

## Outcome

Finance mencatat penerimaan dari satu pelanggan. Accounting memverifikasinya; setelah itu sistem mengalokasikan nominal ke faktur tertua dulu. Setiap faktur menampilkan sisa, dan statusnya menjadi `SEBAGIAN_LUNAS` atau `LUNAS`. Piutang berkurang sesuai alokasi, dan jurnal kas tercatat.

## Aktor

| Aktor | Peran |
|---|---|
| Finance | mencatat penerimaan (`D-33`: "Catat pembayaran"); membatalkan penerimaan yang belum diverifikasi dengan alasan |
| Accounting | memverifikasi penerimaan (`D-33`: "Verifikasi pembayaran"); membatalkan penerimaan terverifikasi dengan alasan (`PQ-06`) |
| Manajemen | melihat piutang (`D-33`) |

Pencatat dan verifikator adalah dua peran berbeda (`D-48`: satu akun satu peran).

## Cakupan

### Termasuk

- Mencatat penerimaan: tanggal, nominal, metode (Transfer, Giro), pelanggan, nomor referensi.
- Alokasi otomatis ke faktur pelanggan terbuka, tertua dulu (`D-49`).
- Pembayaran parsial dan cicilan: sisa faktur tetap ada.
- Pelunasan: sisa faktur nol.
- Verifikasi oleh Accounting: membentuk jurnal dan mengurangi piutang.
- Pembatalan penerimaan (`DICATAT` tanpa jurnal; `TERVERIFIKASI` lewat jurnal pembalik).
- Jurnal kas dan piutang lewat `postJournal()`.

### Tidak termasuk

- Kelebihan bayar dan saldo kredit (`D-49`, ditolak).
- Metode Tunai di versi awal (`[USULAN-AGEN]`, lihat `00-discussion.md`).
- Rekonsiliasi bank dan impor mutasi bank (`PG-010`).
- Pembayaran ke pemasok (siklus Pengeluaran).
- Penerbitan faktur (`PD-005`).
- Retur (`PD-007`).

## States

Status penerimaan:

| Dari | Ke | Oleh | Syarat | Efek |
|---|---|---|---|---|
| — | `DICATAT` | Finance | nominal > 0; total nominal ≤ total tagihan terbuka pelanggan | tidak ada jurnal; tidak mengubah piutang |
| `DICATAT` | `TERVERIFIKASI` | Accounting (bukan pencatat) | — | alokasi berlaku; jurnal diposting; piutang berkurang; status faktur dihitung ulang |
| `DICATAT` | `DIBATALKAN` | Finance atau Accounting; alasan wajib | — | tidak ada jurnal |
| `TERVERIFIKASI` | `DIBATALKAN` | Accounting; alasan wajib (`[USULAN-AGEN]` `PQ-06`) | — | jurnal pembalik; alokasi dilepas; status faktur dihitung ulang |

Status faktur mengikuti sisa: `DITERBITKAN` (sisa = total), `SEBAGIAN_LUNAS` (0 < sisa < total), `LUNAS` (sisa = 0). Perubahan ditulis ke `riwayat_status` faktur (`D-08`). Bila seluruh faktur pesanan `LUNAS`, pesanan pindah `DIFAKTURKAN → SELESAI` (`D-46`).

## Alokasi (`D-49`)

- Nominal dialokasikan ke faktur pelanggan yang sama, dimulai dari tanggal faktur paling lama.
- Alokasi per faktur ≤ sisa faktur.
- Total alokasi = nominal penerimaan. Bila nominal melebihi total tagihan terbuka, pencatatan ditolak (kelebihan bayar).
- Pembulatan dua desimal (`analisis-sia.md` §10.6).

## Jurnal saat verifikasi (`D-44`, `D-43`)

- Dr `kas_bank` = nominal.
- Cr `piutang_usaha` = nominal.
Jurnal dibentuk lewat `postJournal()` saat `TERVERIFIKASI` dan tidak bisa diubah. Pembatalan `TERVERIFIKASI` membentuk jurnal pembalik dengan arah berlawanan.

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Nominal nol atau negatif | "Nominal pembayaran harus lebih dari nol." |
| Nominal melebihi total tagihan terbuka | "Nominal pembayaran melebihi total tagihan terbuka pelanggan. Kelebihan bayar belum didukung." |
| Pelanggan tanpa faktur terbuka | "Pelanggan ini tidak memiliki tagihan terbuka." |
| Metode di luar Transfer dan Giro | "Metode pembayaran hanya Transfer atau Giro pada versi ini." |
| Verifikasi oleh pencatat yang sama | "Pencatat penerimaan tidak dapat memverifikasi penerimaannya sendiri." |
| Verifikasi penerimaan yang bukan `DICATAT` | "Penerimaan ini tidak dalam status yang bisa diverifikasi." |
| Periode akuntansi terkunci | "Periode {bulan} sudah ditutup. Penerimaan tidak dapat dicatat." |
| Pembatalan tanpa alasan | "Alasan pembatalan wajib diisi." |
| Pembatalan oleh peran di luar Finance atau Accounting | "Anda tidak berwenang membatalkan penerimaan ini." |

## Batasan

- Jurnal hanya lewat `postJournal()` (`D-07`).
- Modul tidak membaca tabel modul lain (`D-25`); piutang dan jurnal lewat service core.
- Penerimaan tidak dihapus (`D-48`).

## Dependensi

- `PD-005` — faktur dan piutang.
- `FND-006` — ledger: peran akun, `postJournal()`, periode.
- Gate fondasi `FND-001`–`FND-006` dan `FND-007`.

## Yang membuka jalan

- `PD-008` — jurnal penjualan dan kas.
- `PD-009` — laporan piutang dan kas.

## Catatan serah terima

Metode Tunai dan lampiran bukti tidak masuk versi awal (`[USULAN-AGEN]`). Kas tunai membutuhkan akun baru, yang merupakan keputusan COA tersendiri.
