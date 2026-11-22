# GJ-005 — Diskusi

## Konteks

Track GJ-C. Draft payroll (GJ-004) diperiksa Akuntansi, lalu disetujui Direksi dan dikunci. Di `backlog.md` item ini `specified`, depends on `GJ-004` dan `FND-004` (approval berjenjang).

Diperbarui 2026-11-22 setelah `D-37`, `D-44` (5), `D-46`, `D-48`, `D-49`, dan `D-51(c)`. `D-49` menetapkan jurnal akrual saat payroll disetujui Direksi. Itu mengubah sisi GJ-005: persetujuan memicu jurnal, dan jurnal dibuat lewat service core (`GJ-007`).

Sumber: `analisis-sia.md` §6.9 langkah 36–37, §8.1 [SUMBER] "Direksi mengunci draft saat menyetujui", §8.3; makalah UC-GJ-06 dan UC-GJ-07.

## Raw request

Daftar backlog: "Periksa & setujui payroll" (track GJ-C, level 5).

## Actor / consumer

- Akuntansi: memeriksa angka dan rincian draft (`D-33`; `D-46` DIPERIKSA).
- Finance: cek dana dan bayar di GJ-006. Bukan status di item ini (R-01, R-02).
- Direksi: menyetujui dan mengunci (`D-33`, `D-46` DISETUJUI). Dapat mengembalikan draft (lihat R-03).
- HR: menghitung draft (GJ-004). Tidak boleh memeriksa atau menyetujui draft yang dihitungnya (`D-48`, AC-09).

## Problem

Angka payroll yang belum diperiksa tidak boleh dibayar. Tanpa kunci setelah disetujui, angka bisa berubah setelah Direksi melihatnya.

## Desired outcome

Draft diperiksa oleh Akuntansi, disetujui oleh Direksi, lalu dikunci. Persetujuan membuat jurnal akrual. Draft yang sudah dikunci tidak bisa diubah diam-diam.

## Known constraints

- §8.1 [SUMBER]: Direksi mengunci draft saat menyetujui.
- `D-33`: Accounting memeriksa angka; Direksi menyetujui. Finance cek dana dan bayar.
- `D-37` dan `D-51(c)`: satu mesin approval di FND-004; payroll memakai satu level Direksi.
- `D-46`: `DIPERIKSA`, `DISETUJUI`, `REVISI`, `DRAFT_TERHITUNG`.
- `D-48`: alasan wajib saat menolak atau mengembalikan; pemohon tidak boleh menyetujui dokumennya.
- `D-49`: jurnal akrual saat DISETUJUI (Dr beban / Cr utang gaji); pembayaran dijurnal terpisah.
- `D-43` dan `D-44` (5): jurnal tidak bisa diubah; koreksi lewat jurnal pembalik; periode akuntansi tertutup menolak jurnal baru.
- `D-35`: koreksi lewat jurnal pembalik.
- `D-08`: transisi tercatat di `riwayat_status`.
- `D-47`: tidak ada status baru.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| R-01 | Pemeriksaan dua tahap (Akuntansi periksa angka, Finance cek dana) apakah diterima? | Menentukan jumlah tahap dan siapa pemilik status `DIPERIKSA`. | Pengguna | Terjawab — D-46: status DIPERIKSA hanya oleh Accounting; cek dana Finance terjadi sebelum transfer, bukan status. D-33: periksa angka oleh Accounting; cek dana dan bayar oleh Finance |
| R-02 | Apakah pemeriksaan Finance (cek dana) adalah tahap status atau pemeriksaan di luar sistem? | Menentukan apakah ada status yang perlu dibuat. | Pengguna | Terjawab — D-46: cek dana bukan status di state machine; D-33: cek dana dan bayar oleh Finance. Jalur "dana tidak cukup, tunda dan beri tahu manajemen" hanya ada di catatan diagram dan tidak dibuat sebagai status |
| R-03 | Apakah draft bisa dikembalikan ke HR (ke `DRAFT_TERHITUNG`) saat diperiksa atau disetujui? Siapa yang boleh mengembalikan, dan apakah alasan wajib? | Status tolak belum ada di sumber. | Pengguna | Terjawab — D-46 (DIPERIKSA → REVISI → DRAFT_TERHITUNG) + D-48 (alasan wajib). [USULAN-AGEN]: Accounting dan Direksi boleh mengembalikan dengan alasan wajib. Alasan: makalah UC-GJ-06 dan UC-GJ-07 memuat keduanya; state machine hanya memuat satu jalur |
| R-04 | Apakah nominal tertentu butuh tingkat persetujuan lebih dari satu (`aturan_approval`, C3 "approval bertingkat nominal")? | Menentukan apakah GJ-005 memakai mesin approval `FND-004` dengan ambang. | Pengguna | Terjawab — D-37 (satu mesin, GJ-005 hanya mengisi aturan) + D-51(c): seed payroll = satu level Direksi untuk semua nominal. Ambang nominal lain ditunda ke data bisnis |
| R-05 | Apa yang dikunci saat `DISETUJUI`: seluruh draft dan rincian, atau hanya status? Apakah ada prosedur buka kunci, dan siapa yang boleh? | Gerbang 4 `EPIC-GJ` bergantung pada ini. | Pengguna | Terjawab — D-48 + D-35: setelah jurnal akrual diposting, koreksi hanya lewat jurnal pembalik dan status tidak mundur. [USULAN-AGEN]: tidak ada buka kunci draft di versi awal; koreksi angka setelah DISETUJUI ditangani lewat jurnal pembalik dan komponen koreksi di periode berikutnya |
| R-06 | Gerbang 4 `EPIC-GJ` menyebut "payroll periode yang sudah ditutup". Apakah "ditutup" berarti `DISETUJUI`, atau `DIPOSTING` (`GJ-007`)? | Menentukan kapan perubahan tarif tidak lagi boleh mengubah angka. | Pengguna | Terjawab — [USULAN-AGEN]: "ditutup" untuk payroll berarti `DISETUJUI` (kunci otomatis, risiko EPIC-GJ). Istilah "periode ditutup" untuk presensi tetap `REKAP` (`D-47` c). Alasan: `EPIC-GJ` menulis "kunci otomatis saat GJ-005 disetujui" |
| R-07 | Hubungan kunci payroll dan tutup buku (§8.3): payroll bisa dibayar di periode akuntansi berikutnya. Apakah kunci payroll tidak bergantung pada `periode_akuntansi`? | Dibahas di §8.3 sebagai `[USULAN]`. | Tech lead | Terjawab — [USULAN-AGEN]: kunci payroll tidak bergantung pada tutup buku. Namun persetujuan ditolak bila periode akuntansi tempat jurnal akrual dibuat sudah tertutup (`D-43`, `D-44` 5). Alasan: jurnal akrual harus masuk periode akuntansi yang terbuka |
| R-08 | Siapa yang boleh melihat draft sebelum disetujui? Rincian per karyawan siapa yang boleh? | DoR bersyarat data pribadi. | Pengguna | Terjawab — D-33 (Accounting memeriksa rincian; Direksi ringkasan total) + [USULAN-AGEN]: HR membaca rincian; Direksi tidak membaca rincian per karyawan. Alasan: sama dengan GJ-004 P-13 |
| R-09 | Apakah status `DIPERIKSA` atau `DISETUJUI` punya jejak selain `riwayat_status` (misal catatan pemeriksa)? | Syarat jejak DoR bersyarat. | Pengguna | Terjawab — makalah UC-GJ-06 ("mencatat hasil pemeriksaan") dan UC-GJ-07 ("mencatat log persetujuan"). [USULAN-AGEN]: catatan opsional tersimpan di baris `riwayat_status`; alasan wajib untuk `REVISI` (`D-48`) |

