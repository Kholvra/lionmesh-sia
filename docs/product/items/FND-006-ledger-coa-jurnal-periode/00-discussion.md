# FND-006 — Diskusi

## Konteks

`backlog.md` mendefinisikan `FND-006` sebagai "Ledger: COA, `postJournal()`, periode akuntansi", sequence 6, `depends on` `FND-002` dan `FND-003` (pada saat diskusi keduanya `specified`; sekarang `done`). `D-07` mengunci bahwa jurnal hanya ditulis lewat `postJournal()` di `core/ledger`. Analisis §8.3 `[USULAN]` memisahkan "periode akuntansi" dari "periode penggajian".

## Pembaruan 2026-11-22

Keputusan terkunci yang menjawab pertanyaan: `D-41` (COA dasar dan nomornya), `D-43` (aturan jurnal), `D-44` (5) (koreksi periode tertutup lewat jurnal pembalik), `D-35` (jurnal pembalik dan GR/IR), `D-33` (COA dikelola tech lead), `D-38` (transaksi IDR), `D-50` (periode bulanan kalender; Accounting menutup). Sisa mekanisme diberi usulan `[USULAN-AGEN]`.

Catatan `D-41` dan `D-45`: `D-41` mencadangkan akun 150, 159, dan 702 "dicadangkan, tidak dipakai", sedangkan `D-45` mengeluarkan aset tetap dan penyusutan dari cakupan. Keduanya tidak saling meniadakan: nomor dicadangkan tanpa baris. Pemilik keputusan perlu mengonfirmasi (lihat Decisions).

Nomor akun baru (PPN, utang BPJS, utang PPh 21, kerugian produksi abnormal, selisih pembulatan, modal) tidak ditulis di paket ini. Nilainya mengikuti mekanisme berversi dan dikutip sumbernya saat implementasi (instruksi pass ini; lihat OQ-06-01).

## Kenapa item ini

Setiap siklus menghasilkan jurnal. Tanpa satu fungsi posting, empat siklus akan punya empat format jurnal, dan laporan keuangan tidak bisa digabung (analisis §9.4 poin 3, "kesalahan paling umum"). `FND-006` menjadi dependensi `C-009`, `PD-005`, `PD-006`, `PD-008`, `PG-008`, `PG-009`, `PG-010`, `PR-006`, `GJ-006`, dan `GJ-007`.

## Actor / consumer

- Modul yang menghasilkan jurnal: memanggil `postJournal()`; tidak menulis tabel jurnal.
- Accounting: mencatat dan memverifikasi transaksi keuangan; menutup periode (`D-50`).
- Tech lead: pemilik item; mengelola COA lewat seed (`D-33`).

## Problem

Jurnal yang tidak balance tersimpan, atau jurnal yang ditulis modul dengan format sendiri, membuat laporan tidak balance. Periode yang sudah ditutup tetap menerima posting.

## Desired outcome

Satu fungsi posting menerima jurnal, menolaknya jika tidak balance, akun tidak aktif, sumber kosong, atau periode terkunci. Jurnal yang sudah diposting tidak diubah; koreksi lewat jurnal pembalik.

## Known constraints

