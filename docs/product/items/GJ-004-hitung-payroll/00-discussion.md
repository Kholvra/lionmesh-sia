# GJ-004 — Diskusi

## Konteks

Track GJ-C (payroll). Hitung draft payroll per periode dari gaji pokok, tunjangan, lembur, potongan ketidakhadiran, BPJS, dan PPh 21. Semua komponen dihitung dari tabel tarif berversi (`D-19`). Di `backlog.md` item ini `specified`, depends on `GJ-003` dan `FND-002`.

Diperbarui 2026-11-22 setelah `D-51` (b, c, d, e), `D-46`, `D-47`, dan `D-48`. Pertanyaan yang sebelumnya terbuka dijawab dengan mekanisme atau keputusan. Tidak ada nilai tarif, persentase, atau batas yang ditulis dari ingatan; semua nilai diverifikasi dan dikutip sumbernya saat implementasi.

Sumber: `analisis-sia.md` §5.5 (GJ-4), §6.9 langkah 35, §7.2, §8.2 #20; makalah §4.1.2, §4.1.5, UC-GJ-05.

## Raw request

Daftar backlog: "Hitung payroll" (track GJ-C, level 4).

## Actor / consumer

- HR: menjalankan hitungan dan mengoreksi komponen dengan alasan (`D-33`).
- Accounting: memeriksa rincian per karyawan di GJ-005.
- Finance: melihat nominal bersih per karyawan untuk transfer (GJ-006).
- Direksi: melihat ringkasan total dan jumlah karyawan di GJ-005.
- Karyawan: tidak terlibat (`D-53`).

## Problem

Tanpa hitungan yang bisa diulang dan dijelaskan, angka gaji tidak bisa dipertanggungjawabkan, dan perubahan tarif bisa mengubah angka periode lama.

## Desired outcome

Draft payroll per karyawan dan total per periode, dihitung dari gaji pokok histori, presensi tervalidasi, lembur, tunjangan, potongan, BPJS, dan PPh 21, dengan rincian komponen yang bisa diaudit. Hitung ulang pada data yang sama menghasilkan angka yang sama (gerbang `EPIC-GJ` nomor 2).

## Known constraints

