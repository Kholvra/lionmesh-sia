# PG-010 — Diskusi

## Konteks

PG-010 mencocokkan mutasi rekening bank dengan catatan kas yang sudah ada di buku besar, lalu menampilkan selisih. Item ini berada di track PG-E bank, level 1 (derived dari backlog). Backlog sengaja menempatkannya berdiri sendiri: `PG-010` hanya bergantung pada `FND-006` (ledger); spike `DISC-002` (format bank) non-pemblokir (`D-60`(e)), tidak menunggu rantai PO (catatan backlog).

Sumber: `[SUMBER]` "Rekonsiliasi bank" masuk cakupan (`reference/analisis-sia.md` §9.3, G20). Fitur PG-10 P1 (§5.3): "impor mutasi bank, cocokkan, selisih". Di §15, PG-10 disebut tetapi tidak punya use case: `[KURANG]`.

## Actor / consumer

- Pengguna rekonsiliasi: Accounting (D-33, baris "Rekonsiliasi bank" = Accounting, ditandai sebagai baris baru default).
- Finance: pemilik rekening dan pembayaran (matriks: Finance mengeksekusi pembayaran).
- Accounting: pemilik pencatatan akun kas (peran `kas_bank`).

## Problem

Saldo kas di jurnal dan saldo rekening bank bisa berbeda karena biaya bank, pembayaran yang belum tercatat, atau pencatatan ganda. Tanpa rekonsiliasi, perbedaan ini tidak terlihat sampai laporan akhir bulan tidak cocok.

## Desired outcome

- Mutasi bank dapat diimpor ke sistem dari berkas CSV dengan pemetaan kolom.
- Setiap mutasi dicocokkan dengan catatan kas yang relevan, atau ditandai belum cocok.
- Selisih tampil dan dapat ditindaklanjuti.
- Impor ulang file yang sama tidak menggandakan data.

## Known constraints

- Impor generik dengan pemetaan kolom (D-52). Format riil bank dapat dikonfirmasi lewat spike `DISC-002` (D-39), non-pemblokir (`D-60`(e)); hasilnya hanya mengisi profil pemetaan (D-52).
- Modul tidak membaca tabel modul lain (D-25). Data kas lintas siklus lewat service core.
- Akun bank 102 dan peran `kas_bank` ada (D-41, D-35). Akun biaya bank tidak ada di D-41.
- Tidak ada jurnal manual (D-43); jurnal selisih wajib punya transaksi asal.

## Keputusan yang sudah terkunci

| Sumber | Isi | Konsekuensi |
|---|---|---|
| `D-25` | Modul tidak membaca tabel modul lain | Pencocokan dengan pembayaran pelanggan dan pemasok lewat service core |
| `D-04` | Modul hanya boleh impor core | Layar memanggil service core |
| `D-07`, `D-43` | Jurnal lewat `postJournal()`; tidak ada jurnal manual; jurnal selisih punya transaksi asal | Rekonsiliasi tidak membuat jurnal pada versi awal |
| `D-27` | Database lokal dengan Supabase CLI | Tidak relevan untuk keputusan produk |
| `D-33` | Rekonsiliasi bank = Accounting (baris default) | Pelaku |
| `D-35`, `D-41` | Peran `kas_bank` = akun 102 Bank; tidak ada akun biaya bank | Tidak ada nomor akun baru |
| `D-39` | Format bank dikonfirmasi lewat `DISC-002`; PG-010 dikerjakan paling akhir di siklusnya | Sebagian `superseded` oleh `D-60`(e): bukan dependensi |
| `D-50` | Periode bulanan; kunci tutup buku bulanan | Dasar periode rekonsiliasi |
| `D-52` | WhatsApp di luar cakupan; `GJ-008` dan `PG-010` sebagai impor CSV generik dengan pemetaan kolom; hasil `DISC-002` hanya mengisi profil pemetaan | Sumber impor dan batas DISC-002 |
| `EPIC-PG` gate 3 | `PG-010` bisa mencocokkan mutasi bank dengan pembayaran | Kriteria gate epic (lihat pertentangan di Pembaruan) |

## Open questions