## Pertentangan sumber vs keputusan

- Makalah §4.1.3 dan UC-GJ-06 memberi Finance peran memeriksa draf payroll. D-46 (DIPERIKSA hanya Accounting) dan D-33 (Finance cek dana dan bayar) menang.
- Makalah memakai status "Terverifikasi Accounting", "Approved", dan "Ditolak"; D-46 mengunci "DIPERIKSA", "DISETUJUI", dan "REVISI". Keputusan terkunci menang.
- Makalah UC-GJ-07 memuat pengembalian oleh Direksi ke Accounting dengan status "Ditolak". Tidak dipakai sebagai status; pengembalian menjadi `REVISI` (R-03).
- EPIC-GJ gerbang 4 memakai kata "ditutup", sedangkan state machine memakai "periode ditutup" untuk tahap presensi. Istilah dipisah (R-06).
- `D-49` menempatkan jurnal akrual saat DISETUJUI, sedangkan `D-46` menempatkan `DIPOSTING` setelah `DIBAYAR`. Ditangani di GJ-007 (J-03): jurnal akrual saat DISETUJUI; `DIPOSTING` dipakai untuk jurnal pembayaran. Dicatat sebagai pertentangan untuk koordinator.

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-33 | Matriks izin v0 disahkan sebagai baseline | 2026-11-22 | Keputusan terkunci | Accounting memeriksa angka; Finance cek dana dan bayar; Direksi menyetujui. |
| D-37 | Satu mesin approval berjenjang di FND-004 | 2026-11-22 | Keputusan terkunci | GJ-005 hanya mengisi aturan. |
| D-44 | Saat pengakuan; tutup buku lewat jurnal pembalik | 2026-11-22 | Keputusan terkunci | Koreksi periode tertutup lewat jurnal pembalik (butir 5). |
| D-46 | Daftar status dokumen mengikuti state machine | 2026-11-22 | Keputusan terkunci | DIPERIKSA, DISETUJUI, REVISI, DRAFT_TERHITUNG. |
| D-48 | Pembatalan, revisi, approval | 2026-11-22 | Keputusan terkunci | Alasan wajib; penghitung tidak menyetujui hasilnya. |
| D-49 | Jurnal gaji akrual saat disetujui Direksi | 2026-11-22 | Keputusan terkunci | Persetujuan memicu jurnal akrual (GJ-007). |
| D-51 | Parameter dan rumus (c) | 2026-11-22 | Keputusan terkunci | Satu level Direksi. |

## Assumptions (agent-proposed)

- Akuntansi memeriksa angka; Direksi menyetujui dan mengunci (`D-33`, `D-46`).
- `[USULAN-AGEN]` Kunci terjadi otomatis saat `DISETUJUI` (dari risiko EPIC-GJ).
- `[USULAN-AGEN]` Persetujuan dan jurnal akrual terjadi dalam satu transaksi (`D-43`).

## Rejected alternatives

- Direksi memeriksa angka: bertentangan dengan matriks (Direksi hanya menyetujui).
- Persetujuan oleh HR yang menghitung: ditolak `D-48` (penghitung tidak menyetujui hasilnya).
- Buka kunci draft `DISETUJUI` di versi awal: ditolak sampai ada kebutuhan (lihat R-05).

## Next step

Tidak ada pertanyaan terbuka. Daftar `[USULAN-AGEN]` (R-03, R-05, R-06, R-07, R-08, R-09) sudah disahkan `D-58` (tingkat item). Verdict tetap `Blocked` karena `GJ-004` dan `FND-004` belum `done`.