- `D-19`: seluruh komponen dari tabel tarif berversi. Tidak boleh ada angka tarif di kode.
- `D-51(b)`: dasar hitung lembur dan BPJS = gaji pokok + tunjangan tetap; pembulatan per komponen per karyawan ke rupiah terdekat, selisih ke akun selisih pembulatan; PPh 21 versi awal = TER bulanan; masa pajak terakhir ditandai "perlu penyesuaian tahunan" dengan input manual beralasan; karyawan masuk atau keluar di tengah periode diprorata hari kerja.
- `D-51(c)`: payroll memakai satu level approval (Direksi).
- `D-51(e)`: reject dan rework tidak ada di payroll (hanya produksi).
- `D-46`: `DRAFT_TERHITUNG`; hitung ulang lewat `REVISI`.
- `D-48`: alasan wajib untuk perubahan manual; penghitung tidak menyetujui hasilnya sendiri.
- `D-42`: penghitung gaji tidak boleh membayar gaji (dicek di GJ-006).
- `EPIC-GJ`: PPh 21 memakai lookup TER; gaji pokok dari histori; koreksi manual wajib alasan dan tercatat.
- `D-25` / `ARCH-08`: presensi dan karyawan dibaca lewat service core.
- Data gaji adalah data pribadi (`GJ-001` tabel "Siapa boleh melihat").

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| P-01 | Daftar komponen payroll lengkap: tunjangan tetap, potongan tetap, lembur, BPJS (program dan bagian karyawan atau perusahaan), PPh 21. `komponen_gaji` tidak punya rincian. | Tanpa daftar, total tidak bisa dihitung dengan benar. | Pengguna | Terjawab — [USULAN-AGEN]: daftar awal dari makalah §4.1.5: penambah gaji pokok, tunjangan tetap, tunjangan kehadiran, uang lembur; pengurang potongan ketidakhadiran, BPJS Ketenagakerjaan, BPJS Kesehatan, PPh 21. Nilai dan rumus per komponen mengikuti tabel berversi (`D-19`, `D-51`). Alasan: makalah memuat daftar ini |
| P-02 | Isi dan sumber resmi setiap tabel tarif: `tarif_lembur` (multiplier per golongan; definisi golongan belum ada), `tarif_bpjs` (persentase dan batas upah), `tarif_ter` (kategori PTKP × bruto). Siapa mengisi dan memverifikasi, dan dari sumber apa? | Nilai tidak boleh ditulis oleh pengembang. Epic mencatat risiko "tabel TER salah isi". | Pengguna | Terjawab — D-51: mekanisme berversi; nilai diverifikasi dan dikutip sumbernya saat implementasi. Pengisi: tech lead (seed, `D-33`); validasi jumlah baris dan kategori saat seed (`EPIC-GJ`) |
| P-03 | Basis "bruto" untuk lookup TER: komponen mana yang masuk bruto, dan apakah BPJS dihitung sebelum atau sesudah dasar PPh 21. | Mempengaruhi kategori TER yang dipilih. | Pengguna | Terjawab — [USULAN-AGEN]: bruto = gaji pokok + tunjangan + uang lembur (makalah §4.1.2); potongan ketidakhadiran bukan bagian bruto. Urutan BPJS terhadap dasar PPh 21: mengikuti aturan berversi yang dikutip saat implementasi (D-51). Alasan: makalah memuat daftar bruto |
| P-04 | Aturan pembulatan (per komponen atau total, ke satuan berapa, arah pembulatan). | Syarat reproduksi angka. | Pengguna | Terjawab — D-51(b): pembulatan per komponen per karyawan ke rupiah terdekat; selisih ke akun selisih pembulatan |
| P-05 | Komponen tetap (tunjangan dan potongan) dan cara menambah komponen baru: apakah komponen baru butuh versi tarif juga? | `komponen_gaji` tidak punya rincian. | Pengguna | Terjawab — [USULAN-AGEN]: komponen berparameter (persentase, batas, atau rumus) wajib punya versi tarif (`D-19`); komponen nominal per karyawan mengikuti histori seperti gaji pokok (GJ-001). Alasan: `D-19` menuntut tarif berversi, nominal per karyawan tidak punya tarif |
| P-06 | Karyawan masuk atau keluar di tengah periode: gaji dihitung proporsional, penuh, atau tidak dibayar? | Tidak ada di sumber. | Pengguna | Terjawab — D-51(b): diprorata hari kerja. Hari kerja per periode dari tabel berversi |
| P-07 | Dua kali hitung pada periode yang sama: apakah draft lama ditimpa, atau disimpan sebagai versi? | Menentukan `DRAFT_TERHITUNG` dan syarat reproduksi. | Pengguna | Terjawab — D-46: hitung ulang dari `REVISI` atau `DRAFT_TERHITUNG`. [USULAN-AGEN]: draft lama ditimpa; riwayat perubahan tercatat di `riwayat_status`. Alasan: angka per karyawan tetap satu, reproduksi mudah diuji |
| P-08 | Override manual: mengacu G7 `[DIKUNCI]` yang menyebut "override manual wajib alasan". Siapa yang boleh override, dan apakah override butuh persetujuan lain? | Override bisa membatalkan seluruh hitungan. | Pengguna | Terjawab — D-48 (alasan wajib, tercatat) + [USULAN-AGEN]: override dilakukan HR (penghitung) dengan alasan; tanpa persetujuan tambahan karena Accounting dan Direksi memeriksa draft di GJ-005. Alasan: D-48 dan D-51(c) cukup dengan satu level |
| P-09 | Versi tarif mana yang dipakai untuk periode tertentu: `berlaku_dari` terhadap tanggal periode, atau tanggal lain? | Mencegah tarif berubah diam-diam (`EPIC-GJ` gerbang 4). | Tech lead | Terjawab — [USULAN-AGEN]: versi dipilih dengan `berlaku_dari` ≤ tanggal akhir periode, yang terbaru. Versi yang masuk setelah draft dihitung tidak mengubah draft (AC-05). Alasan: versi berlaku pada akhir periode, dan draft menjadi stabil |
| P-10 | PPh 21 pada bulan koreksi tahunan atau bulan lain yang butuh perlakuan khusus. | Angka bulanan bisa salah tanpa aturan ini. | Pengguna | Terjawab — D-51(b): masa pajak terakhir ditandai "perlu penyesuaian tahunan" dengan input manual beralasan. Penyesuaian tahunan sendiri di luar versi awal |
| P-11 | Tarif lembur dan BPJS dihitung dari gaji pokok saja, atau dari gaji pokok plus komponen tetap? | Dasar hitung. | Pengguna | Terjawab — D-51(b): dasar lembur dan BPJS = gaji pokok + tunjangan tetap. [USULAN-AGEN]: tunjangan kehadiran dianggap variabel, sehingga tidak masuk dasar. Alasan: makalah menyebutnya terkait kehadiran |
| P-12 | Apakah GJ-004 menambah primitive UI baru? | Gate `FND-007`. | Tech lead | Terjawab — [USULAN-AGEN]: ya, tabel rincian draft memakai primitive `FND-007`; item menunggu `FND-007`. Alasan: backlog aturan 1 dan DoR butir 8 |
| P-13 | Data gaji adalah data pribadi. Siapa yang boleh melihat draft per karyawan dan total? | DoR bersyarat data pribadi. | Pengguna | Terjawab — D-33 (HR menghitung; Accounting memeriksa rincian; Direksi melihat ringkasan total) + [USULAN-AGEN]: Finance melihat nominal bersih per karyawan untuk transfer; Direksi tidak melihat rincian per karyawan |