| ID | Pertanyaan | Kenapa penting | Pemilik | Status |
|---|---|---|---|---|
| Q-01 | Sumber mutasi bank: API bank atau file transfer, dan format rekening koran. | Menentukan seluruh desain impor | Pengguna | Terjawab — D-52: impor CSV generik dengan pemetaan kolom. API bank tidak dipakai. Format riil dari `DISC-002` hanya mengisi profil pemetaan. |
| Q-02 | Berapa rekening bank yang didukung: satu atau banyak? | Menentukan struktur rekening | Pengguna | Terjawab — [USULAN-AGEN]: model mendukung banyak rekening (setiap mutasi menunjuk rekening). Seed memakai satu rekening. Jumlah rekening riil dari `DISC-002` hanya mengisi data dan profil. Dasar: pola D-52 (multi-gudang disiapkan sejak awal). |
| Q-03 | Lingkup pencocokan: hanya pembayaran pemasok, atau juga pembayaran pelanggan (`PD-006`)? | Menentukan sumber data dan batas item | Pengguna + tech lead | Terjawab — [USULAN-AGEN]: yang dicocokkan adalah baris jurnal akun `kas_bank` (102) yang tersedia di core ledger, dari sumber apa pun (pembayaran pemasok atau penerimaan pelanggan). Modul tidak membaca tabel pembayaran (D-25). Tidak ada dependensi baru ke PG-009 atau PD-006 di backlog. |
| Q-04 | Aturan kecocokan: nominal, tanggal, referensi, dan toleransi. | Menentukan apa yang dianggap cocok | Pengguna | Terjawab — [USULAN-AGEN]: nominal harus sama persis (bilangan bulat rupiah, tanpa toleransi). Tanggal dalam jendela yang diatur parameter konfigurasi. Referensi harus sama bila keduanya punya referensi; bila salah satu kosong, referensi diabaikan. Pencocokan otomatis hanya satu lawan satu. |
| Q-05 | Selisih: nama status, siapa yang menyelesaikan, dan apakah selisih menghasilkan jurnal? Bila ya, akun apa? | Menyentuh uang; akun belum ditetapkan | Pengguna + FND-006 | Terjawab — [USULAN-AGEN]: status mutasi `BELUM_COCOK`, `COCOK`, `SELISIH` (nama dari `diagram-sia-lengkap.md` §5.2). Accounting menandai `SELISIH` dengan alasan. Rekonsiliasi tidak membuat jurnal pada versi awal, karena D-43 mewajibkan transaksi asal dan D-41 tidak punya akun biaya bank. `SELISIH` menjadi `COCOK` setelah pasangan dikoreksi. |
| Q-06 | Impor ulang file yang sama: ditolak, atau diproses tanpa penggandaan? | Menentukan idempotensi impor | Tech lead | Terjawab — [USULAN-AGEN]: berkas dengan hash isi yang sudah pernah diimpor ditolak dengan pesan yang menyebut impor sebelumnya. Di dalam satu berkas, baris identik tetap diterima sebagai baris berbeda (nomor baris berbeda), karena bank dapat mencatat dua mutasi bernilai sama pada hari yang sama. |
| Q-07 | Periode rekonsiliasi: harian, mingguan, atau bulanan, dan apakah ada kunci rekonsiliasi per periode? | Menentukan kunci dan laporan | Pengguna | Terjawab — D-50 (periode bulanan, sejalan dengan tutup buku bulanan) + [USULAN-AGEN]: rekonsiliasi per rekening per bulan. Berkas hanya boleh berisi mutasi satu periode; mutasi di luar periode ditolak. |
| Q-08 | Aktor yang melakukan rekonsiliasi. Matriks §3.3 tidak punya baris untuk ini. | Menentukan izin | Pengguna | Terjawab — D-33: "Rekonsiliasi bank" = Accounting. |
| Q-09 | Dependensi backlog: `EPIC-PG` gate 3 mewajibkan `PG-010`, tetapi `INT-001` tidak mencantumkannya di `depends on`. | Menentukan apakah join menunggu rekonsiliasi | Tech lead | Terjawab — `backlog.md`: `INT-001` `depends on` sudah memuat `PG-010`. Premis pertanyaan tidak sesuai backlog saat ini. |
| Q-10 | Satu mutasi bank boleh dicocokkan ke beberapa pembayaran (pembayaran gabungan), atau hanya satu? | Menentukan relasi 1:1 atau 1:banyak | Pengguna | Terjawab — [USULAN-AGEN]: pencocokan otomatis hanya 1:1. Kasus gabungan (satu mutasi untuk beberapa catatan kas, atau sebaliknya) ditandai dan dipasangkan manual oleh Accounting, satu pasangan per langkah. Dasar: validasi di `01-requirement.md`, "tidak dicocokkan otomatis". |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-25 | Data kas lintas siklus lewat service core | 2026-11-22 | Pengguna | Q-03 |
| D-33 | Matriks izin v0: rekonsiliasi bank = Accounting (default) | 2026-11-22 | Pengguna | Q-08 |
| D-35 | Peran `kas_bank` | 2026-11-22 | Pengguna | Q-05 |
| D-39 | Format bank dikonfirmasi lewat `DISC-002` | 2026-11-22 | Pengguna | Sebagian `superseded` oleh `D-60`(e): bukan dependensi |
| D-41 | Tidak ada akun biaya bank di daftar COA dasar | 2026-11-22 | Pengguna | Q-05 |
| D-43 | Tidak ada jurnal manual; jurnal selisih punya transaksi asal | 2026-11-22 | Pengguna | Q-05 |
| D-50 | Periode bulanan | 2026-11-22 | Pengguna | Q-07 |
| D-52 | Impor CSV generik dengan pemetaan kolom | 2026-11-22 | Pengguna | Q-01 |
| [USULAN-AGEN] | Q-02, Q-03 (sumber jurnal kas), Q-04 (aturan cocok), Q-05 (status dan tanpa jurnal), Q-06 (hash berkas), Q-07 (per rekening per bulan), Q-10 (1:1) | 2026-11-22 | Agen | Menunggu penguncian koordinator |

