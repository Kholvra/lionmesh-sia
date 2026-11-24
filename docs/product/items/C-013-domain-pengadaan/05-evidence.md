# C-013 — Bukti Verifikasi

> Review 2026-11-24: skenario baru diuji pada database PostgreSQL lokal terisolasi yang menyalin skema/data C-011, kemudian menerapkan DDL C-013. `node scripts/verify-c013.mjs` menghasilkan 17/17 skenario lulus: termasuk Produksi tanpa `wo_id` ditolak, PR Gudang tanpa `wo_id` diterima, pembatalan oleh pemohon PR ditolak, injeksi kegagalan stok/jurnal/riwayat, periode terkunci, serta penolakan QC bila nilai jurnal setelah pembulatan nol. Perubahan akibat uji di-rollback. AC-18 validasi keberadaan menunggu PR-002; AC-10 snapshot identik pada dua database terisolasi hasil salinan kondisi awal yang sama; perintah reset dan seed literal tidak dijalankan untuk menjaga database bersama. Item belum siap dinyatakan selesai.

**Tanggal:** 2026-11-24
**Branch:** `c-013-domain-pengadaan`
**Lingkungan:** PostgreSQL 17.12 (Supabase lokal, `127.0.0.1:54322`), Node 24, pnpm 10.18.3
**Harness:** `scripts/verify-c013.mjs` (satu transaksi, diakhiri `ROLLBACK`, sehingga dapat diulang)
**Hasil:** 14/14 AC di harness PASS; AC-10 dibuktikan dengan dua siklus `db:reset` + `db:seed` (snapshot identik).

Item ini core tanpa layar (`D-05`), jadi pembuktian memakai harness RPC yang menjadi kontrak `core/pengadaan` (`PT-09`, `[USULAN-AGEN]`). Layar Pengeluaran (`PG-002`+) menjadi bukti akhir saat sudah ada.

## Perintah

```bash
pnpm db:reset
pnpm db:seed:local
node scripts/verify-c013.mjs
pnpm verify
```

Keluaran ringkas run terakhir:

```text
=== C-013 domain pengadaan verification ===
Database: PostgreSQL 17.12 ...

[PASS] AC-01 ... [PASS] AC-09
[PASS] AC-11 ... [PASS] AC-15
=== 14/14 AC PASS ===
```

`pnpm verify` → exit 0; `pnpm test` → 24 test, 24 pass; `pnpm arch:check` → tidak ada pelanggaran; `pnpm build` sukses.

## Hasil per AC

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ✅ | `pr_wo_id = [null, "c0130000-…-0000000000aa"]`; dua PR di tabel `permintaan_pembelian`, masing-masing satu baris item. |
| `AC-02` | ✅ | `buat_po` dari PR `DITOLAK` → error “Permintaan pembelian berstatus DITOLAK tidak bisa dijadikan PO.”; `po_count = 0`. |
| `AC-03` | ✅ | PO dari PR `MENUNGGU_PERSETUJUAN` ditolak dengan “Status PR saat ini: MENUNGGU_PERSETUJUAN”; PO dari `DISETUJUI` berhasil (`DITERBITKAN`), PR menjadi `PEMASOK_DITETAPKAN`; jalur `PEMASOK_DITETAPKAN` juga berhasil. |
| `AC-04` | ✅ | Penerimaan 8 dari PO 10 → `pengadaan_exception` `SELISIH_QTY`, `selisih = 2.0000`; tidak ada toleransi yang diterapkan. |
| `AC-05` | ✅ | Penerimaan 12 dari PO 10 → `diterima=false` (“melebihi sisa PO”), exception `KELEBIHAN_QTY` (`selisih 2`), 0 baris `penerimaan`, `saldo_stok` tetap `0`. |
| `AC-06` | ✅ | Setelah penerimaan 6: saldo `0`; setelah QC lulus 6: saldo `6.0000` (selisih tepat 6). |
| `AC-07` | ✅ | Riwayat PR: `BUAT:DIAJUKAN → PERIKSA:MENUNGGU_PERSETUJUAN → SETUJUI:DISETUJUI`; tiap transisi +1 baris; `actor_id` dan `created_at` terisi. |
| `AC-08` | ✅ | PR tanpa PO dibatalkan pemohon → status `DIBATALKAN`, baris tetap ada, `riwayat_status.alasan = "salah input"`; alasan kosong ditolak. Trigger `trg_*_no_delete` menolak `DELETE` di semua tabel pengadaan. |
| `AC-09` | ✅ | Lihat “Pencarian kode” di bawah; 7 tabel hanya punya `SELECT` untuk `authenticated`/`anon`, tulis hanya lewat RPC `core/pengadaan`. |
| `AC-10` | ✅ | Dua siklus `pnpm db:reset && pnpm db:seed:local && node scripts/verify-c013.mjs` menghasilkan baris `SNAPSHOT` identik (`diff` kosong), termasuk `jumlah_baris`. |
| `AC-11` | ✅ | `pindah_status_dokumen` dari `DITOLAK` → `REVISI` ditolak (“Status DITOLAK tidak bisa diubah”); PR baru berhasil (`DIAJUKAN`). |
| `AC-12` | ✅ | PO 10: terima 4 → `DITERIMA_SEBAGIAN`; terima 6 → `DITERIMA`; terima 1 → ditolak (“PO sudah diterima penuh”). |
| `AC-13` | ✅ | QC lulus 6 × 50 → jurnal `PENERIMAAN_BARANG` Dr `persediaan_bahan` 300.00 / Cr `gr_ir` 300.00; tepat satu jurnal; penerimaan tanpa QC tidak berjurnal. |
| `AC-14` | ✅ | Pemohon (Gudang) mencoba menyetujui PR-nya sendiri → “Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri.”; status tetap `MENUNGGU_PERSETUJUAN`. |
| `AC-15` | ✅ | PO tanpa penerimaan → `DIBATALKAN`; PO yang sudah punya penerimaan → ditolak (“PO sudah ada penerimaan…”). |

