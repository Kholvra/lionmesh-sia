# PG-007 — Diskusi

## Konteks

PG-007 mengambil penerimaan yang sudah dicatat (PG-006) lalu memeriksa mutu bahan. Hanya bahan yang lulus QC boleh masuk stok. Bahan yang gagal dipisahkan dan bisa diretur ke pemasok. Item ini berada di track PG-C penerimaan, level 6 (derived dari backlog).

Sumber: `[ANALISIS]` "Stok baru masuk setelah QC lulus, bukan saat diterima" (`reference/analisis-sia.md` §6.4). `[SUMBER]` "Barang gagal QC dipisahkan" (§8.1). `[SUMBER]` status QC: lulus dan gagal untuk bahan (§5.3 PG-7).

## Actor / consumer

- QC: pencatat hasil pemeriksaan (D-33, "Catat QC" = QC).
- Gudang: memisahkan barang gagal secara fisik dan melaksanakan pengeluaran retur fisik.
- Purchasing: mengajukan retur ke pemasok.
- Accounting: menyetujui retur (D-49) dan pemilik jurnal QC lulus.

## Problem

Tanpa QC yang tercatat, barang cacat dapat dihitung sebagai tersedia (`analisis-sia.md` §6.4). Tanpa jalur retur, barang gagal tidak punya jejak keluar dari gudang atau dari kewajiban ke pemasok.

## Desired outcome

- Hasil QC tercatat per baris penerimaan.
- Qty lulus masuk stok dan menghasilkan jurnal dalam satu transaksi.
- Qty gagal tidak masuk stok dan tercatat sebagai barang terpisah.
- Retur ke pemasok tercatat sebagai dokumen dengan jejak dan persetujuan.

## Known constraints

- Barang masuk stok hanya setelah QC lulus (EPIC-PG, D-36).
- Mutasi stok mengubah `saldo_stok` dalam transaksi yang sama (D-06).
- Jurnal hanya lewat `postJournal()` (D-07, D-43).
- Retur hanya untuk bahan (D-13).
- Akun 120 dan 202 sudah ditetapkan peran dan nomornya (D-35, D-41).

## Keputusan yang sudah terkunci

| Sumber | Isi | Konsekuensi |
|---|---|---|
| `EPIC-PG` | Barang masuk stok hanya setelah QC lulus | Stok bertambah hanya di jalur QC lulus |
| `D-06`, `D-10` | Qty dari mutasi, nilai di `saldo_stok` dengan rata-rata bergerak | Nilai masuk dihitung dengan rata-rata bergerak |
| `D-07`, `D-43` | Jurnal hanya lewat `postJournal()`, langsung diposting, tanpa jurnal manual | QC lulus menghasilkan jurnal lewat service ledger |
| `D-08` | Riwayat status polimorfik | Setiap perubahan status QC dan retur masuk riwayat |
| `D-13` | Retur hanya untuk bahan | Retur hanya untuk barang gagal bahan |
| `D-25` | Lintas siklus lewat service core | Stok dan jurnal diubah lewat `core/inventory` dan `core/ledger` |
| `D-33` | "Catat QC" = QC | Hasil QC dicatat QC, bukan Gudang |
| `D-36` | Stok bahan masuk setelah QC lulus | Qty gagal tidak masuk stok |
| `D-44` (1) | Dr 120 / Cr 202 senilai qty lulus × harga PO | Jurnal QC lulus |
| `D-46` | Status `DITERIMA`, `QC_LULUS`, `QC_GAGAL` | Nama status baris QC |
| `D-48` | Pembatalan sebelum diposting dengan alasan wajib | Retur dapat dibatalkan sebelum disetujui |
| `D-49` | Dokumen retur tersendiri, wajib merujuk penerimaan asal, jumlah tidak melebihi yang diterima, disetujui Accounting | Bentuk dan persetujuan retur |

## Open questions

