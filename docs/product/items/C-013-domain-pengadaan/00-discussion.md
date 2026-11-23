# C-013 — Diskusi

## Konteks

`C-013` adalah **domain pengadaan**: tabel dan aturan status untuk permintaan pembelian, purchase order, dan penerimaan barang (`backlog.md`, track `CORE-D pengadaan`, level 1, `depends on` `FND-002`, `FND-004`, `FND-005`). Item ini menerapkan `D-05`: pengadaan adalah domain core. Tabel dan aturannya ada di `core/pengadaan`. Layarnya tetap milik track Pengeluaran.

Item ini **memblokir** `PG-002` (permintaan pembelian) dan `PR-003` (kebutuhan dan permintaan bahan). Backlog menyebut `C-013` sebagai "titik kritis awal": dua siklus menunggunya, dan ia harus selesai di gelombang pertama.

Analisis §4.1 menjelaskan alasannya: tanpa domain core, Produksi dan Pengeluaran akan membangun dua jalur pembelian dan dua tabel utang yang tidak nyambung.

## Raw request

Tidak ada permintaan pengguna langsung. Item diturunkan dari `backlog.md` (baris `C-013`, catatan di bawah tabel Core), `epics/EPIC-CORE.md`, dan `decisions.md` (`D-05`).

## Context

- `D-05`: "Pengadaan adalah domain core. Tabel + aturan di `core/pengadaan`; layar di `modules/pengeluaran`."
- `ARCH-001` (`ARCH-06`): tabel dan aturan pengadaan hanya didefinisikan di core. Modul Pengeluaran hanya memanggil service-nya.
- Analisis §4.1 `[USULAN]`: satu tabel `permintaan_pembelian` dengan kolom `wo_id` opsional. Jika terisi, PR berasal dari Produksi. Jika kosong, PR berasal dari Gudang.
- Analisis §8.1 `[SUMBER]`: "PR yang ditolak berhenti dan tidak bisa jadi PO" dan "Barang gagal QC dipisahkan".
- `diagram-sia-lengkap.md` §5.2 (catatan rancangan, dirujuk `D-46`): satu rantai status untuk PR, PO, dan penerimaan. `PEMASOK_DITETAPKAN` adalah status PR, dan PO terbit lalu masuk `DITERBITKAN`.

## Actor / consumer

- Pemohon PR: Gudang dan Produksi (analisis §3.1 dan §5.3–§5.4).
- Purchasing: memeriksa PR dan membuat PO (matriks-izin, `D-33`).
- Gudang: mencatat penerimaan (matriks-izin, `D-33`).
- QC: mencatat hasil QC penerimaan (matriks-izin, `D-33`).
- Manajemen: menyetujui PR (matriks-izin, `D-33`).
- Modul pemanggil: Pengeluaran (layar) dan Produksi (`pengadaan.ajukanPR()`, analisis §4.1).

## Problem

Tanpa domain pengadaan yang bersama, setiap siklus menulis aturan PR, PO, dan penerimaan sendiri. Dua siklus akan menghasilkan dua definisi pembelian dan dua jalur utang, dan Produksi akan menunggu seluruh siklus Pengeluaran selesai (`EPIC-CORE`, "Kenapa C-013 ada di sini").

## Desired outcome

Ada satu set tabel dan aturan status untuk PR, PO, dan penerimaan di core. Pengeluaran menampilkan layarnya, dan Produksi mengajukan PR lewat service yang sama, tanpa menyalin aturan.

## Known constraints

