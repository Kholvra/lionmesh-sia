---
id: PG-010
slug: rekonsiliasi-bank
title: Rekonsiliasi bank
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: unset
size: unset
depends_on:
  - FND-006
blocks:
  - INT-001
owner_role: unset
package: docs/product/items/PG-010-rekonsiliasi-bank
---

# PG-010 — Rekonsiliasi bank

## Masalah

Saldo kas di jurnal dan saldo rekening bank bisa berbeda karena biaya bank, pembayaran yang belum tercatat, atau pencatatan ganda. Tanpa rekonsiliasi, perbedaan ini baru terlihat saat laporan akhir periode tidak cocok.

## Outcome

Pengguna dapat mengimpor mutasi rekening bank dari berkas CSV dengan pemetaan kolom, mencocokkannya dengan catatan kas di buku besar, dan melihat daftar mutasi yang belum cocok beserta selisihnya. Impor ulang file yang sama tidak menggandakan mutasi.

## Aktor

| Aktor | Peran pada item ini | Sumber |
|---|---|---|
| Accounting | mengimpor mutasi, mencocokkan, dan menandai selisih | D-33: baris "Rekonsiliasi bank" = Accounting (default) |
| Finance | pemilik rekening dan pembayaran (sumber catatan kas) | matriks §3.3 (Finance mengeksekusi pembayaran) |
| Sistem | memvalidasi berkas, mencocokkan, dan menampilkan selisih | ARCH-001 BOUNDARY-01 |

## Ringkasan (derived)

- Track: PG-E bank. Level 1 (derived dari backlog). Berdiri sendiri dari rantai PO; hanya bergantung pada `FND-006`. Spike `DISC-002` non-pemblokir (`D-60`(e)), hanya mengisi profil pemetaan (D-52).
- Memblokir `INT-001` menurut `backlog.md`.

## Cakupan

### Termasuk

- Impor mutasi rekening bank dari berkas CSV dengan pemetaan kolom (R-01).
- Validasi berkas impor sebelum data tersimpan (R-02).
- Pencocokan mutasi dengan baris jurnal akun kas (R-04).
- Daftar mutasi dan catatan kas yang belum cocok, serta selisih (R-05).
- Penandaan status pencocokan (R-05).

### Tidak termasuk

- Pembayaran itu sendiri (PG-009) dan penerimaan kas pelanggan (modul Pendapatan). Keduanya hanya terlihat sebagai baris jurnal kas.
- Integrasi API bank (D-52).
- Jurnal selisih atau akun biaya bank (R-06).
- Pencocokan gabungan otomatis (R-09).

## Constraints & invariants

- Modul tidak membaca tabel modul lain; data kas lewat service core (D-25).
- Layar hanya memanggil service core (D-04).
- Jurnal hanya lewat `postJournal()` (D-07). Tidak ada jurnal manual (D-43). Rekonsiliasi tidak membuat jurnal pada versi awal (R-06).
- Berkas impor tidak dipercaya. Validasi sebelum menyimpan apa pun (R-02).
- Tidak ada akun yang dibuat dari asumsi. Akun bank 102 dan peran `kas_bank` ada (D-41, D-35). Akun biaya bank tidak ada (D-41).
- Periode rekonsiliasi bulanan (D-50).
- Rekonsiliasi tidak mengubah saldo utang, saldo kas, atau jurnal yang sudah ada (R-07).

## Behavior / rules

### Aturan (keputusan terkunci atau [USULAN-AGEN], lihat `00-discussion.md`)

