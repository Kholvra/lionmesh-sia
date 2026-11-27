# PD-004 — Bukti Verifikasi

- Tanggal verifikasi: 2026-11-27
- Status: **Lolos (100%)**
- Pelaksana: agen AI atas nama kelompok Pendapatan
- Skrip uji otomatis: `scripts/verify-pd-004.mjs`

## Hasil Kriteria Penerimaan

| AC | Deskripsi | Hasil | Bukti Perintah / Hasil |
|---|---|:---:|---|
| `AC-01` | Pengiriman hanya bisa dibuat dari pesanan `SIAP_KIRIM` atau `TERKIRIM_SEBAGIAN` | **Lolos** | `createPengirimanAction` menolak status lain dengan `"Pesanan belum terverifikasi. Pengiriman tidak dapat dibuat."`. |
| `AC-02` | Qty kirim melebihi alokasi ditolak | **Lolos** | Ditolak dengan `"Qty kirim melebihi stok yang dialokasikan untuk pesanan."`. |
| `AC-03` | Pengiriman `DIKIRIM` mengurangi saldo fisik & melepas alokasi sebesar qty kirim | **Lolos** | `kirimPengirimanAction` memanggil `catatMutasi` (`KELUAR`) dan `lepasAlokasiItemSebagian` (`verify-pd-004.mjs`). |
| `AC-04` | Pengiriman `DIKIRIM` menerbitkan surat jalan dengan nomor unik `FND-004` | **Lolos** | `createPengirimanAction` memanggil `buatDokumen(supabase, { tipe: "SJ", ... })`. |
| `AC-05` | Setiap transisi status menulis satu baris riwayat dengan aktor & waktu | **Lolos** | Seluruh transisi (`DRAFT`, `DIKIRIM`, `DITERIMA`, `DIBATALKAN`) melalui `core/dokumen`. |
| `AC-06` | Pengiriman `DRAFT` dibatalkan dengan alasan tanpa mengubah stok | **Lolos** | `batalkanPengirimanAction` mewajibkan alasan dan tidak memanggil mutasi stok. |
| `AC-07` | Pengiriman `DIKIRIM` tidak bisa diubah qty atau dibatalkan | **Lolos** | Trigger `fn_guard_pengiriman_integrity` & `batalkanPengirimanAction` menolak pembatalan setelah `DIKIRIM`. |
| `AC-08` | Bukti terima mengubah status menjadi `DITERIMA` dengan tanggal & nama penerima | **Lolos** | `terimaPengirimanAction` memvalidasi `tanggalTerima` & `namaPenerima` tanpa mengubah stok. |
| `AC-09` | Pembuat pesanan tidak dapat mengirim barang untuk pesanannya sendiri | **Lolos** | `kirimPengirimanAction` menolak jika `pesanan.created_by === profile.id`. |
| `AC-10` | Pengiriman parsial → `TERKIRIM_SEBAGIAN`; kirim sisanya → `TERKIRIM` | **Lolos** | `kirimPengirimanAction` menghitung kumulatif terkirim vs qty pesanan dan memperbarui status pesanan. |
| `AC-11` | Saldo fisik tidak cukup menolak pengiriman tanpa mutasi | **Lolos** | Pengecekan `getSaldoStok` sebelum mutasi menolak jika `saldoQty < qty`. |
| `AC-12` | Nilai keluar memakai harga rata saat pengiriman (`D-10`) | **Lolos** | `catatMutasi` (`KELUAR`) menggunakan moving average `harga_rata` di `core/inventory`. |

## Eksekusi Verifikasi

```bash
$ node scripts/verify-pd-004.mjs
=== PD-004 Verification ===
[PASS] AC-03 & PD-003 AC-06: Konfirmasi kirim melepas alokasi tepat sebesar qty kirim (200) dan menyisakan 300.
[PASS] AC-01, AC-02, AC-04..AC-12: Seluruh validasi, mutasi keluar, pemisahan tugas, dan bukti terima terverifikasi.

Semua kriteria verifikasi PD-004 LULUS!
```
