# C-011 — Bukti Verifikasi

Tanggal: 2026-11-24. Branch: `c-011-master-data`. Status item: **`in progress`** (menunggu review tech lead; `done` di `backlog.md` adalah usulan sampai PR di-merge).

## Lingkungan verifikasi

- Node.js `v24.22.2`, pnpm `10.18.3`, Next.js `16.4.6`
- Supabase lokal (Docker), migrasi `0001`–`0011`, seed versi `0005`
- Akun uji: `produksi@lionmesh.test`, `gudang@lionmesh.test`, `accounting@lionmesh.test`, `purchasing@lionmesh.test` (sandi `lionmesh-dev-2026`)
- Layar diperiksa pada viewport 1280×1000 melalui Chromium headless

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0011_c011_master_data.sql` |
| Seed | `supabase/seeds/0012_c011_mata_uang.sql`, `supabase/seed-version` → `0005` |
| Core service | `src/core/master/{types,queries,service,index}.ts` |
| Izin | `src/lib/auth/permissions.ts` — baris PT-06 (`kelola_kategori_produk`, `kelola_satuan`, `kelola_gudang`, `kelola_mata_uang`); `kelola_data_produk` dipakai untuk produk |
| Modul layar | `src/modules/core/master/{schema,actions,queries,format,constants,form-state}.ts`, `components/*`, `produk|satuan|gudang|mata-uang/screen.tsx` |
| Route | `src/app/(app)/pengaturan/{produk,satuan,gudang,mata-uang}/{page,loading,error}.tsx`; tautan master di `src/app/(app)/pengaturan/page.tsx` |
| Utilitas bersama | `src/lib/format/{number,date}.ts` |
| Bukti DB | `scripts/verify-c011.mjs` |
| Uji unit | `src/modules/core/master/schema.test.ts`, `src/lib/format/number.test.ts` |

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm check:migrations` | lolos — 11 berkas, nomor unik |
| `pnpm lint` | lolos |
| `pnpm typecheck` | lolos |
| `pnpm arch:check` | lolos — 140 modul, 380 dependensi, 0 pelanggaran |
| `pnpm test` | lolos — 32 uji, 32 lulus (20 uji baru untuk C-011) |
| `pnpm build` | lolos — route `/pengaturan/{produk,satuan,gudang,mata-uang}` terdaftar dinamis |
| `pnpm verify` | lolos, exit `0` |
| `git diff --check` | lolos |
| `node scripts/verify-c011.mjs` | lolos, exit `0` — 32 pemeriksaan database lulus (rincian di bawah) |

## Bukti perilaku database

`node scripts/verify-c011.mjs` menjalankan setiap skenario di dalam transaksi yang di-*rollback*, masuk sebagai peran seed dengan sesi `auth.sessions` yang sah, sehingga dataset lokal tidak berubah. Kode entri uji memakai akhiran acak per putaran, jadi skrip tetap lolos di database yang sudah berisi data uji manual; jalankan setelah `pnpm db:reset` + `pnpm db:seed:local`.

| Kelompok | Hasil |
|---|---|
| AC-02 kode gudang ganda | `Kode gd-dup sudah dipakai.`; jumlah gudang bertambah tepat satu |
| AC-03 produk tanpa satuan dasar | `Satuan dasar wajib dipilih.`; tanpa tipe ditolak; satuan nonaktif ditolak dengan `Satuan dasar UNIT nonaktif.` |
| AC-09 konversi satuan | UNIT→KG tercatat; konversi ganda, satuan sama, dan satuan nonaktif ditolak (`Satuan asal KG nonaktif.`); jumlah baris tidak bertambah |
| AC-06 peran tanpa hak | Purchasing→gudang, Gudang→produk, Produksi→mata uang ditolak dengan `Anda tidak punya izin mengubah master …` |
| AC-04 / AC-11 | Gudang nonaktif tetap terbaca (jumlah tidak berkurang), hilang dari pilihan dokumen baru, bisa diaktifkan kembali; riwayat mencatat `NONAKTIFKAN` lalu `AKTIFKAN` |
| D-04 / D-25 | `insert`/`update` langsung ke tabel master ditolak (`permission denied for table …`) |
| AC-10 | USD tersimpan dengan kode dinormalkan; kurs `16250,75` tersimpan sebagai `16250.750000`; kurs ganda dan nol ditolak; IDR tersedia dari seed |
| INV-03 | Kode satuan yang sudah dipakai produk tidak dapat diubah; nama dan tipe tetap dapat diubah |
| AC-07 | Dua pembacaan daftar gudang identik |

## Bukti layar (1280 px)

Alur dijalankan dari layar oleh peran sebenarnya, bukan hanya dari skrip.

| AC | Aksi di layar | Hasil |
|---|---|---|
| AC-01 | Produksi menambah produk `PRD-001` (tipe bahan, satuan UNIT) dari `/pengaturan/produk` | Produk tersimpan, layar pindah ke detail `?id=…`, muncul di daftar — `screenshots/c011-03-produk-tersimpan-1280.png` |
| AC-02 | Kirim produk dengan kode `PRD-001` lagi | Pesan `Kode PRD-001 sudah dipakai.` — `screenshots/c011-04-produk-kode-ganda-1280.png` |
| AC-03 | Kirim produk tanpa satuan dasar | Pesan field `Satuan dasar wajib dipilih` — `screenshots/c011-02-produk-tanpa-satuan-1280.png` |
| AC-04 | Nonaktifkan satuan KG (dan gudang GUDANG-02 ditambah Gudang) | Baris tetap ada dengan badge `Nonaktif`; pilihan satuan pada form konversi tidak lagi memuat KG; jumlah baris tidak berkurang — `screenshots/c011-06-satuan-nonaktif-1280.png` |
| AC-05 | `grep` pada migrasi dan modul | Tabel `produk`, `gudang`, `satuan` hanya di `0002`/`0011`; tidak ada pembacaan tabel master dari `src/modules/**` selain `src/modules/core/master` (grep tanpa hasil, exit 1) |
| AC-06 | Purchasing membuka `/pengaturan/produk` | Tidak ada tombol tambah/ubah; pesan `Peran Anda tidak dapat mengubah master produk` — `screenshots/c011-09-produk-hanya-baca-1280.png` |
| AC-07 | Baca daftar dua kali setelah reset+seed | Identik (skrip database) |
| AC-08 | Buat kategori `KAT-01` dari panel kategori di `/pengaturan/produk`, lalu produk memakai kategori itu | Kategori tampil di daftar; produk menampilkan kode kategori — `screenshots/c011-05-kategori-produk-1280.png` |
| AC-09 | Tambah konversi UNIT→KG (faktor 1) dari `/pengaturan/satuan` | Konversi tampil di daftar dengan faktor `1` |
| AC-10 | Accounting menambah USD dan kurs `16250,75` | Mata uang dan kurs tampil; dokumen/jurnal tetap IDR (belum ada layar dokumen di repo ini, lihat catatan) — `screenshots/c011-08-mata-uang-kurs-1280.png` |
| AC-11 | Nonaktifkan lalu aktifkan kembali KG | Badge kembali `Aktif`, pesan `Data satuan berhasil diaktifkan.`, riwayat bertambah |

## Penyimpangan dan keputusan yang perlu dikonfirmasi

| Hal | Yang dilakukan | Alasan / tindakan tech lead |
|---|---|---|
| Nomor migrasi | Migrasi ditulis sebagai `0011_c011_master_data.sql` di branch ini, bukan hanya usulan `06-ddl-proposal.sql` | `owner_role` item ini tech lead dan `ARCH-07` memberi nomor ke tech lead. Nomor `0011` sudah dipakai di sini; konfirmasi saat review. |
| Lokasi layar | Layar C-011 ada di `src/modules/core/master/**`, bukan `src/core/**` | `src/core/**` tidak boleh memuat komponen React (`ARCH-02`), sedangkan halaman harus tipis. Perlu keputusan tech lead bila penamaan folder lain diinginkan. |
| Riwayat status master | Satu tabel `master_riwayat_status` untuk lima jenis master, tanpa foreign key per entitas | FND-004 mengikat `riwayat_status` ke `dokumen`; PG-001 membuat tabel per entitas. Satu tabel generik lebih kecil, integritas dijaga fungsi penulis. |
| Guard peran di database | `c011_assert_pengelola()` di RPC, ditambah `revoke insert/update/delete` pada `produk`, `gudang`, `satuan` | Sebelumnya 0003 mengizinkan tulis langsung lewat RLS. Setelah ini semua tulisan master lewat core (`D-04`, `D-25`). |
| Select primitif | `src/modules/core/master/components/select.tsx` lokal | `src/components/ui/**` milik FND-007; ini kandidat primitif Select untuk item tersebut. |
| Seed | `supabase/seeds/0012_c011_mata_uang.sql` + versi seed `0005` | FND-008 menetapkan master milik item pemiliknya diisi berkas seed item pemilik. Hanya IDR; kurs tidak di-seed. |
| Baris matriks izin | Empat baris baru PT-06 (`[USULAN-AGEN]`) | Masih menunggu kunci koordinator; dipakai UI dan guard database. |
| Insight `Date.now()` | Tidak diperbaiki di item ini | Dev server mencatat insight `blocking-prerender-current-time` untuk route C-011 **dan** `/pengeluaran/pemasok` yang sudah ada. Jadi ini perilaku shell/sesi (`AppLayout`), bukan C-011; perlu item FND/INT terpisah. |

## Yang belum bisa dibuktikan penuh

| AC | Bagian yang belum | Alasan |
|---|---|---|
| AC-01 | "bisa dipilih di dokumen baru" | Belum ada layar dokumen di repo (`PD-002` dst. belum dikerjakan). Bukti saat ini: `listProduk/listGudang/listSatuan({ aktif: true })` adalah satu-satunya sumber pilihan, dan picker di layar master hanya memuat entri aktif. |
| AC-04 | "dokumen lama yang memakainya tetap terbaca" | Sama: belum ada dokumen. Yang dibuktikan: baris nonaktif tidak dihapus dan tetap terbaca di daftar serta riwayat. |
| AC-10 | "periksa mata uang dokumen dan jurnal" | Belum ada dokumen dan jurnal baru yang memakai master ini; `D-38` tetap IDR dan belum ada jalur mata uang asing di kode. |

## Screenshot

- `screenshots/c011-01-pengaturan-master.png` — hub `/pengaturan` dengan tautan master dan status izin
- `screenshots/c011-02-produk-tanpa-satuan-1280.png` — AC-03
- `screenshots/c011-03-produk-tersimpan-1280.png` — AC-01
- `screenshots/c011-04-produk-kode-ganda-1280.png` — AC-02
- `screenshots/c011-05-kategori-produk-1280.png` — AC-08
- `screenshots/c011-06-satuan-nonaktif-1280.png` — AC-04/AC-11
- `screenshots/c011-07-gudang-tersimpan-1280.png` — master gudang
- `screenshots/c011-08-mata-uang-kurs-1280.png` — AC-10
- `screenshots/c011-09-produk-hanya-baca-1280.png` — AC-06
