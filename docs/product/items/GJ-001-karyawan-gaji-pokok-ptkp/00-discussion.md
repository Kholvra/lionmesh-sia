# GJ-001 — Diskusi

## Konteks

Siklus Penggajian (`EPIC-GJ`, track GJ-A master) membutuhkan data karyawan sebelum presensi, payroll, atau slip bisa dihitung. Di `backlog.md`, `GJ-001` berstatus `specified` dengan `depends on` `FND-003` (autentikasi dan 12 peran staf dengan RLS). Item ini belum boleh `ready` karena gate fondasi `FND-001`–`FND-006` belum selesai (hanya `FND-001` yang `done`).

Diperbarui 2026-11-22 setelah keputusan `D-47`–`D-53`. Pertanyaan yang sebelumnya terbuka sudah dijawab; setiap jawaban memberi tanda sumbernya.

Sumber: `reference/analisis-sia.md` §5.5 (fitur GJ-1), §7.2 (tabel `karyawan`, `gaji_pokok_histori`), §8.1 (NIK unik); makalah penggajian §4.1.9 aturan 1 dan UC-GJ-01.

## Raw request

Daftar backlog: "Karyawan, gaji pokok, PTKP" (track GJ-A master, level 1).

## Actor / consumer

- HR: kelola data karyawan dan gaji pokok (`D-33`).
- Karyawan: peran self-service dengan akun opsional (`D-53`). Tidak membaca data karyawan mana pun (lihat AC-13 di `02`).
- Accounting dan Finance: pembaca data pribadi tertentu (lihat P-06 dan tabel "Siapa boleh melihat" di `01`).
- Direksi dan Supervisor Lapangan: tidak membaca data pribadi karyawan di item ini.

## Problem

Tanpa master karyawan dan histori gaji pokok yang terpisah dari kolom tunggal, payroll tidak punya dasar hitung, dan perubahan gaji akan menimpa angka periode sebelumnya.

## Desired outcome

HR dapat mencatat karyawan dengan NIK unik, mencatat gaji pokok dengan tanggal berlaku, dan melihat riwayatnya. Perubahan gaji tidak mengubah histori lama.

## Known constraints

- `D-53`: karyawan adalah peran ke-13 self-service. Akun karyawan opsional. Karyawan tanpa akun tetap berupa data.
- `D-19`: komponen payroll dihitung dari tabel tarif berversi. Kategori PTKP diambil dari tabel, bukan dari kode.
- `D-51(d)`: NIK 16 digit numerik unik. Rekening terdiri dari nama bank, nomor (digit), dan nama pemilik; panjang tidak divalidasi ketat.
- `D-50`: master dinonaktifkan, bukan dihapus. Master nonaktif tidak bisa dipilih untuk dokumen baru.
- `D-25` / `ARCH-08`: modul tidak membaca tabel modul lain. Tabel `karyawan` dimiliki `core/` (`D-31`).
- `D-47`: tidak ada status dokumen baru. Berlaku atau digantikannya entri gaji diturunkan dari tanggal, bukan disimpan sebagai status.
- Data pribadi (NIK, rekening, gaji, PTKP): berlaku DoR bersyarat.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| P-01 | Tabel `karyawan` dan `gaji_pokok_histori` milik core atau milik modul Penggajian? Backlog menaruhnya di track GJ-A; analisis §7.2 mencantumkan `karyawan` di tabel inti core dan "dipakai juga oleh payroll". | Menentukan jalur akses dari GJ-002..GJ-007 (`ARCH-08`) dan apakah core perlu service karyawan. | Tech lead | Terjawab — D-31: tabel `karyawan` dimiliki `core/`; modul penggajian memiliki layar dan aturan |
| P-02 | Format NIK dan aturan panjang/karakter. Sumber hanya menyebut "NIK unik". | Validasi input dan pesan error. | Pengguna | Terjawab — D-51(d): NIK 16 digit numerik dan unik; pesan menyebut format yang diharapkan |
| P-03 | Daftar kategori PTKP dan nilainya. Sumber tidak memuatnya. Kategori diambil dari tabel TER (`tarif_ter`) atau tabel PTKP terpisah? Analisis menulis `tarif_ter` (§7.2) dan `tarif_ptkp` (§9.1 G7). | Pilihan PTKP di form hanya boleh berisi kategori dari tabel. Epic mencatat risiko "kategori PTKP salah isi" saat seed. | Pengguna / tech lead | Terjawab — D-19: kategori PTKP dari tabel berversi; D-51: mekanisme berversi; nilai diverifikasi dan dikutip sumbernya saat implementasi |
| P-04 | Aturan tanggal berlaku gaji pokok: apakah tanggal boleh mundur, apakah dua entri boleh berlaku pada tanggal sama, dan bagaimana koreksi entri yang salah input. | Histori yang bisa ditimpa melanggar "perubahan gaji tidak menimpa masa lalu". | Pengguna | Terjawab — [USULAN-AGEN]: tanggal berlaku boleh mundur; dua entri pada tanggal sama ditolak; koreksi lewat entri baru. Alasan: menjaga histori tanpa menimpa (D-19, gerbang 4 EPIC-GJ) |
| P-05 | Status karyawan (aktif, nonaktif, keluar) dan dampaknya ke payroll. Sumber tidak menyebutnya. | Karyawan keluar di tengah periode belum punya aturan. | Pengguna | Terjawab — D-50: master dinonaktifkan dan tidak bisa dipilih untuk dokumen baru; D-51(b): karyawan masuk atau keluar di tengah periode diprorata (perhitungan di GJ-004) |
| P-06 | Siapa boleh melihat NIK, rekening, gaji pokok, dan PTKP? Matriks §3.3 hanya menyebut "Kelola data karyawan: HR" dan "Lihat laporan payroll: HR, Accounting, Direksi". | Syarat DoR bersyarat "data pribadi". Tanpa ini, AC izin tidak bisa ditulis. | Pengguna | Terjawab — [USULAN-AGEN] (sebagian D-33): tulis HR; baca NIK, gaji pokok, PTKP: HR dan Accounting; baca rekening dan nominal bersih: HR dan Finance. Alasan: matriks belum punya baris ini, dan Finance butuh rekening untuk transfer (makalah UC-GJ-08) |
| P-07 | Apakah master departemen dan jabatan (§7.2, tabel core tanpa rincian) masuk GJ-001 atau item core lain? | Menentukan cakupan GJ-001 dan kepemilikan tabel. | Tech lead | Terjawab — [USULAN-AGEN]: departemen dan jabatan adalah master di `core/` bersama karyawan, dinonaktifkan bukan dihapus (D-50). Alasan: GJ-003 memakai departemen untuk lingkup Supervisor |
| P-08 | Apakah GJ-001 menjadi item perilaku pertama yang menambah test runner (`FND-001` menunda test ke item perilaku pertama)? | Menentukan bukti AC di 02 bisa otomatis atau masih manual. | Tech lead | Terjawab — [USULAN-AGEN]: test runner ditambah oleh item perilaku pertama yang selesai lebih dulu, tidak dikunci di GJ-001. Alasan: FND-001 menunda test ke item perilaku pertama dan urutan lintas siklus belum ditetapkan |
| P-09 | Apakah rekening bank karyawan punya format dan validasi tertentu? | Dipakai GJ-006 untuk transfer. | Pengguna | Terjawab — D-51(d): rekening = nama bank + nomor (digit) + nama pemilik; panjang tidak divalidasi ketat |
| P-10 | Apakah GJ-001 menambah primitive UI baru (tabel, form), sehingga menunggu `FND-007`? | Gate per `backlog.md` aturan 1. | Tech lead | Terjawab — [USULAN-AGEN]: ya, tabel dan form memakai primitive `FND-007`; item menunggu `FND-007`. Alasan: backlog aturan 1 dan D-54 (gate item modul) |

