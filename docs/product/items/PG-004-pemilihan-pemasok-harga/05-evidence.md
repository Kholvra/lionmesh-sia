# PG-004 — Bukti Verifikasi

Status: **usulan `done` dengan utang bukti database**. Layar perbandingan harga, penetapan pemasok, dan migrasi `0024` selesai; seluruh AC yang butuh database belum dijalankan karena tidak ada Docker/Supabase lokal di mesin penulis. Pelacakan: `docs/tech-debt/pg-004-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`
- pnpm `10.18.3`
- Next.js `16.4.6`
- Branch ditumpuk di atas `pg-003-approval-berjenjang` (PR PG-003 belum merge)
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan untuk item ini.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0024_pg004_penawaran_harga.sql` |
| Core pengadaan | `src/core/pengadaan/{types,queries,service}.ts` |
| Modul | `src/modules/pengeluaran/pemilihan/{actions,schema,queries,screen,perbandingan,constants,form-state}.ts(x)` |
| Komponen | `src/modules/pengeluaran/pemilihan/components/*` |
| Gaya | `src/modules/pengeluaran/pemilihan/pemilihan.module.css` (memakai ulang gaya form/tabel Pengeluaran) |
| Route | `src/app/(app)/pengeluaran/pemilihan-pemasok/{page,loading,error}.tsx` |
| Test | `src/modules/pengeluaran/pemilihan/perbandingan.test.ts` |

Rancangan singkat:

- Tabel baru `penawaran_harga`: satu harga per barang, pemasok, dan tanggal. Tanggal berbeda menambah riwayat; tanggal sama mengoreksi baris lewat `simpan_penawaran_harga`.
- Harga adalah net sebelum PPN dalam IDR (`D-17`, `D-38`); layar tidak menambah pajak.
- Perbandingan menampilkan harga terbaru per barang per pemasok, menandai harga terendah per barang, dan menjumlahkan total per pemasok.
- Penetapan satu pemasok memakai `tetapkan_pemasok_pr_dengan_alasan`, yang menolak permintaan selain `DISETUJUI`, pemasok nonaktif, pemasok tanpa harga lengkap, dan pemasok bukan termurah tanpa alasan. Status berpindah ke `PEMASOK_DITETAPKAN` lewat `FND-004` (`pindah_status_dokumen`), sehingga riwayat tetap satu mesin.
- Alasan pemilihan disimpan di `permintaan_pembelian.alasan_pemilihan` dan ditampilkan pada detail.

## Aturan yang ditetapkan saat implementasi

Dokumen tidak mendefinisikan "harga terendah" untuk permintaan banyak barang. Diputuskan bersama pemilik track pada 2026-11-27:

- Total per pemasok = jumlah harga terbaru seluruh barang pada permintaan itu.
- Pemasok hanya bisa ditetapkan bila mengutip harga untuk **semua** barang permintaan.
- Alasan wajib bila total pemasok lebih besar dari total terendah di antara pemasok lengkap.

Aturan ini ditegakkan di `tetapkan_pemasok_pr_dengan_alasan`; `perbandingan.ts` hanya menghitung tampilan dengan aturan yang sama dan diberi komentar bahwa SQL adalah pemilik aturan.

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm test` | lolos — 122 test (114 sebelumnya + 8 test PG-004) |
| `pnpm arch:check` | lolos — 322 modul, 1039 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/pemilihan-pemasok` terdaftar |
| `pnpm check:migrations` | lolos — 17 berkas, nomor unik (`0016` dicadangkan GJ-001) |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ⚠️ belum | Form penetapan + RPC menolak selain `DISETUJUI`; tombol penetapan hilang setelah `PEMASOK_DITETAPKAN`. Butuh uji DB |
| `AC-02` | ⚠️ belum | Tabel perbandingan barang × pemasok dengan penanda `terendah`; unit test `harga terendah per barang menandai semua nilai yang sama`. Butuh uji UI |
| `AC-03` | ⚠️ belum | RPC melempar `Pemasok hanya bisa dipilih untuk permintaan yang sudah disetujui`; layar hanya menerima PR `DISETUJUI`. Butuh uji DB |
| `AC-04` | ✅ sebagian terbukti | zod menolak `0`, `0,00`, negatif, dan bukan angka; unit test `harga pembanding menolak nol dan bukan angka`; RPC juga memeriksa `harga > 0` |
| `AC-05` | ⚠️ belum | Penetapan tanpa pemasok ditolak zod; unit test `penetapan tanpa pemasok ditolak`. Pesan "Pilih minimal satu pemasok kandidat" belum dipakai karena form hanya mengirim satu pemasok |
| `AC-06` | ⚠️ belum | `listRiwayatHarga` menampilkan semua harga barang yang sama lintas permintaan, terurut tanggal turun. Butuh uji DB |
| `AC-07` | ⚠️ belum | Aturan total + alasan di RPC; unit test `alasan wajib hanya untuk pemasok lengkap yang bukan termurah`. Butuh uji DB |
| `AC-08` | ⚠️ belum | Kandidat difilter `aktif`; RPC menolak pemasok nonaktif. Butuh uji UI dengan pemasok dinonaktifkan |
| `AC-09` | ⚠️ belum | Transisi hanya dari `DISETUJUI`; tidak ada aksi ganti setelah ditetapkan. Butuh uji DB |
| `AC-10` | ⚠️ belum | `pnpm db:reset` belum bisa dijalankan |
| `AC-11` | ⚠️ belum | Harga disimpan apa adanya tanpa PPN; tidak ada perhitungan pajak di layar. Butuh uji UI |

## Penyimpangan

- Nomor migrasi `0024`. Aturan repo meminta nomor dari tech lead (`D-09`); track GJ memakai `0017`-`0022` di PR-nya, jadi `0024` dipakai dan nomornya menunggu konfirmasi. Mohon dikonfirmasi saat review.
- Pesan `AC-05` memakai validasi form (satu pemasok per permintaan, `Q-09`), bukan pesan "Pilih minimal satu pemasok kandidat", karena penetapan bersifat satu pemasok untuk seluruh permintaan.
- `04-design-contract.md` menyebut kandidat harus "aktif dan bertermin"; `pemasok.termin_hari` bersifat wajib (`not null`), sehingga syarat termin otomatis terpenuhi dan yang diperiksa hanya `aktif`.
- Layar baru `pemilihan-pemasok` belum masuk navigasi shell, sama seperti `/pengeluaran/permintaan`; akses lewat URL langsung.
- `docs/design/INVENTORY.md` tidak memuat layar PG-004; pola yang dipakai adalah pola detail/verifikasi (daftar + panel) seperti `PG-002`, bukan tata letak baru.

## Yang belum / risiko

- Belum ada bukti UI 1280px (butuh database + seed).
- Harga pembanding belum bisa diubah setelah pemasok ditetapkan; koreksi harus lewat pembatalan permintaan (`PG-002`), sesuai `D-46`.
- `penawaran_harga` belum punya aturan hapus; data salah dikoreksi dengan tanggal yang sama (upsert), bukan dihapus.
