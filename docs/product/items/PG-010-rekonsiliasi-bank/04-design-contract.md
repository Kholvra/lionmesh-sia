# Design Contract: PG-010 — Rekonsiliasi bank

- Source: `docs/product/items/PG-010-rekonsiliasi-bank/01-requirement.md` (`PG-010`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-17`)
- Status: `Proposed` — belum diverifikasi; seluruh aturan `Unverified`
- Profile: product app (aplikasi web internal)
- Scope: impor CSV mutasi bank, validasi berkas, pencocokan dengan baris jurnal kas, daftar selisih, status pencocokan
- Owner: tech lead (desain); keputusan produk dipegang pengguna (D-xx) atau koordinator (`[USULAN-AGEN]`)
- Kewajiban: item menyentuh uang dan batas modul, sehingga kontrak wajib

## Intent and non-goals

**Intent.** Setiap mutasi bank tercatat tepat sekali, dan setiap perbedaan dengan catatan kas terlihat. Rekonsiliasi tidak mengubah saldo, jurnal, atau utang.

**Non-goals.** Pembayaran (`PG-009`), penerimaan kas pelanggan, integrasi API bank (D-52), jurnal selisih, akun biaya bank, struktur folder dan tabel.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Berkas CSV → parser | Berkas dari pengguna (format CSV generik, pemetaan kolom dari profil) | Pola format, tipe kolom, batas ukuran, dan validasi per baris sebelum penyimpanan | Baris mutasi tervalidasi | Tolak seluruh berkas; pesan menyebut format atau nomor baris |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran tepercaya | Tolak bila tidak ada sesi; abaikan `actor_id` dari klien |
| `B-03` | Server → core | Pencocokan dan status | Core memeriksa pasangan, periode, dan peran | Pencocokan tervalidasi | Core menolak; tidak ada perubahan saldo |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Impor dimulai | Berkas lolos validasi format dan semua baris lolos sebelum ada yang disimpan (R-02) | Parser | Tolak seluruh impor |
| `PRE-02` | Impor dimulai | Rekening tujuan ada dan aktif; periode dipilih; semua mutasi berada di periode itu (R-01, R-08) | Core | Tolak; pesan menyebut rekening atau periode |
| `PRE-03` | Impor dimulai | Hash isi berkas belum pernah diimpor untuk rekening itu (R-03) | Core | Tolak; pesan menyebut impor sebelumnya |
| `PRE-04` | Pencocokan dijalankan | Baris jurnal kas berada di periode rekonsiliasi dan rekening referensinya cocok (R-04, R-08) | Core | Tidak dicocokkan; masuk daftar `BELUM_COCOK` |
| `PRE-05` | Pasangan manual | Mutasi dan baris jurnal belum berpasangan; nominal sama (R-09) | Core | Tolak; pesan menyebut pasangan yang ada |
| `PRE-06` | Penandaan `SELISIH` | Alasan terisi (R-05) | Core | Tolak; pesan menyebut alasan wajib |
| `PRE-07` | Akses | Aktor berperan Accounting (D-33, R-10) | Core | Tolak; pesan menyebut peran |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Setiap mutasi dalam berkas tersimpan tepat sekali (R-01, R-02) | Mutasi lama | Baris mutasi, riwayat impor |
| `POST-02` | Mutasi dan baris jurnal yang cocok ditandai `COCOK` tanpa mengubah nominal | Nominal mutasi dan jurnal | Status pencocokan |
| `POST-03` | Mutasi dan baris jurnal yang tidak cocok tampil di daftar `BELUM_COCOK` dengan selisih | Data sumber | Daftar |
| `POST-04` | Rekonsiliasi tidak mengubah saldo utang, saldo kas, atau jurnal yang sudah ada (R-07) | Saldo dan jurnal | Hanya status pencocokan |
| `POST-05` | Rekonsiliasi tidak membuat jurnal apa pun (R-06) | Jurnal | Tidak ada |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core ledger | Setiap jurnal yang dibuat di luar item ini tetap balance (`ARCH-001` INV-01); item ini tidak membuat jurnal | Jurnal tidak balance tersimpan |
| `INV-02` | Core | Satu mutasi cocok paling banyak dengan satu baris jurnal kas (R-04, R-09) | Mutasi atau baris dihitung dua kali |
| `INV-03` | Core | Jumlah mutasi per rekening per periode = jumlah `COCOK` + jumlah `BELUM_COCOK` + jumlah `SELISIH` | Mutasi hilang dari daftar |
| `INV-04` | Core | Impor ulang berkas dengan hash sama tidak menambah baris mutasi (R-03) | Mutasi dobel |
| `INV-05` | Core | Rekonsiliasi tidak menulis ke saldo utang atau jurnal (R-07) | Saldo berubah saat rekonsiliasi |
| `INV-06` | Core | Akun dan rekening pada data mutasi hanya terlihat peran Accounting (R-10) | Data rekening terlihat peran lain |

Status (nama [USULAN-AGEN], dari diagram §5.2 bila ada; R-05):

| State | Arti | Transisi legal |
|---|---|---|
| `BELUM_COCOK` | belum ada pasangan | ke `COCOK` (pasangan) atau `SELISIH` (penandaan dengan alasan) |
| `COCOK` | berpasangan | tidak ada (kecuali pasangan dilepas dan dipasangkan ulang oleh Accounting) |
| `SELISIH` | ada perbedaan, ditandai dengan alasan | ke `COCOK` setelah pasangan dikoreksi |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Berkas rusak di tengah | Seluruh impor ditolak; tidak ada mutasi tersimpan | Perbaiki berkas dan impor ulang |
| Impor berhasil, pencocokan gagal | Mutasi tetap tersimpan dan tampil `BELUM_COCOK` | Ulangi pencocokan |
| Dua impor bersamaan untuk berkas sama | Satu ditolak (hash dicek di dalam transaksi) | Pengguna memuat ulang |
| Dua pasangan manual bersamaan untuk mutasi sama | Satu ditolak | Pengguna memuat ulang |

## Architecture boundaries

- Baris jurnal kas dibaca lewat service core ledger (ARCH-03, D-07). Modul tidak menulis jurnal.
- Pembayaran pemasok dan penerimaan pelanggan terlihat hanya lewat baris jurnal kas, tidak lewat tabel modul lain (D-25, ARCH-08).
- Layar hanya memanggil service core (D-04).
- Referensi rekening pada baris jurnal kas adalah dimensi yang harus ada di spesifikasi `FND-006` (lihat `00-discussion.md`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Berkas rusak ditolak seluruh | Uji parser | `05-evidence.md` AC-03, AC-04 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | Core menolak pencocokan tidak sah | Uji service | `05-evidence.md` AC-15 | `Unverified` |
| `PRE-01` | Satu baris rusak menolak seluruh impor | Uji parser | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-02` | Rekening tidak aktif atau mutasi di luar periode menolak impor | Uji perilaku | `05-evidence.md` AC-13 | `Unverified` |
| `PRE-03` | Impor ulang berkas sama ditolak | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `PRE-04` | Baris jurnal di luar periode atau rekening lain tidak dicocokkan | Uji service | `05-evidence.md` AC-05, AC-06 | `Unverified` |
| `PRE-05` | Pasangan ganda ditolak | Uji service | `05-evidence.md` AC-15 | `Unverified` |
| `PRE-06` | Penandaan `SELISIH` tanpa alasan ditolak | Uji perilaku | `05-evidence.md` AC-14 | `Unverified` |
| `PRE-07` | Peran selain Accounting ditolak | Uji perilaku | `05-evidence.md` AC-16 | `Unverified` |
| `POST-01` | Mutasi tersimpan tepat sekali | Uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | Status cocok tanpa mengubah nominal | Uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `POST-03` | Daftar belum cocok lengkap di dua sisi | Uji perilaku | `05-evidence.md` AC-06, AC-07 | `Unverified` |
| `POST-04` | Saldo dan jurnal tidak berubah | Uji perbandingan | `05-evidence.md` AC-09 | `Unverified` |
| `POST-05` | Tidak ada jurnal dibuat rekonsiliasi | Uji perbandingan | `05-evidence.md` AC-10 | `Unverified` |
| `INV-01` | Item ini tidak membuat jurnal | Pencarian kode + review | — | `Unverified` |
| `INV-02` | Satu mutasi, satu baris jurnal | Uji service | `05-evidence.md` AC-08 | `Unverified` |
| `INV-03` | Jumlah mutasi per periode terjaga | Uji perbandingan | `05-evidence.md` AC-01, AC-06 | `Unverified` |
| `INV-04` | Impor ulang tidak menggandakan | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `INV-05` | Tidak ada perubahan saldo utang | Uji perbandingan | `05-evidence.md` AC-09 | `Unverified` |
| `INV-06` | Data rekening tidak terlihat peran lain | Uji perilaku | `05-evidence.md` AC-16 | `Unverified` |

Tidak ada aturan yang berstatus `PASS`.

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Sumber dan format (Q-01) | Dijawab D-52: CSV generik dengan pemetaan kolom | `B-01` dan desain impor |
| Jumlah rekening (Q-02) | Dijawab [USULAN-AGEN]: banyak rekening didukung; seed satu | `PRE-02` |
| Lingkup pencocokan (Q-03) | Dijawab [USULAN-AGEN]: baris jurnal kas di core ledger | Sumber data dan batas item |
| Aturan kecocokan (Q-04) | Dijawab [USULAN-AGEN]: nominal persis, tanggal dalam jendela, referensi bila ada | `PRE-04` dan `POST-02` |
| Selisih dan jurnal (Q-05) | Dijawab [USULAN-AGEN]: status tanpa jurnal | `POST-05` |
| Impor ulang (Q-06) | Dijawab [USULAN-AGEN]: hash isi berkas | `PRE-03` dan `INV-04` |
| Periode (Q-07) | Dijawab D-50 dan [USULAN-AGEN]: per rekening per bulan | `PRE-02` dan `INV-03` |
| Aktor (Q-08) | Dijawab D-33 (Accounting) | `PRE-07` |
| Relasi 1:1 atau banyak (Q-10) | Dijawab [USULAN-AGEN]: 1:1 otomatis | `INV-02` |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Jurnal selisih | Tidak ada transaksi asal (D-43) dan akun biaya bank tidak ada (D-41) |
| Integrasi API bank | Ditolak oleh D-52 (CSV generik) |
| Pembayaran dan pembayaran pelanggan | Milik `PG-009` dan modul Pendapatan |
| Pencocokan gabungan otomatis | Ditandai, dipasangkan manual (R-09) |
| Loop/termination | Tidak ada algoritma berulang |
| Batas modul | Milik `ARCH-001` |
