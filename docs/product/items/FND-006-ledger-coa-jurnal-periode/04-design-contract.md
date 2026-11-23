# Design Contract: FND-006 — Ledger

- Source: `docs/product/items/FND-006-ledger-coa-jurnal-periode/01-requirement.md` (`FND-006`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-16`)
- Status: `Approved` (D-58, 2026-11-23)
- Profile: product app / money and ledger
- Scope: COA, peran akun, jurnal, fungsi posting, jurnal pembalik, periode akuntansi
- Owner: tech lead
- Referensi: `ARCH-001` (`ARCH-03`, `PRE-02`, `POST-01`, `INV-01`, `INV-06`); `D-07`, `D-33`, `D-35`, `D-38`, `D-41`, `D-43`, `D-44`, `D-45`, `D-50`, `D-51`

## Intent and non-goals

**Intent.** Setiap jurnal dalam sistem lahir dari satu fungsi, selalu balance, dan tidak berubah setelah diposting.

**Non-goals.** Laporan (`C-009`), tutup buku (`C-010`), jurnal modul, master mata uang.

## Implementation decisions (2026-11-23)

- `akun.peran` unik; modul memanggil akun lewat peran, bukan nomor. Seed `0011_fnd_006_coa.sql` memuat tepat 14 akun `D-41`.
- `jenis_sumber_jurnal` adalah daftar tertutup. `peran_berhak` menentukan peran aktor; nilai `null` hanya dipakai `PEMBALIKAN` karena otorisasi pembatalan dimiliki aksi pemanggil. Core tetap menolak akun nonaktif dan peran `Karyawan`.
- Baris `periode_akuntansi` dibuat `buka` saat posting pertama pada bulan kalender `Asia/Jakarta`, lalu dikunci/dibuka hanya oleh mekanisme `C-010`. Core menolak posting jika status bukan `buka`.
- `post_journal()` dan `reverse_journal()` adalah `SECURITY DEFINER` yang hanya dapat dieksekusi `service_role`. DML tabel jurnal dicabut dari semua role aplikasi.
- Header dan detail jurnal tidak dapat diubah atau dihapus. Constraint trigger tertunda memeriksa minimal dua baris dan debit = kredit saat commit.
- Jurnal pembalik menyalin baris asal dengan debit/kredit tertukar, merujuk jurnal asal secara unik, dan tidak mengubah jurnal asal.
- Boundary TypeScript ada di `src/core/ledger`: `postJournal`, `reverseJournal`, `postJournalUntukSesi`, dan `reverseJournalUntukSesi`. Aktor selalu diambil dari sesi pada jalur server.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Modul → `postJournal()` | header dan baris jurnal, sumber, aktor | validasi di layanan: minimal dua baris, balance, akun aktif, periode buka, sumber terdaftar, IDR, aktor berhak | jurnal tervalidasi | Tolak; tidak ada baris tersimpan |
| `B-02` | Layanan → tabel jurnal | penulisan header dan baris | satu transaksi; hak akses role klien dicabut (`FND-003`) | baris balance | Rollback |
| `B-03` | Database saat commit | jumlah debit dan kredit per jurnal | constraint trigger tertunda (`[USULAN-AGEN]`) | jurnal balance | Commit ditolak |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Posting dipanggil | Aktor sesi berhak atas transaksi pemicu menurut matriks (`[USULAN-AGEN]`, OQ-06-09) | Core ledger | Tolak |
| `PRE-02` | Posting dipanggil | Periode tanggal berstatus `buka`; total debit = kredit; semua akun aktif (`ARCH-001` `PRE-02`) | Core ledger | Tolak; tidak ada baris tersimpan |
| `PRE-03` | Posting dipanggil | Jurnal punya minimal dua baris; sumber lengkap dan jenis terdaftar; mata uang IDR (`D-43`, `D-38`) | Core ledger | Tolak |
| `PRE-04` | Pembalik dipanggil | Jurnal asal ada dan belum dibalik sebelumnya | Core ledger | Tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Jurnal balance tersimpan dan id dikembalikan (`ARCH-001` `POST-01`) | Akun dan periode | Baris jurnal dan detail |
| `POST-02` | Posting ditolak tidak mengubah tabel jurnal | Semua jurnal yang ada | Tidak ada |
| `POST-03` | Jurnal pembalik saldo-nol terhadap jurnal asal; jurnal asal utuh | Jurnal asal | Baris jurnal baru |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core ledger | Setiap jurnal tersimpan: total debit = total kredit (`ARCH-001` `INV-01`); dijaga oleh `B-03` dan layanan | Jurnal tidak balance tersimpan |
| `INV-02` | Core ledger | Jurnal yang sudah diposting tidak diubah atau dihapus (DoD butir 8, `D-43`) | UPDATE atau DELETE jurnal |
| `INV-03` | Core ledger | Jurnal hanya ditulis lewat `postJournal()` (`ARCH-001` `ARCH-03`, `D-07`) | Insert langsung dari modul |
| `INV-04` | Core ledger | Setiap jurnal punya sumber: jenis transaksi asal, nomor transaksi asal, dan pemicu (`D-43`) | Jurnal tanpa sumber tersimpan |
| `INV-05` | Core ledger | Hanya akun aktif yang dipakai di jurnal baru (`D-50`) | Akun tidak aktif dipakai |
| `INV-06` | Core ledger | Jurnal hanya dalam IDR (`D-38`) | Mata uang lain tersimpan |

Status periode: `buka` → `kunci`; `kunci` → `buka` hanya lewat prosedur `C-010`. Status akun: `aktif` ↔ `tidak aktif` (tech lead, `D-33`).

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Jurnal tidak balance | Tolak; tidak ada baris | Perbaiki pemanggil |
| Periode terkunci | Tolak; tidak ada baris | Buka periode lewat prosedur `C-010`, atau koreksi lewat jurnal pembalik di periode berjalan |
| Penulisan header berhasil, baris gagal | Rollback seluruh transaksi (`AC-10`) | Ulangi posting |
| Koreksi jurnal salah | Jurnal baru (pembalik atau koreksi) | Tidak mengubah jurnal lama |

## Architecture boundaries

- `ARCH-03`: penulisan jurnal hanya lewat `core/ledger`. Penegakan database lewat hak akses (`B-02`).
- `D-07`: tidak ada modul yang membuat jurnal sendiri.

## Menyentuh uang

- Akun dipanggil lewat peran akun (`D-35`); modul tidak menyebut nomor akun.
- Sumber angka disimpan sebagai nilai baris dan dicatat sumbernya; contoh terkunci di 01 (`D-44`, `D-49`).
- Pembulatan dua desimal, tipe `numeric(18,2)` (`[USULAN-AGEN]` bersama `FND-002` `OQ-02-07`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Jurnal tidak valid ditolak | AC-02, AC-03, AC-06, AC-08, AC-13, AC-15 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `B-02` | Kegagalan baris membatalkan header | AC-10 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `B-03` | Jurnal tidak balance tidak bisa commit | AC-02, AC-10 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `PRE-01` | Aktor tidak berhak ditolak | AC-14 | `verify-fnd-006.mjs`, `verify-fnd-006-session.mjs` | `PASS` |
| `PRE-02` | Periode terkunci dan tidak balance ditolak | AC-02, AC-04 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `PRE-03` | Jurnal satu baris, sumber kosong, IDR ditolak | AC-06, AC-08, AC-15 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `PRE-04` | Pembalik ganda ditolak | AC-11 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `POST-01` | Jurnal balance tersimpan | AC-01 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `POST-02` | Penolakan tidak mengubah tabel | AC-02 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `POST-03` | Pembalik saldo-nol, jurnal asal utuh | AC-11, AC-12 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `INV-01` | Debit = kredit untuk setiap jurnal tersimpan | AC-01 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `INV-02` | Jurnal posted tidak berubah | AC-05 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `INV-03` | Insert langsung ditolak | AC-07 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `INV-04` | Sumber wajib | AC-06 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `INV-05` | Akun tidak aktif tidak dipakai | AC-03, AC-09, AC-13 | `node scripts/verify-fnd-006.mjs` | `PASS` |
| `INV-06` | Hanya IDR | AC-15 | `node scripts/verify-fnd-006.mjs` | `PASS` |

## Locked decisions and implementation assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Bagan akun dasar (`D-41`) | Terkunci; seed 14 akun | Seed dan posting tidak bisa diuji |
| Nomor akun baru (`D-51`) | Mekanisme berversi; nilai dikutip item pemilik | Akun baru tidak boleh dikarang di sini |
| Akun 150, 159, 702 dicadangkan (`D-41`, `D-45`) | Terkunci; tanpa baris | Akun tak terpakai di COA |
| Periode bulanan kalender (`D-50`) | Terkunci | — |
| Jenis sumber dan pemanggil (`OQ-06-08`, `OQ-06-09`) | Disahkan `D-58` | Jurnal dari pemicu tak berwenang |
| Penegakan balance di database (`OQ-06-10`) | Disahkan `D-58`; constraint trigger | Jaminan balance hanya di layanan |
| Pembulatan dua desimal (`OQ-06-11`) | Disahkan `D-58`; `numeric(18,2)` | Selisih kecil antar laporan |
| Penempatan master mata uang (`OQ-06-07`) | Terjawab `D-38`; transaksi IDR | Kurs tidak tercatat |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | Tidak ada dokumen di item ini |
| Loop/termination | Tidak ada algoritma berulang |
| Matriks izin aksi bisnis | Milik `FND-003` dan item pemilik aksi; core hanya menegakkan daftar peran per jenis sumber jurnal |
| Jurnal manual | Dilarang `D-43` |
| Revaluasi kurs | Tidak ada transaksi asing (`D-38`) |
