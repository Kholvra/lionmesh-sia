# Register Keputusan

Keputusan yang sudah dikunci. Tidak dibuka lagi kecuali ada bukti baru.

Urutan prioritas: **dokumen ini** > `backlog.md` > `reference/analisis-sia.md`.

## Arsitektur & cara kerja

| ID | Keputusan | Konsekuensi | Sumber |
|---|---|---|---|
| `D-01` | Cakupan penuh: 48 use case + fitur tambahan = **46 fitur** (12 core + 34 modul). Tidak ada pemotongan | tidak ada item "menyusul" atau "v2" | keputusan pengguna |
| `D-02` | Satu repo, branch per track, merge ke `main` oleh tech lead | tidak ada repo terpisah per kelompok | keputusan pengguna |
| `D-03` | Empat siklus berjalan paralel, **dan beberapa track di dalam tiap siklus** juga paralel | backlog disusun sebagai graph, bukan antrean | keputusan pengguna |
| `D-04` | Satu aplikasi Next.js, satu project Supabase. `src/core/` + `src/modules/<siklus>/` | modul boleh impor core, tidak boleh impor modul lain | analisis §2 |
| `D-05` | **Pengadaan adalah domain core.** Tabel + aturan di `core/pengadaan`; layar di `modules/pengeluaran` | Produksi bisa memakai pengadaan tanpa menunggu siklus Pengeluaran | analisis §7.1 |
| `D-06` | **Qty stok** diturunkan dari `mutasi_stok`. **Nilai stok** disimpan di `saldo_stok` (qty, nilai, harga_rata), di-update dalam transaksi yang sama | tidak ada kolom `stok` di tabel produk | `Q1` |
| `D-07` | Jurnal hanya ditulis lewat `postJournal()` di `core/ledger` | tidak ada modul yang menulis ke tabel jurnal langsung | analisis §7.5 |
| `D-08` | `riwayat_status` bersifat polimorfik untuk semua dokumen | satu tabel riwayat, bukan satu per dokumen | analisis §7.2 |
| `D-09` | Migrasi Supabase dinomori dan di-merge **hanya oleh tech lead**. Kelompok mengirim DDL sebagai usulan | tidak ada empat file `0005_*.sql` bertabrakan | keputusan pengguna |

## Keputusan domain (Q1–Q11)

| ID | Keputusan | Konsekuensi | Status |
|---|---|---|---|
| `D-10` | **Q1 — valuasi persediaan: rata-rata bergerak** | `saldo_stok`: qty, nilai, harga_rata. Tidak ada `lapisan_stok` | `locked` |
| `D-11` | **Q2 — BOM tersimpan, satu level, berversi** | `produk_komponen` + `toleransi_scrap` + `toleransi_reject` + `versi` + `berlaku_dari` | `locked` |
| `D-12` | **Q3 — overhead: DLH + tarif predeterminasi + kapasitas normal** | `tarif_overhead`, `overhead_aktual`. Selisih disesuaikan akhir periode | `locked` |
| `D-13` | **Q4 — reject ≤ toleransi diserap ke unit baik; di atasnya jadi kerugian produksi.** Rework masuk HPP. Retur hanya untuk bahan | `toleransi_reject` di master BOM | `locked` |
| `D-14` | **Q5 — termin: pelanggan default 30 hari + override; pemasok tanpa default, wajib input** | `term_hari` di pelanggan, pesanan, faktur, pemasok, invoice | `locked` |
| `D-15` | **Q6 — toleransi three-way match per pemasok, default 0, hanya untuk harga/total.** Selisih qty selalu exception | `toleransi_persen`, `toleransi_nominal` | `locked` |
| `D-16` | **Q7 — batas kredit: blokir + override.** Exposure = piutang + pesanan terbuka. Default 0 = tunai | status `MENUNGGU_PERSETUJUAN_KREDIT`; override per pesanan + alasan | `locked` |
| `D-17` | **Q8 — harga master net (belum PPN); PPN dihitung di dokumen; tarif dari `konfigurasi_pajak` berversi** | tidak ada `0.11` di kode | `locked` |
| `D-18` | **Q9 — 12 akun staf.** Karyawan adalah data, bukan pengguna. Slip dicetak | tidak ada portal karyawan | `locked` |
| `D-19` | **Q10 — seluruh komponen payroll dihitung dari tabel tarif berversi.** PPh 21 memakai lookup TER | `tarif_lembur`, `tarif_bpjs`, `tarif_ter`, `gaji_pokok_histori` | `locked` |
| `D-20` | **Q11 — tech lead membangun core v0; C9–C12 menyusul setelah track berjalan** | fondasi serial, modul menunggu gate | `locked` |

## Batas arsitektur

| ID | Keputusan | Konsekuensi | Status |
|---|---|---|---|
| `D-25` | Modul tidak boleh membaca tabel milik modul lain secara langsung. Data lintas siklus diambil lewat service core atau read model core | laporan lintas siklus menjadi milik core (`C-009`); modul terisolasi | `locked` |
| `D-26` | Pemeriksa batas impor memakai **dependency-cruiser**, bukan skrip sendiri | `ARCH-01`/`ARCH-02` bisa jadi aturan `block` di CI | `locked` |
| `D-27` | Database lokal memakai **Supabase CLI** (Docker), bukan project bersama | `db reset` satu perintah; auth + RLS identik production | `locked` |

## Lingkungan & alat

| ID | Keputusan | Konsekuensi | Status |
|---|---|---|---|
| `D-28` | Gerbang mutu dijalankan di **GitHub Actions** pada setiap PR: `check:migrations`, `lint`, `typecheck`, `arch:check`, `build` | check merah menahan merge; pemeriksaan manual bukan pengganti | `locked` |
| `D-29` | Next.js dikunci di **16.4.6** (`--save-exact`). Versi 16.4.3 menghentikan build dan `next dev` karena security advisory | upgrade dependency lewat PR + `pnpm verify` | `locked` |
| `D-30` | `db:reset` mengembalikan skema ke **`siap`** (migrasi terpasang, tanpa seed), bukan `kosong`. `kosong` hanya state sesaat di dalam reset | `POST-03` FND-001 direvisi; seed selalu berjalan dari `siap` | `locked` |

## Yang tidak dipakai

| ID | Keputusan | Alasan |
|---|---|---|
| `D-21` | **Q13 — tidak ada target tanggal.** Dikerjakan mengalir | keputusan pengguna |
| `D-22` | Skrip demo dihapus dari dokumen analisis. "Selesai" didefinisikan lewat DoD | keputusan pengguna |
| `D-23` | Portal pelanggan dan pemasok di luar cakupan | keputusan pengguna, bukan pemotongan |
| `D-24` | Integrasi e-Faktur belum dipakai; nomor faktur pajak diinput manual | menunggu konfirmasi |

## Cara mengubah keputusan

1. Tulis alasannya di item terkait (`00-discussion.md`).
2. Perbarui baris di dokumen ini — jangan hapus, tandai `superseded` dan arahkan ke ID baru.
3. Perbarui referensi di `backlog.md` bila keputusan mengubah dependensi.
