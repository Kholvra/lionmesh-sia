# GJ-008 — Acceptance Criteria

Diuji lewat UI sebagai HR, dan dengan berkas CSV contoh yang dibuat dari profil pemetaan uji (bukan dari merek mesin tertentu). Langkah awal: `pnpm db:reset` dan `pnpm db:seed`, lalu satu periode uji `TERBUKA`, karyawan `NIK-UJI-001` dan `NIK-UJI-002` dengan ID mesin yang dipetakan, dan satu ID mesin `ID-UJI-999` yang tidak dipetakan.

## AC-01 — Impor berkas valid

- Given profil pemetaan uji dan berkas CSV dengan tiga baris valid untuk dua karyawan terpetakan
- When HR mengimpor berkas
- Then tiga presensi tersimpan dengan status `MENUNGGU_VALIDASI_SUPERVISOR` dan penanda sumber impor; ringkasan menampilkan tiga tersimpan

## AC-02 — Format salah ditolak sebelum simpan

- Given berkas dengan pemisah yang tidak sesuai profil
- When HR mengimpor
- Then seluruh impor ditolak sebelum baris apa pun disimpan; pesan menyebut format yang diharapkan

## AC-03 — ID tanpa NIK tidak disimpan diam-diam

- Given berkas berisi satu baris dengan ID mesin `ID-UJI-999` yang belum dipetakan dan dua baris valid
- When HR mengimpor
- Then baris `ID-UJI-999` tidak tersimpan dan tampil di daftar tidak terpetakan; dua baris valid tetap tersimpan

## AC-04 — Baris rusak menggagalkan seluruh berkas

- Given berkas yang baris ke-3-nya berisi jam tidak valid
- When HR mengimpor
- Then tidak ada baris dari berkas itu yang tersimpan; pesan menyebut nomor baris 3

## AC-05 — Berkas identik ditolak

- Given berkas yang sama sudah pernah diimpor
- When HR mengimpor lagi
- Then impor ditolak dengan pesan bahwa berkas sudah diimpor; jumlah baris presensi tidak bertambah

## AC-06 — Bentrok dengan presensi manual dilewati

- Given `NIK-UJI-001` sudah punya presensi manual untuk tanggal T (GJ-002)
- When HR mengimpor berkas yang berisi baris `NIK-UJI-001` untuk tanggal T
- Then baris itu tidak tersimpan dan tampil sebagai bentrok; presensi manual tidak berubah; satu presensi per NIK per tanggal tetap berlaku (GJ-002 AC-02)

## AC-07 — Impor ditolak untuk periode tertutup

- Given periode berstatus `REKAP` atau `TERVALIDASI` (GJ-003)
- When HR mengimpor presensi untuk periode itu
- Then impor ditolak dengan pesan yang menyebut periode tertutup; tidak ada baris tersimpan

## AC-08 — Peran tanpa izin tidak bisa mengimpor

- Given pengguna dengan peran Supervisor Lapangan, Accounting, atau Finance
- When mencoba mengimpor berkas
- Then aksi ditolak dan tidak ada baris tersimpan

## AC-09 — Pemetaan ID ke NIK diisi HR

- Given HR membuka profil pemetaan
- When HR menambah pemetaan `ID-UJI-999` ke `NIK-UJI-003` yang aktif
- Then pemetaan tersimpan; impor berikutnya memetakan baris `ID-UJI-999` ke `NIK-UJI-003`

## AC-10 — ID ganda ditolak

- Given `ID-UJI-999` sudah dipetakan ke `NIK-UJI-003`
- When HR mencoba memetakan `ID-UJI-999` ke `NIK-UJI-001`
- Then pemetaan ditolak dengan pesan yang menyebut ID sudah dipetakan

## AC-11 — Profil pemetaan dapat diubah tanpa mengubah kode

- Given profil pemetaan uji dengan pemisah titik koma
- When HR mengubah pemisah menjadi koma dan mengimpor berkas dengan pemisah koma
- Then impor berhasil memakai profil baru; tidak ada perubahan kode yang diperlukan (`D-52`)

## AC-12 — Berkas kosong ditolak

- Given berkas CSV tanpa baris data
- When HR mengimpor
- Then ditolak dengan pesan yang menyebut berkas kosong

## AC-13 — Karyawan nonaktif tidak dipetakan

- Given `NIK-UJI-002` sudah dinonaktifkan (GJ-001 AC-12)
- When HR membuka pemetaan untuk `NIK-UJI-002`
- Then `NIK-UJI-002` tidak muncul sebagai pilihan NIK

## AC-14 — Ringkasan hasil dan jejak

- Given impor selesai dengan campuran baris tersimpan, tidak terpetakan, dan bentrok
- When HR membuka hasil impor
- Then ringkasan menampilkan jumlah tersimpan, dilewati, tidak terpetakan, dan bentrok; aktor dan waktu tercatat

## Edge cases

- Baris dengan jam pulang kosong: dilewati dengan alasan (GJ-002 AC-16 berlaku untuk entri).
- Baris di luar rentang periode: dilewati dengan alasan.
- Berkas dengan ID mesin yang dipetakan ke karyawan yang sudah nonaktif: dilewati (AC-13).

## Verifiability

- AC-01 sampai AC-07 dan AC-09 sampai AC-14 → uji manual UI dengan berkas contoh; bandingkan jumlah baris dengan isi berkas.
- AC-08 → login sebagai peran tanpa izin.
- AC-05 → impor berkas yang sama dua kali; hitung baris sebelum dan sesudah.
