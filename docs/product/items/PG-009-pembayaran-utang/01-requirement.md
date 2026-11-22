---
id: PG-009
slug: pembayaran-utang
title: Pembayaran utang
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: unset
size: unset
depends_on:
  - FND-006
  - PG-008
blocks:
  - INT-001
owner_role: unset
package: docs/product/items/PG-009-pembayaran-utang
---

# PG-009 — Pembayaran utang

## Masalah

Utang yang sudah diakui kepada pemasok perlu dibayar, sering sebagian dan sering untuk beberapa invoice sekaligus. Tanpa pencatatan pembayaran yang rapi, saldo utang tidak bisa dicocokkan dengan kas, dan bukti transfer hilang.

## Outcome

Finance mencatat pembayaran kepada pemasok dan mengalokasikannya otomatis ke satu atau beberapa invoice yang sudah diakui, tertua dulu. Accounting memverifikasi pembayaran sebelum transfer dicatat. Saldo utang berkurang sesuai alokasi, sisa utang tetap terlihat, dan pembayaran gagal atau parsial ditandai. Bukti transfer tersimpan. Saldo utang di laporan sama dengan jurnal.

## Aktor

| Aktor | Peran pada item ini | Sumber |
|---|---|---|
| Finance | mencatat pembayaran dan hasil transfer | `policies/matriks-izin.md` (D-33): Bayar pemasok = Finance |
| Accounting | memverifikasi pembayaran sebelum transfer; pemilik jurnal dan saldo utang | D-47 (e): Verifikasi pembayaran pemasok = Accounting; D-33 (Accounting tidak mengeksekusi) |
| Manajemen | tidak terlibat (pembayaran pemasok tidak berjenjang) | D-51 (c) |
| Sistem | menghitung alokasi, menolak pembayaran tidak valid, menulis jurnal | ARCH-001 BOUNDARY-01, BOUNDARY-02 |

## Ringkasan (derived)

- Track: PG-D utang. Level 8 (derived dari backlog).
- Menyentuh uang dan memblokir `INT-001`.
- Ukuran sedang (usulan M). Laporan milik core (C-009), bukan item ini.

## Cakupan

### Termasuk

- Pencatatan pembayaran kepada pemasok (R-01).
- Alokasi otomatis ke invoice tertua, dan kelebihan bayar ditolak (R-01, R-02).
- Verifikasi Accounting sebelum transfer (R-03).
- Hasil transfer: berhasil atau gagal (R-04).
- Penyimpanan bukti transfer (R-05).
- Jurnal pembayaran saat transfer berhasil (R-06).
- Pembalikan pembayaran dengan jurnal pembalik (R-09).
- Daftar pembayaran dan sisa per invoice, serta read model saldo utang lewat core (R-12).

### Tidak termasuk

- Pengakuan utang dan pencocokan invoice (PG-008).
- Rekonsiliasi mutasi bank (PG-010).
- Laporan utang dan laporan pembelian sebagai layar (C-009, D-25).
- Pembayaran gaji dan pembayaran pelanggan.
- Portal pemasok (D-23).
- Approval berjenjang pembayaran (D-51 (c)).

## Constraints & invariants

- Pembayaran parsial menyisakan saldo (`analisis-sia.md` §8.1).
- Transfer gagal atau parsial harus ditandai (§8.1).
- Finance menyimpan bukti transfer (§8.1).
- Pembayaran tidak boleh melebihi utang yang tersisa (D-49).
- Dokumen tidak dihapus, hanya dibatalkan lewat jurnal pembalik (D-48).
- Jurnal hanya lewat `postJournal()` (D-07). Tidak ada jurnal manual (D-43).
- Jurnal pembayaran: Dr 201 Utang usaha / Cr 102 Bank (peran `kas_bank`), senilai nominal (D-41; pasangan dari `proses-bisnis.md` jurnal 3).
- Pemohon PR tidak boleh membayar invoice yang berasal dari PR-nya; sistem menelusuri invoice → PO → PR (D-42).
- Accounting tidak mengeksekusi pembayaran (D-33).
- Nominal dan alokasi berupa bilangan bulat rupiah (R-07).

## Behavior / rules

### Aturan (keputusan terkunci atau [USULAN-AGEN], lihat `00-discussion.md`)

