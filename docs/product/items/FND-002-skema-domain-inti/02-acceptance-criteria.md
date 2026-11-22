# FND-002 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Semua pertanyaan pada 00 sudah terjawab; sebagian jawaban berstatus `[USULAN-AGEN]` menunggu kunci koordinator.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Setelah `pnpm db:reset`, daftar tabel publik tepat `profiles` (dari `0001`), `satuan`, `produk`, dan `gudang`. Tidak ada tabel domain lain. | Jalankan `pnpm db:reset`. Ambil URL database dari `pnpm exec supabase status`. Jalankan `pg_dump --schema-only` ke berkas di direktori sementara. Bandingkan daftar `CREATE TABLE` dengan daftar di atas. |
| `AC-02` | Dua kali `pnpm db:reset` menghasilkan skema yang identik. | Jalankan `pnpm db:reset`, simpan `pg_dump --schema-only`. Ulangi. Jalankan `diff` pada kedua berkas; keluaran kosong. |
| `AC-03` | Migrasi yang sudah di-merge tidak berubah, dan penomoran tetap lolos pemeriksa. | Jalankan `git log --follow -- supabase/migrations/0001_initial.sql`; hanya commit awal yang muncul. Jalankan `pnpm check:migrations`; exit 0. |
| `AC-04` | Insert `produk` dengan `satuan_dasar_id` yang tidak ada ditolak. | Jalankan `pnpm db:reset`. Dengan `psql` ke URL database lokal, insert satu baris `produk` dengan `satuan_dasar_id` acak. Harus ada error foreign key yang menyebut nama constraint; jumlah baris `produk` tidak berubah. |
| `AC-05` | Kode duplikat pada `satuan`, `produk`, dan `gudang` ditolak; nama kosong ditolak. | Untuk tiap tabel: insert satu baris valid (berhasil), lalu baris dengan `kode` sama (ditolak, nama constraint unique muncul), lalu baris dengan `nama` kosong (ditolak, nama constraint check muncul). |
| `AC-06` | Tidak ada kolom `stok` pada tabel `produk`. | `select column_name from information_schema.columns where table_schema='public' and table_name='produk' and column_name='stok';` pada database lokal; hasil 0 baris. |
| `AC-07` | Setiap tabel publik punya tepat satu pemilik di tabel kepemilikan (`04-design-contract.md`). | Bandingkan daftar tabel dari AC-01 dengan tabel kepemilikan. Tidak ada tabel tanpa pemilik dan tidak ada tabel dengan dua pemilik. |
| `AC-08` | `satuan`, `produk`, dan `gudang` punya kolom `created_by`, `created_at`, `updated_by`, dan `updated_at` (`D-32`). | `select table_name, count(*) from information_schema.columns where table_schema='public' and column_name in ('created_by','created_at','updated_by','updated_at') group by table_name;` Ketiga tabel tampil dengan hitungan 4. |
| `AC-09` | Kolom waktu audit bertipe `timestamptz` dan tidak ada kolom `numeric` di tiga tabel ini (konvensi `OQ-02-07`). | `select table_name, column_name, data_type from information_schema.columns where table_schema='public' and table_name in ('satuan','produk','gudang') and (data_type='numeric' or column_name like 'created_%' or column_name like 'updated_%');` Hasil: waktu `timestamp with time zone`; tanpa `numeric`. |

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | daftar perintah yang dijalankan, termasuk versi Supabase CLI dan PostgreSQL |
| Keluaran | daftar tabel, hasil `diff` dua reset, hasil insert uji (error dan nama constraint) |
| Selisih | bila ada tabel yang keluar dari daftar, tulis alasannya |

## Yang tidak diuji di sini

- Perilaku RLS dan peran (`FND-003`).
- Nomor dokumen, status, dan approval (`FND-004`).
- Isi mutasi, saldo, dan jurnal (`FND-005`, `FND-006`).
- Kinerja dan ukuran data.