| Sumber | Constraint |
|---|---|
| `D-05` | Tabel dan aturan di core, layar di Pengeluaran. |
| `D-06` | Stok masuk hanya lewat `core/inventory` (`FND-005`). Penerimaan memanggil service inventory, tidak menulis `saldo_stok` langsung. |
| `D-08`, `D-32` | Setiap transisi status dokumen masuk `riwayat_status` (polimorfik). Audit berupa kolom. |
| `D-09` | Migrasi pengadaan dinomori dan di-merge tech lead. Kelompok mengirim DDL sebagai usulan. |
| `D-15` | Toleransi three-way match hanya untuk harga/total. Selisih qty selalu exception. |
| `D-25`, `ARCH-08` | Produksi tidak membaca tabel pengadaan langsung; ia memanggil service. |
| `D-37` | Mesin approval di `FND-004`. Item ini memanggilnya, tidak membuat mesin sendiri. |
| `D-42` | Pemohon tidak boleh menyetujui dokumen miliknya. Pemisahan tugas ditegakkan sistem. |
| `D-46`, `D-47` | Daftar status mengikuti diagram §5.2. Penambalan hanya dari sumber yang ada. |
| `D-48` | Pembatalan sebelum posting oleh pemohon dengan alasan wajib. Setelah posting hanya lewat jurnal pembalik. |
| `D-49` | Penerimaan melebihi qty PO ditolak sebagai exception. Penerimaan parsial diizinkan sampai qty PO terpenuhi. |
| `D-50` | Dokumen tidak dihapus; dibatalkan lewat status. Master nonaktif tidak bisa dipilih. |
| `D-35`, `D-41`, `D-44` (1) | Jurnal QC lulus lewat peran akun: `persediaan_bahan` dan `gr_ir`. Nomor di konfigurasi. |
| `D-18`, `D-53` | Pengguna pengadaan adalah akun staf. |
| `FND-004` (backlog) | Penomoran, status, riwayat, dan approval berjenjang adalah domain `FND-004`. C-013 memakainya. |

## Open questions

Status per 2026-11-22 (setelah D-47 sampai D-53): 14 pertanyaan — 10 terjawab dari keputusan terkunci, 4 `[USULAN-AGEN]` (PT-05, PT-09, PT-11, PT-13), 0 terbuka. PT-14 ditambahkan saat penulisan ulang status DITOLAK. Rincian di bawah.

