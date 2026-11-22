# GJ-002 — Diskusi

## Konteks

Track GJ-B (presensi). `GJ-002` mencatat presensi harian dan pengajuan lembur per karyawan untuk satu periode penggajian. Di `backlog.md` item ini `specified`, depends on `GJ-001` dan `FND-004` (dokumen: penomoran, status, riwayat, approval berjenjang).

Diperbarui 2026-11-22 setelah `D-53`. `D-53` menggantikan `D-18` dan mengubah jawaban P-01: karyawan adalah peran ke-13 self-service yang mencatat presensi dan lembur miliknya sendiri (makalah UC-GJ-02). Pertanyaan yang sebelumnya terbuka sudah dijawab.

Sumber: `analisis-sia.md` §5.5 (GJ-2), §6.9 langkah 32, §8.1; makalah penggajian §4.1.3 dan UC-GJ-02, UC-GJ-03, aturan 4.

## Raw request

Daftar backlog: "Presensi & pengajuan lembur" (track GJ-B presensi, level 2).

## Actor / consumer

- Karyawan (self-service, `D-53`): mencatat jam masuk dan pulang miliknya, mengajukan lembur dengan nomor SPL, dan melihat riwayat presensinya. Akun opsional.
- HR: mencatat presensi dan lembur atas nama karyawan, termasuk karyawan tanpa akun (`D-53`). Mengajukan koreksi periode tertutup dengan otorisasi (P-07).
- Supervisor Lapangan: memvalidasi presensi dan lembur per departemen di `GJ-003`. Tidak mencatat.
- Manajemen: memberi otorisasi khusus untuk koreksi periode tertutup (P-07, `[USULAN-AGEN]`).

## Problem

Payroll butuh data kehadiran dan lembur per periode. Sebelum keputusan ini, sumber mencatat dua hal yang bertentangan tentang siapa yang mengisi. `D-53` menyelesaikannya: karyawan mencatat sendiri, HR bisa mencatat atas nama, dan Supervisor memvalidasi.

## Desired outcome

Presensi harian dan pengajuan lembur tercatat per karyawan dalam satu periode penggajian. Setiap entri tersimpan menunggu validasi Supervisor. Lembur hanya tercatat bila ada nomor SPL.

## Known constraints

- `D-53`: karyawan mencatat presensi masuk dan pulang sendiri, mengajukan lembur dengan nomor SPL, dan melihat riwayat presensinya. Presensi tersimpan menunggu validasi Supervisor. Koreksi periode tertutup diajukan lewat HR dengan otorisasi khusus. Akun karyawan opsional.
- `D-33`: matriks izin v0 memuat baris "Catat presensi / ajukan lembur: Karyawan untuk dirinya sendiri; HR atas nama atau koreksi dengan otorisasi khusus".
- `D-08`: transisi status tercatat di `riwayat_status` polimorfik.
- `D-48`: pemohon tidak boleh menyetujui dokumennya sendiri; dokumen yang belum diposting boleh dibatalkan pemohon dengan alasan wajib.
- `D-47`: tidak ada status dokumen baru di luar `D-46`/`D-47`. Status presensi memakai `MENUNGGU_VALIDASI_SUPERVISOR` dari `D-53` dan `TERVALIDASI` dari `D-46` (per periode).
- `D-50`: penomoran dan master nonaktif. Karyawan nonaktif tidak bisa dipilih (GJ-001).
- `D-25` / `ARCH-08`: data karyawan dibaca lewat service core.
- `D-51`: parameter berversi untuk batas jam lembur (nilai tidak ditulis di sini).

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| P-01 | Siapa yang mengisi presensi: HR saja, atau HR dan Supervisor? Matriks §3.3 menyebut "Karyawan (atau HR atas nama)", catatan §3.1 menyebut "HR/Supervisor", dan §6.9 langkah 32 menyebut "Karyawan isi presensi". | Menentukan peran yang boleh menulis dan AC izin. | Pengguna | Terjawab — D-53: karyawan mencatat presensi dan lembur miliknya; HR atas nama atau untuk karyawan tanpa akun; Supervisor memvalidasi (D-33). Menggantikan D-18 |
| P-02 | Siapa "atasan" yang memberi instruksi lembur? Apakah instruksi ini dicatat sebagai dokumen terpisah (SPL) yang perlu approval berjenjang lewat `FND-004`? | Menentukan alur status SPL dan siapa yang menyetujui. | Pengguna | Terjawab — D-53: lembur wajib nomor SPL. [USULAN-AGEN]: SPL tidak punya approval berjenjang terpisah; validasi Supervisor di GJ-003 adalah satu langkah. Alasan: D-37 hanya menyebut PG-003, PR-003, GJ-005 untuk mesin berjenjang; makalah hanya memuat satu validasi supervisor |
| P-03 | Jenis kehadiran: apa saja nilai presensi harian? Sumber tidak menyebut daftar. | Menentukan data mentah GJ-003 dan GJ-004. | Pengguna | Terjawab — [USULAN-AGEN]: HADIR, IZIN, SAKIT, ALPHA, CUTI. LIBUR bukan input (hari libur tidak dicatat). Alasan: makalah §4.1.2 dan rekap memakai hari kerja, sakit, izin, alpha, dan cuti |
| P-04 | Batas jam lembur dan aturan pembulatan jam (per menit, per jam, per setengah jam). Tidak ada di sumber. | Mempengaruhi angka lembur di GJ-004 dan kemampuan reproduksi. | Pengguna | Terjawab — D-51: batas jam lembur sebagai parameter berversi; mekanisme berversi, nilai diverifikasi dan dikutip sumbernya saat implementasi. Pembulatan jam: [USULAN-AGEN] jam lembur dihitung per menit penuh tanpa pembulatan ke jam. Alasan: pembulatan rupiah sudah diatur D-51(b) |
| P-05 | Status pengajuan lembur dan transisinya. Sumber hanya menyebut `PRS` dan `SPL` sebagai dokumen. | Diperlukan untuk DoR butir 3. | Pengguna | Terjawab — D-53: `MENUNGGU_VALIDASI_SUPERVISOR`; D-46/D-47: `TERVALIDASI` per periode; D-48: `DIBATALKAN` oleh pemohon sebelum validasi dengan alasan. Tidak ada status baru. [USULAN-AGEN] transisi per baris: menunggu → tervalidasi, atau dibatalkan |
| P-06 | Aturan periode: apakah presensi boleh diisi di luar periode penggajian, dan siapa yang menentukan tanggal awal dan akhir? | Menentukan periode yang diisi. | Pengguna | Terjawab — [USULAN-AGEN]: presensi hanya pada periode `TERBUKA` (D-47 c); periode `REKAP` atau lebih lanjut menolak entri baru. Tanggal awal dan akhir: rentang per periode, default satu bulan kalender. Alasan: makalah UC-GJ-02 menolak periode tertutup; D-47 mendefinisikan `REKAP` sebagai periode ditutup |
| P-07 | Koreksi presensi setelah periode direkap atau divalidasi: boleh atau tidak, dan oleh siapa? | Berinteraksi dengan GJ-003 (validasi). | Pengguna | Terjawab — D-53: koreksi periode tertutup diajukan HR dengan otorisasi khusus. [USULAN-AGEN]: pemberi otorisasi Manajemen. Setelah `REKAP`, koreksi membuka periode ke `TERBUKA` (D-47 c). Setelah `TERVALIDASI`: [USULAN-AGEN] transisi `TERVALIDASI` → `REKAP` dengan otorisasi, hanya bila draft belum `DISETUJUI`, karena transisi ini belum ada di D-46/D-47 |
| P-08 | Data presensi termasuk data pribadi? Siapa yang boleh melihat? | DoR bersyarat data pribadi. | Pengguna | Terjawab — [USULAN-AGEN] (sebagian D-53): HR membaca semua presensi; Supervisor membaca presensi departemennya; karyawan membaca presensinya sendiri. Lainnya tidak. Alasan: D-53 dan makalah UC-GJ-04 |
| P-09 | Apakah GJ-002 menambah primitive UI baru (kalender presensi, tabel)? | Gate `FND-007` pada `backlog.md`. | Tech lead | Terjawab — [USULAN-AGEN]: ya, tabel dan form memakai primitive `FND-007`; item menunggu `FND-007`. Alasan: backlog aturan 1 dan D-54 (gate item modul) |