- `R-01` Finance mencatat pembayaran: pemasok, nominal (bilangan bulat rupiah lebih dari nol), tanggal, dan rekening bank aktif (master rekening, peran `kas_bank`). Sistem mengalokasikan nominal otomatis ke invoice `TERCATAT` atau `DIBAYAR_SEBAGIAN` pemasok itu, urut tanggal invoice tertua dulu, lalu nomor invoice (D-49). Invoice `COCOK`, `SELISIH`, atau `DIBATALKAN` tidak bisa dibayar. Total alokasi selalu sama dengan nominal.
- `R-02` Kelebihan bayar ditolak. Nominal tidak boleh melebihi total sisa utang pemasok yang dapat dialokasikan. Tidak ada saldo kredit pemasok (D-49).
- `R-03` Verifikasi Accounting: sebelum hasil transfer dicatat, pembayaran harus diverifikasi Accounting. Verifikasi berupa kolom `diverifikasi_oleh` dan `diverifikasi_pada`, bukan status baru (D-47 (e); [USULAN-AGEN]). Verifikator tidak boleh sama dengan pencatat (D-48).
- `R-04` Hasil transfer, dicatat Finance setelah verifikasi:
  - Berhasil: dalam satu transaksi, pembayaran dan alokasi disimpan, sisa tiap invoice dikurangi, status invoice menjadi `DIBAYAR_SEBAGIAN` (sisa masih ada) atau `LUNAS` (sisa nol), jurnal dibuat (R-06), dan bukti transfer tersimpan (R-05) (D-46, D-43).
  - Gagal: pembayaran dicatat dengan status `GAGAL_TRANSFER` ([USULAN-AGEN], nama dari diagram §5.4). Tidak ada jurnal dan utang tidak berubah. Transfer dapat diulang dengan alasan tercatat (pola D-49 untuk gaji, diterapkan ke pemasok [USULAN-AGEN]).
- `R-05` Bukti transfer: lampiran PDF, JPG, atau PNG. Wajib saat hasil berhasil dicatat. Disimpan dan terhubung ke pembayaran. Batas ukuran adalah parameter konfigurasi ([USULAN-AGEN]).
- `R-06` Jurnal pembayaran dibuat hanya saat transfer berhasil: Dr 201 Utang usaha / Cr 102 Bank (peran `kas_bank`), senilai nominal. Total debit sama dengan total kredit (D-41, D-43).
- `R-07` Nominal dan alokasi berupa bilangan bulat rupiah. Pembayaran tidak membulatkan apa pun, sehingga tidak ada selisih pembulatan pada pembayaran ([USULAN-AGEN]).
- `R-08` Tanggal pembayaran boleh mundur hanya ke periode yang terbuka. Tanggal di periode terkunci ditolak (FND-006; D-44 (5); D-50) ([USULAN-AGEN]).
- `R-09` Pembayaran yang sudah berhasil tidak dihapus. Pembalikan hanya dengan jurnal pembalik (D-35, D-48) oleh Finance dengan alasan wajib. Alokasi dibalik, status pembayaran menjadi `DIBATALKAN`, dan status invoice dihitung ulang dari sisa. Perubahan status invoice dicatat di riwayat ([USULAN-AGEN]; lihat pertentangan D-48 di `00-discussion.md`).
- `R-10` Status invoice mengikuti D-46: `TERCATAT` → `DIBAYAR_SEBAGIAN` → `LUNAS`. `LUNAS` hanya bila sisa nol.
- `R-11` Pemisahan tugas: pemohon PR tidak boleh membayar invoice dari PR-nya (D-42, telusur invoice → PO → PR). Finance mencatat dan Accounting memverifikasi, dua peran yang berbeda (D-33, D-48).
- `R-12` Daftar pembayaran dan sisa per invoice tampil di layar PG-009. Saldo utang per pemasok dibaca dari core (service atau read model), tidak dari tabel modul lain (D-25). Laporan utang tampil di C-009 ([USULAN-AGEN]).

### Alur utama

