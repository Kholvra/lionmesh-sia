# C-010 — Diskusi

## Konteks

`C-010` adalah **tutup buku dan jurnal penutup** (`EPIC-CORE`, analisis §5.1 C10, prioritas P1). Backlog menempatkannya di track `CORE-B tutup`, level 2, dengan `depends on` `C-009` dan `FND-006`. Item ini memblokir `INT-001`.

Gate selesai `EPIC-CORE` nomor 2: `C-010` menolak posting ke periode tertutup. Aturan ini sudah ditulis sebagai prasyarat `postJournal()` di `ARCH-001` (`PRE-02`: periode tidak terkunci) dan di analisis §7.5 ("Periode terkunci tidak menerima jurnal").

Analisis §8.3 mengusulkan (`[USULAN]`) bahwa tutup buku **mengunci jurnal, bukan dokumen**. Payroll punya kunci sendiri (`GJ-5`) dan tidak ikut terkunci oleh tutup buku. Usulan ini sejalan dengan `D-50` (periode dikunci) dan `D-43` (jurnal tidak bisa diubah).

## Raw request

Tidak ada permintaan pengguna langsung. Item diturunkan dari `backlog.md` (baris `C-010`) dan `epics/EPIC-CORE.md`.

## Context

- Analisis §8.3: "payroll Desember sering dibayar Januari. Kalau tutup buku Desember ikut mengunci payroll, gaji terakhir tahun tidak bisa dibayar."
- `ARCH-001` failure semantics menyebut "buka periode lewat prosedur `C-010`". `D-44` (5) menetapkan koreksi lewat jurnal pembalik di periode berjalan, sehingga buka kembali tidak dipakai (lihat PT-03 dan pertentangan di `03`).

## Actor / consumer

- Penutup periode dan tahun buku: Accounting (`D-50`).
- Sistem (`postJournal()` milik `FND-006`): membaca status periode.
- Pembaca laporan: `C-009`.

## Problem

Tanpa penutupan periode, jurnal bulan lalu masih bisa berubah diam-diam, dan laporan periode lalu tidak stabil.

## Desired outcome

Periode akuntansi bulanan dapat ditutup. Setelah itu, jurnal baru ke periode tersebut ditolak dengan pesan jelas. Pada tutup buku tahunan, jurnal penutup memindahkan saldo pendapatan dan beban ke akun laba ditahan, sehingga saldo akun sementara menjadi nol (`D-44` (5)).

## Known constraints

| Sumber | Constraint |
|---|---|
| `D-07` | Jurnal hanya lewat `postJournal()`. Penutupan tidak boleh menulis jurnal dengan jalur lain. |
| `D-08`, `D-32` | Setiap transisi status masuk `riwayat_status`. Status periode termasuk transisi. |
| `D-43` | Jurnal tidak bisa diubah atau dihapus. Koreksi lewat jurnal pembalik. |
| `D-44` (4), (5) | Akun nominal ditutup ke 302 akhir tahun. Sisa 601 dan 602 diselesaikan saat tutup buku. Koreksi periode tertutup lewat jurnal pembalik di periode berjalan. |
| `D-50` | Periode bulanan dikunci terpisah dari tutup tahunan. Syarat tutup: neraca saldo balance dan tidak ada dokumen setengah posting. Penutup: Accounting. |
| `FND-006` (backlog) | `periode akuntansi` adalah bagian `FND-006`. `C-010` mengoperasikannya, bukan membuat tabelnya. |
| Analisis §8.3 `[USULAN]` | Tutup buku mengunci jurnal, bukan dokumen sumber. |
| Analisis §8.3 `[ANALISIS]` | Dua arti "periode" harus dibedakan: periode penggajian dan periode akuntansi. |

## Open questions

Status per 2026-11-22 (setelah D-47 sampai D-53): 12 pertanyaan — 12 terjawab (9 dari keputusan terkunci, 3 `[USULAN-AGEN]`: PT-02, PT-04, PT-12), 0 terbuka.

