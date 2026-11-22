# GJ-003 — Acceptance Criteria

Diuji lewat UI sebagai HR, Supervisor Lapangan, dan Manajemen. Langkah awal: `pnpm db:reset` dan `pnpm db:seed`, lalu satu periode uji `TERBUKA` dengan presensi dari GJ-002 untuk dua departemen uji (`DEPT-UJI-A`, `DEPT-UJI-B`) dan satu Supervisor per departemen.

## AC-01 — HR membuat rekap periode

- Given periode uji `TERBUKA` dengan presensi dan lembur tercatat, dan semua karyawan aktif punya entri
- When HR menyimpan rekap untuk periode itu
- Then periode berstatus `REKAP` dan riwayat mencatat aktor dan waktu; jumlah karyawan sesuai presensi

## AC-02 — Supervisor memvalidasi rekap departemennya

- Given periode `REKAP` dengan rekap departemen `DEPT-UJI-A` dan `DEPT-UJI-B`
- When Supervisor `DEPT-UJI-A` memvalidasi departemennya lalu Supervisor `DEPT-UJI-B` memvalidasi departemennya
- Then setelah keduanya, periode berstatus `TERVALIDASI`; setiap validasi tercatat dengan aktor dan waktu di `riwayat_status`

## AC-03 — Supervisor mengembalikan rekap dengan alasan

- Given periode `REKAP`
- When Supervisor `DEPT-UJI-A` mengembalikan rekap departemennya dengan alasan
- Then periode berstatus `TERBUKA` (`D-47` c), alasan tampil bagi HR, dan riwayat mencatat aktor, waktu, dan alasan

## AC-04 — Pengguna selain Supervisor departemen tidak bisa memvalidasi

- Given rekap departemen `DEPT-UJI-A` pada periode `REKAP`
- When HR, atau Supervisor `DEPT-UJI-B`, mencoba memvalidasi departemen `DEPT-UJI-A`
- Then aksi ditolak dengan pesan yang menyebut peran yang berwenang; status tidak berubah

## AC-05 — Payroll tidak bisa jalan sebelum tervalidasi

- Given periode berstatus `TERBUKA` atau `REKAP`
- When pengguna mencoba memulai hitung payroll untuk periode itu
- Then aksi ditolak dengan pesan bahwa validasi supervisor belum dilakukan

## AC-06 — Rekap tervalidasi tidak diubah diam-diam

- Given periode berstatus `TERVALIDASI` dan draft payroll belum `DISETUJUI`
- When HR mencoba mengubah presensi karyawan dalam periode itu tanpa otorisasi Manajemen
- Then perubahan ditolak dengan pesan yang menyebut otorisasi khusus; data tidak berubah

## AC-07 — Koreksi tervalidasi dengan otorisasi

- Given periode `TERVALIDASI` dan draft belum `DISETUJUI`
- When HR mengajukan koreksi dengan alasan dan Manajemen memberi otorisasi
- Then periode berstatus `REKAP`, riwayat mencatat alasan dan otorisasi, dan periode harus divalidasi ulang oleh Supervisor sebelum `TERVALIDASI` lagi

## AC-08 — Rekap tidak bisa disimpan dengan karyawan tanpa entri

- Given karyawan aktif `NIK-UJI-004` tidak punya entri presensi pada periode `TERBUKA`
- When HR menyimpan rekap
- Then penyimpanan ditolak dengan pesan yang menyebut `NIK-UJI-004` dan bahwa nilai kehadiran wajib diisi; tidak ada alpha yang dibuat otomatis

## AC-09 — Pembuat presensi tidak memvalidasi presensinya sendiri

- Given presensi di departemen `DEPT-UJI-A` dicatat oleh Supervisor `DEPT-UJI-A` atas nama karyawan
- When Supervisor yang sama memvalidasi departemen itu
- Then aksi ditolak dengan pesan bahwa pencatat tidak boleh memvalidasi (`D-48`)

## AC-10 — Pengembalian tanpa alasan ditolak

- Given periode `REKAP`
- When Supervisor mengembalikan tanpa mengisi alasan
- Then aksi ditolak dengan pesan yang menyebut alasan wajib; status tetap `REKAP`

## AC-11 — Periode tanpa karyawan aktif di satu departemen

- Given departemen `DEPT-UJI-B` tidak punya karyawan aktif pada periode
- When semua departemen lain tervalidasi
- Then periode menjadi `TERVALIDASI` tanpa menunggu departemen kosong

## Edge cases

- Karyawan masuk di tengah periode: entri hanya diisi sejak tanggal masuk (GJ-001, prorata di GJ-004).
- Karyawan nonaktif di tengah periode: entri sampai tanggal keluar.
- Pengembalian oleh satu departemen saat departemen lain sudah tervalidasi: periode kembali `TERBUKA`, dan validasi departemen lain dihapus untuk diulang.

## Verifiability

- AC-01 sampai AC-05, AC-08 sampai AC-11 → uji manual UI dengan peran HR dan Supervisor; cek `riwayat_status` lewat query atau tampilan riwayat.
- AC-06 dan AC-07 → uji manual dengan dan tanpa otorisasi Manajemen; cek status dan baris presensi sebelum dan sesudah.
