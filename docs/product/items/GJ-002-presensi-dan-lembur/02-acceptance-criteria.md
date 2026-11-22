# GJ-002 — Acceptance Criteria

Diuji lewat UI sebagai HR, Karyawan, dan Supervisor sesuai tiap AC. Langkah awal: `pnpm db:reset` lalu `pnpm db:seed`, lalu buat satu periode penggajian uji berstatus `TERBUKA`, dengan karyawan `NIK-UJI-001` (GJ-001) dan akun Karyawan untuk `NIK-UJI-001` (`D-53`).

## AC-01 — HR mencatat presensi harian

- Given periode uji `TERBUKA` dan karyawan `NIK-UJI-001` aktif (GJ-001)
- When HR mencatat presensi HADIR untuk tanggal dalam periode dengan jam masuk dan jam pulang
- Then presensi tersimpan dengan status `MENUNGGU_VALIDASI_SUPERVISOR` dan muncul di daftar presensi periode itu

## AC-02 — Presensi ganda ditolak

- Given presensi `NIK-UJI-001` untuk tanggal T sudah ada
- When HR atau Karyawan menyimpan presensi kedua untuk NIK dan tanggal yang sama
- Then penyimpanan ditolak, pesan menyebut NIK dan tanggal, dan jumlah baris presensi tidak bertambah

## AC-03 — Presensi di luar periode ditolak

- Given periode uji dengan tanggal awal dan akhir yang ditetapkan
- When HR mencoba menyimpan presensi di luar rentang itu
- Then penyimpanan ditolak dengan pesan yang menyebut rentang periode yang berlaku

## AC-04 — Lembur tanpa nomor SPL ditolak

- Given karyawan `NIK-UJI-001` ada di periode uji `TERBUKA`
- When karyawan atau HR mengajukan lembur tanpa mengisi nomor SPL
- Then pengajuan ditolak dengan pesan yang menyebut nomor SPL wajib diisi

## AC-05 — Lembur dengan nomor SPL tersimpan

- Given karyawan dan nomor SPL sudah diisi
- When karyawan `NIK-UJI-001` mengajukan lembur
- Then pengajuan tersimpan dengan status `MENUNGGU_VALIDASI_SUPERVISOR` dan nomor SPL tampil di detail

## AC-06 — Setiap perubahan status tercatat

- Given presensi atau pengajuan lembur sudah dibuat
- When statusnya berubah (divalidasi di GJ-003, atau dibatalkan oleh pemohon)
- Then `riwayat_status` mencatat aktor, waktu, dan status sebelum dan sesudah

## AC-07 — Peran yang tidak berhak tidak bisa mencatat

- Given pengguna dengan peran Supervisor Lapangan, Accounting, atau Finance
- When pengguna mencoba menambah presensi atau pengajuan lembur
- Then aksi ditolak dan data tidak berubah

## AC-08 — Karyawan hanya mencatat dan melihat dirinya sendiri

- Given akun Karyawan `NIK-UJI-001` dan karyawan lain `NIK-UJI-002` punya presensi di periode yang sama
- When akun `NIK-UJI-001` membuka riwayat presensi, atau mencoba membaca atau mencatat presensi `NIK-UJI-002` lewat permintaan langsung
- Then hanya presensi `NIK-UJI-001` yang tampil; permintaan untuk `NIK-UJI-002` ditolak oleh database (RLS)

## AC-09 — Data presensi tidak tampil untuk peran tanpa izin

- Given pengguna dengan peran Direksi atau Finance
- When membuka daftar presensi periode atau riwayat presensi karyawan
- Then data presensi tidak tampil

## AC-10 — Karyawan mencatat presensi sendiri

- Given akun Karyawan `NIK-UJI-001` dan periode `TERBUKA`
- When karyawan mencatat presensi HADIR untuk tanggal dalam periode dengan jam masuk dan jam pulang, lalu menyimpan
- Then presensi tersimpan dengan status `MENUNGGU_VALIDASI_SUPERVISOR` atas nama karyawan itu (`D-53`)

## AC-11 — Karyawan tidak mengubah presensi yang sudah tervalidasi atau periode tertutup

- Given presensi karyawan berstatus `TERVALIDASI`, atau periode berstatus `REKAP`
- When karyawan mencoba mengubah atau menambah presensi
- Then aksi ditolak dengan pesan yang mengarahkan ke HR untuk pengajuan koreksi; data tidak berubah

## AC-12 — HR mencatat atas nama karyawan tanpa akun

- Given karyawan `NIK-UJI-003` tidak punya akun
- When HR mencatat presensi dan lembur untuk `NIK-UJI-003` dengan nomor SPL
- Then entri tersimpan dengan status `MENUNGGU_VALIDASI_SUPERVISOR` dan dicatat sebagai diinput HR atas nama karyawan

## AC-13 — Koreksi periode tertutup memerlukan otorisasi

- Given periode berstatus `REKAP`
- When HR mengajukan koreksi tanpa otorisasi Manajemen, atau dengan otorisasi tetapi tanpa alasan
- Then koreksi ditolak dengan pesan yang menyebut otorisasi khusus atau alasan wajib; periode tetap `REKAP`

## AC-14 — Pemohon membatalkan lembur sebelum validasi

- Given pengajuan lembur karyawan berstatus `MENUNGGU_VALIDASI_SUPERVISOR`
- When karyawan membatalkan dengan alasan
- Then status menjadi `DIBATALKAN`, alasan tercatat di `riwayat_status`, dan pembatalan tanpa alasan ditolak

## AC-15 — Pembatalan setelah validasi ditolak

- Given pengajuan lembur berstatus `TERVALIDASI`
- When pemohon mencoba membatalkannya
- Then aksi ditolak dengan pesan yang menyebut status saat ini; status tidak berubah (`D-48`)

## AC-16 — Jam pulang kosong untuk HADIR ditolak

- Given karyawan atau HR mengisi presensi HADIR
- When jam pulang tidak diisi
- Then penyimpanan ditolak dengan pesan yang menyebut jam pulang

## Edge cases

- Presensi dengan status CUTI, IZIN, atau SAKIT: jam masuk dan pulang tidak wajib (`[USULAN-AGEN]`, P-03).
- Pengajuan lembur melewati tengah malam: dihitung pada tanggal pengajuan; batas jam berversi (`D-51`).
- Dua pengajuan lembur dengan nomor SPL sama untuk karyawan berbeda: diizinkan; SPL diverifikasi Supervisor saat validasi.

## Verifiability

- AC-01 sampai AC-07, AC-10 sampai AC-16 → uji manual UI dan hitung baris tabel sebelum dan sesudah.
- AC-08 → login sebagai akun Karyawan, buka riwayat, dan kirim permintaan langsung untuk karyawan lain.
- AC-09 → login sebagai Direksi dan Finance lalu buka daftar presensi.