## Pertentangan sumber vs keputusan

- Makalah (tabel keputusan 14, 16, 17) menyebut `gaji_pokok_histori`, `tarif_ptkp`, dan `tarif_bpjs` "tidak dipakai" sebagai tabel; gaji pokok disimpan sebagai kolom karyawan dan snapshot. Bertentangan dengan `D-19` dan EPIC-GJ (histori, tarif berversi). Keputusan terkunci menang: histori dan tabel berversi dipakai.
- `D-18` (karyawan tidak punya akun) digantikan `D-53` (karyawan peran self-service dengan akun opsional). Teks di `EPIC-GJ.md` masih menyebut `D-18`; file itu di luar folder item ini dan belum diubah.

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-18 | Karyawan adalah data, bukan pengguna. | 2026-11-17 | Pengguna | `superseded` oleh `D-53`. Akun karyawan kini opsional. |
| D-19 | Komponen payroll dari tabel tarif berversi. | 2026-11-17 | Pengguna | GJ-001 hanya menyimpan gaji pokok dan PTKP sebagai data; tarif ada di GJ-004. |
| D-25 | Modul tidak membaca tabel modul lain. | 2026-11-17 | Pengguna | Data karyawan dibaca lewat service core. |
| D-31 | Tabel domain bersama dimiliki `core/`; modul memiliki layar dan aturan. | 2026-11-22 | Keputusan terkunci | Tabel `karyawan` milik core; P-01 terjawab. |
| D-33 | Matriks izin v0 disahkan sebagai baseline. | 2026-11-22 | Keputusan terkunci | HR kelola data karyawan; laporan payroll HR, Accounting, Direksi. |
| D-50 | Master dinonaktifkan, bukan dihapus. | 2026-11-22 | Keputusan terkunci | Status karyawan nonaktif (P-05). |
| D-51 | Parameter dan rumus (NIK, rekening, prorata). | 2026-11-22 | Keputusan terkunci | P-02, P-09 terjawab. |
| D-53 | Karyawan peran self-service, akun opsional. | 2026-11-22 | Keputusan terkunci | Karyawan tidak membaca data karyawan lain (AC-13). |

## Assumptions (agent-proposed)

- `[USULAN]` Entri histori gaji pokok tidak diubah atau dihapus setelah disimpan; koreksi dibuat sebagai entri baru.
- Matriks izin v0 sudah disahkan sebagai baseline (`D-33`).

## Rejected alternatives

- Kolom `gaji_pokok` tunggal di tabel karyawan: ditolak oleh `EPIC-GJ` (histori, bukan kolom tunggal).
- Akun karyawan yang bisa melihat data karyawan lain: ditolak `D-53`.

## Next step

Tidak ada pertanyaan terbuka. Daftar `[USULAN-AGEN]` (P-04, P-06, P-07, P-08, P-10) sudah disahkan `D-58` (tingkat item). Verdict tetap `Blocked` karena dependensi (`FND-003`, gate fondasi, `FND-007`) belum `done`.
