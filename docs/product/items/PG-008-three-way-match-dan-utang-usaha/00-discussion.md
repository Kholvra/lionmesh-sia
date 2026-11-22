# PG-008 — Diskusi

## Konteks

PG-008 mengakui utang kepada pemasok hanya setelah tiga dokumen cocok: PO, penerimaan (yang sudah lulus QC), dan invoice pemasok. Item ini berada di track PG-D utang, level 7 (derived dari backlog). Item ini adalah titik utang pertama di seluruh rantai pengadaan dan memblokir `PG-009` serta `INT-001`.

Sumber: `[SUMBER]` "Dokumen pendukung dicocokkan sebelum utang diakui" (`reference/analisis-sia.md` §8.1). `[SUMBER]` "Apabila ketiga dokumen sesuai" (§9.1 G5). Aturan EPIC-PG: utang diakui saat tiga dokumen cocok, bukan saat PO terbit.

## Actor / consumer

- Purchasing: menjalankan pencocokan dokumen (D-33: Cocokkan dokumen = Purchasing).
- Accounting: mencatat invoice dan utang, dan mengesahkan pencocokan (D-33).
- Sistem: menghitung kecocokan dan menolak yang tidak cocok.

## Problem

Tanpa pencocokan tiga dokumen, utang bisa diakui untuk barang yang belum datang, untuk barang gagal QC, atau untuk harga dan jumlah yang tidak sesuai. Selisih qty yang lolos akan membuat pembayaran untuk barang yang tidak diterima (`analisis-sia.md` §9.2 G5, §8.2 #18).

## Desired outcome

- Invoice pemasok tercatat dengan nomor, tanggal, termin, dan baris.
- Sistem mencocokkan invoice dengan PO dan penerimaan lulus QC.
- Kecocokan lulus: utang diakui dan jurnal pengakuan dibuat setelah pengesahan Accounting.
- Kecocokan gagal: exception terbuka; tidak ada utang dan tidak ada jurnal.

## Known constraints

- Utang diakui saat tiga dokumen cocok (EPIC-PG).
- Termin pemasok wajib diisi per invoice, tanpa default (D-14).
- Toleransi per pemasok, default 0, hanya untuk harga dan total. Selisih qty selalu exception (D-15).
- Tarif PPN dari `konfigurasi_pajak` berversi; nilai tarif tidak ditulis di sini (D-17, D-51 (a)).
- Jurnal hanya lewat `postJournal()` (D-07, D-43).

## Keputusan yang sudah terkunci

| Sumber | Isi | Konsekuensi |
|---|---|---|
| `EPIC-PG` | Utang diakui saat tiga dokumen cocok | Invoice saja tidak mengakui utang |
| `EPIC-PG` gate 2 | Invoice yang qty-nya melebihi penerimaan ditolak | Ada validasi qty invoice terhadap penerimaan (pembanding lihat Q-02) |
| `D-14` | Termin pemasok tanpa default, wajib per invoice | Input termin wajib |
| `D-15` | Toleransi per pemasok, default 0, hanya harga dan total; selisih qty selalu exception | Dua jenis selisih dengan perlakuan berbeda |
| `D-17` | Harga master net; PPN dihitung di dokumen; tarif dari `konfigurasi_pajak` berversi | PPN masukan tidak hard-code |
| `D-07`, `D-43` | Jurnal lewat `postJournal()`, langsung diposting | Jurnal pengakuan lewat service ledger |
| `D-10`, `D-44` (1) | Rata-rata bergerak; nilai persediaan memakai harga PO | Selisih harga invoice tidak masuk persediaan |
| `D-24`, `D-51` (a) | Nomor faktur pajak diinput manual tanpa validasi format; tarif berversi | Nomor faktur pajak masukan manual |
| `D-33` | Cocokkan dokumen = Purchasing; Sahkan pencocokan = Accounting; Catat invoice dan utang = Accounting | Pemisahan pelaku |
| `D-35`, `D-41` | Peran akun; 201 Utang usaha, 202 Utang belum difakturkan, peran `ppn_masukan` | Jurnal pengakuan memakai peran |
| `D-38` | Transaksi IDR | Tidak ada mata uang asing |
| `D-44` (2) | Invoice cocok: Dr 202 / Cr 201 | Jurnal pengakuan dasar (lihat perluasan di R-05) |
| `D-46` | Status `COCOK`, `SELISIH`, `TERCATAT` | Nama status |
| `D-48` | Pembatalan sebelum diposting; approval gugur bila revisi; pemohon tidak menyetujui dokumennya sendiri | Pencatat invoice tidak mengesahkan invoice sendiri |
| `D-49` | Satu invoice per penerimaan; jatuh tempo = tanggal invoice + termin | Relasi dan jatuh tempo |

## Open questions

| ID | Pertanyaan | Kenapa penting | Pemilik | Status |
|---|---|---|---|---|
| Q-01 | Toleransi harga dan total: persen dan nominal berlaku bersama (keduanya terpenuhi) atau salah satu? Dihitung per baris atau per total invoice? D-15 tidak merinci. | Menentukan apakah match lulus | Pengguna | Terjawab — [USULAN-AGEN]: keduanya harus terpenuhi (AND). Berlaku per baris untuk harga satuan DPP, dan total DPP invoice dicek dengan toleransi yang sama. Default 0 berarti harga harus persis sama. Alasan: AND paling konservatif (tidak membayar lebih), dan per baris mencegah selisih saling menutup. |
| Q-02 | Invoice qty lebih kecil dari penerimaan (kurang tagih): diterima atau exception? Dan pembanding untuk gate epic: qty penerimaan, atau qty penerimaan yang sudah lulus QC? | Menentukan validasi dan `INV-02` | Pengguna | Terjawab — D-15 untuk kurang tagih (exception). Pembanding gate 2: [USULAN-AGEN] qty lulus QC. Alasan: D-44 (1) hanya mengakui qty lulus, dan utang untuk barang gagal tidak boleh diakui. Invoice yang qty-nya melebihi qty lulus ditolak. Perbedaan dengan teks EPIC-PG dicatat di bagian Pembaruan. |
| Q-03 | Harga invoice dibandingkan dengan harga PO, dengan harga penerimaan, atau keduanya? | Menentukan apa yang bertoleransi | Pengguna | Terjawab — [USULAN-AGEN] (`proses-bisnis.md` A6): harga satuan DPP invoice dibandingkan dengan harga PO; qty invoice dibandingkan dengan qty lulus QC. Konsisten dengan D-44 (1) yang mengakui persediaan pada harga PO. |
| Q-04 | Alur exception: exception pergi ke mana, siapa yang menyelesaikan, dan apakah invoice bisa dikoreksi atau diganti? | Sumber tidak mengatur alur exception | Pengguna | Terjawab — [USULAN-AGEN]: invoice tersimpan dengan status `SELISIH` dan tampil di daftar exception. Purchasing menindaklanjuti dengan pemasok. Accounting dapat merevisi invoice (pencocokan ulang; pengesahan gugur, D-48) atau membatalkannya dengan alasan sebelum `TERCATAT` (R-06). Tidak ada utang dan jurnal sebelum `COCOK`. Dasar: `diagram-sia-lengkap.md` (status `SELISIH`, "dikoreksi"), UC-PG09 (status ketidaksesuaian), dan `proses-bisnis.md` A6 (selisih diselesaikan dengan pemasok). |
| Q-05 | Selisih harga invoice terhadap nilai persediaan (rata-rata bergerak, D-10): masuk persediaan, HPP, atau akun selisih harga? | Menyentuh uang dan nilai stok; akun belum ada | Pengguna + tech lead | Terjawab — [USULAN-AGEN]: selisih harga dalam toleransi masuk ke peran akun `selisih_harga_pembelian` (nomor ditetapkan di FND-006 sesuai D-41), bukan persediaan (persediaan tetap nilai PO, D-44 (1)) dan bukan HPP. Selisih di luar toleransi menjadi `SELISIH`, tanpa jurnal. |
| Q-06 | Akun pengakuan utang: debit GR/IR, kredit Utang usaha (usulan §6.7). Akun GR/IR tidak ada di sumber (G13). | Syarat wajib item yang menyentuh uang | Pengguna (Accounting) + FND-006 | Terjawab — D-44 (2): invoice cocok → Dr 202 / Cr 201. Akun dari D-41 (201 Utang usaha, 202 Utang belum difakturkan = GR/IR, D-35). Baris PPN dan selisih harga ditambahkan pada jurnal yang sama (lihat R-05). |
| Q-07 | PPN masukan: akun PPN masukan, tarif yang berlaku, dan apakah nomor faktur pajak masukan diinput manual (D-24) atau wajib? | Menyentuh uang dan pajak | Pengguna | Terjawab — D-51 (a): mekanisme tarif berversi di `konfigurasi_pajak`, nilai awal diverifikasi dan dikutip sumbernya saat implementasi (tidak ditulis dari ingatan). Nomor faktur pajak diinput manual tanpa validasi format (D-24, D-51 (a)). Peran akun `ppn_masukan` (D-35, D-41). |
| Q-08 | Mata uang invoice pemasok: hanya IDR, atau multi-mata uang dengan kurs saat transaksi? | Menentukan kolom dan validasi | Pengguna | Terjawab — D-38: transaksi IDR sampai ada kebutuhan. |
| Q-09 | Jatuh tempo: dihitung dari tanggal invoice atau tanggal penerimaan, ditambah termin? | Menentukan aging utang | Pengguna | Terjawab — D-49: jatuh tempo = tanggal invoice + termin. |
| Q-10 | Invoice ganda: kunci unik nomor invoice dan pemasok (usulan §7.5). Invoice yang dibatalkan: bagaimana jurnal balik (usulan G12)? | Menyentuh uang dan keutuhan utang | Pengguna | Terjawab — [USULAN-AGEN]: kunci unik (pemasok, nomor invoice). Pembatalan sebelum `TERCATAT` memakai `DIBATALKAN` dengan alasan (D-48). Setelah `TERCATAT`, pembatalan hanya bila belum ada pembayaran teralokasi, dengan jurnal pembalik (D-35) dan status `DIBATALKAN` (R-09). |
| Q-11 | Satu penerimaan dengan beberapa invoice, atau invoice parsial terhadap penerimaan? | Menentukan relasi dokumen | Pengguna | Terjawab — D-49: satu invoice per penerimaan. Syarat tambahan [USULAN-AGEN]: invoice hanya dicatat bila semua baris penerimaan sudah QC final, sehingga qty lulus sudah pasti. |
| Q-12 | Apakah "tiga dokumen" tepat PO, penerimaan, dan invoice (§8.1 "dokumen pendukung")? | Menentukan cakupan match | Pengguna | Terjawab — sumber: `LAPORAN_PENGERJAAN_PROYEK.txt` definisi: "Pencocokan tiga dokumen (three-way matching), yaitu pencocokan purchase order, bukti penerimaan barang, dan invoice pemasok". |
| Q-13 | Pembagian peran: Purchasing mencocokkan dan Accounting mengesahkan. Apakah pengesahan wajib sebelum utang diakui? | Menentukan siapa boleh mengakui utang | Pengguna | Terjawab — D-33 (aksi "Sahkan pencocokan" ada di matriks, dilakukan Accounting) dan `diagram-sia-lengkap.md` PG10 (utang disimpan setelah Accounting membuka dokumen `COCOK`). Pemisahan tambahan [USULAN-AGEN]: pencatat invoice tidak boleh mengesahkan invoice yang sama (D-48). |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-14 | Termin pemasok wajib per invoice | 2026-11-22 | Pengguna | Termin tidak punya default |
| D-15 | Toleransi per pemasok, default 0; kurang tagih = exception | 2026-11-22 | Pengguna | Q-01 dan Q-02 |
| D-24 | Nomor faktur pajak diinput manual | 2026-11-22 | Pengguna | Q-07 |
| D-33 | Matriks izin v0 disahkan | 2026-11-22 | Pengguna | Q-13 |
| D-35 | Dokumen batal lewat jurnal pembalik; peran akun | 2026-11-22 | Pengguna | Q-10 |
| D-38 | Transaksi IDR | 2026-11-22 | Pengguna | Q-08 |
| D-41 | Nomor akun 201, 202, 102 dan peran PPN | 2026-11-22 | Pengguna | Q-06, Q-07 |
| D-44 | Dr 202 / Cr 201 saat invoice cocok; nilai persediaan memakai harga PO | 2026-11-22 | Pengguna | Q-03, Q-06 |
| D-46 | Status COCOK, SELISIH, TERCATAT | 2026-11-22 | Pengguna | Q-04 |
| D-48 | Pembatalan dan revisi; pemohon tidak menyetujui dokumennya sendiri | 2026-11-22 | Pengguna | Q-10, Q-13 |
| D-49 | Satu invoice per penerimaan; jatuh tempo; kelebihan ditolak | 2026-11-22 | Pengguna | Q-02, Q-09, Q-11 |
| D-51 (a) | PPN tarif berversi; nomor faktur manual | 2026-11-22 | Pengguna | Q-07 |
| [USULAN-AGEN] | Q-01, Q-02 (pembanding), Q-03, Q-04, Q-05, Q-10, Q-13 (pemisahan pencatat dan pengesah) | 2026-11-22 | Agen | Menunggu penguncian koordinator |

## Assumptions (agent-proposed)

- Tiga dokumen adalah PO, penerimaan lulus QC (lulus per baris), dan invoice (Q-12, LAPORAN).
- Invoice tidak menyentuh `saldo_stok` (R-10).
- Jurnal pengakuan: Dr 202 senilai nilai PO, Dr `ppn_masukan`, Dr atau Cr `selisih_harga_pembelian` bila ada selisih toleransi, dan Cr 201 senilai total invoice (R-05).
- Nomor invoice dan pemasok membentuk kunci unik (usulan §7.5).

## Rejected alternatives (optional)

- Mengakui utang saat PO terbit: ditolak EPIC-PG.
- Mengakui utang saat barang diterima: ditolak karena barang belum tentu lulus QC.
- Membiarkan selisih qty lolos dengan toleransi: ditolak D-15.
- Menaruh selisih harga pada persediaan: ditolak karena persediaan tetap nilai PO (D-44 (1)).
- Status invoice pra-cocok sebagai status baru: ditolak oleh D-47 (tidak ada status di luar daftar). Pencocokan dijalankan saat invoice disimpan sehingga status langsung `COCOK` atau `SELISIH`.

## Next step

Tidak ada pertanyaan terbuka. Item siap menjadi `Ready` begitu dependensi backlog (`PG-007`, `FND-006`) berstatus `done` dan gate fondasi terpenuhi. Ukuran item besar (lihat `03-readiness-review.md`); pemecahan hanya boleh diputuskan koordinator, tidak dipecah sendiri. Usulan [USULAN-AGEN] menunggu penguncian koordinator.

## Pembaruan 2026-11-22

- Ringkasan klasifikasi (lanjutan, setelah D-47 sampai D-53): 13 pertanyaan. Terjawab dengan keputusan terkunci 5 (Q-06, Q-07, Q-08, Q-09, Q-11); terjawab dari sumber 1 (Q-12); terjawab dengan keputusan terkunci dan [USULAN-AGEN] 1 (Q-13); terjawab dengan [USULAN-AGEN] 6 (Q-01, Q-02, Q-03, Q-04, Q-05, Q-10); terbuka 0.
- Pertentangan sumber dan keputusan: EPIC-PG gate 2 menulis "penerimaan" sebagai pembanding qty invoice, sedangkan `proses-bisnis.md` A6 memakai "qty lolos QC". Dipilih qty lulus (Q-02). Ini perlu dikonfirmasi koordinator.
- Pertentangan lain: `LAPORAN` menyebut status ketidaksesuaian, sedangkan `proses-bisnis.md` A6 menyebut invoice tidak disimpan. Dipilih invoice tersimpan dengan status `SELISIH` (Q-04).
- Perluasan D-44 (2): jurnal pengakuan memerlukan baris PPN dan, bila ada selisih toleransi, baris selisih harga. D-44 (2) hanya menyebut dua baris. Ini perlu dikonfirmasi koordinator.
- Pemilik pencocokan: `diagram-sia-lengkap.md` gap 13 menulis "Purchasing atau Accounting". D-33 sudah menjawabnya (Q-13).
