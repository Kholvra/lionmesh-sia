# GJ-008 — Diskusi

## Konteks

Track GJ-B (presensi). Impor presensi dari berkas ekspor mesin absensi dengan pemetaan ID mesin ke NIK. Di `backlog.md` item ini `specified`, depends on `GJ-002` saja. `DISC-001` adalah spike non-pemblokir (`D-60`(e)), bukan dependensi. Level 3 (derived). Item ini tidak memblokir item lain.

Diperbarui 2026-11-22 setelah `D-52`. `D-52` menetapkan `GJ-008` sebagai impor CSV generik dengan pemetaan kolom. Hasil `DISC-001` hanya mengisi profil pemetaan. Merek dan tipe mesin tidak lagi mengunci format, sehingga M-01 dan M-02 terjawab.

Sumber: `analisis-sia.md` §5.5 (GJ-8), §5.6, §9.3 G19; `D-01`, `D-39`, `D-52`; makalah §4.1.5 (presensi mesin dan SPL).

## Raw request

Daftar backlog: "Impor presensi dari mesin" (track GJ-B presensi, level 3).

## Actor / consumer

- HR: menjalankan impor, mengisi profil pemetaan, dan memeriksa hasil (`D-33`, `D-52`).
- Supervisor Lapangan: membaca hasil lewat validasi `GJ-003`. Tidak mengimpor.
- Karyawan: tidak terlibat. Impor tidak berasal dari perangkat karyawan (`D-53`).

## Problem

Presensi mesin harus dimasukkan ke sistem tanpa mengetik ulang. Tanpa impor, HR mengetik ulang dari mesin dan risiko salah input naik.

## Desired outcome

Berkas CSV dari mesin dapat diimpor dan dipetakan ke karyawan (NIK) lewat profil pemetaan. Baris yang tidak bisa dipetakan atau bentrok tidak masuk diam-diam.

## Known constraints

- `D-52`: impor CSV generik dengan pemetaan kolom; hasil `DISC-001` hanya mengisi profil pemetaan; merek tidak mengunci format.
- `D-01`: cakupan penuh, tidak ada pemotongan. Urutan mengikuti `D-39`; dependensi mengikuti `D-60`(e).
- `D-39`: `GJ-008` dikerjakan paling akhir di siklusnya. Ketergantungan pada `DISC-001` dicabut oleh `D-60`(e).
- `D-53`: presensi tersimpan menunggu validasi Supervisor; periode tertutup ditolak.
- `D-47`: tidak ada status baru. Impor tidak punya status tersimpan (lihat Status di 01).
- `D-08`: transisi presensi tercatat di `riwayat_status`.
- `D-25`: presensi lewat aturan GJ-002; karyawan lewat service core.
- `D-32`: audit kolom (aktor dan waktu).

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| M-01 | Merek dan tipe mesin absensi, dan cara ekspornya (berkas, API, atau basis data mesin)? | Tanpa ini, format impor tidak bisa ditetapkan. | Pengguna | Terjawab — D-52: impor berkas CSV generik dengan pemetaan kolom; merek dan tipe tidak mengunci format. Fakta mesin dari `DISC-001` hanya mengisi profil pemetaan (D-39, D-52) |
| M-02 | Format berkas impor: kolom, pemisah, dan kode status mesin. | Parser dan validasi. | Pengguna | Terjawab — D-52 + [USULAN-AGEN]: CSV dengan baris judul; pemisah, format tanggal dan jam, serta kolom ID mesin, tanggal, jam masuk, dan jam pulang dipilih di profil pemetaan. Kode status mesin tidak dipakai; baris dengan jam masuk dan jam pulang dianggap HADIR. Alasan: format mesin belum dikonfirmasi |
| M-03 | Pemetaan ID mesin ke NIK: siapa yang mengisi, dan apa yang terjadi bila ID tidak punya NIK? | Baris yang tidak terpetakan tidak boleh masuk diam-diam. | Pengguna | Terjawab — [USULAN-AGEN]: HR mengisi profil pemetaan (ID mesin → NIK karyawan aktif, satu ID satu NIK). ID tanpa NIK: baris dilewati dan didaftar sebagai tidak terpetakan, tidak disimpan. Alasan: data pribadi dikelola HR (`D-33`) |
| M-04 | Impor dua kali untuk berkas yang sama: apakah ditolak, digabung, atau menimpa? | Idempotensi; mencegah presensi ganda. | Pengguna | Terjawab — [USULAN-AGEN]: berkas identik (sama isi) yang sudah pernah diimpor ditolak dengan pesan; tidak ada penimpaan. Alasan: mencegah presensi ganda dan tidak menambah aturan status |
| M-05 | Presensi impor dan presensi manual untuk tanggal yang sama: mana yang menang? | Konflik data. | Pengguna | Terjawab — [USULAN-AGEN]: tidak ada yang menang diam-diam. Baris impor yang bentrok dengan presensi yang sudah ada (NIK dan tanggal sama) dilewati dan didaftar sebagai bentrok; presensi manual tetap. Alasan: GJ-002 AC-02 satu presensi per NIK per tanggal |
| M-06 | Prioritas dan status item: analisis P2. Apakah item ini masuk sebelum atau setelah GJ-007? | Menentukan urutan kerja track GJ-B. | Pengguna | Terjawab — D-39: GJ-008 dikerjakan paling akhir di siklusnya; D-01: cakupan penuh tanpa pemotongan. Prioritas P2 tetap usulan analisis |
| M-07 | Apakah impor boleh dijalankan untuk periode yang sudah `TERVALIDASI`? | Berinteraksi dengan Q-03 GJ-003. | Pengguna | Terjawab — D-53 dan D-47 c: periode `REKAP` atau `TERVALIDASI` menolak entri baru termasuk impor. Impor hanya untuk periode `TERBUKA` |
| M-08 | Apakah GJ-008 menambah primitive UI baru? | Gate `FND-007`. | Tech lead | Terjawab — [USULAN-AGEN]: ya, pratinjau impor dan daftar baris tidak terpetakan memakai primitive `FND-007`; item menunggu `FND-007`. Alasan: backlog aturan 1 |

