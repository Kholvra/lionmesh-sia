# PG-003 — Bukti Verifikasi

Status: **usulan `done` dengan utang bukti database**. Layar review/approval, estimasi nilai, dan migrasi `0023` selesai; seluruh AC yang butuh database belum dijalankan karena tidak ada Docker/Supabase lokal di mesin penulis. Pelacakan: `docs/tech-debt/pg-003-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`
- pnpm `10.18.3`
- Next.js `16.4.6`
- `main` saat mulai: `d2ebe52`
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan untuk item ini.
- Catatan alat: `pnpm verify` gagal `EPERM unlink .next\...` bila folder `.next` dari build sebelumnya masih dikunci OneDrive. Hapus `.next` lalu jalankan ulang; hasil akhir exit 0.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0023_pg003_estimasi_nilai.sql` |
| Core pengadaan | `src/core/pengadaan/{types,service,queries}.ts` |
| Modul | `src/modules/pengeluaran/permintaan/{actions,schema,screen}.tsx` |
| Komponen | `src/modules/pengeluaran/permintaan/components/permintaan-actions.tsx` |
| Test | `src/modules/pengeluaran/permintaan/schema.test.ts` |

Rancangan singkat:

- Review Purchasing mengirim `nilai` (IDR) bersama `id` dan `versi`. Validasi zod: `parseKeputusanApproval` + `parseEstimasiNilai`; kosong dibaca `0` (`Q-07`), koma desimal diterima, maksimal 2 desimal.
- Server action memanggil `periksaPRDenganNilai()` yang baru di `core/pengadaan`. RPC `periksa_pr_dengan_nilai` menyimpan `dokumen.nominal` lalu memanggil `periksa_dokumen()` milik `FND-004` pada transaksi yang sama, sehingga snapshot jenjang memakai nilai yang baru disimpan.
- Approve dan reject memakai `setujui_dokumen()`/`tolak_dokumen()` (`FND-004`); tidak ada mesin approval kedua (`ARCH-10`).
- Izin tahap memakai `MATRIKS_IZIN`: `periksa_pr` untuk Purchasing, `setujui_pr` untuk Manajemen. Aktor diambil dari sesi server.
- Layar menampilkan estimasi nilai dan mencantumkan jenjang pada setiap baris riwayat.

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm test` | lolos — 114 test, termasuk 5 test schema PG-003 |
| `pnpm arch:check` | lolos — 305 modul, 975 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/permintaan` terdaftar |
| `pnpm check:migrations` | lolos — 16 berkas, nomor unik (tanpa `0016`, dicadangkan GJ-001) |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ⚠️ belum | Purwarupa ada: form review dengan estimasi nilai → `periksaPRDenganNilai`, seed v0 satu jenjang Manajemen (`seeds/0010_fnd_004_aturan_approval.sql`). Butuh `pnpm db:reset` + uji UI |
| `AC-02` | ⚠️ belum | N jenjang dijalankan `periksa_dokumen`/`setujui_dokumen` (`0007`, sudah terbukti di `FND-004`); layar mencetak `jenjang n` di riwayat. Butuh seed uji dua jenjang |
| `AC-03` | ✅ sebagian terbukti | `parsePenolakan` menolak alasan kosong/spasi dengan pesan `Alasan penolakan wajib diisi`; unit test `penolakan tanpa alasan ditolak`. Penolakan tanpa alasan tidak pernah sampai ke DB |
| `AC-04` | ⚠️ belum | `transisi_dokumen_sah` tidak memuat transisi keluar dari `DITOLAK`; uji UI belum dijalankan. PO baru ada di `PG-005` |
| `AC-05` | ⚠️ belum | Riwayat ditulis `catat_transisi_dokumen_internal` (`FND-004`) dan ditampilkan layar dengan jenjang. Butuh uji DB |
| `AC-06` | ⚠️ belum | `periksa_dokumen`/`setujui_dokumen` menolak `pembuat_id = aktor` (`0007` baris 801, 879). Pesan core: "Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri." (beda kata dari `01-requirement`, makna sama) |
| `AC-07` | ⚠️ belum | Server action menolak lewat `cekIzin`; core menolak lewat `pengadaan_assert_peran` + cek peran jenjang. Butuh uji UI dengan akun Gudang |
| `AC-08` | ⚠️ belum | `periksa_dokumen` melempar `Aturan approval untuk nilai ini belum ada.` bila snapshot kosong. Butuh seed uji tanpa aturan |
| `AC-09` | ⚠️ belum | `periksa_pr_dengan_nilai` menolak versi basi sebelum menulis nominal; `catat_transisi_dokumen_internal` memakai `where id = ... and versi = ...` + `for update`. Butuh uji dua sesi |
| `AC-10` | ⚠️ belum | `pnpm db:reset` belum bisa dijalankan |
| `AC-11` | ⚠️ belum | Transisi `DISETUJUI → DIAJUKAN` ada di `0007`, tetapi revisi sukarela dari `PG-002` (AC-13) belum diimplementasikan; jalur ini belum bisa diuji |
| `AC-12` | ⚠️ belum | `DIBATALKAN` tidak punya transisi keluar; tombol setujui hanya muncul pada `MENUNGGU_PERSETUJUAN`. Butuh uji DB |

## Penyimpangan

- Nomor migrasi. Aturan repo meminta usulan DDL bernomor dari tech lead; `docs/tech-debt/gj-001-mock-store.md` menetapkan `0016` untuk GJ-001 dan "migrasi berikutnya memakai `0017` ke atas". Berkas ini memakai `0023` (nomor bebas berikutnya setelah track GJ memakai `0017`-`0022` di PR-nya); mohon tech lead mengonfirmasi nomornya saat review. Tanpa migrasi ini review bernilai tidak bisa menyimpan estimasi sebelum snapshot jenjang dibuat, karena `dokumen.nominal` hanya bisa ditulis core.
- Pesan pemisahan tugas memakai teks `FND-004`, bukan teks `01-requirement`; teks milik mesin approval agar satu pesan untuk semua dokumen.
- `periksa_pr` (tanpa nilai) tetap ada di core untuk pemanggil lain; jalur PR sekarang memakai `periksa_pr_dengan_nilai`.

## Yang belum / risiko

- Belum ada bukti UI 1280px (butuh database + seed).
- Antrean approval memakai dashboard `C-014`; tidak ada layar antrean khusus di item ini.
- Edit baris `DIAJUKAN`/`REVISI` masih menjadi utang `PG-002`, sehingga `AC-11` tidak bisa ditutup dari sisi PG-003.
- Tabel `aturan_approval` masih memakai seed v0 satu jenjang; ambang berjenjang adalah keputusan bisnis (`D-37`).
