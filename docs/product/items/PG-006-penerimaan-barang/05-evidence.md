# PG-006 — Bukti Verifikasi

Status: **usulan `done` dengan utang bukti database**. Pencatatan penerimaan, tampilan sisa PO, penutupan exception, dan pembatalan penerimaan selesai; seluruh AC yang butuh database belum dijalankan. Pelacakan: `docs/tech-debt/pg-006-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`
- pnpm `10.18.3`
- Next.js `16.4.6`
- Branch ditumpuk di atas `pg-005-purchase-order` (PR PG-003 s/d PG-005 belum merge)
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan untuk item ini.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0026_pg006_penerimaan.sql` |
| Core pengadaan | `src/core/pengadaan/{types,queries,service}.ts` |
| Modul | `src/modules/pengeluaran/penerimaan/{actions,schema,queries,screen,format,constants,form-state}.ts(x)` |
| Komponen | `src/modules/pengeluaran/penerimaan/components/*` |
| Gaya | `src/modules/pengeluaran/penerimaan/penerimaan.module.css` (memakai ulang gaya Pengeluaran) |
| Route | `src/app/(app)/pengeluaran/penerimaan/{page,loading,error}.tsx` |
| Test | `src/modules/pengeluaran/penerimaan/schema.test.ts` |

Rancangan singkat:

- Pencatatan penerimaan memakai `catat_penerimaan` milik `C-013` apa adanya: kunci baris PO, validasi status `DITERBITKAN`/`DITERIMA_SEBAGIAN`, qty > 0, gudang aktif, penolakan kelebihan kirim dengan exception, dan pembaruan status PO turunan.
- Layar menampilkan PO yang masih punya sisa per baris (`listPoSiapTerima`), mengisi qty awal sama dengan sisa, dan memilih gudang hanya bila gudang aktif lebih dari satu (`R-05`, AC-13).
- Penerimaan tidak menyentuh stok atau jurnal: jalur ini tidak memanggil `core/inventory` maupun `core/ledger`, dan `catat_qc_penerimaan` (pemilik efek stok/jurnal) tidak dipanggil.
- Pembatalan penerimaan: `batalkan_penerimaan` menolak bila sudah ada hasil QC (`qty_lulus` terisi atau status `QC_*`), menolak tanpa alasan, lalu memakai `batalkan_dokumen` (`D-48`).
- Penutupan exception selisih: `tutup_exception_selisih` hanya untuk Purchasing, alasan wajib, status `TERBUKA → DITUTUP`, tanpa mengubah qty PO.
- Migrasi `0026` menambah tepi transisi `DITERIMA → DIBATALKAN` (aksi `BATAL`, alasan wajib) karena `0007` belum memuatnya; tanpa tepi itu R-08 tidak mungkin dijalankan.

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm test` | lolos — 136 test (130 sebelumnya + 6 test PG-006) |
| `pnpm arch:check` | lolos — 355 modul, 1158 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/penerimaan` terdaftar |
| `pnpm check:migrations` | lolos — 19 berkas, nomor unik |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ⚠️ belum | Form + `catat_penerimaan` ada; nomor `PENERIMAAN_BARANG/YYYY/MM/NNNN` dari core. Butuh DB |
| `AC-02` | ⚠️ belum | Tidak ada panggilan stok/jurnal di jalur penerimaan; butuh uji hitung baris sebelum/sesudah |
| `AC-03` | ⚠️ belum | RPC menolak PO di luar `DITERBITKAN`/`DITERIMA_SEBAGIAN` dengan pesan berisi status. Butuh uji DB |
| `AC-04` | ✅ sebagian terbukti | zod menolak qty kosong, nol, negatif; unit test `qty nol dan negatif ditolak sebelum ke server`; RPC memeriksa ulang |
| `AC-05` | ⚠️ belum | `catat_penerimaan` mencatat `SELISIH_QTY` saat qty < sisa; layar menampilkan exception terbuka. Butuh uji DB |
| `AC-06` | ⚠️ belum | RPC mengunci baris PO (`for update`) + cek versi; butuh uji dua sesi |
| `AC-07` | ⚠️ belum | Tidak ada aksi ubah; hanya pembatalan sebelum QC. Butuh uji UI/DB |
| `AC-08` | ⚠️ belum | Riwayat ditulis core pada setiap transisi; butuh uji DB |
| `AC-09` | ⚠️ belum | Alur tersedia di layar; butuh uji UI |
| `AC-10` | ⚠️ belum | Status PO turunan dihitung `catat_penerimaan`; butuh uji DB. Lihat Penyimpangan soal exception pada penerimaan sebagian |
| `AC-11` | ⚠️ belum | RPC mengembalikan `diterima: false` + mencatat `KELEBIHAN_QTY` tanpa membuat dokumen; butuh uji DB |
| `AC-12` | ✅ sebagian terbukti | zod + RPC menolak alasan kosong; unit test `pembatalan penerimaan tanpa alasan ditolak`; bagian setelah QC butuh `PG-007` |
| `AC-13` | ⚠️ belum | Layar menyembunyikan pilihan gudang bila hanya satu gudang aktif. Butuh uji UI |
| `AC-14` | ✅ sebagian terbukti | `tutup_exception_selisih` + form per baris; zod menolak alasan kosong (unit test). Butuh uji DB |

## Penyimpangan

- **Nomor dokumen.** Core mencetak `{TIPE}/YYYY/MM/NNNN`, jadi nomor penerimaan berbentuk `PENERIMAAN_BARANG/2026/11/0001`, bukan `TRM/...` seperti contoh AC-01. Sama seperti PG-005; mengubah prefiks berarti mengubah migrasi `0007`/`0014` yang sudah diterapkan.
- **Exception pada penerimaan sebagian.** R-02 menyatakan penerimaan `SEBAGIAN` yang qty-nya lebih kecil tidak membuat exception, tetapi `catat_penerimaan` milik `C-013` mencatat `SELISIH_QTY` untuk setiap kekurangan, termasuk `SEBAGIAN`. Layar mengikuti perilaku C-013 dan menampilkan exception tersebut agar tidak tersembunyi. Memperbaikinya berarti mengganti RPC C-013; diusulkan ke tech lead, bukan dikerjakan diam-diam.
- **PO yang sudah `DITERIMA` tidak bisa dibuka kembali.** R-08 menyatakan sisa qty PO kembali setelah pembatalan. State machine `D-46` tidak punya transisi mundur dari `DITERIMA`, jadi `batalkan_penerimaan` menolak pembatalan yang akan meninggalkan PO tertutup dengan sisa qty, dan memberi pesan agar koreksi lewat QC/penerimaan baru. Pembatalan penerimaan parsial (PO `DITERIMA_SEBAGIAN`) berjalan penuh.
- **Tepi transisi baru.** Migrasi `0026` menambah `DITERIMA → DIBATALKAN` ke `transisi_dokumen_sah`. Ini menyentuh state machine terkunci (`D-46`, `D-48`) dan perlu konfirmasi tech lead.
- **Migrasi `0026`.** Nomor bebas berikutnya setelah `0025` (PG-005) dan track GJ `0017`-`0022`. Mohon dikonfirmasi (`D-09`).

## Yang belum / risiko

- Belum ada bukti UI 1280px (butuh database + seed).
- Seluruh rantai PG-003 → PG-005 masih menumpuk di branch; PG-006 belum bisa diuji end-to-end sampai PO bisa diterbitkan, dan PO tertahan sampai `konfigurasi_pajak` diisi (lihat `docs/tech-debt/pg-005-bukti-db.md`).
- QC dan efek stok/jurnal ada di `PG-007`.
