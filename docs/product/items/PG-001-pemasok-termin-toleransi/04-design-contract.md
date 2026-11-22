# Design Contract: PG-001 — Master pemasok, termin, dan toleransi match

- Source: `docs/product/items/PG-001-pemasok-termin-toleransi/01-requirement.md` (`PG-001`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-13`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app (master pengadaan)
- Scope: penyimpanan termin dan toleransi per pemasok, status aktif dan nonaktif, aktivasi ulang, snapshot nilai ke dokumen, pembatasan field kontak pribadi
- Owner: pemilik track PG-A (belum ditetapkan)

## Intent and non-goals

**Intent.** Master pemasok menjadi satu-satunya sumber termin dan toleransi per pemasok, sehingga `PG-004`, `PG-005`, dan `PG-008` membaca nilai yang sama, dan dokumen yang sudah dibuat tidak berubah karena master.

**Non-goals.** Pemilihan pemasok (`PG-004`), penerbitan PO (`PG-005`), pencocokan tiga dokumen (`PG-008`), jurnal, dan portal pemasok (`D-23`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser ke server action | data form pemasok | parse dan validasi skema di server sebelum menyentuh service core (lihat `ARCH-001` BOUNDARY-01) | nilai tervalidasi bertipe | tolak dengan pesan; jangan teruskan ke core |
| `B-02` | Sesi ke identitas pengguna | cookie sesi | ambil pengguna dan peran dari sesi di server (`ARCH-001` BOUNDARY-02) | `actor_id` dan peran tepercaya | tolak bila tidak ada sesi; jangan terima `actor_id` dari klien |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Pengguna mengubah, menonaktifkan, atau mengaktifkan pemasok | pengguna terautentikasi dan berperan Purchasing (`D-33`) | server action | tolak sebelum menyentuh data |
| `PRE-02` | Termin disimpan | termin tidak punya nilai default dan wajib diisi (`D-14`) | service pemasok | tolak dengan pesan; tidak ada baris tersimpan |
| `PRE-03` | Toleransi disimpan | `toleransi_persen` dalam rentang 0 sampai 100; `toleransi_nominal` tidak negatif, dalam IDR (`D-38`) `[USULAN]` | service pemasok | tolak dengan pesan |
| `PRE-04` | Pemasok dipilih untuk dokumen baru (PR, kandidat, PO) | pemasok berstatus `aktif` (`D-50`) | service core pengadaan | tolak dengan pesan; dokumen tidak dibuat |
| `PRE-05` | Pemasok diaktifkan kembali | pemasok berstatus `nonaktif` `[USULAN-AGEN]` | service pemasok | tolak dengan pesan; status tidak berubah |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | pemasok baru tersimpan dengan status `aktif` dan toleransi 0 bila tidak diisi (`D-15`) | data pemasok lain | baris pemasok |
| `POST-02` | setiap perubahan status menulis satu baris `riwayat_status` dengan aktor dan waktu (`D-08`, `ARCH-001` INV-05); kolom audit `updated_by` dan `updated_at` diperbarui (`D-32`) | riwayat lama | baris riwayat |
| `POST-03` | dokumen yang dibuat setelah perubahan memakai termin dan toleransi terbaru; dokumen yang sudah dibuat menyimpan salinan nilai saat dibuat `[USULAN-AGEN]` (Q-08) | nilai dokumen lama | tidak ada (snapshot dibuktikan di `PG-005` dan `PG-008`) |
| `POST-04` | aktivasi ulang menulis satu baris `riwayat_status` dengan aktor dan waktu `[USULAN-AGEN]` | riwayat lama | baris riwayat |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | service pemasok | tidak ada kolom toleransi untuk qty | menyimpan atau membaca toleransi qty (`D-15`) |
| `INV-02` | service pemasok | termin pemasok tidak punya default | termin default 30 hari untuk pemasok (default 30 hanya untuk pelanggan, `D-14`) |
| `INV-03` | service pemasok | pemasok tidak punya akun login | pemasok masuk ke sistem |
| `INV-04` | service pemasok | dua toleransi disimpan sebagai dua field terpisah; penggabungan menjadi satu nilai bukan bagian master `[USULAN-AGEN]` (Q-06) | satu kolom toleransi gabungan di master |
| `INV-05` | service pemasok dengan RLS (`FND-003`) | field kontak PIC hanya terbaca Purchasing dan Accounting `[USULAN-AGEN]` (Q-03) | pembacaan field kontak oleh peran lain |

Transisi status pemasok:

| State | Arti | Transisi legal |
|---|---|---|
| `aktif` | bisa dipilih untuk dokumen baru | `aktif → nonaktif` oleh Purchasing |
| `nonaktif` | tidak bisa dipilih untuk dokumen baru; dokumen terbuka tetap berjalan (`D-50`) | `nonaktif → aktif` oleh Purchasing `[USULAN-AGEN]` (Q-07) |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penyimpanan pemasok gagal di tengah | tidak ada pemasok setengah tersimpan | ulangi input |
| Perubahan status gagal menulis riwayat | status tidak berubah | ulangi aksi |
| Validasi toleransi gagal | data lama tetap berlaku | perbaiki input |
| Aktivasi ulang gagal menulis riwayat | status tetap `nonaktif` | ulangi aksi |

## Architecture boundaries

| ID | Rule | Sumber | Catatan |
|---|---|---|---|
| `ARCH-06` | tabel dan aturan pengadaan berada di `core/pengadaan`; tabel `pemasok` dimiliki `core/` | `D-05`, `D-31` | Q-01 terjawab |
| `ARCH-08` | modul tidak membaca tabel milik modul lain | `D-25` | item ini tidak membaca tabel lain |
| `ARCH-09` | peran mengikuti 12 akun staf; izin pengelolaan pemasok hanya Purchasing | `D-18`, `D-33` | Q-02 terjawab |
| `ARCH-07` | migrasi dinomori dan di-merge tech lead | `D-09` | DDL dari kelompok diusulkan |

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | input tidak valid ditolak dengan pesan | uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-01` | pengguna tanpa izin ditolak | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-02` | termin kosong ditolak sesuai `D-14` | uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-03` | toleransi negatif ditolak | uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-04` | pemasok nonaktif tidak bisa dipilih untuk dokumen baru | uji perilaku lintas item | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-05` | aktivasi pemasok aktif ditolak; aktivasi nonaktif berhasil | uji perilaku | `05-evidence.md` AC-12 | `Unverified` |
| `POST-01` | toleransi default 0 | uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `POST-02` | nonaktifkan dan aktifkan menulis riwayat | uji perilaku | `05-evidence.md` AC-06, AC-12 | `Unverified` |
| `POST-03` | perubahan tidak menyentuh dokumen lama | uji perilaku lintas item | `05-evidence.md` AC-09 | `Unverified` |
| `POST-04` | aktivasi ulang menulis riwayat | uji perilaku | `05-evidence.md` AC-12 | `Unverified` |
| `INV-01` | tidak ada toleransi qty | pencarian kode dan review skema | — | `Unverified` |
| `INV-02` | tidak ada default termin | pencarian kode dan review skema | — | `Unverified` |
| `INV-03` | tidak ada akun pemasok | review skema | — | `Unverified` |
| `INV-04` | dua toleransi terpisah | uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `INV-05` | kontak PIC tidak terbaca peran lain | uji perilaku (RLS) | `05-evidence.md` AC-13 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Pemilik tabel `pemasok` (Q-01) | Terjawab — `D-31` (core) | ARCH-06 |
| Izin pengelola (Q-02) | Terjawab — `D-33` (Purchasing) | PRE-01 dan AC-08 |
| Termin master wajib (Q-04) | Terjawab — `D-14` (wajib, tanpa default) | PRE-02 dan AC-05 |
| Mata uang toleransi nominal (Q-05) | Terjawab — `D-38` (IDR) | PRE-03 |
| Field wajib dan data pribadi (Q-03) | Terjawab — `[USULAN-AGEN]` (wajib nama, termin, status; kontak PIC dibatasi) | INV-05 dan AC-13 |
| Kombinasi dua toleransi (Q-06) | Terjawab — `[USULAN-AGEN]` (kedua batas bersama) | INV-04 dan perilaku `PG-008` |
| Arti nonaktifkan dan dokumen terbuka (Q-07) | Terjawab — `D-50` (dokumen terbuka berjalan; dokumen baru ditolak). Aktivasi ulang `[USULAN-AGEN]` | PRE-04, PRE-05, AC-07, AC-12 |
| Perubahan surut (Q-08) | Terjawab — `[USULAN-AGEN]` (snapshot, perubahan hanya dokumen baru) | POST-03 dan AC-09 |
| Jejak perubahan (Q-09) | Terjawab — `[USULAN-AGEN]` (kolom audit `D-32`, nilai lama tidak disimpan) | POST-02 |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | pemasok adalah master, bukan dokumen transaksi |
| Loop/termination | tidak ada algoritma berulang |
| Otorisasi per peran | milik `FND-003`; matriks v0 `D-33` |
| Batas modul | milik `ARCH-001` |
| Tabel audit nilai lama | `D-32` menetapkan audit sebagai kolom |
