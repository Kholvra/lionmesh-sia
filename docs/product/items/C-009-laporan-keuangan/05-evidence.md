# C-009 — Bukti Verifikasi

Tanggal: 2026-11-26 (putaran awal 2026-11-24; gap AC-09/AC-11 ditutup 2026-11-26)
Lingkungan: Supabase lokal Docker (`127.0.0.1:54322`), Next.js 16.4.6 dev
(`http://127.0.0.1:3009`), Node 24.22.2, Chromium (screenshot), skrip `verify-c-009.mjs`.
Status: **SIAP REVIEW** — AC-01–AC-11 PASS. Screenshot 1280px berisi data fixture di bawah.

## Perintah yang dijalankan

```bash
pnpm db:reset
pnpm db:seed:local
pnpm dev --port 3009                 # 3000 dipakai sesi lain
C009_BASE_URL=http://127.0.0.1:3009 \
  node scripts/verify-c-009.mjs      # 11 pemeriksaan lulus
pnpm verify
```

Hasil gerbang terakhir:

```text
pnpm verify → exit 0
lint          ok
typecheck     ok
arch:check    ok
test          90 lulus, 0 gagal (termasuk 5 tes unit rekonsiliasi baru)
build         ok (rute /laporan dan /laporan/[laporan] terbangun)
git diff --check → bersih
pnpm check:migrations → ok, 12 berkas, nomor unik (C-009 tidak menambah migrasi)

`scripts/verify-c-009.mjs` menyiapkan fixture deterministik lewat
`postJournal()` dan `catatMutasiStok()` (bukan menulis tabel jurnal langsung),
lalu membuka halaman sebagai sesi Accounting. Fixture menolak berjalan dua kali
pada database yang sama; reset + seed dulu untuk mengulang.

## Data uji tangan

Periode laporan: **November 2026**. Saldo awal berasal dari jurnal Oktober.

| Akun | Saldo awal | Debit Nov | Kredit Nov | Saldo akhir |
|---|---:|---:|---:|---:|
| 102 Bank | 10.000.000,00 | 2.100.000,00 | 1.100.000,00 | 11.000.000,00 |
| 110 Piutang usaha | 0,00 | 5.000.000,00 | 2.000.000,00 | 3.000.000,00 |
| 120 Persediaan bahan | 0,00 | 1.500.000,00 | 0,00 | 1.500.000,00 |
| 122 Persediaan barang jadi | 4.000.000,00 | 0,00 | 3.000.000,00 | 1.000.000,00 |
| 201 Utang usaha | 0,00 | 500.000,00 | 1.500.000,00 | 1.000.000,00 |
| 302 Laba ditahan | 14.000.000,00 | 0,00 | 0,00 | 14.000.000,00 |
| 401 Penjualan | 0,00 | 0,00 | 5.000.000,00 | 5.000.000,00 |
| 501 HPP | 0,00 | 3.000.000,00 | 0,00 | 3.000.000,00 |
| 701 Beban gaji administrasi | 0,00 | 600.000,00 | 100.000,00 | 500.000,00 |

Neraca saldo: debit **20.000.000,00**, kredit **20.000.000,00**.
Laba rugi November: pendapatan **5.000.000,00**, beban **3.500.000,00**,
laba bersih **1.500.000,00**.
Neraca 30 November: aktiva **16.500.000,00**; kewajiban **1.000.000,00**;
ekuitas **15.500.000,00** (laba ditahan 14.000.000 + laba tahun berjalan
1.500.000).
Daftar jurnal November: **8 jurnal / 16 baris**, total debit = kredit
**12.700.000,00**.
Kartu persediaan November: saldo awal **100 unit / 1.000.000,00**; masuk
**50**; keluar **50**; saldo akhir **100 unit / 1.083.333,33**.
Rekonsiliasi agregat November: total nilai mutasi **83.333,33**; total jurnal
persediaan (debit − kredit akun peran persediaan) **−1.500.000,00**; selisih
**1.583.333,33** → status **Selisih**. Angka ini benar apa adanya: fixture
jurnal dan mutasi ditulis terpisah dengan nilai yang memang tidak berpasangan,
sehingga kontrol total wajib menampilkannya, bukan menyembunyikannya.

## Hasil per kriteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | PASS | `GET /laporan/buku-besar?periode=2026-11&akun=<102>`: saldo awal Rp 10.000.000,00; debit Rp 2.100.000,00; kredit Rp 1.100.000,00; saldo akhir Rp 11.000.000,00; 5 baris termasuk sumber `UJI-C009-009` dan `UJI-C009-010`. |
| `AC-02` | PASS | `GET /laporan/neraca-saldo?periode=2026-11`: total debit = total kredit Rp 20.000.000,00; halaman menyatakan “Seimbang”. Selisih ditampilkan sebagai kartu dan alert bila tidak nol (logika `hitungNeracaSaldo` diuji unit). |
| `AC-03` | PASS | `GET /laporan/laba-rugi?periode=2026-11`: pendapatan Rp 5.000.000,00; beban Rp 3.500.000,00; laba bersih Rp 1.500.000,00. Teks “Beban penyusutan kantor” (702) tidak muncul; unit test memastikan hanya peran `penjualan`, `hpp`, `tenaga_kerja_langsung`, `overhead_pabrik`, `beban_gaji_admin` yang dihitung. |
| `AC-04` | PASS | `GET /laporan/neraca?periode=2026-11`: aktiva Rp 16.500.000,00; kewajiban Rp 1.000.000,00; ekuitas Rp 15.500.000,00; baris “Laba tahun berjalan”; status “Seimbang”. |
| `AC-05` | PASS | Script menghitung `jurnal`, `detail_jurnal`, dan `periode_akuntansi` sebelum dan sesudah membuka tujuh laporan: **10 header / 20 baris / 2 periode**, tidak berubah. |
| `AC-06` | PASS | Buku besar dibuka dua kali; seluruh nilai `Rp …` yang diekstrak dari teks halaman identik. |
| `AC-07` | PASS | `detail_jurnal.debit` tersimpan `5000000.00` (query `::text`) dan tampil `Rp 5.000.000,00`. Unit test `formatRupiah` memakai BigInt sen, bukan floating point. |
| `AC-08` | PASS | Login `penjualan@lionmesh.test` membuka `/laporan/neraca-saldo?periode=2026-11`: halaman “Akses ditolak” dan tidak ada pola `Rp <angka>,00` di respons. |
| `AC-09` | PASS | Daftar jurnal: 8 jurnal / 16 baris / total Rp 12.700.000,00 — sama dengan hitung `detail_jurnal`. Arus kas: 5 baris akun 102. Kartu: 3 mutasi dari buku stok. Rekonsiliasi agregat tampil di layar (`Rp 83.333,33` vs `-Rp 1.500.000,00`, selisih `Rp 1.583.333,33`, status `Selisih`) dan kedua sisinya dibuktikan sama dengan hitung SQL langsung di skrip. |
| `AC-10` | PASS | `GET /laporan/neraca-saldo?periode=2026-11,2026-12`: pesan “Pilih tepat satu bulan kalender” dan tidak ada angka laporan. |
| `AC-11` | PASS | Buku besar menampilkan `UJI-C009-009` + pembalik `UJI-C009-010`, saldo akhir Rp 11.000.000,00 (netto nol). Skrip membuat dokumen `PERMINTAAN_PEMBELIAN` via `buat_dokumen` lalu membatalkannya via `batalkan_dokumen`: jumlah baris jurnal/detail/periode tidak berubah dan nomor dokumen tidak muncul di buku besar maupun daftar jurnal. |

## Keterbatasan yang dicatat (bukan penyimpangan)

1. **Kartu per produk/gudang vs jurnal agregat.** Jurnal tidak menyimpan qty
   maupun rincian produk, sehingga baris kartu membaca `mutasi_stok` — buku
   stok core (`FND-005`), bukan tabel transaksi modul — sedangkan sisi jurnal
   rekonsiliasi selalu agregat. Ini pelaksanaan `D-57` ("dicocokkan"):
   perbandingan total + status Cocok/Selisih tampil di layar. Kaitan per produk
   ke akun menunggu pemetaan produk → akun (`PR-006`) dan pendalaman di `INT-003`.
2. **Screenshot 1280px.** [`c009-neraca-saldo-1280.png`](c009-neraca-saldo-1280.png)
   (diambil ulang 2026-11-26, berisi data fixture: total Rp 20.000.000,00
   seimbang) dan [`c009-kartu-persediaan-1280.png`](c009-kartu-persediaan-1280.png)
   (kartu + seksi rekonsiliasi). Sesi Accounting, viewport 1280px. Badge dev
   Next.js tidak terlihat pada kedua gambar; `ISSUE-002` tetap open untuk
   keputusan permanen.
3. **Periode tanpa jurnal** menampilkan nol dan tabel kosong; halaman tidak
   melempar error. Ini mengikuti edge case `01-requirement.md`.
4. **Hak akses** mengikuti PT-02 `[USULAN-AGEN]`: Accounting, Manajemen,
   Direksi. Entri `lihat_laporan_keuangan` ditambahkan ke `MATRIKS_IZIN`; bila
   koordinator memutuskan lain, satu baris itu yang berubah.

## Akun uji

| Peran | Email | Sandi |
|---|---|---|
| Accounting | `accounting@lionmesh.test` | `lionmesh-dev-2026` |
| Penjualan (uji penolakan) | `penjualan@lionmesh.test` | `lionmesh-dev-2026` |

Database lokal Docker saja; jangan dipakai di lingkungan hosted.