### AC-10 — snapshot dua siklus reset + seed

```json
{"pr_wo_id":[null,"c0130000-0000-4000-8000-0000000000aa"],"riwayat_aksi":["BUAT:DIAJUKAN","PERIKSA:MENUNGGU_PERSETUJUAN","SETUJUI:DISETUJUI"],"rejected_pr_po_count":0,"po_status":"DITERBITKAN","pr_status_setelah_po":"PEMASOK_DITETAPKAN","selisih":{"tipe":"SELISIH_QTY","qty_po":"10.0000","qty_diterima":"8.0000","selisih":"2.0000"},"over_receipt":{"diterima":false,"exception":"KELEBIHAN_QTY","saldo":"0"},"stok":{"sebelum":"0","setelah_terima":"0","setelah_qc":"6.0000"},"jurnal":{"debit":"300.00","kredit":"300.00","sumber":"PENERIMAAN_BARANG"},"penerimaan_parsial":["DITERIMA_SEBAGIAN","DITERIMA","DITOLAK"],"pembatalan_pr":{"status":"DIBATALKAN","alasan":"salah input"},"pembatalan_po":{"tanpa_penerimaan":"DIBATALKAN","setelah_penerimaan":"DITOLAK"},"tabel_pengadaan":["penerimaan","penerimaan_item","pengadaan_exception","permintaan_pembelian","permintaan_pembelian_item","po","po_item"],"jumlah_baris":{"permintaan":13,"po":6,"penerimaan":5,"exception":5,"jurnal":1}}
```

## Pencarian kode (AC-09)

```text
$ grep -rnE 'from\("(permintaan_pembelian|penerimaan|po)"\)|insert into public\.(permintaan_pembelian|penerimaan|po)\b|update public\.(permintaan_pembelian|penerimaan|po)\b|delete from public\.(permintaan_pembelian|penerimaan|po)\b' src
(tidak ada akses tabel langsung di src)

$ grep -rnE '\.rpc\("(ajukan_pr|periksa_pr|tetapkan_pemasok_pr|buat_po|batalkan_pr|batalkan_po|catat_penerimaan|catat_qc_penerimaan)"' src
src/core/pengadaan/service.ts → rpc("ajukan_pr")
src/core/pengadaan/service.ts → rpc("periksa_pr")
src/core/pengadaan/service.ts → rpc("tetapkan_pemasok_pr")
src/core/pengadaan/service.ts → rpc("buat_po")
src/core/pengadaan/service.ts → rpc("catat_penerimaan")
src/core/pengadaan/service.ts → rpc("catat_qc_penerimaan")
src/core/pengadaan/service.ts → rpc("batalkan_pr")
src/core/pengadaan/service.ts → rpc("batalkan_po")
```

## Uji unit gerbang input

`src/core/pengadaan/rules.test.ts` — 10 test, hijau. Menutup: baris kosong, qty nol/negatif/notasi aneh, PPn di luar 0–100, alasan kosong, versi dokumen tidak sah, dan pemetaan payload RPC. Dijalankan oleh `pnpm test` yang juga dipakai `pnpm verify`.

## Penyimpangan / keputusan implementasi