1. Finance membuka pemasok dengan utang yang sudah diakui, mencatat nominal, tanggal, dan rekening (R-01).
2. Sistem mengalokasikan otomatis (tertua dulu) dan memvalidasi kelebihan bayar (R-01, R-02).
3. Accounting memverifikasi pembayaran (R-03).
4. Finance mencatat hasil transfer. Bila berhasil, sistem menyimpan pembayaran, mengurangi sisa, memperbarui status, dan membuat jurnal. Bukti transfer dilampirkan (R-04, R-05, R-06).
5. Bila gagal, status `GAGAL_TRANSFER` tercatat tanpa efek ke utang (R-04).
6. Accounting melihat saldo utang yang berubah dan jurnal yang terbentuk (R-12).

### Status

| Status | Objek | Arti | Transisi |
|---|---|---|---|
| `TERCATAT` (D-46) | invoice | ada sisa utang belum dibayar | ke `DIBAYAR_SEBAGIAN` atau `LUNAS` |
| `DIBAYAR_SEBAGIAN` (D-46) | invoice | sebagian sudah dibayar, sisa tercatat | ke `LUNAS` |
| `LUNAS` (D-46) | invoice | sisa nol | — (kecuali pembalikan R-09) |
| `GAGAL_TRANSFER` ([USULAN-AGEN]) | pembayaran | transfer belum sempurna; tidak mengurangi utang | diulang sebagai pembayaran baru yang menunjuk alokasi yang sama |
| `DIBATALKAN` (R-09) | pembayaran | dibalik dengan jurnal pembalik | — |

Parsial tidak punya status terpisah: pembayaran sebagian menghasilkan `DIBAYAR_SEBAGIAN`.

### Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Nominal nol, negatif, atau bukan bilangan bulat | Ditolak; pesan menyebut nominal harus bilangan bulat lebih dari nol |
| Nominal melebihi total sisa utang pemasok | Ditolak; pesan menyebut total sisa utang (kelebihan bayar) |
| Alokasi melebihi sisa invoice | Ditolak; pesan menyebut invoice dan sisanya |
| Invoice belum `TERCATAT` atau `DIBAYAR_SEBAGIAN` | Ditolak; pesan menyebut status invoice |
| Tanggal pembayaran di periode terkunci | Ditolak; pesan menyebut periode terkunci |
| Rekening bank tidak dipilih atau tidak aktif | Ditolak; pesan menyebut rekening |
| Hasil transfer dicatat sebelum verifikasi | Ditolak; pesan menyebut verifikasi Accounting belum ada |
| Verifikator sama dengan pencatat | Ditolak; pesan menyebut pemisahan tugas |
| Hasil berhasil tanpa bukti transfer | Ditolak; pesan menyebut bukti transfer wajib |
| Pembayaran untuk invoice dari PR milik pencatat | Ditolak; pesan menyebut telusuran invoice → PO → PR |
| Pembalikan tanpa alasan | Ditolak; pesan menyebut alasan wajib diisi |

Teks pesan final mengikuti implementasi; yang diikat adalah isi informasi pesan.

## Success

- Saldo utang per pemasok sama dengan total utang diakui dikurangi total pembayaran teralokasi.
- Setiap pembayaran berhasil punya satu jurnal yang balance.
- Setiap pembayaran gagal atau parsial terlihat, tidak tersembunyi.

## Edge cases (optional)

- Satu pembayaran menutup tiga invoice sekaligus (R-01, AC-03).
- Pembayaran parsial yang menyisakan sisa kecil (AC-02).
- Pembayaran dicoba ulang setelah transfer gagal (R-04, AC-08).
- Pembayaran di tanggal akhir periode akuntansi sebelum ditutup (R-08).

## Decision references (optional)

- `EPIC-PG` gate 1 dan gate 4.
- `D-07`, `D-08`, `D-25`, `D-33`, `D-35`, `D-41`, `D-42`, `D-43`, `D-44`, `D-46`, `D-47`, `D-48`, `D-49`, `D-50`, `D-51`.
- Pertanyaan dan jawabannya: lihat `00-discussion.md`.

## Catatan serah terima

Requirement ini mengikat perilaku dan bukti. Akun kas dan bank ada di D-41. Pembulatan tidak berlaku pada pembayaran (R-07). Status dan aturan tambahan ditandai [USULAN-AGEN] menunggu penguncian koordinator. Desain kontrak ada di `04-design-contract.md` (status `Proposed`).