| ID | Pertanyaan | Kenapa penting | Pemilik | Status |
|---|---|---|---|---|
| Q-01 | Apakah bahan punya status rework selain lulus dan gagal? Sumber menyebut rework dan reject untuk produksi (G6), tetapi tidak untuk bahan. | Menentukan jumlah status QC | Pengguna | Terjawab — sumber: `LAPORAN_PENGERJAAN_PROYEK.txt` (form pemeriksaan QC): "status diterima atau ditolak", dua status, tanpa rework untuk bahan. Istilah rework di sumber berasal dari produksi (D-13). |
| Q-02 | Barang gagal QC disimpan di mana (karantina atau lokasi terpisah), dan apakah pemindahannya dicatat sebagai mutasi stok? | Menentukan apakah barang gagal menyentuh `saldo_stok` | Pengguna + tech lead | Terjawab — [USULAN-AGEN]: lokasi pemisahan dicatat sebagai teks pada baris QC gagal (mis. "karantina") dan tidak membuat mutasi. Dasar: D-36 (qty gagal tidak masuk stok) dan `diagram-sia-lengkap.md` PG08 ("barang dipisahkan", "catat qty gagal ke daftar retur"). Alasan: tanpa lokasi master, pemindahan tidak punya efek stok. |
| Q-03 | QC sebagian: satu penerimaan boleh lulus sebagian dan gagal sebagian, per baris atau per qty? | Menentukan aturan qty lulus dan qty gagal | Pengguna | Terjawab — [USULAN-AGEN] berdasarkan `proses-bisnis.md` A5: QC dicatat per baris dengan qty lulus dan qty gagal; jumlahnya sama dengan qty diterima baris. Pencatat QC adalah QC (D-33, lihat Q-10). |
| Q-04 | Retur ke pemasok: dokumen tersendiri atau bagian dari penerimaan? Status apa, siapa yang menyetujui, dan apakah harus berasal dari barang gagal QC? | Menentukan bentuk dokumen retur | Pengguna | Terjawab — D-49: dokumen retur tersendiri; wajib merujuk penerimaan asal; jumlah tidak melebihi qty yang diterima gagal; disetujui Accounting. Status retur `DIAJUKAN` → `DISETUJUI` / `DITOLAK`, dan `DIBATALKAN` sebelum disetujui (D-48), adalah [USULAN-AGEN] dengan nama dari diagram §5.2 (`DIAJUKAN`, `DISETUJUI`, `DITOLAK`). |
| Q-05 | Efek retur ke stok: karena barang gagal belum masuk stok, apakah retur mengubah `saldo_stok`? | Menentukan mutasi keluar atau tidak | Pengguna + tech lead | Terjawab — D-36: barang gagal tidak pernah masuk saldo, sehingga retur tidak membuat mutasi dan tidak mengubah `saldo_stok`. |
| Q-06 | Efek retur ke utang dan jurnal: apakah ada jurnal balik, dengan akun apa, dan apakah retur bisa terjadi sebelum atau sesudah invoice (PG-008)? | Menyentuh uang; akun belum ditetapkan | Pengguna + Accounting + FND-006 | Terjawab — [USULAN-AGEN]: retur tidak membuat jurnal dan tidak mengubah utang, di kapan pun ia terjadi. Dasar: D-44 (1) hanya mengakui qty lulus ke GR/IR, dan PG-008 membandingkan invoice dengan qty lulus, sehingga barang gagal tidak pernah ada di GR/IR maupun di utang. Retur tidak menunggu PG-008. |
| Q-07 | Akun jurnal QC lulus: debit persediaan bahan, kredit GR/IR. Akun GR/IR tidak ada di sumber (G13). | Syarat wajib untuk item yang menyentuh uang | Pengguna (Accounting) + FND-006 | Terjawab — D-44 (1) dan D-41: Dr 120 Persediaan bahan baku / Cr 202 Utang belum difakturkan (= akun GR/IR, D-35). |
| Q-08 | Nilai masuk stok saat QC lulus: harga satuan diambil dari PO atau penerimaan? | Menentukan nilai `saldo_stok` | Pengguna + tech lead | Terjawab — D-44 (1): nilai masuk = qty lulus × harga PO. |
| Q-09 | Perlakuan biaya barang gagal QC untuk bahan. G6 hanya memutuskan untuk produksi. | Menentukan apakah ada beban dan ke akun mana | Pengguna | Terjawab — [USULAN-AGEN]: barang gagal bahan tidak menimbulkan beban atau jurnal pada versi awal. Dasar: D-44 (1) hanya mengakui qty lulus, dan D-13 hanya mengatur retur. Retur tidak menghasilkan jurnal (Q-06). |
| Q-10 | Hak "catat QC = QC" masih usulan dan belum disahkan (§3.3). | Menentukan siapa boleh mencatat hasil | Pengguna | Terjawab — D-33: "Catat QC" = QC. Pertentangan: `proses-bisnis.md` A5 menyebut Gudang yang mengisi qty lulus; D-33 menang. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-13 | Retur hanya untuk bahan | 2026-11-22 | Pengguna | Q-04 terjawab sebagian |
| D-33 | Matriks izin v0 disahkan; "Catat QC" = QC | 2026-11-22 | Pengguna | Q-10 terjawab |
| D-36 | Stok bahan masuk setelah QC lulus | 2026-11-22 | Pengguna | Q-02 terjawab, Q-05 terjawab |
| D-41 | Nomor akun 120 Persediaan bahan baku, 202 Utang belum difakturkan | 2026-11-22 | Pengguna | Q-07 terjawab |
| D-44 | Dr 120 / Cr 202 senilai qty lulus × harga PO saat QC lulus | 2026-11-22 | Pengguna | Q-07, Q-08 terjawab |
| D-49 | Bentuk retur: dokumen tersendiri, merujuk penerimaan asal, disetujui Accounting | 2026-11-22 | Pengguna | Q-04 terjawab |
| [USULAN-AGEN] | Q-02 (lokasi sebagai teks, tanpa mutasi), Q-03 (per baris), Q-04 (status retur), Q-06 (retur tanpa jurnal), Q-09 (tanpa beban) | 2026-11-22 | Agen | Menunggu penguncian koordinator |