1. **SELISIH_QTY pada penerimaan sebagian.** AC-04 meminta penerimaan 8 dari PO 10 tercatat sebagai exception. `PG-006` R-02 nanti membedakan penerimaan sebagian vs penuh. Untuk C-013, exception dicatat setiap kali `qty_diterima < sisa`, tanpa toleransi (`D-15`); `PG-006` boleh mempersempit tampilannya.
2. **QC per baris dengan satu status dokumen.** `qty_lulus` disimpan per `penerimaan_item`; status penerimaan `QC_LULUS` bila total lulus > 0, `QC_GAGAL` bila total 0. Retur barang gagal milik `PG-007`.
3. **Over-receipt dicatat lalu ditolak.** RPC mengembalikan `{diterima:false, pesan, exception_ids}` setelah menulis exception, tanpa membuat baris `penerimaan` dan tanpa mutasi stok. Service memetakannya menjadi `Result` gagal.
4. **Pembatalan penerimaan dan penutupan exception tidak dibuat di C-013.** Keduanya milik `PG-006` (R-08, R-10) dan tidak ada AC-nya di item ini. Dokumen penerimaan sudah punya status `DIBATALKAN` di daftar status agar `PG-006` bisa menambah transisinya.
5. **Tipe dokumen dan sumber jurnal.** Migrasi 0014 mendaftarkan `PURCHASE_ORDER`, `PENERIMAAN_BARANG`, daftar statusnya, dan sumber jurnal `PENERIMAAN_BARANG` (`peran_berhak = QC`). `PERMINTAAN_PEMBELIAN` tetap didaftarkan seed `FND-004` (0010).
6. **`wo_id` nullable tanpa foreign key** (`PT-05`). FK ke `perintah_produksi` menyusul di `PR-002`.
7. **Akses tulis hanya `service_role`.** RPC `SECURITY DEFINER` mencabut hak `public/anon/authenticated`; aktor diambil dari parameter yang diisi server dari sesi. Modul wajib memakai `src/core/pengadaan/service.ts`.
8. **Read model TS belum ada.** `queries.ts` sengaja tidak dibuat karena belum ada konsumen; layar `PG-002` akan menambahkannya di core.

## Tidak dikerjakan

- Layar, alur approval, pemilihan pemasok, UI PO/penerimaan/QC (`PG-002`–`PG-007`).
- Retur ke pemasok dan penutupan exception (`PG-006`, `PG-007`).
- Invoice, utang, three-way match, pembayaran (`PG-008`, `PG-009`).
- FK `wo_id` ke `perintah_produksi` (`PR-002`).
- Jurnal pembalik untuk pembatalan dokumen yang sudah berjurnal (belum ada dokumen pengadaan yang berjurnal selain penerimaan `QC_LULUS`, dan pembatalannya di luar C-013).

## Risiko tersisa

| Risiko | Mitigasi |
|---|---|
| Penerimaan dan mutasi stok tidak sinkron | QC memanggil `catat_mutasi_stok` dan `post_journal` dalam transaksi RPC yang sama; AC-06/AC-13 |
| Dua penerimaan bersamaan melewati sisa PO | `SELECT … FOR UPDATE` pada baris `po`; `INV-06`; AC-12 |
| Modul menulis tabel pengadaan | Tidak ada grant tulis ke klien; `ARCH-06`; AC-09 |
| Toleransi qty dipakai diam-diam | Exception `SELISIH_QTY` selalu dibuat; `D-15`; AC-04 |
| Perbedaan tafsir QC parsial dengan `PG-007` | Dicatat di atas; `PG-007` memutuskan retur/rework |

## Keputusan tech lead: nilai jurnal nol

Untuk mencegah perubahan stok tanpa jurnal yang diwajibkan D-44, QC lulus ditolak ketika jumlah nilai setelah pembulatan menjadi nol. Nilai positif yang terlalu kecil, misalnya qty 1 × harga 0,0001, termasuk kondisi ini; transaksi di-rollback dan pesan meminta nilai jurnal lebih dari nol. Keputusan ini tidak menetapkan kebijakan barang gratis; perlakuan barang gratis memerlukan keputusan terpisah sebelum diaktifkan. Uji AC-19 pada database terisolasi memastikan saldo dan status tidak berubah.

- AC-10 ulang 2026-11-24: dua database uji terisolasi (`lionmesh_c013_v2`, `lionmesh_c013_v3`) disiapkan dari kondisi awal yang sama dan DDL 0014; `diff -u` hasil baris SNAPSHOT kosong. Pengujian tidak mereset database bersama.