## Pertentangan sumber vs keputusan

- Makalah keputusan tabel menyebut `tarif_lembur`, `tarif_bpjs`, dan `tarif_ptkp` "tidak dipakai" sebagai tabel, dan PPh 21 disebut "estimasi". Bertentangan dengan `D-19` (tabel tarif berversi, PPh 21 lewat lookup TER). Keputusan terkunci menang.
- Makalah menamai draft "Dihitung"; `D-46` mengunci `DRAFT_TERHITUNG`. Keputusan terkunci menang.
- Makalah UC-GJ-05 menyebut "perhitungan dapat diulang sebelum draft disimpan". `D-46` mengizinkan hitung ulang setelah draft tersimpan. Diikuti `D-46`.

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-19 | Komponen payroll dari tabel tarif berversi; PPh 21 lewat lookup TER | 2026-11-17 | Pengguna | Tidak ada tarif di kode. P-02 menjadi syarat implementasi. |
| D-33 | Matriks izin v0 disahkan sebagai baseline | 2026-11-22 | Keputusan terkunci | HR menghitung draft; Accounting memeriksa; Direksi menyetujui. |
| D-41 | COA dasar mengikuti rancangan proses bisnis | 2026-11-22 | Keputusan terkunci | Akun peran utang gaji, beban tenaga kerja, beban gaji administrasi, dan selisih pembulatan (nomor di FND-006). |
| D-43 | Aturan jurnal | 2026-11-22 | Keputusan terkunci | Draft tidak membuat jurnal. Jurnal akrual dibuat saat DISETUJUI (GJ-007). |
| D-46 | Daftar status dokumen mengikuti state machine | 2026-11-22 | Keputusan terkunci | `DRAFT_TERHITUNG`, `REVISI`. |
| D-48 | Alasan wajib untuk perubahan manual | 2026-11-22 | Keputusan terkunci | Override P-08. |
| D-51 | Parameter dan rumus (b) | 2026-11-22 | Keputusan terkunci | Dasar hitung, pembulatan, PPh 21 TER, prorata. |

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` Hitungan berjalan pada satu periode, hanya untuk periode `TERVALIDASI` (`D-46`).
- `[USULAN-AGEN]` Hasil hitungan disimpan dengan rincian komponen per karyawan (agar bisa diaudit).
- `[USULAN]` Ukuran `L` (`size`) karena mencakup lembur, BPJS, TER, komponen, histori, prorata, override, dan reproduksi. Bila ukuran ini terlalu besar untuk satu track, pemecahan adalah keputusan manusia (lihat 03 Risiko).

## Rejected alternatives

- Tarif sebagai konstanta di kode: ditolak `D-19`.
- Bracket progresif bulanan untuk PPh 21: ditolak `EPIC-GJ`.
- Menyimpan setiap hitung ulang sebagai versi draft: ditolak untuk versi awal (P-07, `[USULAN-AGEN]`).

## Next step

Tidak ada pertanyaan terbuka. Daftar `[USULAN-AGEN]` (P-01, P-03 bagian urutan BPJS, P-05, P-07, P-08, P-09, P-12, P-13) sudah disahkan `D-58` (tingkat item). Verdict tetap `Blocked` karena `GJ-003` dan `FND-002` belum `done`.
