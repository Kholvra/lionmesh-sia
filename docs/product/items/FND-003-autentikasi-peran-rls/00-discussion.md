# FND-003 — Diskusi

## Konteks

`backlog.md` mendefinisikan `FND-003` sebagai "Autentikasi & 12 peran staf dengan RLS", sequence 3, `depends on` `FND-002` (status `specified`, belum `done`). Repo sudah punya login dan callback Supabase Auth (`README.md`, `src/app/login/page.tsx`, `src/app/auth/callback/route.ts`), tetapi tabel `profiles` (dari `0001`) belum punya kolom peran (`backlog.md` status fondasi "Peran & otorisasi" = `missing`).

Analisis (`reference/analisis-sia.md` §3) menetapkan 12 akun staf (`D-18`). `D-53` menambah peran ke-13, **Karyawan**, berakun terbatas untuk presensi dan lembur miliknya sendiri.

## Pembaruan 2026-11-22

Keputusan terkunci yang menjawab pertanyaan: `D-33` (matriks izin v0), `D-42` (pemisahan tugas; login gagal tidak menyebut yang salah; sesi 8 jam), `D-48` (satu akun satu peran; akun nonaktif atau berubah peran langsung kehilangan sesi), `D-53` (13 peran, Karyawan self-service, pembatasan per pemilik di database). Pertanyaan yang belum ada di keputusan terkunci diberi usulan `[USULAN-AGEN]`.

## Kenapa item ini

Semua modul dan core membutuhkan identitas dan peran tepercaya di server. Tanpa ini, `FND-004` (approval), `FND-006` (posting jurnal), dan item modul `PD-001`, `PG-001`, `GJ-001` tidak punya dasar untuk membatasi aksi.

## Actor / consumer

- Staf (12 peran): masuk, dan hanya melakukan aksi sesuai perannya.
- Karyawan (peran ke-13, `D-53`): masuk hanya untuk presensi dan lembur miliknya sendiri.
- Pengguna tanpa akun (pelanggan, pemasok, karyawan yang tidak punya akun): tidak dapat masuk ke aplikasi.
- Tech lead: pemilik item; mengelola akun dan kebijakan RLS dasar (`D-33`).

## Problem

Kontrol akses hanya di layar (menu disembunyikan) bisa ditembus dengan menembak endpoint langsung (`analisis` §10.2). Peran yang disimpan di token tidak langsung berubah saat peran diubah (analisis §10.1).

## Desired outcome

Staf dan Karyawan masuk dan hanya melihat serta menjalankan data sesuai perannya. Permintaan tanpa sesi atau tanpa peran ditolak di server dan di database. Perubahan peran atau penonaktifan akun mencabut sesi yang sedang berjalan.

## Known constraints