- `R-01` Sumber impor adalah berkas CSV generik. Pengguna memetakan kolom berkas ke field mutasi (tanggal, nominal, referensi, arah debit atau kredit). Profil pemetaan dapat disimpan; hasil `DISC-002` hanya mengisi profil (D-52).
- `R-02` Validasi berkas dilakukan sebelum penyimpanan. Format tidak dikenali menolak seluruh berkas. Satu baris yang tanggal, nominal, atau referensinya tidak terbaca menolak seluruh impor, dengan nomor baris. Berkas yang isinya sudah pernah diimpor ditolak (R-03).
- `R-03` Impor ulang berkas dengan hash isi yang sama ditolak dengan pesan impor sebelumnya ([USULAN-AGEN]). Di dalam satu berkas, baris identik tetap diterima sebagai baris berbeda, karena nomor barisnya berbeda.
- `R-04` Pencocokan dijalankan terhadap baris jurnal akun `kas_bank` (102) di core ledger, dari sumber apa pun. Aturan cocok: nominal sama persis (bilangan bulat rupiah, tanpa toleransi); tanggal dalam jendela yang diatur parameter konfigurasi; referensi harus sama bila keduanya punya referensi. Pencocokan otomatis hanya satu lawan satu ([USULAN-AGEN]). Rekening mutasi harus sama dengan referensi rekening pada baris jurnal (lihat pertentangan di `00-discussion.md`).
- `R-05` Status mutasi: `BELUM_COCOK` (belum ada pasangan), `COCOK` (berpasangan), dan `SELISIH` (ditandai Accounting dengan alasan) ([USULAN-AGEN]; nama dari diagram §5.2). `SELISIH` menjadi `COCOK` setelah pasangan dikoreksi. Baris jurnal kas tanpa pasangan tampil di daftar `BELUM_COCOK`.
- `R-06` Rekonsiliasi tidak membuat jurnal pada versi awal. Selisih tidak punya transaksi asal (D-43), dan akun biaya bank tidak ada (D-41) ([USULAN-AGEN]).
- `R-07` Rekonsiliasi hanya menulis status pencocokan. Saldo utang, saldo kas, dan jurnal yang sudah ada tidak berubah.
- `R-08` Rekonsiliasi dilakukan per rekening per bulan (D-50). Berkas hanya boleh berisi mutasi satu periode; mutasi di luar periode ditolak ([USULAN-AGEN]). Pencocokan tidak dijalankan pada periode yang sudah terkunci.
- `R-09` Pencocokan gabungan (satu mutasi untuk beberapa catatan kas, atau sebaliknya) tidak otomatis. Kasus ini ditandai, dan Accounting memasangkan manual satu pasangan per langkah ([USULAN-AGEN]).
- `R-10` Akses: rekonsiliasi dilakukan Accounting (D-33). Nomor rekening dan nama pemilik rekening di mutasi hanya terlihat oleh Accounting.
- `R-11` Setiap perubahan status pencocokan dicatat di riwayat dengan aktor dan waktu (D-08).

### Alur utama

1. Accounting memilih rekening dan periode, lalu mengunggah berkas CSV dan memetakan kolom (R-01, R-08).
2. Sistem memvalidasi berkas (R-02, R-03). Bila lolos, sistem menyimpan semua baris sebagai mutasi.
3. Sistem mencocokkan tiap mutasi dengan baris jurnal kas yang relevan (R-04).
4. Mutasi yang cocok ditandai `COCOK`. Yang tidak cocok masuk daftar `BELUM_COCOK`.
5. Accounting dapat menandai `SELISIH` dengan alasan, atau memasangkan manual satu pasangan (R-05, R-09).

### Status

| Status | Objek | Arti | Transisi |
|---|---|---|---|
| `BELUM_COCOK` ([USULAN-AGEN]) | mutasi | belum ada pasangan | ke `COCOK` atau `SELISIH` |
| `COCOK` ([USULAN-AGEN]) | mutasi | berpasangan dengan baris jurnal kas | tidak ada (kecuali koreksi pasangan) |
| `SELISIH` ([USULAN-AGEN]) | mutasi | ada perbedaan, ditandai Accounting dengan alasan | ke `COCOK` setelah dikoreksi |

### Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Format berkas tidak dikenali | Impor ditolak; pesan menyebut format yang diharapkan |
| Ada baris dengan tanggal, nominal, atau referensi tidak terbaca | Impor ditolak seluruhnya; pesan menyebut nomor baris |
| Rekening tujuan tidak dipilih atau tidak aktif | Impor ditolak; pesan menyebut rekening |
| Berkas dengan isi yang sudah pernah diimpor | Ditolak; pesan menyebut hasil impor sebelumnya |
| Mutasi di luar periode yang dipilih | Impor ditolak; pesan menyebut periode |
| Pasangan manual pada mutasi atau baris jurnal yang sudah berpasangan | Ditolak; pesan menyebut pasangan yang ada |
| Penandaan `SELISIH` tanpa alasan | Ditolak; pesan menyebut alasan wajib diisi |

Teks pesan final mengikuti implementasi; yang diikat adalah isi informasi pesan.

## Success

- Setiap mutasi yang diimpor muncul tepat sekali.
- Setiap baris jurnal kas punya status pencocokan terhadap mutasi bank.
- Daftar belum cocok dapat dipakai untuk menutup selisih.

## Edge cases (optional)

- Berkas dengan dua baris identik di dalam satu file (R-03).
- Mutasi di luar periode rekonsiliasi (R-08).
- Catatan kas yang belum ada di sistem tetapi sudah ada mutasinya: tampil `BELUM_COCOK` di sisi mutasi.

## Decision references (optional)

- `EPIC-PG` gate 3.
- `D-04`, `D-07`, `D-08`, `D-25`, `D-27`, `D-33`, `D-35`, `D-39`, `D-41`, `D-43`, `D-50`, `D-52`.
- `reference/analisis-sia.md` §5.3 PG-10, §7.3, §9.3 G20.
- Pertanyaan dan jawabannya: lihat `00-discussion.md`.

## Catatan serah terima

Requirement ini mengikat perilaku dan bukti. Cara impor dibatasi D-52 (CSV generik). Aturan cocok, status, dan pasangan ditandai [USULAN-AGEN] menunggu penguncian koordinator. Desain kontrak ada di `04-design-contract.md` (status `Proposed`).
