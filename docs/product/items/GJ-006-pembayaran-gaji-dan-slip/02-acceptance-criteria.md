# GJ-006 — Acceptance Criteria

Diuji lewat UI sebagai Finance, HR, dan Accounting. Langkah awal: `pnpm db:reset` dan `pnpm db:seed`, lalu satu draft `DISETUJUI` (GJ-005) dengan tiga karyawan uji: `NIK-UJI-001` (rekening lengkap), `NIK-UJI-002` (rekening lengkap), dan `NIK-UJI-003` (rekening tidak lengkap).

## AC-01 — Finance mencatat hasil transfer berhasil

- Given draft `DISETUJUI` dan bukti transfer batch tersimpan
- When Finance mencatat hasil transfer berhasil untuk `NIK-UJI-001` dan `NIK-UJI-002`
- Then status kedua karyawan menjadi `DIBAYAR`, riwayat mencatat aktor dan waktu

## AC-02 — Pembayaran gagal ditandai per karyawan

- Given draft `DISETUJUI`
- When Finance mencatat transfer gagal untuk `NIK-UJI-002`
- Then status karyawan itu menjadi `GAGAL_TRANSFER`, karyawan tidak dihitung `DIBAYAR`, dan draft tidak berstatus `DIBAYAR`

## AC-03 — Percobaan ulang dengan alasan

- Given karyawan `NIK-UJI-002` berstatus `GAGAL_TRANSFER`
- When Finance mencatat percobaan ulang yang berhasil dengan alasan
- Then status menjadi `DIBAYAR`; riwayat mencatat kedua percobaan beserta alasan (`D-49`)

## AC-04 — Percobaan ulang tanpa alasan ditolak

- Given karyawan `GAGAL_TRANSFER`
- When Finance mencatat percobaan ulang tanpa alasan
- Then aksi ditolak dengan pesan yang menyebut alasan wajib; status tidak berubah

## AC-05 — Draft menjadi `DIBAYAR` hanya bila semua karyawan `DIBAYAR`

- Given `NIK-UJI-001` dan `NIK-UJI-002` `DIBAYAR`, dan `NIK-UJI-003` `GAGAL_TRANSFER`
- When pengguna melihat status draft
- Then draft berstatus `GAGAL_TRANSFER`, bukan `DIBAYAR`; setelah `NIK-UJI-003` `DIBAYAR`, draft menjadi `DIBAYAR`

## AC-06 — Karyawan yang gagal ditandai untuk diproses ulang

- Given sebagian transfer gagal (makalah UC-GJ-08)
- When Finance membuka daftar batch
- Then karyawan yang gagal tampil sebagai `GAGAL_TRANSFER` dan ditandai untuk diproses ulang; karyawan yang berhasil tidak ikut diproses ulang

## AC-07 — Bukti transfer wajib untuk status `DIBAYAR`

- Given Finance mencoba menandai `DIBAYAR` tanpa bukti batch
- When aksi disimpan
- Then ditolak dengan pesan yang menyebut bukti transfer wajib

## AC-08 — Pembayaran tanpa persetujuan ditolak

- Given draft berstatus `DIPERIKSA`
- When Finance mencoba mengirim batch pembayaran
- Then aksi ditolak dengan pesan bahwa persetujuan belum ada

## AC-09 — HR mencetak slip

- Given karyawan `NIK-UJI-001` berstatus `DIBAYAR`
- When HR membuka slip dan mencetak
- Then slip tampil dengan komponen sesuai T-05 dan nominal bersih; cetak tercatat dengan nomor slip, aktor, dan waktu

## AC-10 — Slip sebelum pembayaran ditolak

- Given karyawan `NIK-UJI-002` berstatus `GAGAL_TRANSFER`
- When HR mencoba mencetak slip
- Then aksi ditolak dengan pesan bahwa pembayaran belum tercatat

## AC-11 — Penghitung gaji tidak bisa membayar gaji

- Given draft dihitung oleh pengguna X (HR)
- When pengguna X mencoba mencatat pembayaran untuk draft itu
- Then aksi ditolak dengan pesan pemisahan tugas; status tidak berubah (`D-42`)

## AC-12 — Rekening tidak lengkap menunda pembayaran

- Given `NIK-UJI-003` tidak punya rincian rekening lengkap (`D-51(d)`)
- When Finance menyiapkan batch
- Then `NIK-UJI-003` tidak masuk batch; daftar rekening bermasalah tampil; HR menerima permintaan perbaikan

## AC-13 — Dana tidak cukup menunda batch

- Given Finance mencatat dana tidak cukup untuk batch
- When batch dicoba diproses
- Then batch tidak diproses; status draft tetap `DISETUJUI`; manajemen menerima notifikasi (`C-012`, bila sudah ada)

## AC-14 — Slip pengganti dengan alasan

- Given slip karyawan `NIK-UJI-001` sudah dicetak
- When HR membuat slip pengganti tanpa alasan, lalu dengan alasan
- Then tanpa alasan ditolak; dengan alasan, slip pengganti tercatat dan slip lama tidak berubah

## AC-15 — Pembayaran ganda ditolak

- Given `NIK-UJI-001` sudah `DIBAYAR`
- When Finance mencoba mencatat pembayaran kedua untuk karyawan itu
- Then ditolak dengan pesan bahwa karyawan sudah dibayar; nominal tidak bertambah

## AC-16 — Karyawan tidak punya akses slip digital

- Given akun Karyawan untuk `NIK-UJI-001` (`D-53`)
- When akun membuka menu slip atau mencoba mengakses slip lewat permintaan langsung
- Then menu tidak tampil dan permintaan ditolak; tidak ada slip yang kembali

## AC-17 — Rekening dan nominal hanya untuk peran yang diizinkan

- Given pengguna dengan peran Direksi
- When membuka daftar pembayaran
- Then rekening dan nominal per karyawan tidak tampil

## Edge cases

- Karyawan nonaktif setelah draft `DISETUJUI`: pembayaran tetap mengikuti draft yang sudah disetujui dan tidak berubah (`[USULAN-AGEN]`: draft terkunci; GJ-001 AC-12 hanya mencegah pemilihan untuk dokumen baru).
- Pembayaran ganda untuk karyawan yang sama: AC-15.
- Cetak ulang slip yang sama: tidak membuat slip baru; tercatat sebagai cetak ulang.

## Verifiability

- AC-01 sampai AC-08, AC-15 → uji manual UI dan cek tabel status per karyawan.
- AC-09, AC-10, AC-14 → cetak ke PDF dan periksa isi; cek status dan riwayat cetak.
- AC-11 → login sebagai HR penghitung dan coba bayar.
- AC-16 → login sebagai akun Karyawan.
- AC-17 → login sebagai Direksi.