## Pertentangan sumber vs keputusan

- Makalah UC-GJ-02 menjadikan aktor "Karyawan" yang mencatat presensi dan lembur sendiri. Analisis §6.9 langkah 32 menulis "Karyawan isi presensi". Keduanya sesuai dengan `D-53`, yang berlaku. `D-18` (karyawan tidak punya akun) dan `D-33` ("HR yang mencatat") digantikan untuk akun karyawan.
- Makalah memakai status "Tidak Divalidasi" dan "dikembalikan ke HR" di UC-GJ-04. Status tersebut tidak dipakai di item ini; pengembalian rekap ditangani `GJ-003` lewat `TERBUKA` (`D-47` c).

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-18 | Karyawan tidak punya akun | 2026-11-17 | Pengguna | `superseded` oleh `D-53`. |
| D-33 | Matriks izin v0 disahkan sebagai baseline | 2026-11-22 | Keputusan terkunci | Karyawan mencatat untuk dirinya; HR atas nama; Supervisor memvalidasi. |
| D-47 | Penambal state machine: periode `REKAP` → `TERBUKA` | 2026-11-22 | Keputusan terkunci | Koreksi periode tertutup (P-07). |
| D-48 | Pembatalan oleh pemohon; akun nonaktif kehilangan sesi | 2026-11-22 | Keputusan terkunci | Pembatalan lembur sebelum validasi (AC-14). |
| D-53 | Karyawan peran ke-13 self-service | 2026-11-22 | Keputusan terkunci | Sumber presensi utama adalah karyawan sendiri. |

## Assumptions (agent-proposed)

- Presensi diisi karyawan sendiri atau HR atas nama; Supervisor memvalidasi (`D-53`).
- `[USULAN]` Lembur yang tidak punya nomor SPL ditolak saat disimpan (makalah UC-GJ-02, alur alternatif).
- `[USULAN]` Satu presensi dan satu pengajuan lembur per karyawan per tanggal.

## Rejected alternatives

- Presensi tanpa akun dan tanpa HR (mis. kiosk tanpa login): tidak disebut sumber; ditolak sampai ada keputusan baru.
- Validasi presensi oleh karyawan sendiri: ditolak `D-48`.

## Next step

Tidak ada pertanyaan terbuka. Daftar `[USULAN-AGEN]` (P-02, P-03, P-04 bagian pembulatan jam, P-05, P-06, P-07, P-08, P-09) sudah disahkan `D-58` (tingkat item). Verdict tetap `Blocked` karena dependensi (`GJ-001`, `FND-004`, gate fondasi, `FND-007`) belum `done`.