## Assumptions (agent-proposed)

- Prioritas analisis P1 tidak dipakai sebagai urutan: backlog menentukan urutan (level 2, tanpa dependensi PG lain). Prioritas P1 dicatat sebagai referensi.
- Rekonsiliasi tidak menulis jurnal pada versi awal (Q-05).
- Impor tidak mengubah pembayaran atau jurnal yang sudah tercatat; hanya menandai status pencocokan.
- Baris jurnal kas membawa referensi rekening (lihat Pembaruan).

## Rejected alternatives (optional)

- Menunggu rantai PO selesai sebelum mulai: ditolak oleh catatan backlog (`PG-010` sengaja berdiri sendiri).
- Membaca tabel pembayaran pelanggan atau pemasok langsung dari modul ini: ditolak D-25.
- Mengintegrasikan API bank: ditolak oleh D-52 (CSV generik).
- Akun biaya bank baru untuk selisih: ditolak oleh D-41 dan D-43 pada versi awal.

## Next step

Tidak ada pertanyaan terbuka. Item siap menjadi `Ready` begitu dependensi backlog (`FND-006`) berstatus `done` dan gate fondasi terpenuhi. Pertentangan dengan `EPIC-PG` gate 3 dan kebutuhan `rekening` di jurnal perlu dikonfirmasi koordinator sebelum `FND-006` ditulis. Usulan [USULAN-AGEN] menunggu penguncian koordinator.

## Pembaruan 2026-11-22

- Ringkasan klasifikasi (lanjutan, setelah D-47 sampai D-53): 10 pertanyaan. Terjawab dengan keputusan terkunci 3 (Q-01, Q-08, Q-09); terjawab dengan keputusan terkunci dan [USULAN-AGEN] 1 (Q-07); terjawab dengan [USULAN-AGEN] 6 (Q-02, Q-03, Q-04, Q-05, Q-06, Q-10); terbuka 0.
- Dependensi `backlog.md`: `FND-006` saja. `DISC-002` (`idea`) adalah spike non-pemblokir (`D-60`(e)); status `idea`-nya tidak lagi menahan `PG-010`. Pertentangan dengan D-39 terselesaikan oleh `D-60`(e).
- Pertentangan 1: `EPIC-PG` gate 3 menulis "pencocokan dengan pembayaran", tetapi backlog hanya mengikat `PG-010` ke `FND-006`, bukan `PG-009`. Dipilih mencocokkan dengan baris jurnal kas di core ledger (Q-03), sehingga backlog tetap berlaku. Ini perlu dikonfirmasi koordinator.
- Pertentangan 2: pencocokan per rekening (Q-02) membutuhkan referensi rekening pada baris jurnal kas. D-41 hanya memberi satu akun 102. Referensi rekening sebagai dimensi pada baris jurnal harus ada di lingkup `FND-006`. Ini perlu dikonfirmasi koordinator.
- Pertanyaan Q-09 memakai premis lama. `INT-001` sudah memuat `PG-010` di `depends on`.
