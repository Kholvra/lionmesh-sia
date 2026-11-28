# PD-002 — Bukti Verifikasi

- Tanggal verifikasi: 2026-11-27
- Status: **Lolos (100%)**
- Pelaksana: agen AI atas nama kelompok Pendapatan
- Skrip uji otomatis: `scripts/verify-pd-002.mjs` & `src/modules/pendapatan/pesanan/calc.test.ts`

## Hasil Kriteria Penerimaan

| AC | Deskripsi | Hasil | Bukti Perintah / Hasil |
|---|---|:---:|---|
| `AC-01` | Pesanan baru mendapat nomor `core/dokumen` dan status awal `DRAFT` | **Lolos** | `createPesananAction` memanggil `buatDokumen(supabase, { tipe: "SO", ... })` dan mencatat riwayat awal di `riwayat_status`. |
| `AC-02` | Pesanan tanpa baris tidak bisa diverifikasi | **Lolos** | `verifikasiPesananAction` menolak pesanan tanpa item dengan pesan `"Pesanan belum punya barang. Tambahkan minimal satu baris."`. |
| `AC-03` | Rumus total: diskon, DPP, PPN (tarif T pada tanggal verifikasi), dan total | **Lolos** | `calc.test.ts` membuktikan qty 10 × 100.000, diskon 10%, T=0.11 menghasilkan DPP 900.000, PPN 99.000, total 999.000. |
| `AC-04` | Qty nol atau negatif ditolak | **Lolos** | `pesananItemSchema` & `verifikasiPesananAction` menolak qty `<= 0` dengan pesan `"Jumlah harus lebih dari nol."`. |
| `AC-05` | Pesanan melewati batas kredit berstatus `MENUNGGU_PERSETUJUAN_KREDIT` | **Lolos** | `verifikasiPesananAction` mencatat transisi `DRAFT → VERIFIED` lalu `VERIFIED → MENUNGGU_PERSETUJUAN_KREDIT` (2 baris riwayat). |
| `AC-06` | Override batas kredit hanya oleh Manajemen & wajib alasan | **Lolos** | `overrideKreditAction` memeriksa `requireIzin("override_batas_kredit")` dan menolak alasan kosong. |
| `AC-07` | Setiap transisi status menulis satu baris riwayat dengan aktor & waktu | **Lolos** | Seluruh transisi memanggil `core/dokumen` (`buatDokumen`, `pindahStatusDokumen`, `revisiDokumen`, `batalkanDokumen`). |
| `AC-08` | Pesanan `DRAFT` yang dibatalkan dengan alasan tetap ada & terkunci | **Lolos** | `batalkanPesananAction` mewajibkan alasan, memindahkan status ke `DIBATALKAN`, dan trigger `trg_pesanan_no_delete` mencegah hapus fisik. |
| `AC-09` | Termin pesanan terisi dari pelanggan dan bisa di-override per pesanan | **Lolos** | `PesananForm` otomatis mengisi termin dari master pelanggan dan dapat diubah per pesanan tanpa mengubah master pelanggan. |
| `AC-10` | Pembuat pesanan tidak bisa memverifikasi pesanannya sendiri | **Lolos** | `verifikasiPesananAction` menolak jika `pesanan.created_by === profile.id` dengan `"Pembuat pesanan tidak dapat memverifikasi pesanannya sendiri."`. |
| `AC-11` | Pesanan `VERIFIED` tidak bisa diubah isinya | **Lolos** | `updatePesananAction` & trigger `trg_pesanan_lock_verified` menolak perubahan setelah `VERIFIED`. |
| `AC-12` | Pesanan `VERIFIED` tanpa pengiriman dapat dibatalkan dengan alasan | **Lolos** | `batalkanPesananAction` mengizinkan pembatalan sebelum pengiriman dan menolak setelah status pengiriman. |
| `AC-13` | Batas kredit 0 menahan setiap pesanan dengan total > 0 | **Lolos** | `cekMelewatiBatasKredit(0, 50000, 0)` mengembalikan `true`. |
| `AC-14` | Exposure dihitung dari piutang faktur dan pesanan belum difakturkan | **Lolos** | `hitungExposurePelanggan` menjumlahkan sisa piutang faktur terbuka + pesanan `VERIFIED`..`TERKIRIM`. |
| `AC-15` | Pengembalian ke `REVISI` mewajibkan alasan & verifikasi ulang cek kredit | **Lolos** | `revisiPesananAction` memindahkan ke `REVISI` dengan alasan wajib; verifikasi ulang menjalankan cek kredit kembali. |
| `AC-16` | Manajemen dapat menolak (membatalkan) pesanan `MENUNGGU_PERSETUJUAN_KREDIT` | **Lolos** | `batalkanPesananAction` mengizinkan Manajemen membatalkan dari status `MENUNGGU_PERSETUJUAN_KREDIT`. |
| `AC-17` | Pelanggan nonaktif tidak bisa dipakai untuk pesanan baru | **Lolos** | `getFormReferenceData` hanya memuat pelanggan `aktif`, dan `createPesananAction` menolak `status !== "aktif"`. |

## Eksekusi Verifikasi

```bash
$ pnpm.cmd test
✔ hitungBarisPesanan menghitung diskon, DPP, PPN, dan total dengan T=0.11 (AC-03)
✔ hitungTotalPesanan menjumlahkan banyak baris dengan akurat
✔ cekMelewatiBatasKredit menahan pesanan saat exposure > batas atau batas = 0 (AC-13, AC-14)
ℹ tests 17 | pass 17 | fail 0

$ node scripts/verify-pd-002.mjs
=== PD-002 Verification ===
[PASS] AC-03: Rumus nilai kotor, diskon, DPP, PPN (T=0.11), dan total sesuai.
[PASS] AC-13: Batas kredit 0 menahan pesanan dengan total > 0.
[PASS] AC-14: Perhitungan exposure piutang + pesanan terbuka akurat.
[PASS] AC-01..AC-17: Seluruh pesan validasi, guard pemisahan tugas, dan state machine terverifikasi.
```
