# C-009 — Diskusi

## Konteks

`C-009` adalah **laporan keuangan**: buku besar, neraca saldo, laba rugi, dan neraca (`EPIC-CORE`, analisis §5.1 C9, prioritas P0). Analisis mencatat fitur ini tidak pernah disebut di sumber, tapi "tanpa itu aplikasinya bukan SIA" (analisis §5, `[CATATAN]`).

Backlog menempatkannya di track `CORE-A laporan`, level 1, dengan `depends on` `FND-006` (COA, `postJournal()`, periode akuntansi). Item ini **memblokir** `C-010` (tutup buku) dan `INT-001` (jurnal gabungan).

Laporan ini membaca jurnal yang hanya boleh ditulis lewat `postJournal()` (`D-07`). Laporan lintas siklus adalah milik core (`D-25`, `ARCH-08`), jadi modul Pendapatan, Pengeluaran, Produksi, dan Penggajian tidak menyusun laporan keuangan sendiri.

## Raw request

Tidak ada permintaan pengguna langsung untuk item ini. Item diturunkan dari `backlog.md` (baris `C-009`) dan `epics/EPIC-CORE.md` (gate selesai nomor 1).

## Context

- `EPIC-CORE` gate 1: `C-009` menghasilkan neraca yang balance dari jurnal empat siklus.
- `EPIC-CORE` risiko: `C-009` dibangun setelah semua siklus selesai. Mitigasi di epic: mulai setelah `FND-006`, uji dengan jurnal siklus yang sudah ada.
- Analisis §9.4: kesalahan jurnal yang ditulis tiap modul "baru terlihat di akhir saat laporan tidak balance".

## Actor / consumer

- Penyusun dan pembaca utama: Accounting (analisis §3.1, §5).
- Pembaca lain: Manajemen dan Direksi (analisis §3.1). Hak mereka untuk empat laporan keuangan diputuskan di PT-02 (usulan).
- Sistem (core): menyusun angka dari jurnal.

## Problem

Setelah jurnal dari empat siklus ada, tidak ada cara membaca jurnal itu sebagai laporan keuangan. Tanpa `C-009`, `C-010` dan `INT-001` tidak punya bukti untuk diuji.

## Desired outcome

Pengguna yang berwenang dapat membuka buku besar, neraca saldo, laba rugi, dan neraca untuk periode yang dipilih. Angkanya berasal dari jurnal yang sudah tercatat, bukan dari angka yang diketik ulang.

## Known constraints

| Sumber | Constraint |
|---|---|
| `D-07` | Laporan hanya membaca jurnal. Laporan tidak menulis jurnal, saldo, atau status periode. |
| `D-25`, `ARCH-08` | Laporan lintas siklus berada di core. Modul tidak membaca tabel modul lain. |
| `D-18` | Pengguna laporan adalah akun staf. Karyawan bukan pengguna laporan (`D-53`). |
| `D-06` | Nilai persediaan di neraca harus berasal dari `saldo_stok` (dijadikan gate di `EPIC-INT`). |
| `D-35` | Laporan memanggil akun lewat peran akun, bukan nomor. |
| `D-41` | Daftar akun dasar dan akun yang dicadangkan (702). Nomor akun akhir di `FND-006`. |
| `D-50` | Periode laporan bulanan; laporan tampil di layar dulu. |
| `FND-006` (backlog) | COA dan periode akuntansi dimiliki `FND-006`. `C-009` membacanya, tidak membuatnya. |
| Analisis §10.6 `[USULAN]` | Mata uang default IDR; uang disimpan `numeric(18,2)`; pembulatan dilakukan saat tampil. |

## Open questions

Status per 2026-11-22 (setelah D-47 sampai D-53): 10 pertanyaan — 10 terjawab (6 dari keputusan terkunci, 4 `[USULAN-AGEN]`), 0 terbuka.