- PT-01 — Peran: siapa yang boleh menutup dan membuka kembali periode? Owner: pengguna. **Status: Terjawab — D-50.** Accounting menutup periode bulanan dan tutup buku tahunan. Buka kembali tidak ada (lihat PT-03).
- PT-02 — Scope kunci: apakah tutup buku hanya mengunci jurnal (usulan §8.3), atau juga dokumen sumber? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: penutupan hanya mengunci jurnal periode. Status dokumen sumber tidak berubah. Dokumen dengan tanggal di periode terkunci tidak bisa diposting, sehingga tanggal harus pindah ke periode terbuka. Alasan: `D-50` mengunci periode dan `D-43` membuat jurnal tidak bisa berubah. Tidak perlu kunci dokumen terpisah.
- PT-03 — Buka kembali: apakah periode tertutup boleh dibuka lagi? Owner: pengguna. **Status: Terjawab — D-44 (5).** Tidak ada buka kembali. Koreksi periode tertutup dibuat sebagai jurnal pembalik di periode berjalan. Sebutan "prosedur buka kembali" di `ARCH-001` perlu disesuaikan (lihat pertentangan di `03`).
- PT-04 — Urutan: apakah periode harus ditutup berurutan (tidak boleh melompati bulan)? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: periode hanya bisa ditutup bila periode sebelumnya sudah terkunci. Alasan: angka periode yang melompati bulan bergantung pada jurnal yang belum final, dan `D-50` mengunci per bulan secara berurutan.
- PT-05 — Jejak: apakah penutupan dan pembukaan periode masuk ke `riwayat_status`, atau cukup kolom audit? Owner: tech lead. **Status: Terjawab — D-32.** `D-32` mewajibkan transisi status masuk `riwayat_status`. Penutupan periode adalah transisi status.
- PT-06 — Akun laba ditahan dan akun ikhtisar: kode akun mana yang dipakai jurnal penutup? Owner: pemilik `FND-006`. **Status: Terjawab — D-41.** 302 Laba ditahan. Akun nominal 401, 501, 601, 602, 701 (702 dicadangkan). Tidak ada akun ikhtisar. Penyediaan akun di `FND-006` adalah spec `FND-006`.
- PT-07 — Prasyarat penutupan: pemeriksaan apa yang harus lolos sebelum periode boleh ditutup? Owner: pengguna. **Status: Terjawab — D-50.** Syarat: neraca saldo balance dan tidak ada dokumen setengah posting. Penutupan ditolak bila salah satunya gagal, dengan pesan yang menyebut prasyarat itu.
- PT-08 — Koreksi setelah tutup: apakah koreksi dibuat sebagai jurnal penyesuaian di periode berikutnya? Owner: pengguna. **Status: Terjawab — D-44 (5).** Koreksi dibuat sebagai jurnal pembalik di periode berjalan.
- PT-09 — Dependensi: `FND-006` harus ada di `depends on`? Owner: tech lead. **Status: Terjawab — backlog.md.** `FND-006` sudah ada di `depends_on` C-010.
- PT-10 — Prioritas dan ukuran. Owner: pengguna dan tech lead. **Status: Terjawab — D-50.** Prioritas P1 mengikuti analisis C10. Ukuran M (usulan paket, lihat `03`).
- PT-11 — Tutup periode bulanan atau tutup buku tahunan: outcome lama menulis jurnal penutup setiap periode ditutup, sedangkan `D-44` (5) menutup nominal hanya di akhir tahun. Owner: pengguna. **Status: Terjawab — D-50 dan D-44 (5).** Periode bulanan hanya mengunci jurnal. Jurnal penutup nominal hanya pada tutup buku tahunan.
- PT-12 — Status tahun buku dan sisa 601/602 saat tutup tahunan: `D-50` memisahkan kunci bulanan dari tutup tahunan, tetapi tidak menamai status tahun buku. `D-44` (4) tidak menyebut tujuan sisa 601/602. Owner: pengguna dengan tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: tahun buku berstatus `terbuka` lalu `ditutup`. Tutup tahunan hanya bisa dilakukan bila semua 12 periode bulanan sudah terkunci. Setelah `ditutup`, tidak ada jurnal baru di tahun itu. Sisa saldo 601 dan 602 ikut ditutup ke 302 dalam jurnal penutup yang sama. Alasan: `D-50` menuntut kunci bulanan dan tutup tahunan terpisah; `D-44` (4) menutup sisa saat tutup buku, tanpa tujuan lain yang tertulis.

## Decisions

| ID | Keputusan | Tanggal | Owner | Konsekuensi |
|---|---|---|---|---|
| `D-07` | Jurnal hanya lewat `postJournal()` | 2026-11-17 | pengguna | Penutupan dan pembukaan periode tidak menulis jurnal langsung |
| `D-20` | Tech lead membangun core v0 | 2026-11-17 | pengguna | **Superseded oleh D-34.** |

Keputusan lintas item yang berlaku (ditambahkan 2026-11-22):

| ID | Keputusan | Konsekuensi untuk C-010 |
|---|---|---|
| `D-32` | Transisi status masuk `riwayat_status` | PT-05 |
| `D-34` | Urutan core dua gelombang; `C-010` terakhir | urutan tidak lagi `D-20` |
| `D-35` | Dokumen batal = jurnal pembalik | koreksi tidak lewat hapus |
| `D-41` | 302 Laba ditahan; akun nominal 401, 501, 601, 602, 701 (702 dicadangkan) | PT-06 |
| `D-43` | Jurnal tidak bisa diubah atau dihapus | koreksi lewat jurnal pembalik |
| `D-44` (4), (5) | Penutupan nominal akhir tahun; koreksi lewat pembalik di periode berjalan | PT-03, PT-08, PT-11, PT-12 |
| `D-50` | Periode bulanan dikunci terpisah dari tutup tahunan; prasyarat tutup; Accounting menutup | PT-01, PT-07, PT-10, PT-11 |

## Assumptions (agent-proposed)

Ini daftar `[USULAN-AGEN]` yang dibuat di item ini. Semua menunggu kunci koordinator.

- PT-02: penutupan hanya mengunci jurnal periode; status dokumen sumber tidak berubah.
- PT-04: penutupan periode harus berurutan.
- PT-12: status tahun buku `terbuka` lalu `ditutup`; sisa 601 dan 602 ikut ditutup ke 302.
- `[USULAN]` Jurnal penutup dibuat lewat `postJournal()` dan tercatat dengan sumber penutupan periode (analisis §7.5 "jurnal harus punya sumber").
- `[USULAN]` Laporan periode yang sudah ditutup tidak berubah setelah penutupan.

## Rejected alternatives (optional)

- Mengunci dokumen sumber saat tutup buku. Ditolak: `D-50` dan `D-43` sudah mengamankan angka lewat jurnal; lihat PT-02.
- Menyimpan saldo penutup di tabel terpisah tanpa jurnal. Ditolak: melanggar `D-07`.
- Buka kembali periode dengan prosedur khusus. Ditolak: `D-44` (5) menetapkan koreksi lewat jurnal pembalik.

## Next step

Tidak ada pertanyaan terbuka. Item ini menunggu dependensi `C-009` dan `FND-006` berstatus `done`, lalu siap menjadi `Ready` (lihat `03`). Usulan `PT-02`, `PT-04`, dan `PT-12` perlu dikunci koordinator.
