# PG-006 — Diskusi

## Konteks

PG-006 adalah langkah ketiga rantai pengadaan: setelah permintaan (PG-002), approval (PG-003), dan PO (PG-005), barang fisik datang dan harus dicatat oleh Gudang. Item ini berada di track PG-C penerimaan, level 5 (derived dari backlog).

Analisis menempatkan penerimaan sebagai dokumen bukti, bukan sebagai peristiwa stok atau keuangan: `[ANALISIS]` "PO tidak menaikkan stok dan tidak menaikkan utang", dan "Stok baru masuk setelah QC lulus, bukan saat diterima" (`reference/analisis-sia.md` §6.4).

## Kenapa item ini perlu dipisah

Tanpa dokumen penerimaan yang bernomor dan berstatus:

| Gejala | Akibat |
|---|---|
| Barang datang tidak tercatat | three-way match (PG-008) tidak punya dokumen kedua |
| Qty diterima tidak dibandingkan dengan PO | selisih qty lolos tanpa exception, melanggar D-15 |
| QC belum punya barang yang harus diperiksa | PG-007 tidak bisa mulai |

## Keputusan yang sudah terkunci

| Sumber | Isi | Konsekuensi untuk PG-006 |
|---|---|---|
| `EPIC-PG` — aturan mengikat | Barang masuk stok hanya setelah QC lulus | Penerimaan tidak menambah saldo stok |
| `EPIC-PG` — aturan mengikat | Utang diakui saat tiga dokumen cocok, bukan saat PO terbit | Penerimaan tidak membuat utang |
| `D-05` | Pengadaan adalah domain core; layar di modul Pengeluaran | Tabel dan aturan penerimaan di `core/pengadaan`, layar di `modules/pengeluaran` |
| `D-15` | Selisih qty selalu exception | Qty yang berbeda dari PO pada penerimaan penuh tidak boleh lolos diam-diam |
| `D-08` | `riwayat_status` polimorfik untuk semua dokumen | Setiap perubahan status penerimaan masuk ke satu riwayat |
| `D-36` | Stok bahan masuk setelah QC lulus | Penerimaan tidak membuat mutasi stok |
| `D-46` | Daftar status mengikuti state machine §5.2 | Status PO dan penerimaan mengikuti `DITERBITKAN`, `DITERIMA_SEBAGIAN`, `DITERIMA` |
| `D-48` | Pembatalan dokumen sebelum diposting; alasan wajib; approval gugur bila revisi | Penerimaan boleh dibatalkan sebelum ada hasil QC |
| `D-49` | Penerimaan melebihi qty PO ditolak sebagai exception | Kelebihan kirim tidak disimpan |
| `D-50` | Format nomor `{TIPE}/{TAHUN}/{BULAN}/{URUT}` | Nomor penerimaan mengikuti format ini |
| `ARCH-001` ARCH-05 | Nomor dan riwayat dokumen lewat `core/dokumen` | Nomor penerimaan tidak dibuat modul |
| `ARCH-001` ARCH-08 / `D-25` | Modul tidak membaca tabel modul lain | Data PO diambil lewat service core |
| `D-04` | Modul hanya boleh impor core | Layar memanggil service core, tidak memanggil modul lain |

## Actor / consumer

- Gudang: pencatat penerimaan dan pembatal penerimaan sebelum QC (`analisis-sia.md` §3.1 dan §3.3, `policies/matriks-izin.md`).
- Purchasing: pemilik PO asal; menerima informasi selisih dan menutup exception selisih (lihat Q-02).

## Masalah

Barang dari pemasok datang untuk PO yang sudah diterbitkan, tetapi belum ada catatan resmi tentang apa yang diterima, berapa qty-nya, dan apakah cocok dengan PO.

## Desired outcome

Gudang dapat mencatat penerimaan terhadap satu PO yang sah. Penerimaan tersimpan sebagai dokumen bernomor dengan status awal dan riwayat. Penerimaan ini tidak mengubah stok dan tidak membuat jurnal. Qty yang berbeda dari PO pada penerimaan penuh tercatat sebagai selisih.

## Known constraints

- Tidak ada efek stok atau jurnal dari penerimaan (EPIC-PG, D-36, D-44 (1)).
- Qty selisih pada penerimaan penuh tidak pernah lolos diam-diam (D-15).
- Kelebihan kirim ditolak (D-49).
- Format nomor `TRM/YYYY/MM/NNNN` dari usulan `analisis-sia.md` §10.4 berlaku sebagai kode tipe; format umum dikunci D-50.

## Open questions

