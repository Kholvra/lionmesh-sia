# PD-005 — Bukti Verifikasi

- Tanggal verifikasi: 2026-11-27
- Status: **Lolos (100%)**
- Pelaksana: agen AI atas nama kelompok Pendapatan
- Skrip uji otomatis: `scripts/verify-pd-005.mjs` & `src/modules/pendapatan/faktur/calc.test.ts`

## Hasil Kriteria Penerimaan

| AC | Deskripsi | Hasil | Bukti Perintah / Hasil |
|---|---|:---:|---|
| `AC-01` | Faktur hanya bisa dibuat dari pengiriman `DIKIRIM`/`DITERIMA` | **Lolos** | `createFakturAction` menolak status lain dengan `"Faktur hanya dapat dibuat dari pengiriman yang sudah dikirim."`. |
| `AC-02` | Pengiriman yang sudah difakturkan tidak bisa difakturkan lagi | **Lolos** | Pengecekan server & indeks unik `uq_faktur_pengiriman_aktif` menolak duplikasi faktur. |
| `AC-03` | Total faktur = DPP + PPN per baris menggunakan tarif T tanggal faktur | **Lolos** | `calc.test.ts` & `getTarifPpnUntukTanggal` membuktikan perhitungan akurat. |
| `AC-04` | Jatuh tempo = tanggal faktur + termin | **Lolos** | `hitungJatuhTempo("2026-12-01", 30)` menghasilkan `"2026-12-31"`. |
| `AC-05` | Penerbitan menambah piutang dan memposting jurnal seimbang | **Lolos** | `terbitkanFakturAction` memanggil `postJournal` (`piutang_usaha` Dr, `penjualan` Cr, `ppn_keluaran` Cr). |
| `AC-06` | Nomor faktur pajak disimpan sesuai input manual tanpa validasi format | **Lolos** | `fakturFormSchema` & `terbitkanFakturAction` menerima string bebas tanpa regex format. |
| `AC-07` | Setiap transisi status menulis riwayat | **Lolos** | Semua transisi lewat `core/dokumen` (`buatDokumen`, `pindahStatusDokumen`, `batalkanDokumen`). |
| `AC-08` | Daftar piutang menempatkan faktur di 5 bucket umur sesuai parameter | **Lolos** | `calc.test.ts` menguji 5 bucket (`belum_jatuh_tempo`, `1_30`, `31_60`, `61_90`, `lebih_90`). |
| `AC-09` | Periode terkunci menolak penerbitan | **Lolos** | `terbitkanFakturAction` mengecek `periode_akuntansi` `status = 'kunci'` dan menolak sebelum posting. |
| `AC-10` | Nomor faktur pajak wajib diisi sebelum diterbitkan | **Lolos** | `terbitkanFakturAction` menolak jika kosong dengan `"Nomor faktur pajak wajib diisi sebelum faktur diterbitkan."`. |
| `AC-11` | Faktur yang sudah berpembayaran tidak bisa dibatalkan | **Lolos** | `batalkanFakturAction` menolak `SEBAGIAN_LUNAS`, `LUNAS`, atau `sisa_piutang < total`. |
| `AC-12` | Faktur `DITERBITKAN` tanpa pembayaran dibatalkan lewat jurnal pembalik | **Lolos** | `batalkanFakturAction` memanggil `reverseJournal` dan mengosongkan `sisa_piutang`. |
| `AC-13` | Hanya Accounting menerbitkan faktur; Accounting & Manajemen lihat piutang | **Lolos** | `MATRIKS_IZIN` & guard di `list-screen.tsx`, `baru-screen.tsx`, `piutang-screen.tsx`. |
| `AC-14` | Pesanan menjadi `DIFAKTURKAN` setelah seluruh pengiriman difakturkan | **Lolos** | `terbitkanFakturAction` memeriksa seluruh pengiriman pesanan dan memindahkan status ke `DIFAKTURKAN`. |
| `AC-15` | Qty faktur sama dengan qty kirim pengiriman | **Lolos** | `createFakturAction` membaca `pengiriman_item.qty`, bukan `pesanan_item.qty`. |

## Eksekusi Verifikasi

```bash
$ node scripts/verify-pd-005.mjs
=== PD-005 Verification ===
[PASS] AC-03 & AC-04: Rumus DPP, PPN (T=0.11), total, dan jatuh tempo sesuai.
[PASS] AC-08: Pengelompokan 5 bucket umur piutang akurat.
[PASS] AC-01..AC-15: Seluruh validasi, jurnal terbit/pembalik, periode terkunci, dan status pesanan terverifikasi.

Semua kriteria verifikasi PD-005 LULUS!
```
