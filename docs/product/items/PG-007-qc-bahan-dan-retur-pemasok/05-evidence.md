# PG-007 — Bukti Verifikasi

Status: **usulan `done` dengan utang bukti database**. Pencatatan QC, pemisahan barang gagal, dan retur pemasok selesai; seluruh AC yang butuh database belum dijalankan. Pelacakan: `docs/tech-debt/pg-007-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`
- pnpm `10.18.3`
- Next.js `16.4.6`
- Branch ditumpuk di atas `pg-006-penerimaan-barang` (PR PG-003 s/d PG-006 belum merge)
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan untuk item ini.
- Repo dipulihkan dari GitHub ke `C:\dev\lionmesh-sia` pada 2026-11-27 setelah folder OneDrive rusak.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0027_pg007_qc_retur_pemasok.sql` |
| Core pengadaan | `src/core/pengadaan/{types,queries,service}.ts` |
| Modul QC | `src/modules/pengeluaran/qc/{screen,retur-screen,actions,schema,queries,format,constants,form-state}.ts(x)` |
| Komponen | `src/modules/pengeluaran/qc/components/*` |
| Route | `src/app/(app)/pengeluaran/{qc,retur-pemasok}/{page,loading,error}.tsx` |
| Test | `src/modules/pengeluaran/qc/schema.test.ts` |

Rancangan singkat:

- QC memakai `catat_qc_penerimaan` milik `C-013` apa adanya: satu transaksi menulis mutasi masuk, `saldo_stok`, dan jurnal Dr 120 / Cr 202 lewat `catat_mutasi_stok` + `post_journal`. Total nilai = Σ(qty lulus × harga PO).
- Qty gagal dihitung dari `qty_diterima − qty_lulus` dan tidak pernah masuk stok; tidak ada mutasi atau jurnal untuknya.
- Lokasi pemisahan barang gagal disimpan sebagai teks di `penerimaan_item.lokasi_pemisahan` lewat `catat_lokasi_pemisahan` (peran Gudang), tanpa mutasi.
- Retur pemasok adalah dokumen tersendiri (`RETUR_PEMASOK`): tabel `retur_pemasok` + `retur_pemasok_item`, status `DIAJUKAN → DISETUJUI | DITOLAK | DIBATALKAN`.
- `ajukan_retur_pemasok` (Purchasing) menolak baris tanpa referensi penerimaan, produk non-bahan (`produk.tipe <> 'bahan'`), baris yang belum di-QC, dan qty melebihi qty gagal yang belum diretur.
- `putuskan_retur_pemasok` (Accounting) menolak pengaju memutuskan retur sendiri dan mewajibkan alasan saat menolak; `batalkan_retur_pemasok` (Purchasing, pengaju) hanya saat `DIAJUKAN`.
- Retur tidak mengubah stok, jurnal, atau utang: tidak ada panggilan inventory/ledger di jalur retur.

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm test` | lolos — 143 test (136 sebelumnya + 7 test PG-007) |
| `pnpm arch:check` | lolos — 373 modul, 1229 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/qc` dan `/pengeluaran/retur-pemasok` terdaftar |
| `pnpm check:migrations` | lolos — 20 berkas, nomor unik (`0016` dicadangkan GJ-001) |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ⚠️ belum | `catat_qc_penerimaan` menulis mutasi masuk per baris lulus; butuh uji saldo |
| `AC-02` | ⚠️ belum | Jurnal Dr `persediaan_bahan` / Cr `gr_ir` senilai total lulus; butuh uji jurnal |
| `AC-03` | ⚠️ belum | Mutasi + jurnal satu transaksi (RPC C-013); butuh uji akun nonaktif |
| `AC-04` | ⚠️ belum | Qty lulus 0 tidak memanggil mutasi/jurnal; butuh uji |
| `AC-05` | ✅ sebagian terbukti | Zod membatasi format qty; RPC menolak lulus > diterima dan mewajibkan semua baris. Butuh uji pesan per baris |
| `AC-06` | ⚠️ belum | RPC menolak penerimaan selain `DITERIMA`; butuh uji DB |
| `AC-07` | ⚠️ belum | RPC menolak QC kedua karena status dokumen sudah `QC_*`; butuh uji DB |
| `AC-08` | ⚠️ belum | `ajukan_retur_pemasok` membatasi qty terhadap qty gagal tersisa; butuh uji DB |
| `AC-09` | ⚠️ belum | Pengajuan Purchasing, keputusan Accounting, riwayat via core; butuh uji DB |
| `AC-10` | ⚠️ belum | RPC mengunci baris penerimaan (`for update`); butuh uji dua sesi |
| `AC-11` | ⚠️ belum | Periode terkunci ditolak `post_journal` (FND-006); butuh uji |
| `AC-12` | ⚠️ belum | Kedua layar tersedia; butuh uji UI |
| `AC-13` | ⚠️ belum | Nilai masuk memakai `po_item.harga_satuan`; butuh uji dua harga |
| `AC-14` | ✅ sebagian terbukti | Zod dan RPC menolak retur tanpa baris referensi; unit test `retur tanpa baris terisi ditolak` |
| `AC-15` | ✅ sebagian terbukti | RPC menolak pengaju memutuskan sendiri; zod mewajibkan alasan penolakan (unit test). Butuh uji DB |
| `AC-16` | ✅ sebagian terbukti | Zod mewajibkan alasan batal (unit test); RPC hanya mengizinkan `DIAJUKAN` |
| `AC-17` | ⚠️ belum | Qty gagal tidak pernah dipanggil ke mutasi; butuh uji saldo |
| `AC-18` | ✅ sebagian terbukti | `catat_lokasi_pemisahan` menyimpan teks tanpa mutasi, menolak baris tanpa qty gagal |

## Penyimpangan

- **Migrasi `0027`.** Nomor bebas berikutnya setelah `0026` (PG-006); mohon dikonfirmasi (`D-09`).
- **Tepi transisi baru.** Migrasi menambah `DIAJUKAN → DISETUJUI/DITOLAK/DIBATALKAN` untuk dokumen retur; ini menyentuh tabel state machine terkunci (`D-46`, `D-48`).
- **Izin lokasi pemisahan** memakai `catat_pengeluaran_retur` (Gudang) karena matriks belum punya kunci khusus pemisahan barang gagal. Usulan kunci baru dicatat di `03-readiness-review.md` sebagai usulan, bukan diubah sendiri.
- **Pengeluaran fisik retur** (R-09: Gudang melaksanakan) belum punya status atau langkah tersendiri; AC tidak mengujinya. Retur berhenti di keputusan Accounting.
- **Nomor dokumen** mengikuti `{TIPE}/YYYY/MM/NNNN` dari core: `RETUR_PEMASOK/2026/11/0001`.
- **Retur hanya bahan** ditegakkan lewat `produk.tipe = 'bahan'` (C-011), bukan daftar kategori.

## Yang belum / risiko

- Belum ada bukti UI 1280px (butuh database + seed).
- Rantai PG-003…PG-007 belum pernah dijalankan ke database; PO masih tertahan tarif PPN (`docs/tech-debt/pg-005-bukti-db.md`).
- Belum ada seed penerimaan `DITERIMA` maupun PO dengan harga berbeda untuk AC-02/AC-13.
