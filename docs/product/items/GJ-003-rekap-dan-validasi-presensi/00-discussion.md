# GJ-003 — Diskusi

## Konteks

Track GJ-B. Setelah presensi dan lembur tercatat (GJ-002), HR merekap per periode penggajian dan Supervisor Lapangan memvalidasi per departemen. Sumber §8.1: "Payroll tidak boleh jalan sebelum presensi divalidasi supervisor". Di `backlog.md` item ini `specified`, depends on `GJ-002`.

Diperbarui 2026-11-22 setelah `D-47` (c) dan `D-53`. `D-47` (c) menambahkan `REKAP` → `TERBUKA` sebagai jalur "rekap dikembalikan ke HR", sehingga status `DITOLAK` yang sebelumnya `[USULAN]` tidak dipakai lagi.

Sumber: `analisis-sia.md` §5.5 (GJ-3), §6.9 langkah 33–34, §5.4 (state machine); makalah UC-GJ-03 dan UC-GJ-04.

## Raw request

Daftar backlog: "Rekap & validasi presensi" (track GJ-B presensi, level 3).

## Actor / consumer

- HR: membuat rekap periode dan menutup periode (`REKAP`), serta menerima rekap yang dikembalikan (`D-33`, `D-47` c).
- Supervisor Lapangan: memvalidasi rekap per departemen dan dapat mengembalikannya dengan alasan (`D-33`, makalah UC-GJ-04).
- Manajemen: memberi otorisasi khusus untuk membuka kembali periode `TERVALIDASI` (`[USULAN-AGEN]`, Q-03).
- Karyawan: tidak terlibat (`D-53` hanya mencatat presensinya).

## Problem

Payroll tidak boleh berjalan dengan data kehadiran yang belum diperiksa. Tanpa gate ini, angka lembur bisa salah tanpa ada yang bertanggung jawab.

## Desired outcome

Periode berpindah dari `TERBUKA` ke `REKAP` ke `TERVALIDASI`, atau kembali ke `TERBUKA` bila dikembalikan. Payroll hanya bisa dimulai untuk periode yang `TERVALIDASI`.

## Known constraints

- §8.1 [SUMBER]: payroll tidak boleh jalan sebelum validasi supervisor.
- `D-46`: nama status `REKAP` dan `TERVALIDASI`.
- `D-47` (c): `REKAP` → `TERBUKA` ketika rekap dikembalikan ke HR. Tidak ada status baru tanpa keputusan baru.
- `D-08`: transisi status tercatat di `riwayat_status`.
- `D-33`: rekap oleh HR, validasi oleh Supervisor Lapangan, dan Supervisor tidak merekap.
- `D-48`: pemohon tidak boleh menyetujui dokumennya sendiri; alasan wajib saat menolak.
- `D-53`: presensi tersimpan menunggu validasi Supervisor; koreksi periode tertutup lewat HR dengan otorisasi khusus.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| Q-01 | Supervisor mana yang memvalidasi? Per departemen, per area, atau satu supervisor untuk semua? | Menentukan izin dan apakah validasi bertahap. | Pengguna | Terjawab — [USULAN-AGEN]: satu Supervisor Lapangan per departemen, hanya untuk karyawan departemennya (makalah UC-GJ-04). Penugasan dicatat sebagai data di master departemen (GJ-001, P-07). Alasan: sumber menyebut validasi per departemen |
| Q-02 | Apa yang terjadi bila Supervisor menolak rekap: dikembalikan ke HR untuk diperbaiki, dan siapa yang membuka kembali? | Membentuk jalur kembali yang belum ada di sumber. | Pengguna | Terjawab — D-47 (c): rekap dikembalikan ke HR dengan status `TERBUKA` dan alasan wajib (`D-48`). [USULAN-AGEN]: tidak ada batas waktu otomatis di versi awal; pengingat ke Supervisor lewat notifikasi `C-012`. Alasan: sumber menyebut batas waktu tanpa angka, dan D-50 menetapkan notifikasi in-app dan email |
| Q-03 | Setelah `TERVALIDASI`, apakah presensi masih boleh diubah? Bila ya, siapa, dan apakah validasi harus diulang? | Berinteraksi dengan P-07 GJ-002 dan dengan kunci payroll GJ-005. | Pengguna | Terjawab — [USULAN-AGEN]: presensi terkunci setelah `TERVALIDASI`. Koreksi dilakukan HR dengan otorisasi Manajemen dan alasan, periode kembali ke `REKAP` (transisi baru di luar `D-46`/`D-47`, perlu dikunci koordinator), lalu validasi ulang. Tidak diperbolehkan bila draft payroll sudah `DISETUJUI`. Alasan: makalah aturan 4 dan `D-53` |
| Q-04 | Karyawan tanpa presensi sama sekali dalam periode: dianggap apa? | Mempengaruhi gaji yang dihitung di GJ-004. | Pengguna | Terjawab — [USULAN-AGEN]: karyawan aktif tanpa entri tidak dianggap alpha. Rekap tidak bisa disimpan selama masih ada karyawan aktif tanpa entri; HR harus mengisi nilai kehadiran (makalah UC-GJ-03: data kosong ditandai dan diperbaiki sebelum rekap disimpan) |
| Q-05 | Apakah validasi dilakukan sekali untuk seluruh periode, atau bertahap per bagian? | Menentukan kapan payroll bisa dimulai. | Pengguna | Terjawab — D-46 (periode `TERVALIDASI`) + [USULAN-AGEN]: validasi per departemen; periode menjadi `TERVALIDASI` hanya bila semua departemen yang punya karyawan aktif sudah tervalidasi. Alasan: makalah UC-GJ-04 dan D-46 |
| Q-06 | Dampak data pribadi: rekap menampilkan data per karyawan. Pembaca rekap siapa? | DoR bersyarat data pribadi. | Pengguna | Terjawab — [USULAN-AGEN] (sebagian D-33): HR membaca rekap seluruh karyawan; Supervisor membaca rekap departemennya; Accounting dan Direksi tidak membaca rekap per karyawan. Alasan: D-33 hanya menetapkan HR dan Supervisor |
| Q-07 | Apakah GJ-003 menambah primitive UI baru? | Gate `FND-007`. | Tech lead | Terjawab — [USULAN-AGEN]: ya, tabel rekap dan dialog validasi memakai primitive `FND-007`; item menunggu `FND-007`. Alasan: backlog aturan 1 dan DoR butir 8 |