- `D-18` (Q9): 12 akun staf; karyawan adalah data. Diubah sebagian oleh `D-53`.
- `D-53`: Karyawan = peran ke-13, self-service; akun opsional; pembatasan per pemilik di database.
- `D-23`: portal pelanggan dan pemasok di luar cakupan.
- `ARCH-001` `ARCH-09`: peran mengikuti daftar akun; tidak ada peran baru tanpa keputusan. `D-53` adalah keputusan itu; kontrak `ARCH-001` perlu diselaraskan (lihat 04).
- `ARCH-001` `BOUNDARY-02`: identitas hanya dari sesi; `actor_id` dari klien tidak diterima.
- `ARCH-001` `BOUNDARY-03`: RLS dan constraint di database; klien bukan pembatas.
- Analisis §10.1 `[USULAN]`: peran dibaca dari tabel akun pada setiap permintaan.
- `D-33`: matriks izin v0 (`policies/matriks-izin.md`) disahkan sebagai baseline; kelola akun oleh tech lead.
- `D-42`: empat aturan pemisahan tugas ditegakkan sistem; login gagal tidak menyebut akun atau sandi yang salah; sesi berlaku 8 jam.
- `D-48`: satu akun satu peran; akun yang dinonaktifkan atau berubah peran langsung kehilangan sesinya; pemohon tidak menyetujui dokumen miliknya.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| OQ-03-01 | Matriks hak aksi harus disahkan sebelum item `Ready`? | Tanpa matriks, kebijakan RLS per peran tidak bisa ditulis. | user | Terjawab — D-33: matriks izin v0 disahkan sebagai baseline. |
| OQ-03-02 | Daftar peran final. Apakah "Pengiriman" berdiri sendiri? | Jumlah dan nama peran menentukan `ARCH-09`. | user | Terjawab — D-53: 13 peran = 12 staf (`D-33`, Pengiriman berdiri sendiri) + Karyawan (self-service). |
| OQ-03-03 | Siapa yang membuat, mengubah peran, dan menonaktifkan akun? | Tanpa ini tidak ada cara sah menambah akun. | user | Terjawab — D-33: tech lead mengelola akun; tidak ada peran administrator. Efek nonaktif dan ubah peran: D-48. |
| OQ-03-04 | Apakah satu akun boleh memiliki lebih dari satu peran? | Menentukan bentuk tabel akun dan RLS. | user | Terjawab — D-48: satu akun satu peran. Catatan karyawan yang juga memegang peran staf: `[USULAN-AGEN]` presensinya dicatat HR atas namanya, tanpa akun Karyawan kedua (`D-53` mengizinkan HR menginput atas nama karyawan). |
| OQ-03-05 | Apakah pendaftaran mandiri di `/login` dimatikan? | Halaman login menyediakan daftar. | user | Terjawab — [USULAN-AGEN]: pendaftaran mandiri dimatikan; akun dibuat tech lead. Alasan: `D-18` dan `D-33` menyatakan akun hanya untuk staf dan dikelola tech lead. |
| OQ-03-06 | Pemisahan tugas dijalankan di `FND-003` umum atau per item? | Menentukan aturan tambahan di `FND-003`. | user | Terjawab — D-42 dan D-48: empat aturan dan aturan pemohon tidak menyetujui ditegakkan sistem; pengecekan dilakukan di pemilik aksi (`FND-004`, `GJ-006`, `PD-004`, `PG-005`). |
| OQ-03-07 | Ketika akun dinonaktifkan atau peran diubah, apakah sesi aktif berakhir segera? | Menentukan AC-05 dan AC-09. | user | Terjawab — D-48: sesi langsung hilang; masuk ulang diperlukan. Sesi biasa berlaku 8 jam (D-42). |
| OQ-03-08 | Teks pesan "akses ditolak" dan "akun belum memiliki peran" disetujui? | Syarat DoR butir 4. | user | Terjawab — [USULAN-AGEN]: teks di 01 bagian Validasi. Alasan: login gagal memakai pesan generik sesuai `D-42`; teks lain singkat dan tidak membocorkan data. |
| OQ-03-09 | Tabel mana yang mendapat RLS pada item ini? | Menentukan cakupan AC-02 dan AC-03. | tech lead | Terjawab — [USULAN-AGEN]: RLS aktif pada semua tabel domain yang ada saat item selesai (`satuan`, `produk`, `gudang`, `profiles`) dan wajib untuk setiap tabel baru (ditolak review bila tidak ada). Alasan: `ARCH-001` `BOUNDARY-03`. |
| OQ-03-10 | C1 (autentikasi) dan C2 (izin, menu dari peran) masuk `FND-003`? | Menentukan cakupan item dan batas `FND-007`. | tech lead | Terjawab — [USULAN-AGEN]: C1 dan C2 masuk `FND-003` (judul backlog). Fungsi izin tunggal dari matriks dipakai server dan menu; layar menu dipasang item pemilik layar, bukan `FND-007`. Alasan: satu sumber izin. |
| OQ-03-11 | Tabel akun: `profiles` yang sudah ada diperluas, atau dibuat tabel `pengguna` baru? | `FND-002` dan `FND-003` harus menunjuk tabel yang sama. | tech lead | Terjawab — [USULAN-AGEN]: `profiles` diperluas (kolom peran, aktif, `karyawan_id`); tidak ada tabel kedua. Alasan: sudah ada dari `0001`; mencegah dua tabel untuk fakta yang sama (`D-08` semangatnya). |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `[USULAN-AGEN]` OQ-03-04 | Karyawan yang juga staf tidak punya akun Karyawan kedua | 2026-11-22 | tech lead (kunci koordinator) | HR mencatat presensinya |
| `[USULAN-AGEN]` OQ-03-05 | Pendaftaran mandiri dimatikan | 2026-11-22 | tech lead (kunci koordinator) | Akun hanya dibuat tech lead |
| `[USULAN-AGEN]` OQ-03-08 | Teks pesan | 2026-11-22 | tech lead (kunci koordinator) | DoR butir 4 |
| `[USULAN-AGEN]` OQ-03-09..11 | RLS semua tabel domain; C1+C2 di item ini; `profiles` diperluas | 2026-11-22 | tech lead (kunci koordinator) | Migrasi FND-003 |

## Assumptions (agent-proposed)

- A1: Peran dibaca dari `profiles` pada setiap permintaan (analisis §10.1 `[USULAN]`), dan akun yang berubah dicabut sesinya (D-48).
- A2: Identitas diambil dari sesi Supabase di server (`ARCH-001` `BOUNDARY-02`).
- A3: Tipe item `feature`: menyentuh masuk dan izin yang terlihat pengguna.
- A4: Ukuran `M` `[USULAN]`, dengan risiko dari RLS lintas tabel dan pembatasan Karyawan.

## Rejected alternatives

- Peran disimpan di token: ditolak. Perubahan peran tidak berlaku sampai token kedaluwarsa (analisis §10.1); D-48 menuntut sesi dicabut.
- Pemeriksaan peran hanya di klien: ditolak (analisis §10.2, `ARCH-001` `BOUNDARY-03`).
- Satu akun dengan banyak peran: ditolak oleh `D-48`.

## Next step

Koordinator mengunci keputusan `[USULAN-AGEN]` di atas. Setelah `FND-002` `done`, item ini dapat menjadi `Ready` sesuai 03.
