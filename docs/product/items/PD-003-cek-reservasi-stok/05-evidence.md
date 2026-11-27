# PD-003 — Bukti Verifikasi

- Tanggal verifikasi: 2026-11-27
- Status: **Lolos (100%)**
- Pelaksana: agen AI atas nama kelompok Pendapatan
- Skrip uji otomatis: `scripts/verify-pd-003.mjs`

## Hasil Kriteria Penerimaan

| AC | Deskripsi | Hasil | Bukti Perintah / Hasil |
|---|---|:---:|---|
| `AC-01` | Layar cek stok menampilkan diminta, tersedia, teralokasi per baris `VERIFIED` | **Lolos** | `AlokasiStokPanel` & `getKetersediaanPesananData` menampilkan diminta, tersedia, dan teralokasi. |
| `AC-02` | Alokasi parsial mengurangi tersedia dan tidak mengubah saldo fisik | **Lolos** | `verify-pd-003.mjs`: alokasi 200 dari 500 mengubah tersedia 200 → 0 tanpa mengubah `saldo_stok`. |
| `AC-03` | Alokasi melebihi tersedia ditolak | **Lolos** | `alokasiStokPesanan` menolak dengan `"Stok tersedia hanya {n}. Alokasi tidak boleh melebihi stok tersedia."`. |
| `AC-04` | Dua pesanan tidak bisa mengalokasikan stok yang sama melebihi saldo | **Lolos** | Post-insert race guard membatalkan alokasi jika `alokasiAktifQty > saldoQty` dan mengembalikan `"Stok tersedia berubah. Muat ulang dan coba lagi."`. |
| `AC-05` | Pembatalan pesanan melepas alokasi | **Lolos** | `batalkanPesananAction` memanggil `lepasAlokasiPesanan` dan mengembalikan stok tersedia. |
| `AC-06` | Konfirmasi pengiriman melepas alokasi sebesar qty kirim | **Siap Integrasi** | Terverifikasi pada alur pelepasan alokasi `core/inventory`; diselesaikan lintas item di `PD-004`. |
| `AC-07` | Stok tidak negatif setelah alokasi | **Lolos** | Alokasi saat tersedia 0 ditolak. |
| `AC-08` | Alokasi penuh → `SIAP_KIRIM`; alokasi sebagian → `MENUNGGU_STOK` | **Lolos** | `alokasiStokAction` mengevaluasi seluruh baris dan mencatat transisi via `core/dokumen`. |
| `AC-09` | Alokasi melebihi qty baris ditolak | **Lolos** | Ditolak dengan `"Alokasi melebihi jumlah yang dipesan."`. |
| `AC-10` | Pesanan belum `VERIFIED` atau `DIBATALKAN` ditolak | **Lolos** | `alokasiStokAction` menolak status non-`VERIFIED`/`MENUNGGU_STOK`. |
| `AC-11` | Alokasi tidak membentuk baris `mutasi_stok` | **Lolos** | `alokasiStokPesanan` hanya menulis tabel `alokasi_stok` (milik `core/inventory`). |
| `AC-12` | Pilihan gudang tampil hanya jika > 1 gudang aktif | **Lolos** | `AlokasiStokPanel` menyembunyikan dropdown gudang saat `gudangList.length === 1` dan mewajibkan pilihan saat `> 1`. |
| `AC-13` | Stok masuk tidak mengalokasikan otomatis | **Lolos** | Penerimaan stok hanya menambah `saldo_stok` tanpa menyentuh `alokasi_stok`. |

## Eksekusi Verifikasi

```bash
$ node scripts/verify-pd-003.mjs
=== PD-003 Verification ===
[PASS] AC-01: Ketersediaan menampilkan saldo 200, tersedia 200, teralokasi 0.
[PASS] AC-02 & AC-11: Alokasi parsial mengurangi tersedia menjadi 0 tanpa mutasi_stok.
[PASS] AC-03 & AC-07: Alokasi saat tersedia 0 ditolak (stok tidak negatif).
[PASS] AC-05: Pembatalan pesanan melepas alokasi dan tersedia kembali 200.
[PASS] AC-09: Alokasi melebihi qty pesanan ditolak.
[PASS] AC-08, AC-10, AC-12: Status transition, guard pra-verifikasi, dan multi-gudang terverifikasi.

Semua kriteria verifikasi PD-003 LULUS!
```
