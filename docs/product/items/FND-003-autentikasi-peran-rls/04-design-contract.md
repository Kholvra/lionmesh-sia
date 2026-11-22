# Design Contract: FND-003 — Autentikasi dan peran

- Source: `docs/product/items/FND-003-autentikasi-peran-rls/01-requirement.md` (`FND-003`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-14`)
- Status: `Partially verified`
- Profile: product app / security boundary
- Scope: identitas dari sesi, 13 peran, RLS dasar, pembatasan per pemilik untuk Karyawan, pencabutan sesi, penolakan di server dan database
- Owner: tech lead
- Referensi: `ARCH-001` (`BOUNDARY-01`, `BOUNDARY-02`, `BOUNDARY-03`, `ARCH-09`); `D-18`, `D-23`, `D-33`, `D-42`, `D-48`, `D-53`

## Intent and non-goals

**Intent.** Identitas dan peran hanya berasal dari sesi sah dan tabel akun di server. Database menolak akses yang tidak berwenang, sehingga klien tidak menjadi pembatas. Karyawan hanya dapat menyentuh baris miliknya.

**Non-goals.** Matriks hak aksi per siklus (sudah baseline `D-33`), approval (`FND-004`), pendaftaran mandiri, portal non-staf, dan tabel presensi (`GJ-002`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server | Form, parameter, payload | Validasi skema di server sebelum menyentuh data (`BOUNDARY-01`) | Nilai bertipe | Pesan yang bisa dibaca; tidak diteruskan |
| `B-02` | Sesi → identitas | Cookie sesi Supabase | Ambil pengguna dari sesi di server; cek akun aktif dan peran | `actor_id` + peran tepercaya | Tolak bila tidak ada sesi; `actor_id` dari klien diabaikan |
| `B-03` | Server → database | Query server | RLS, constraint | Baris yang lolos kebijakan | Tolak di database |
| `B-04` | Perubahan akun → sesi aktif | Admin mengubah `aktif` atau `peran` | Sesi lama dicabut saat perubahan (`D-48`) | Sesi hanya sah untuk akun aktif dengan peran saat itu | Permintaan dengan sesi lama ditolak |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Aksi domain dipanggil | Sesi sah dan akun `aktif` | Server | Ditolak sebelum menyentuh data |
| `PRE-02` | Aksi domain dipanggil | Peran akun termasuk peran yang diizinkan aksi itu (matriks `D-33`) | Server + RLS | Ditolak dengan pesan |
| `PRE-03` | Peran diberikan | Nilai peran ada di daftar 13 (`ARCH-09`, `D-53`) | Database | Constraint menolak |
| `PRE-04` | Baris Karyawan diakses | Untuk peran Karyawan, `karyawan_id` sesi sama dengan `karyawan_id` baris | Database (RLS) | Baris tidak terbaca atau ditolak tulis |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Aksi sah dilakukan atas nama identitas sesi | Data lain tidak berubah | Jejak `actor_id` dari sesi |
| `POST-02` | Aksi ditolak tidak mengubah data | Seluruh data | Tidak ada |
| `POST-03` | Setelah akun dinonaktifkan atau peran berubah, sesi lama tidak lagi sah (`D-48`) | Data akun | Sesi dicabut |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core | Peran hanya dari daftar 13 (`ARCH-09`, `D-53`) | Peran ke-14 tersimpan |
| `INV-02` | Server | `actor_id` selalu dari sesi | `actor_id` dari klien dipercaya |
| `INV-03` | Database | Tidak ada baris domain terbaca tanpa kebijakan yang lolos (`B-03`) | Akses tanpa peran |
| `INV-04` | Server + core | Pemisahan tugas `D-42` dan `D-48`: pemohon tidak menyetujui dokumen miliknya; penghitung gaji tidak membayar gaji; pembuat pesanan tidak mengirim barangnya; pemohon PR tidak membayar invoice PR itu | Aksi yang melanggar pemisahan diterima |
| `INV-05` | Database | Satu akun satu peran (`D-48`) | Dua peran untuk satu `user_id` |
| `INV-06` | Database | Karyawan hanya membaca dan menulis baris dengan `karyawan_id` miliknya (`D-53`) | Karyawan membaca atau menulis baris orang lain |

Status akun (`tanpa peran` → `aktif` ↔ `nonaktif`) mengikuti `01-requirement.md`. Setiap transisi ke `nonaktif` atau perubahan peran pada akun `aktif` memicu `B-04` dan `POST-03`.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Sesi kedaluwarsa (8 jam) | Ditolak; diarahkan ke `/login` | Masuk ulang |
| Akun dicabut saat sesi aktif | Permintaan berikutnya ditolak; aksi yang sudah selesai di server tidak dibatalkan | Masuk ulang bila akun masih aktif |
| Peran tidak berwenang | Ditolak; tidak ada perubahan | Tech lead memberi peran yang benar |
| Kebijakan RLS salah | Akses terlalu luas atau terlalu sempit | Perbaiki lewat migrasi baru; tidak mengubah migrasi merged |

## Architecture boundaries

- `BOUNDARY-01`–`03` dari `ARCH-001`: aturan penolakan berlaku di tiga lapis.
- `ARCH-09`: 12 peran staf pada `ARCH-001` sekarang 13 peran (`D-53`). Kontrak `ARCH-001` perlu diselaraskan koordinator; item ini memakai 13.

## Data pribadi

| Field | Isi | Yang boleh melihat |
|---|---|---|
| `profiles.email` atau nama login | identitas login | pemilik akun (data sendiri); tech lead |
| `profiles.peran`, `profiles.aktif` | hak akses | pemilik akun (data sendiri); tech lead |
| `profiles.karyawan_id` | tautan ke data karyawan | pemilik akun; tech lead; HR (lewat item `GJ-001`) |

Karyawan tidak melihat `profiles` orang lain.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Nilai tidak valid ditolak sebelum layanan | Uji perilaku | AC-04, AC-08 | `PARTIAL` |
| `B-02` | `actor_id` dari klien diabaikan | AC-06 | AC-06 | `PASS` |
| `B-03` | RLS menolak akses tanpa peran | AC-02 | AC-02 | `PASS` |
| `B-04` | Sesi lama ditolak setelah perubahan | AC-05 | AC-05 | `PARTIAL` |
| `PRE-01` | Tanpa sesi atau akun nonaktif ditolak | AC-01, AC-09 | AC-01, AC-09 | `PARTIAL` |
| `PRE-02` | Peran tidak berwenang ditolak | AC-03, AC-04 | AC-03, AC-04 | `PARTIAL` |
| `PRE-03` | Peran ke-14 ditolak | AC-08 | AC-08 | `PASS` |
| `PRE-04` | Karyawan hanya baris sendiri | AC-11 | AC-11 | `PASS` |
| `POST-01` | Aksi sah mencatat identitas sesi | AC-06 | AC-06 | `PASS` |
| `POST-02` | Aksi ditolak tidak mengubah data | AC-04 | AC-04 | `PARTIAL` |
| `POST-03` | Sesi lama dicabut | AC-05 | AC-05 | `PARTIAL` |
| `INV-01` | Daftar peran = 13 | AC-07 | AC-07 | `PASS` |
| `INV-02` | Identitas dari sesi | AC-06 | AC-06 | `PASS` |
| `INV-03` | Akses tanpa peran ditolak | AC-02 | AC-02 | `PASS` |
| `INV-04` | Pemisahan tugas diuji di pemilik aksi | AC-03 di item pemilik | — | `PARTIAL` |
| `INV-05` | Satu peran per akun | AC-10 | AC-10 | `PASS` |
| `INV-06` | Karyawan tidak membaca baris orang lain | AC-11 | AC-11 | `PASS` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Satu peran per akun (`OQ-03-04`, `D-48`) | Terjawab | Bentuk tabel akun |
| Karyawan yang juga staf (`OQ-03-04`) | `[USULAN-AGEN]` | Presensi staf tidak tercatat self-service |
| Efek nonaktif dan ubah peran (`OQ-03-07`, `D-48`) | Terjawab | — |
| Akun tabel: `profiles` diperluas (`OQ-03-11`) | `[USULAN-AGEN]` | Dua tabel akun |
| RLS semua tabel domain yang ada (`OQ-03-09`) | `[USULAN-AGEN]` | Tabel tanpa kebijakan |
| Peran dibaca per permintaan (analisis §10.1 `[USULAN]`) | `Proposed` | Perubahan peran tertunda; `B-04` tetap menutup sesi |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | Milik `FND-004` |
| Loop/termination | Tidak ada algoritma berulang |
| Batas modul penuh | Milik `ARCH-001` |
| Pemisahan tugas per aksi | Milik item pemilik aksi (`D-42`) |