- PT-01 — Cakupan tabel: backlog menyebut permintaan, PO, dan penerimaan. Apakah QC, invoice, utang, dan pembayaran termasuk C-013? Owner: pengguna dengan tech lead. **Status: Terjawab — D-31.** Cakupan: permintaan, PO, penerimaan, dan QC. Invoice dan utang menjadi tabel core yang dibuat `PG-008` dan `PG-009`.
- PT-02 — Waktu stok masuk: saat penerimaan, atau setelah QC lulus? Owner: pengguna. **Status: Terjawab — D-36.** Stok masuk setelah QC lulus. Sejalan `D-44` (1): Dr `persediaan_bahan` / Cr `gr_ir` senilai qty lolos × harga PO.
- PT-03 — Daftar status PR, PO, dan penerimaan. Owner: pengguna dengan tech lead. **Status: Terjawab — D-46 dan D-47.** Daftar status dari diagram §5.2. Nama akhir mengikuti diagram. `DIBATALKAN` tidak ada di §5.2, tetapi `D-47` (a) sudah memakainya untuk pesanan, dan `D-48` memberi pembatalan. Pertentangan dengan `D-47` (d) dibahas di PT-13.
- PT-04 — Batas aturan dan approval: transisi mana yang ditegakkan core, dan mana yang hanya alur layar? Owner: tech lead. **Status: Terjawab — D-37.** Core menegakkan: PO hanya dari PR `DISETUJUI`; PR `DITOLAK` tidak bisa jadi PO; transisi approval lewat mesin `FND-004`. Layar dan alur pilih pemasok milik `PG-003`–`PG-005`.
- PT-05 — Permintaan dari Produksi: apakah `wo_id` dipakai, dan bagaimana referensinya ke `perintah_produksi` (`PR-002`) yang belum ada? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: kolom `wo_id` nullable tanpa foreign key di C-013. Foreign key ke `perintah_produksi` ditambahkan `PR-002` lewat migrasi yang dinomori tech lead (`D-09`). Alasan: `PR-002` belum ada saat C-013 dibangun, dan kolom nullable mempertahankan satu tabel PR (analisis §4.1).
- PT-06 — Penerimaan parsial: satu PO boleh diterima sebagian dalam beberapa penerimaan? Batas jumlahnya? Owner: pengguna. **Status: Terjawab — D-49 dan D-46.** Penerimaan parsial diizinkan (jalur `DITERBITKAN` → `DITERIMA_SEBAGIAN` → `DITERIMA`). Total qty penerimaan tidak boleh melebihi qty PO. Tidak ada batas jumlah penerimaan.
- PT-07 — Qty penerimaan lebih besar dari qty PO. Owner: pengguna. **Status: Terjawab — D-49.** Penerimaan melebihi qty PO ditolak sebagai exception. Tidak ada stok masuk untuk kelebihan itu.
- PT-08 — Hak: siapa yang boleh mengajukan PR, memeriksa, menyetujui, membuat PO, dan mencatat penerimaan? Apakah core menegakkan hak ini? Owner: pengguna dengan tech lead. **Status: Terjawab — D-33, D-42, D-48.** Hak per aksi dari matriks-izin. `D-42` menegakkan pemisahan tugas. Penegakan dimiliki `FND-003` dan `FND-004`, dan core memanggilnya. Pembatalan oleh pemohon: `D-48`.
- PT-09 — Cara membuktikan DoD butir 1 untuk item core tanpa layar. Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: AC-01 sampai AC-03, AC-05, dan AC-07 dibuktikan lewat uji service yang memanggil `pengadaan.ajukanPR()` dan service PO. Layar Pengeluaran (`PG-002`) menjadi bukti akhir saat sudah ada. Alasan: C-013 tidak punya layar sendiri (`D-05`).
- PT-10 — Ambang approval nominal (`aturan_approval`) ada di `FND-004`, bukan di C-013. Konfirmasi. Owner: tech lead. **Status: Terjawab — D-37.** Ambang nominal di `FND-004`; C-013 hanya memanggil approval.
- PT-11 — Ukuran: cakupan tabel dan aturan ini besar. Dipecah atau tidak? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: tidak dipecah. Satu item dengan ukuran L, karena `D-31` sudah mempersempit cakupan. Pemecahan lewat `decompose` tetap bisa dipilih tech lead, tetapi tidak wajib.
- PT-12 — Konflik urutan dengan `D-20`. Owner: pengguna dengan tech lead. **Status: Terjawab — D-34.** C-013 gelombang 1 (memblokir).
- PT-13 — Pembatalan PR dan PO: `D-47` (d) menyatakan pembatalan PR dan PO tidak ditambah, tetapi `D-48` memberi pemohon hak membatalkan sebelum posting. Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: pemohon boleh membatalkan PR selama PO belum terbit, dan PO selama belum ada penerimaan. Dokumen menjadi `DIBATALKAN` dengan alasan wajib, dan transisi tercatat di `riwayat_status`. Penerimaan yang sudah `QC_LULUS` dan berjurnal tidak bisa dibatalkan; koreksi lewat jurnal pembalik (`D-35`). Alasan: `D-48` lebih baru dan lebih umum; `DIBATALKAN` sudah dipakai `D-47` (a) untuk pesanan, sehingga tidak ada status baru. Pertentangan dengan `D-47` (d) dicatat di `03`.
- PT-14 — Penolakan PR: apakah PR `DITOLAK` bisa diajukan ulang? Owner: tech lead. **Status: Terjawab — D-46.** `DITOLAK` adalah cabang akhir (tidak ada transisi keluar di diagram §5.2). Analisis §8.1: "PR yang ditolak berhenti". Pemohon mengajukan PR baru.

## Decisions

