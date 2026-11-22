# GJ-006 — Diskusi

## Konteks

Track GJ-D (bayar). Setelah draft disetujui dan dikunci (GJ-005), Finance mentransfer gaji, status pembayaran per karyawan dicatat, dan HR mencetak slip untuk diserahkan. Di `backlog.md` item ini `specified`, depends on `GJ-005` dan `FND-006` (ledger).

Diperbarui 2026-11-22 setelah `D-47`, `D-49`, dan `D-53`. Status pembayaran memakai nama dari `D-46` (`DIBAYAR`, `GAGAL_TRANSFER`). Status `PARSIAL` dan `SLIP` yang sebelumnya `[USULAN]` tidak dipakai (`D-47`: tidak ada status baru).

Sumber: `analisis-sia.md` §5.5 (GJ-6), §6.9 langkah 38–39, §8.1 [SUMBER] (bukti transfer disimpan Finance; transfer gagal ditandai); makalah UC-GJ-08, UC-GJ-09, dan KF-GJ-05.

## Raw request

Daftar backlog: "Pembayaran gaji & slip" (track GJ-D, level 6).

## Actor / consumer

- Finance: mencatat dan mengeksekusi transfer, menyimpan bukti (`D-33`).
- HR: menerbitkan dan mencetak slip (`D-33`, `D-53`). Tidak boleh membayar gaji yang dihitungnya (`D-42`).
- Accounting: membaca status dan bukti pembayaran; jurnal di GJ-007.
- Karyawan: menerima slip cetak secara fisik; tidak melihat slip digital (`D-53`).

## Problem

Gaji yang sudah disetujui harus benar-benar dibayar, dan pembayaran gagal harus terlihat. Slip harus bisa dicetak dan diserahkan, tanpa membuka akses digital bagi karyawan.

## Desired outcome

Setiap karyawan pada draft `DISETUJUI` punya status pembayaran (`DIBAYAR` atau `GAGAL_TRANSFER`). Bukti transfer tersimpan. Slip cetak tersedia per karyawan per periode.

## Known constraints

- `D-53`: slip tetap diterbitkan HR dan dicetak; tidak ada portal slip. Karyawan tidak membaca slip digital.
- `D-49`: transfer gagal boleh diulang dengan alasan tercatat; pembayaran dijurnal terpisah (GJ-007).
- `D-42`: penghitung gaji tidak boleh membayar gaji.
- `D-46`: `DIBAYAR`, `GAGAL_TRANSFER`, `DIPOSTING` (setelah jurnal pembayaran).
- `D-47`: tidak ada status baru.
- `D-33`: Finance cek dana dan bayar; HR terbitkan slip.
- §8.1 [SUMBER]: bukti transfer disimpan Finance; transfer gagal atau parsial ditandai.
- `D-08`: status pembayaran tercatat di `riwayat_status`.
- `D-51(d)`: rekening = nama bank + nomor + nama pemilik.
- `D-39`, `D-52`: format bank dan berkas transfer dikonfirmasi lewat `DISC-002` bila dibutuhkan (lihat T-01). Item ini tidak punya dependensi ke `DISC-002` di backlog.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| T-01 | Metode pembayaran gaji: transfer manual satu per satu, berkas batch, atau integrasi bank? | Menentukan apakah ada impor atau ekspor berkas dan validasinya. | Pengguna | Terjawab — [USULAN-AGEN]: transfer dalam satu batch per periode, dengan daftar transfer berkas CSV generik (kolom rekening dan nominal). Bentuk berkas sesuai bank dikunci saat `DISC-002` bila bank meminta. Alasan: makalah UC-GJ-08 menyebut batch; integrasi bank belum dikonfirmasi |
| T-02 | Status pembayaran per karyawan: nilai dan transisi. Apa arti "parsial" untuk gaji? | Syarat DoR butir 3. | Pengguna | Terjawab — D-46 + [USULAN-AGEN]: status per karyawan memakai `DIBAYAR` atau `GAGAL_TRANSFER`. Periode `DIBAYAR` hanya bila semua karyawan `DIBAYAR`; bila ada yang gagal, periode `GAGAL_TRANSFER`. Tidak ada status `PARSIAL` (`D-47`). Alasan: nama dari state machine, tanpa status baru |
| T-03 | Pembayaran gagal: bisa dicoba ulang? Berapa kali, dan apakah perlu alasan? | Mempengaruhi status dan jurnal. | Pengguna | Terjawab — D-49: transfer gagal boleh diulang dengan alasan tercatat. [USULAN-AGEN]: tanpa batas jumlah percobaan; setiap percobaan ulang wajib alasan. Alasan: D-49 tidak membatasi jumlah |
| T-04 | Bukti transfer: format, jumlah per karyawan, dan siapa yang mengunggah. | Syarat jejak Finance. | Pengguna | Terjawab — [USULAN-AGEN]: satu bukti per batch transfer (berkas), dengan referensi per karyawan di baris detail; diunggah Finance. Format berkas tidak divalidasi selain tipe dan ukuran. Alasan: makalah UC-GJ-08 dan §8.1 [SUMBER] |
| T-05 | Isi slip: komponen apa saja yang tampil? | Tanpa ini slip tidak bisa diverifikasi. | Pengguna | Terjawab — [USULAN-AGEN]: slip memuat komponen yang sama dengan draft GJ-004 (penambah, pengurang, nominal bersih) untuk satu karyawan. Alasan: makalah dokumen 8 memuat rincian hak dan potongan |
| T-06 | Format cetak slip (ukuran kertas, halaman per karyawan, atau gabungan). | Syarat cetak. | Pengguna | Terjawab — [USULAN-AGEN]: satu halaman per karyawan, dicetak satu per satu atau sebagai berkas PDF gabungan per periode. Alasan: makalah KF-GJ-05 menyebut slip individual |
| T-07 | Siapa yang mencetak dan menyerahkan slip: HR atau Finance? | Menentukan izin cetak. | Pengguna | Terjawab — D-33: "Terbitkan slip" adalah HR; D-53: slip tetap diterbitkan HR dan dicetak |
| T-08 | Cetak ulang atau revisi slip setelah diserahkan: apakah slip baru dibuat, dan siapa yang menyetujui? | Menentukan slip sebagai dokumen. | Pengguna | Terjawab — [USULAN-AGEN]: slip yang terbit tidak diubah; koreksi lewat slip pengganti yang dibuat HR dengan alasan wajib, tanpa persetujuan tambahan karena angka berasal dari payroll `DISETUJUI`. Alasan: makalah UC-GJ-09 dan D-43 (tidak mengubah yang sudah jadi) |
| T-09 | Rekening bank karyawan dan nominal transfer: siapa yang boleh melihat? | Data pribadi, DoR bersyarat. | Pengguna | Terjawab — D-33 + [USULAN-AGEN]: rekening dibaca HR dan Finance; nominal bersih per karyawan dibaca Finance dan Accounting; Direksi tidak. Alasan: Finance butuh rekening dan nominal untuk transfer |
| T-10 | Apakah pembayaran hanya boleh dilakukan untuk seluruh periode sekaligus, atau per karyawan? | Menentukan urutan status. | Pengguna | Terjawab — [USULAN-AGEN]: transfer dikirim sebagai satu batch serentak (makalah UC-GJ-08), status dicatat per karyawan; karyawan yang sudah `DIBAYAR` tidak masuk batch ulang (`D-49`, INV-02). Alasan: makalah UC-GJ-08 dan keputusan tabel detail pembayaran |
| T-11 | Apakah GJ-006 menambah primitive UI baru? | Gate `FND-007`. | Tech lead | Terjawab — [USULAN-AGEN]: ya, tabel batch dan daftar slip memakai primitive `FND-007`; item menunggu `FND-007`. Alasan: backlog aturan 1 dan DoR butir 8 |

