# GJ-004 — Acceptance Criteria

Diuji lewat UI sebagai HR, dengan periode uji yang sudah `TERVALIDASI` (GJ-003). Nilai yang diharapkan dihitung ulang secara manual dari tabel tarif yang sama dan dicatat di 05, bukan ditulis di 02. Contoh di bawah memakai placeholder (`[NILAI-TABEL]`, `[NOMINAL]`), bukan angka tarif.

## AC-01 — Draft dihitung dari tabel tarif

- Given periode uji `TERVALIDASI`, karyawan dengan gaji pokok histori, presensi tervalidasi, lembur, dan tabel tarif berversi aktif
- When HR menjalankan hitung draft
- Then draft berstatus `DRAFT_TERHITUNG`; setiap komponen per karyawan sama dengan hitungan manual dari tabel yang sama `[NOMINAL]`

## AC-02 — Hitung ulang menghasilkan angka sama

- Given draft sudah dihitung untuk periode uji
- When HR menghitung ulang tanpa mengubah data sumber
- Then setiap angka per karyawan dan total identik dengan hitungan pertama

## AC-03 — Periode belum tervalidasi ditolak

- Given periode berstatus `REKAP` atau `TERBUKA`
- When HR mencoba menghitung draft
- Then aksi ditolak dengan pesan bahwa validasi supervisor belum dilakukan

## AC-04 — Tarif tidak ada ditolak

- Given tidak ada versi tarif dengan `berlaku_dari` ≤ tanggal akhir periode (P-09)
- When HR menghitung draft
- Then aksi ditolak dan pesan menyebut tabel dan periode yang tidak ada versinya; tidak ada draft tersimpan

## AC-05 — Perubahan tarif tidak mengubah draft yang sudah dihitung

- Given draft sudah dihitung dengan tarif versi V1
- When tabel tarif mendapat versi V2 dengan tanggal berlaku setelah periode
- Then draft yang sudah ada tetap memakai V1; angka tidak berubah

## AC-06 — PPh 21 dari lookup TER

- Given karyawan dengan kategori PTKP K dan bruto B pada periode
- When draft dihitung
- Then PPh 21 yang tercatat sama dengan hasil lookup tabel TER untuk K dan B `[NILAI-TABEL]`, bukan hitungan bracket progresif

## AC-07 — Lembur dari tabel tarif

- Given karyawan dengan lembur tercatat dan golongan lembur
- When draft dihitung
- Then nilai lembur sama dengan hasil tabel tarif lembur untuk golongan itu `[NILAI-TABEL]`, dengan dasar gaji pokok + tunjangan tetap

## AC-08 — BPJS dari persentase dan batas

- Given karyawan dengan dasar BPJS (gaji pokok + tunjangan tetap) pada periode
- When draft dihitung
- Then potongan BPJS Ketenagakerjaan dan Kesehatan sama dengan hasil persentase dari tabel berversi sampai batas upah yang berlaku `[NILAI-TABEL]`

## AC-09 — Override manual wajib alasan

- Given draft sudah dihitung
- When HR mengubah satu komponen secara manual tanpa alasan
- Then perubahan ditolak dengan pesan yang menyebut alasan wajib; bila alasan diisi, perubahan tercatat dengan alasan, aktor, dan waktu

## AC-10 — Karyawan tanpa presensi tervalidasi tidak diberi angka

- Given karyawan aktif tidak punya presensi tervalidasi pada periode
- When draft dihitung
- Then karyawan itu ditandai dan tidak diberi angka; draft tidak tersimpan untuk karyawan itu sampai datanya dilengkapi (makalah UC-GJ-05)

## AC-11 — Prorata karyawan masuk di tengah periode

- Given karyawan dengan tanggal masuk di tengah periode
- When draft dihitung
- Then komponen yang diprorata sama dengan hasil hari kerja aktif dibagi hari kerja periode dikali komponen penuh, sesuai tabel hari kerja berversi `[NILAI-TABEL]`

## AC-12 — Pembulatan per komponen dan balance

- Given draft dengan beberapa komponen per karyawan
- When draft dihitung
- Then setiap komponen dibulatkan ke rupiah terdekat per karyawan; selisih pembulatan tampil sebagai komponen tersendiri di draft dan dijurnal ke akun peran selisih pembulatan di GJ-007; total nominal bersih = total komponen penambah dikurangi total komponen pengurang

## AC-13 — Masa pajak terakhir ditandai untuk penyesuaian tahunan

- Given periode adalah masa pajak terakhir dalam tahun
- When draft dihitung
- Then PPh 21 bulan itu ditandai "perlu penyesuaian tahunan"; HR dapat mengisi nilai manual dengan alasan; tanpa alasan ditolak

## AC-14 — Kegagalan di tengah tidak menyisakan draft parsial

- Given hitungan gagal di tengah (mis. satu tabel tidak tersedia setelah beberapa karyawan dihitung)
- When HR melihat periode
- Then tidak ada baris draft yang tersimpan untuk periode itu; pesan menyebut penyebab

## AC-15 — Setiap angka dapat ditelusuri ke versi tarif

- Given draft sudah dihitung
- When HR membuka rincian satu karyawan
- Then rincian menampilkan versi tarif yang dipakai untuk setiap tabel

## AC-16 — Draft dikembalikan lalu dihitung ulang

- Given draft `REVISI` setelah dikembalikan dari GJ-005
- When HR menghitung ulang
- Then status menjadi `DRAFT_TERHITUNG`, angka diperbarui, dan riwayat mencatat pengembalian dan hitung ulang

## AC-17 — Pembaca draft sesuai izin

- Given pengguna dengan peran Direksi
- When membuka draft periode
- Then hanya ringkasan total dan jumlah karyawan tampil; rincian per karyawan tidak tampil

## Edge cases

- Karyawan keluar di tengah periode: diprorata sampai tanggal keluar (AC-11).
- Pembulatan: diuji dengan nilai yang membutuhkan pembulatan (AC-12).
- PPh 21 bulan koreksi: AC-13.
- Dua hitung ulang bersamaan: hanya satu yang berhasil (optimistic lock `G16` di §9.2 bila dipakai).

## Verifiability

- AC-01, AC-02, AC-05, AC-11, AC-12 → hitung manual dengan spreadsheet atau skrip terpisah yang membaca tabel tarif yang sama, lalu bandingkan.
- AC-03, AC-04, AC-09, AC-10, AC-14, AC-16 → uji manual UI dan cek tabel draft tidak berubah.
- AC-06 sampai AC-08 → uji satu karyawan per kategori lalu bandingkan dengan baris tabel tarif.
- AC-15 dan AC-17 → uji dengan peran berbeda dan cek tampilan rincian.