## Assumptions (agent-proposed)

- Status QC bahan adalah `lulus` dan `gagal` (`analisis-sia.md` §5.3; D-33). Tidak ada rework bahan.
- Barang gagal QC tidak menambah `saldo_stok` (D-36).
- Retur hanya untuk qty gagal yang belum diretur. Retur tidak mengubah saldo, jurnal, atau utang.

## Rejected alternatives (optional)

- Mengakui stok saat barang diterima (sebelum QC): ditolak oleh EPIC-PG.
- Mengakui utang saat QC lulus: ditolak oleh EPIC-PG; utang baru diakui saat tiga dokumen cocok (PG-008).
- Membuat mutasi keluar untuk retur barang gagal: ditolak karena barang gagal tidak pernah ada di saldo (D-36).
- Membuat jurnal pembalik untuk retur: ditolak karena tidak ada yang sudah diakui untuk dibalik (Q-06).

## Next step

Tidak ada pertanyaan terbuka. Item siap menjadi `Ready` begitu dependensi backlog (`PG-006`, `FND-005`) berstatus `done` dan gate fondasi terpenuhi. Usulan [USULAN-AGEN] menunggu penguncian koordinator.

## Pembaruan 2026-11-22

- Ringkasan klasifikasi (lanjutan, setelah D-47 sampai D-53): 10 pertanyaan. Terjawab dari sumber 1 (Q-01); terjawab dengan keputusan terkunci 4 (Q-05, Q-07, Q-08, Q-10); terjawab dengan keputusan terkunci dan [USULAN-AGEN] 1 (Q-04); terjawab dengan [USULAN-AGEN] 4 (Q-02, Q-03, Q-06, Q-09); terbuka 0.
- Q-06 yang sebelumnya terbuka sekarang dijawab: retur tidak berjurnal karena invoice dan GR/IR hanya memakai qty lulus.
- Q-09 yang sebelumnya terbuka sekarang dijawab: barang gagal tidak menimbulkan beban pada versi awal.
- Tidak ada pertentangan baru. Pertentangan lama tetap: pencatat QC (`proses-bisnis.md` A5 vs D-33, D-33 menang); retur (`LAPORAN` "dokumen retur tidak didefinisikan" vs D-13 dan D-49, keduanya menang); stok (`LAPORAN` "mutasi_persediaan tidak dipakai" vs D-06, D-06 menang).
- Dependensi `PG-006` dan `FND-005` berstatus `specified` di `backlog.md`. Front-matter tidak diubah.