- `D-07`: jurnal hanya lewat `postJournal()` di `core/ledger`.
- `D-43`: jurnal hanya dari transaksi operasional, langsung diposting, tidak bisa diubah atau dihapus; setiap jurnal menyimpan jenis transaksi asal, nomor transaksi asal, dan pemicu; header dan baris dalam satu transaksi database; debit = kredit.
- `ARCH-001` `ARCH-03`: tidak ada `insert` atau `update` ke tabel jurnal dari luar core.
- `ARCH-001` `PRE-02`: periode tidak terkunci; total debit = kredit; akun aktif.
- `D-35`: dokumen batal menghasilkan jurnal pembalik; akun GR/IR diadopsi.
- `D-41`: COA dasar dan nomornya.
- `D-44` (5): koreksi periode tertutup lewat jurnal pembalik di periode berjalan.
- `D-50`: periode bulanan kalender; master nonaktif tidak bisa dipilih untuk transaksi baru.
- `D-38`: transaksi IDR; mata uang dan kurs hanya master.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| OQ-06-01 | Bagan akun: daftar awal dan struktur kode. | Semua posting dan seed bergantung pada akun. | user / Accounting | Terjawab — D-41: daftar dasar dan nomornya, struktur kode mengikuti D-41. Akun yang belum ada (PPN keluaran, PPN masukan, utang BPJS, utang PPh 21, kerugian produksi abnormal, selisih pembulatan, modal): Terjawab — D-51: mekanisme berversi; nilai diverifikasi dan dikutip sumbernya saat implementasi. |
| OQ-06-02 | Siapa boleh membuat dan mengubah akun? | Menentukan `PRE-01`. | user | Terjawab — D-33: tech lead lewat seed; layar pengelolaan ditunda. |
| OQ-06-03 | Periode akuntansi per bulan kalender? | Menentukan bentuk `periode_akuntansi`. | user | Terjawab — D-50: periode bulanan kalender. |
| OQ-06-04 | Siapa boleh membuka dan mengunci periode? | DoD butir 9 menuntut penolakan posting periode terkunci. | user / tech lead | Terjawab — D-50: Accounting menutup periode; mekanisme tutup di `C-010` (D-33). Teks penolakan `[USULAN-AGEN]`: "Periode {bulan} {tahun} sudah dikunci; posting ditolak." |
| OQ-06-05 | Pembatalan dokumen yang sudah memposting jurnal: jurnal pembalik? | Menyentuh `FND-004` OQ-04-06. | user | Terjawab — D-35: dokumen batal menghasilkan jurnal pembalik (D-48 mengunci batas posting). |
| OQ-06-06 | Akun GR/IR wajib di COA awal? | Mengubah bagan akun dan posting penerimaan. | user / Accounting | Terjawab — D-35 dan D-41: akun GR/IR diadopsi sebagai 202 Utang belum difakturkan. |
| OQ-06-07 | Mata uang asing dan kurs di jurnal: di item ini atau `C-011`? | Analisis §5.1 C11 menaruh mata uang di master. | tech lead / user | Terjawab — D-38: transaksi IDR; mata uang dan kurs hanya master, ditempatkan di `C-011` (kalimat yang sama dengan `C-011` di D-38; perlu konfirmasi koordinator). |
| OQ-06-08 | `sumber_tipe`: siapa mendaftar jenis, dan apakah wajib? | Menentukan `PRE-03` dan AC-06. | tech lead | Terjawab — D-43: sumber wajib (jenis, nomor, pemicu). `[USULAN-AGEN]`: daftar jenis sumber tertutup di `core/ledger`, didaftarkan item yang menambah jenis transaksi. |
| OQ-06-09 | Siapa boleh memanggil `postJournal()`? | Menentukan aturan izin di fungsi posting. | user | Terjawab — [USULAN-AGEN]: pemanggil adalah layanan modul pemilik transaksi; aktor yang dicatat adalah pengguna sesi pemicu, yang harus berhak atas transaksi pemicu menurut matriks; `FND-006` tidak punya daftar izin sendiri. Alasan: `D-43` melarang jurnal manual dan matriks sudah memetakan aksi pemicu. |
| OQ-06-10 | Penegakan balance di database (trigger atau constraint) atau cukup layanan? | Menentukan tingkat jaminan AC-01. | tech lead | Terjawab — [USULAN-AGEN]: constraint trigger yang ditunda sampai commit memeriksa jumlah debit = kredit per jurnal, ditambah pemeriksaan di layanan. Alasan: `D-43` menuntut debit = kredit dan DoD butir 6 menuntut bukti, bukan hanya kode layanan. |
| OQ-06-11 | Pembulatan dua desimal dan tipe `numeric(18,2)`? | Syarat DoR butir 5. | tech lead | Terjawab — [USULAN-AGEN]: uang `numeric(18,2)`, pembulatan dua desimal; dikunci bersama `FND-002` `OQ-02-07`. Alasan: konvensi tunggal untuk seluruh tabel domain. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `[USULAN-AGEN]` OQ-06-08..11 | Daftar jenis sumber di `core/ledger`; pemanggil dan aktor; balance di database dan layanan; uang `numeric(18,2)` | 2026-11-22 | tech lead (kunci koordinator) | AC-01, AC-06, AC-07 |
| `[USULAN-AGEN]` pembalik | Jurnal pembalik adalah jurnal baru dengan sumber dokumen batal dan kolom referensi ke jurnal asal; jurnal asal tidak diubah | 2026-11-22 | tech lead (kunci koordinator) | AC-14 |
| `[USULAN-AGEN]` seed akun | Akun 150, 159, dan 702 (dicadangkan `D-41`) tidak dibuat baris di seed awal; dibuat saat item `D-45` ada | 2026-11-22 | Accounting (kunci koordinator) | Tidak ada akun tak terpakai di COA |
| `[USULAN-AGEN]` COA | Akun baru diberi nomor lewat mekanisme berversi (`D-51`) sebelum seed dibuat; nilai dikutip sumbernya | 2026-11-22 | Accounting | Seed dasar memakai 14 akun `D-41`; akun baru menunggu nilai itu |

## Assumptions (agent-proposed)

- A1: Jurnal memiliki header dan baris debit/kredit (analisis §7.2 `jurnal`, `detail_jurnal`).
- A2: Periode akuntansi bulanan kalender (`D-50`).
- A3: Tipe item `feature`; ukuran `L` `[USULAN]` karena mencakup COA, posting, periode, dan penegakan database.

## Rejected alternatives

- Modul menyusun jurnalnya sendiri: ditolak oleh `D-07`.
- Jurnal yang sudah diposting diedit: ditolak oleh DoD butir 8 dan `D-43`.
- Periode kunci hanya di layar: ditolak (penolakan wajib di layanan dan database).
- Jurnal manual: ditolak oleh `D-43`.

## Next step

`FND-002` dan `FND-003` sudah `done`. Keputusan `[USULAN-AGEN]` disahkan `D-58`. Implementasi, seed COA dasar, migrasi `0007`, boundary `core/ledger`, dan bukti AC-01–AC-16 tercatat di `05-evidence.md`. Nilai akun baru di luar `D-41` tetap menunggu item yang membutuhkannya dan mekanisme `D-51`.