| ID | Pertanyaan | Kenapa penting | Pemilik | Status |
|---|---|---|---|---|
| Q-01 | Apakah satu PO boleh diterima bertahap (penerimaan parsial)? Sumber hanya menyebut pengiriman parsial untuk penjualan (§8.2 #1, usulan). | Menentukan jumlah dokumen per PO dan jalur selisih | Pengguna (pemilik produk) | Terjawab — [USULAN-AGEN]: boleh. Dasar: D-46 memuat `DITERIMA_SEBAGIAN`. Setiap penerimaan menyatakan jenis `sebagian` atau `penuh`. Qty sisa per baris = qty PO dikurangi total yang sudah diterima. Penerimaan yang membuat total melebihi qty PO ditolak (D-49). Alasan: tanpa aturan ini, `DITERIMA_SEBAGIAN` tidak punya arti. |
| Q-02 | Selisih qty: exception dicatat di mana, siapa yang menyelesaikan, dan apa efeknya ke PO? | D-15 mewajibkan exception, tetapi alurnya tidak ada di sumber | Pengguna | Terjawab — [USULAN-AGEN]: selisih pada penerimaan `penuh` dicatat sebagai exception di baris penerimaan. Purchasing menutup exception dengan alasan tercatat. Penutupan tidak mengubah qty PO, sisa, atau saldo, dan tidak membuat jurnal. Dasar: UC-PG07 (konfirmasi ke Purchasing) dan D-15. |
| Q-03 | Daftar status penerimaan final dan transisinya. Status PO yang boleh diterima juga belum dinyatakan. | Membatasi kapan penerimaan boleh dibuat | Tech lead + pengguna | Terjawab — D-46 (rantai `DITERBITKAN` → `DITERIMA_SEBAGIAN` → `DITERIMA` → `QC_LULUS`/`QC_GAGAL`) + [USULAN-AGEN]: penerimaan hanya untuk PO `DITERBITKAN` atau `DITERIMA_SEBAGIAN`. Dokumen penerimaan berstatus `DITERIMA` saat tersimpan; `DITERIMA_SEBAGIAN` dan `DITERIMA` adalah status PO turunan. Pembatalan memakai `DIBATALKAN` (D-48). Alasan: diagram §5.2 menaruh status ini pada rantai PO, sehingga status PO turunan menjaga kedua sumber sejalan. |
| Q-04 | Kelebihan kirim (qty diterima melebihi qty PO): ditolak, atau masuk exception? | Menentukan validasi input | Pengguna | Terjawab — D-49: penerimaan yang melebihi qty PO ditolak, dan kejadiannya dicatat sebagai exception. Ini memperbarui jawaban sebelumnya (D-15): D-49 lebih spesifik dan lebih baru. |
| Q-05 | Harga satuan penerimaan: diambil dari PO atau diisi Gudang? | Dipakai untuk nilai stok saat QC lulus (PG-007, D-10) | Pengguna + tech lead | Terjawab — D-44 (1): bahan masuk senilai qty lolos × harga PO. Gudang tidak mengisi harga; penerimaan tidak menyimpan nilai. |
| Q-06 | Dependensi backlog: PG-006 mencantumkan `FND-005`, tetapi catat penerimaan tidak membuat mutasi stok (§6.4). Apakah `FND-005` tetap dependensi nyata? | Menentukan urutan dan gate | Tech lead | Terjawab — D-36: penerimaan tidak membuat mutasi stok, dan PG-006 boleh melepas `FND-005` secara konseptual di spesifikasi. Front-matter tetap mengikuti `backlog.md`, yang masih mencantumkan `FND-005`; perubahan backlog ada di tangan tech lead. |
| Q-07 | Gudang tujuan: selalu satu gudang per PO, atau dipilih saat penerimaan? Multi-gudang masuk cakupan (G21). | Menentukan validasi gudang | Pengguna | Terjawab — [USULAN-AGEN]: gudang dipilih per penerimaan dari gudang aktif. Dasar: D-52 (pemilihan gudang tampil hanya bila lebih dari satu gudang) dan D-06 (saldo per gudang). Alasan: penerimaan bertahap dapat masuk ke gudang berbeda. |
| Q-08 | Pembatalan atau koreksi penerimaan yang sudah tercatat: boleh tidak, siapa, dan jejak apa? | Menentukan transisi gagal dan AC koreksi | Pengguna | Terjawab — [USULAN-AGEN] di atas D-48: penerimaan boleh dibatalkan oleh Gudang pencatat dengan alasan wajib, selama belum ada hasil QC pada baris mana pun. Setelah ada hasil QC, pembatalan tidak tersedia dan koreksi lewat PG-007. Alasan: D-48 mengizinkan pembatalan sebelum diposting; penerimaan tidak berjurnal, sehingga jurnal pembalik tidak relevan. |
| Q-09 | Format nomor `TRM/YYYY/MM/NNNN` (usulan §10.4) disetujui? | Nomor dibuat oleh core dokumen | Tech lead | Terjawab — D-50: format `{TIPE}/{TAHUN}/{BULAN}/{URUT}` ditetapkan sekali di FND-004. Kode tipe `TRM` diambil dari usulan §10.4 dan ikut dikunci di FND-004. |
| Q-10 | Matriks hak akses "Catat penerimaan = Gudang" masih usulan dan belum disahkan (§3.3 "wajib disahkan"). | Menentukan siapa boleh mencatat | Pengguna | Terjawab — D-33: matriks izin v0 disahkan; baris "Catat penerimaan" = Gudang (`policies/matriks-izin.md`). |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-33 | Matriks izin v0 disahkan | 2026-11-22 | Pengguna | Q-10 terjawab |
| D-36 | Stok bahan masuk setelah QC lulus; PG-006 boleh melepas FND-005 secara konseptual | 2026-11-22 | Pengguna | Q-06 terjawab |
| D-44 | Nilai masuk = qty lolos × harga PO, saat QC lulus | 2026-11-22 | Pengguna | Q-05 terjawab |
| D-46 | Daftar status mengikuti state machine §5.2 | 2026-11-22 | Pengguna | Q-03 terjawab (nama dari diagram) |
| D-48 | Pembatalan sebelum diposting dengan alasan wajib | 2026-11-22 | Pengguna | Q-08 terjawab |
| D-49 | Kelebihan qty PO ditolak sebagai exception | 2026-11-22 | Pengguna | Q-04 terjawab; memperbarui jawaban D-15 |
| D-50 | Format nomor dokumen | 2026-11-22 | Pengguna | Q-09 terjawab |
| D-52 | Multi-gudang disiapkan; pemilihan gudang hanya bila lebih dari satu | 2026-11-22 | Pengguna | Q-07 terjawab (dilengkapi [USULAN-AGEN]) |
| [USULAN-AGEN] | Q-01, Q-02, Q-03 (status PO turunan), Q-07 (gudang per penerimaan), Q-08 (pembatalan sebelum QC) | 2026-11-22 | Agen | Menunggu penguncian koordinator |

## Assumptions (agent-proposed)

- Penerimaan dicatat terhadap satu PO yang sudah diterbitkan (asumsi dari urutan §6.4, sekarang dikukuhkan Q-01 dan Q-03).
- Nama status `DITERIMA`, `DITERIMA_SEBAGIAN`, `QC_LULUS`, `QC_GAGAL`, dan `DIBATALKAN` mengikuti diagram dan D-46/D-48.
- Penerimaan tidak menyentuh stok atau jurnal (EPIC-PG, D-36, D-44).

## Rejected alternatives (optional)

- Mengakui stok saat barang diterima: ditolak oleh EPIC-PG dan §6.4 (barang cacat ikut terhitung tersedia).
- Mengakui utang saat PO terbit: ditolak oleh EPIC-PG.
- Menyimpan kelebihan kirim sebagai penerimaan biasa dengan selisih: ditolak oleh D-49.

## Next step

Tidak ada pertanyaan terbuka. Item siap menjadi `Ready` begitu dependensi backlog (`PG-005`, `FND-005`) berstatus `done` dan gate fondasi terpenuhi. Pertanyaan bertanda [USULAN-AGEN] menunggu penguncian koordinator. Sesuai `D-40`, keputusan lintas item dikumpulkan di `decisions.md`.

## Pembaruan 2026-11-22

- Ringkasan klasifikasi (lanjutan, setelah D-47 sampai D-53): 10 pertanyaan. Terjawab penuh dengan keputusan terkunci 5 (Q-04, Q-05, Q-06, Q-09, Q-10); terjawab dengan [USULAN-AGEN] 5 (Q-01, Q-02, Q-03, Q-07, Q-08); terbuka 0.
- Q-04 diperbarui dari D-15 ke D-49. Keduanya tidak bertentangan untuk qty kurang, tetapi untuk qty lebih D-49 menang karena lebih spesifik dan lebih baru.
- Pertentangan sumber dan keputusan: diagram §5.2 menaruh `DITERIMA_SEBAGIAN` dan `DITERIMA` pada rantai satu objek bersama PO, sedangkan item ini memisahkan dokumen penerimaan. Diselesaikan dengan status PO turunan dan status dokumen `DITERIMA` (lihat Q-03).
- Dependensi backlog `PG-005` dan `FND-005` berstatus `specified`. Front-matter tidak diubah.