## Pertentangan sumber vs keputusan

- Makalah menamai status "Siap Divalidasi Supervisor" dan "Tervalidasi", sedangkan D-46 mengunci `REKAP` dan `TERVALIDASI`. Keputusan terkunci menang.
- Makalah UC-GJ-04 memakai "Tidak Divalidasi" untuk batas waktu terlewat. Tidak dipakai karena tidak ada batas waktu otomatis (Q-02) dan tidak ada status baru (`D-47`).
- Transisi `TERVALIDASI` → `REKAP` (Q-03) belum ada di `D-46` maupun `D-47`. Dicatat sebagai `[USULAN-AGEN]` untuk dikunci koordinator.

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-33 | Matriks izin v0 disahkan sebagai baseline | 2026-11-22 | Keputusan terkunci | Rekap oleh HR; validasi oleh Supervisor Lapangan. |
| D-46 | Daftar status dokumen mengikuti state machine | 2026-11-22 | Keputusan terkunci | Nama `REKAP` dan `TERVALIDASI`. |
| D-47 | Penambal state machine (c) | 2026-11-22 | Keputusan terkunci | `REKAP` → `TERBUKA` untuk rekap yang dikembalikan. Menggantikan `DITOLAK` yang `[USULAN]`. |
| D-53 | Karyawan self-service; koreksi periode tertutup lewat HR dengan otorisasi | 2026-11-22 | Keputusan terkunci | Otorisasi koreksi (Q-03). |

## Assumptions (agent-proposed)

- `[USULAN]` Rekap dan validasi dilakukan per periode penggajian, dengan validasi per departemen (Q-05).
- Periode baru dibuat HR dengan status `TERBUKA`.

## Rejected alternatives

- Validasi otomatis tanpa Supervisor: bertentangan dengan §8.1.
- Status `DITOLAK` sebagai status terpisah: ditolak karena `D-47` (c) sudah memberi jalur `TERBUKA`.

## Next step

Tidak ada pertanyaan terbuka. Daftar `[USULAN-AGEN]` (Q-01, Q-02 bagian batas waktu, Q-03 transisi `TERVALIDASI` → `REKAP`, Q-04, Q-05, Q-06, Q-07) sudah disahkan `D-58` (tingkat item). Verdict tetap `Blocked` karena `GJ-002` dan gate fondasi belum `done`.
