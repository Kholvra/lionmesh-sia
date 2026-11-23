# C-009 — Bukti Verifikasi

Tanggal: 2026-11-24
Lingkungan: Supabase lokal Docker (`127.0.0.1:54322`), Next.js 16.4.6 dev
(`http://127.0.0.1:3002`), Node 24.22.2, Firefox 159 (headless, bukti teks).
Status: **SIAP REVIEW** — belum di-merge, belum boleh disebut `done`.

## Perintah yang dijalankan

```bash
pnpm db:reset
pnpm db:seed:local
pnpm dev                                  # port 3002 karena 3000 terpakai
C009_BASE_URL=http://127.0.0.1:3002 \
  node scripts/verify-c-009.mjs
pnpm verify
```

Hasil gerbang terakhir:

```text
pnpm verify → exit 0
lint          ok
typecheck     ok
arch:check    ok
test          44 lulus, 0 gagal
build         ok (rute /laporan dan /laporan/[laporan] terbangun)
git diff --check → bersih
```

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
| `AC-09` | PASS* | Daftar jurnal: 8 jurnal / 16 baris / total Rp 12.700.000,00 — sama dengan hitung `detail_jurnal`. Arus kas: 5 baris akun 102. Kartu persediaan: 3 mutasi, total masuk/keluar dan saldo sama dengan buku stok. Lihat catatan penyimpangan di bawah. |
| `AC-10` | PASS | `GET /laporan/neraca-saldo?periode=2026-11,2026-12`: pesan “Pilih tepat satu bulan kalender” dan tidak ada angka laporan. |
| `AC-11` | PASS* | Buku besar menampilkan jurnal asal `UJI-C009-009` dan jurnal pembalik `UJI-C009-010`; saldo akhir tetap Rp 11.000.000,00 (netto nol). Dokumen batal tanpa jurnal tidak mungkin muncul karena laporan hanya membaca `detail_jurnal`. Lihat catatan. |

## Penyimpangan dan keterbatasan

1. **`AC-09` kartu persediaan.** Jurnal tidak menyimpan qty, sehingga kartu
   persediaan membaca `mutasi_stok` — buku stok core (`FND-005`), bukan tabel
   transaksi modul — untuk qty dan nilai per produk/gudang. Baris jurnal hanya
   membawa nilai; rekonsiliasi nilai stok dengan akun persediaan adalah milik
   `INT-003`. Daftar jurnal dan arus kas tetap dibandingkan langsung dengan
   `detail_jurnal`.
2. **`AC-11` dokumen batal tanpa jurnal.** Modul dokumen belum menghasilkan
   dokumen pada periode uji ini. Sifat laporan yang hanya membaca `detail_jurnal`
   membuat dokumen tanpa jurnal tidak dapat muncul; kasus jurnal pembalik
   dibuktikan penuh. Uji dokumen batal end-to-end menunggu modul dokumen.
3. **Screenshot 1280px belum tersedia.** Sesi desktop Hyprland terkunci saat
   pengambilan gambar, dan browser headless tidak mempertahankan cookie sesi
   Supabase. Bukti visual diganti dengan pembacaan teks halaman yang dirender
   server pada 1280px (lebar konten mengikuti token `--layout-content-max`).
   Jalankan `pnpm dev`, masuk sebagai Accounting, lalu buka
   `/laporan/buku-besar?periode=2026-11` pada 1280px untuk melihat layar.
4. **Periode tanpa jurnal** menampilkan nol dan tabel kosong; halaman tidak
   melempar error. Ini mengikuti edge case `01-requirement.md`.
5. **Hak akses** mengikuti PT-02 `[USULAN-AGEN]`: Accounting, Manajemen,
   Direksi. Entri `lihat_laporan_keuangan` ditambahkan ke `MATRIKS_IZIN`; bila
   koordinator memutuskan lain, satu baris itu yang berubah.

## Akun uji

| Peran | Email | Sandi |
|---|---|---|
| Accounting | `accounting@lionmesh.test` | `lionmesh-dev-2026` |
| Penjualan (uji penolakan) | `penjualan@lionmesh.test` | `lionmesh-dev-2026` |

Database lokal Docker saja; jangan dipakai di lingkungan hosted.