## Pertentangan sumber vs keputusan

- Analisis §5.5 menaruh GJ-008 sebagai P2 dan §15 menyebut "kemungkinan"; D-01 mengunci cakupan penuh. D-01 menang untuk cakupan; urutan dan dependensi mengikuti D-39.
- `D-39` menaruh `DISC-001` sebagai dependensi GJ-008, sedangkan `D-52` menyatakan hasil `DISC-001` hanya mengisi profil pemetaan. Pertentangan ini terselesaikan oleh `D-60`(e): `DISC-001` menjadi spike non-pemblokir dan `GJ-008` hanya bergantung ke `GJ-002`. `backlog.md` sudah sesuai.
- Analisis §6.9 dan catatan awal menyebut "status impor" `diunggah → diproses → selesai/gagal`. Ditolak oleh `D-47` (tidak ada status baru); diganti dengan impor atomik dan ringkasan hasil.

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-01 | Cakupan penuh, tanpa pemotongan | 2026-11-17 | Pengguna | Item tetap masuk cakupan. |
| D-18 | Karyawan tidak punya akun | 2026-11-17 | Pengguna | `superseded` oleh `D-53`; impor tetap tidak berasal dari karyawan. |
| D-25 | Modul tidak membaca tabel modul lain | 2026-11-17 | Pengguna | Presensi lewat aturan GJ-002. |
| D-39 | Fakta eksternal dikonfirmasi lewat spike `DISC-001` | 2026-11-22 | Keputusan terkunci | Sebagian `superseded` oleh `D-60`(e): bukan dependensi (lihat Pertentangan). |
| D-47 | Tidak ada status baru | 2026-11-22 | Keputusan terkunci | Tidak ada status impor. |
| D-52 | Impor CSV generik dengan pemetaan kolom | 2026-11-22 | Keputusan terkunci | Format tidak dikunci merek. |
| D-53 | Presensi tersimpan menunggu validasi; periode tertutup ditolak | 2026-11-22 | Keputusan terkunci | Impor hanya ke periode `TERBUKA`. |

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` Impor menghasilkan baris presensi yang sama dengan entri manual GJ-002 (satu sumber data), dengan penanda sumber impor.
- `[USULAN-AGEN]` Baris yang gagal dipetakan ditampilkan sebagai daftar, tidak disimpan.
- `[USULAN-AGEN]` Impor dijalankan HR.

## Rejected alternatives

- Presensi karyawan lewat akun karyawan atau impor dari perangkat karyawan: ditolak `D-53` (karyawan mencatat lewat GJ-002, bukan impor).
- Status impor tersimpan (`diunggah`, `diproses`, `selesai`, `gagal`): ditolak `D-47`.
- Konektor API mesin khusus: tidak dipilih; `D-52` memakai berkas CSV generik.

## Next step

Tidak ada pertanyaan terbuka. Daftar `[USULAN-AGEN]` (M-02, M-03, M-04, M-05, M-08) sudah disahkan `D-58` (tingkat item). Pertentangan `DISC-001` (dependensi vs `D-52`) sudah terselesaikan oleh `D-60`(e). Verdict tetap `Blocked` karena `GJ-002` belum `done`.