| ID | Keputusan | Tanggal | Owner | Konsekuensi |
|---|---|---|---|---|
| `D-05` | Pengadaan domain core; layar di Pengeluaran | 2026-11-17 | pengguna | Produksi tidak menunggu siklus Pengeluaran |
| `D-06` | Stok lewat core inventory | 2026-11-17 | pengguna | Penerimaan memanggil service inventory |
| `D-08` | Satu `riwayat_status` untuk semua dokumen | 2026-11-17 | pengguna | Transisi PR, PO, penerimaan tercatat di sana |
| `D-09` | Migrasi dinomori tech lead | 2026-11-17 | pengguna | DDL pengadaan dikirim sebagai usulan |
| `D-15` | Toleransi match hanya harga/total | 2026-11-17 | pengguna | Selisih qty selalu exception |

Keputusan lintas item yang berlaku (ditambahkan 2026-11-22):

| ID | Keputusan | Konsekuensi untuk C-013 |
|---|---|---|
| `D-31` | Cakupan: permintaan, PO, penerimaan, QC | PT-01 |
| `D-33` | Matriks izin v0 | PT-08 |
| `D-34` | C-013 gelombang 1 (memblokir) | PT-12 |
| `D-35` | Peran akun; dokumen batal = jurnal pembalik | PT-13 |
| `D-36` | Stok masuk setelah QC lulus | PT-02 |
| `D-37` | Mesin approval di FND-004 | PT-04, PT-10 |
| `D-41` | Akun persediaan bahan dan GR/IR (202) | jurnal stok masuk |
| `D-42` | Pemisahan tugas ditegakkan sistem | PT-08 |
| `D-44` (1) | Bahan masuk saat QC lulus | jurnal stok masuk |
| `D-46` | Daftar status mengikuti diagram state machine | PT-03, PT-14 |
| `D-47` | Penambalan status; (d) pembatalan PR/PO tidak ditambah | PT-03, PT-13 (pertentangan) |
| `D-48` | Pembatalan sebelum posting; approval gugur bila direvisi | PT-08, PT-13 |
| `D-49` | Penerimaan parsial; over-receipt ditolak | PT-06, PT-07 |
| `D-50` | Dokumen tidak dihapus; dibatalkan lewat status | INV-03 |

## Assumptions (agent-proposed)

Ini daftar `[USULAN-AGEN]` yang dibuat di item ini. Semua menunggu kunci koordinator.

- PT-05: kolom `wo_id` nullable tanpa foreign key; FK menyusul di `PR-002`.
- PT-09: pembuktian DoD butir 1 lewat uji service.
- PT-11: satu item, ukuran L, tidak dipecah.
- PT-13: pembatalan PR selama PO belum terbit, PO selama belum ada penerimaan; status `DIBATALKAN` dengan alasan wajib.
- `[USULAN]` Dokumen dibatalkan, tidak dihapus (analisis §8.2 #9; `D-50`).

## Rejected alternatives (optional)

- Tabel pengadaan di `modules/pengeluaran`. Ditolak: `D-05` dan `ARCH-06`.
- Dua tabel PR, satu untuk Gudang dan satu untuk Produksi. Ditolak: analisis §4.1 dan §9.4 poin 2.
- Mengulang PR `DITOLAK` lewat `REVISI`. Ditolak: `DITOLAK` adalah cabang akhir di diagram §5.2 (PT-14).

## Next step

Tidak ada pertanyaan terbuka. Item ini menunggu dependensi `FND-002`, `FND-004`, dan `FND-005` berstatus `done`, lalu siap menjadi `Ready` (lihat `03`). Usulan `PT-05`, `PT-09`, `PT-11`, dan `PT-13` perlu dikunci koordinator. Pertentangan `D-47` (d) dengan `D-48` perlu keputusan koordinator.

## Klarifikasi tech lead 2026-11-23

D-57 menyelesaikan pembatalan PR; D-58 mengesahkan usulan konsisten dan memisahkan status PO/penerimaan. D-64 menetapkan pembatalan PO oleh Purchasing pembuat sebelum penerimaan, referensi Produksi dan atomisitas QC. Catatan lama di atas dipertahankan sebagai riwayat, bukan keputusan terkini. Gate FND telah selesai; lihat 03 untuk verdict terbaru.