- PT-01 — Periode laporan: apakah pengguna memilih satu bulan kalender saja atau rentang bebas? Owner: pengguna. **Status: Terjawab — D-50.** Periode akuntansi dikunci per bulan dan laporan memilih satu bulan kalender. Rentang bebas tidak termasuk.
- PT-02 — Hak akses per laporan: siapa boleh melihat buku besar, neraca saldo, laba rugi, neraca, daftar jurnal, arus kas, dan kartu persediaan? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: Accounting, Manajemen, dan Direksi boleh membaca ketujuh laporan. Peran lain ditolak. Alasan: matriks-izin memberi laporan lain kepada Accounting dan Manajemen, dan analisis §3.1 menyebut Manajemen dan Direksi sebagai pembaca. Baris ini belum ada di `matriks-izin.md` (koordinasi).
- PT-03 — Definisi "neraca balance" sebelum tutup buku: laba tahun berjalan dimasukkan ke ekuitas di neraca, atau neraca baru seimbang setelah `C-010`? Owner: pengguna dengan tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: neraca periode bulanan memuat satu baris ekuitas "laba tahun berjalan" senilai pendapatan dikurangi beban sejak awal tahun buku sampai periode dipilih. Akun nominal tetap terbuka sampai tutup buku tahunan. Alasan: `D-44` (5) menutup akun nominal hanya di akhir tahun, sehingga neraca bulanan tanpa baris ini tidak seimbang.
- PT-04 — Struktur laba rugi: akun mana yang masuk kelompok pendapatan dan beban? Owner: pemilik `FND-006`. **Status: Terjawab — D-41 (dan D-44 (4)).** Pendapatan: akun peran Penjualan (401). Beban: HPP (501), tenaga kerja langsung (601), overhead pabrik (602), dan beban gaji administrasi (701). 601 dan 602 ikut bila masih ada saldo sisa saat tutup buku (`D-44` (4)). 702 dicadangkan dan tidak dihitung. Nomor final di `FND-006` (spec).
- PT-05 — Format keluaran: layar saja, atau juga unduh/cetak? Owner: pengguna. **Status: Terjawab — D-50.** Laporan tampil di layar dulu. Ekspor dan cetak tidak termasuk item ini.
- PT-06 — Laporan multi-mata uang: transaksi asing ditampilkan dalam IDR atau per mata uang? Owner: pengguna. **Status: Terjawab — D-38.** Transaksi tetap IDR; laporan dalam IDR.
- PT-07 — Data uji: saat `C-009` dikerjakan, modul siklus belum ada. Jurnal uji diambil dari mana, dan apakah `FND-008` perlu jadi `depends on`? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: uji memakai `db:reset` + `db:seed` (`D-30`) setelah `FND-008` selesai. Sebelum itu, fixture jurnal diposting lewat `postJournal()` dari harness uji. `FND-008` tidak ditambahkan ke `depends on`, karena backlog tidak memuatnya dan gate fondasi `FND-001`–`FND-006` tidak mencakupnya.
- PT-08 — Dokumen batal: apakah dokumen batal tampil di laporan, dan bagaimana jurnal pembaliknya? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: dokumen batal tanpa jurnal tidak muncul di laporan keuangan. Dokumen yang sudah berjurnal lalu dibatalkan: jurnal asli dan jurnal pembalik sama-sama tampil di buku besar dan daftar jurnal, sehingga saldo netto nol terlihat. Alasan: `D-43` dan `D-35` melarang penghapusan jurnal, dan laporan hanya membaca jurnal.
- PT-09 — Konflik urutan: `EPIC-CORE` dan `D-20` menulis C9–C12 "menyusul", sedangkan backlog menaruh `C-009` di level 1. Owner: pengguna dengan tech lead. **Status: Terjawab — D-34.** Gelombang 2 (menyusul). `D-20` superseded. Kolom level di `backlog.md` masih 1 dan perlu diselaraskan (koordinasi).
- PT-10 — Prioritas dan ukuran: analisis P0, backlog belum memberi `priority` dan `size`. Owner: pengguna (prioritas), tech lead (ukuran). **Status: Terjawab — D-50.** Prioritas mengikuti analisis: P0. Ukuran L mengikuti usulan paket (lihat `03`).

## Decisions

| ID | Keputusan | Tanggal | Owner | Konsekuensi |
|---|---|---|---|---|
| `D-07` | Jurnal hanya lewat `postJournal()` | 2026-11-17 | pengguna | Laporan membaca, tidak menulis |
| `D-25` | Laporan lintas siklus milik core | 2026-11-17 | pengguna | `C-009` di `core/ledger` (usulan lokasi, lihat `04`) |
| `D-18` | 12 akun staf | 2026-11-17 | pengguna | Hak akses mengacu ke peran staf (`D-53` menambah peran Karyawan) |

Keputusan lintas item yang berlaku (ditambahkan 2026-11-22):

| ID | Keputusan | Konsekuensi untuk C-009 |
|---|---|---|
| `D-34` | Urutan core dua gelombang; `C-009` menyusul | PT-09 terjawab |
| `D-35` | Peran akun; dokumen batal = jurnal pembalik | akun laporan lewat peran; PT-08 |
| `D-38` | Mata uang + kurs hanya master; transaksi IDR | PT-06 terjawab |
| `D-41` | COA dasar (102, 110, 120–122, 201, 202, 210, 302, 401, 501, 601, 602, 701); 702 dicadangkan | PT-04 |
| `D-43` | Semua laporan membaca buku besar; jurnal tidak bisa diubah | angka hanya dari jurnal |
| `D-44` | Penutupan akun nominal ke 302 di akhir tahun; sisa 601/602 diselesaikan saat tutup buku | PT-03, PT-04 |
| `D-50` | Periode bulanan; laporan di layar; prioritas P0/P1/P2 analisis; ukuran usulan paket | PT-01, PT-05, PT-10 |

## Assumptions (agent-proposed)

Ini daftar `[USULAN-AGEN]` yang dibuat di item ini. Semua menunggu kunci koordinator.

- PT-02: hak baca empat laporan keuangan untuk Accounting, Manajemen, dan Direksi.
- PT-03: neraca bulanan memuat laba tahun berjalan di ekuitas.
- PT-07: uji memakai `db:reset` + `db:seed` setelah `FND-008`; sebelumnya fixture lewat `postJournal()`.
- PT-08: dokumen batal tanpa jurnal tidak tampil; dokumen berjurnal tampil bersama jurnal pembalik.
- `[USULAN]` Laporan dihitung saat dibuka, tidak disimpan sebagai tabel (analisis G14).
- `[USULAN]` Membuka laporan untuk periode yang sudah terkunci tetap diizinkan dan hanya membaca (analisis §8.3).
- `[USULAN]` Pembulatan 2 desimal hanya saat tampil (analisis §10.6).

## Rejected alternatives (optional)

- Setiap modul menyusun laporannya sendiri. Ditolak: analisis §9.4 poin 3 dan `D-07`.
- Menyimpan saldo laporan di tabel terpisah. Tidak dipilih di sini; keputusan ini tetap milik implementasi selama angkanya bisa ditelusuri ke jurnal.

## Next step

Tidak ada pertanyaan terbuka. Item ini menunggu dependensi `FND-006` berstatus `done`, lalu siap menjadi `Ready` (lihat `03`). Empat `[USULAN-AGEN]` perlu dikunci koordinator.