## Pertentangan sumber vs keputusan

- Makalah UC-GJ-09 menawarkan slip "unduh, cetak, atau email"; `D-53` mengunci slip diterbitkan HR dan dicetak. Keputusan terkunci menang: distribusi email tidak masuk cakupan.
- Diagram GJ09 memberi Finance peran menerbitkan slip; makalah dan `D-33` memberi HR. `D-33` menang.
- Makalah memakai "GAGAL", "Paid", dan "Approved"; `D-46` mengunci `GAGAL_TRANSFER` dan `DIBAYAR`. `D-46` menang.
- Makalah dan diagram GJ08 mencatat status per karyawan; `D-46` mencatat periode. Dipadukan di T-02 tanpa status baru.
- Makalah dan `D-49` menempatkan pembayaran dijurnal; `D-46` menempatkan `DIPOSTING` setelah `DIBAYAR`. Lihat GJ-007 J-03.

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-33 | Matriks izin v0 disahkan sebagai baseline | 2026-11-22 | Keputusan terkunci | Finance cek dana dan bayar; HR terbitkan slip. |
| D-41 | COA dasar mengikuti rancangan proses bisnis | 2026-11-22 | Keputusan terkunci | Akun peran kas bank dan utang gaji (nomor di FND-006). |
| D-42 | Pemisahan tugas: penghitung gaji tidak boleh membayar gaji | 2026-11-22 | Keputusan terkunci | Pencatat pembayaran bukan penghitung draft (AC-11). |
| D-46 | Daftar status dokumen mengikuti state machine | 2026-11-22 | Keputusan terkunci | `DIBAYAR`, `GAGAL_TRANSFER`. |
| D-49 | Transfer gagal boleh diulang dengan alasan; pembayaran dijurnal terpisah | 2026-11-22 | Keputusan terkunci | T-03 dan jurnal pembayaran (GJ-007). |
| D-53 | Slip dicetak HR; karyawan self-service | 2026-11-22 | Keputusan terkunci | Tidak ada slip digital untuk karyawan. |

## Assumptions (agent-proposed)

- `[USULAN]` Pembayaran hanya dimulai untuk draft `DISETUJUI` (GJ-005).
- HR menerbitkan dan mencetak slip (`D-33`).

## Rejected alternatives

- Slip digital untuk karyawan lewat akun: ditolak `D-53`.
- Status `PARSIAL` dan `SLIP` sebagai status baru: ditolak `D-47`.

## Next step

Tidak ada pertanyaan terbuka. Daftar `[USULAN-AGEN]` (T-01, T-02, T-03 bagian batas jumlah, T-04, T-05, T-06, T-08, T-09, T-10, T-11) sudah disahkan `D-58` (tingkat item). Verdict tetap `Blocked` karena `GJ-005` dan `FND-006` belum `done`.
