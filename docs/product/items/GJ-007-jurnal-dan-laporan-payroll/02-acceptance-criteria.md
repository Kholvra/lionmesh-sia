# GJ-007 — Acceptance Criteria

Diuji lewat UI sebagai Akuntansi, HR, dan Direksi, dan dengan memeriksa tabel jurnal (query). Langkah awal: `pnpm db:reset` dan `pnpm db:seed`, lalu satu payroll periode uji `DISETUJUI` dengan karyawan tipe Produksi dan Non-Produksi, lalu pembayaran sebagian dan lengkap.

## AC-01 — Jurnal akrual dibuat saat disetujui dan balance

- Given draft payroll periode uji berstatus `DIPERIKSA`
- When Direksi menyetujui (GJ-005 AC-02)
- Then tepat satu jurnal akrual tersimpan dalam transaksi yang sama; total debit sama dengan total kredit (`D-43`); jurnal dibuat lewat `postJournal()`

## AC-02 — Jurnal sesuai tabel peran akun

- Given payroll `DISETUJUI` dengan komponen per karyawan `NIK-UJI-001` (Produksi) dan `NIK-UJI-002` (Non-Produksi)
- When jurnal akrual dibuka
- Then setiap baris memakai peran akun dan sisi dari tabel jurnal akrual di 01; tidak ada kode akun di modul

## AC-03 — Jurnal tidak balance ditolak

- Given draf jurnal yang total debitnya berbeda dengan total kreditnya
- When pengguna mencoba memposting
- Then ditolak; tidak ada baris jurnal atau baris jurnal detail tersimpan

## AC-04 — Periode akuntansi tertutup menolak jurnal

- Given periode akuntansi tempat akrual akan dibuat sudah tertutup
- When jurnal akrual dicoba dibuat
- Then ditolak dengan pesan yang menyebut periode tertutup; persetujuan di GJ-005 juga ditolak (GJ-005 AC-08)

## AC-05 — Beban dipisah menurut tipe karyawan

- Given payroll memuat karyawan tipe Produksi dan Non-Produksi
- When jurnal akrual dibuat
- Then beban gaji tipe Produksi masuk peran `tenaga_kerja_langsung`, tipe Non-Produksi masuk `beban_gaji_administrasi`; total debit sama dengan total kredit. Pembebanan TKL ke WIP bukan bagian kriteria ini (`D-44` butir 4)

## AC-06 — Jurnal akrual tidak bisa dibuat dua kali

- Given jurnal akrual payroll periode itu sudah ada
- When pengguna atau proses mencoba membuatnya lagi
- Then ditolak dengan pesan yang menyebut jurnal yang sudah ada; jumlah jurnal tetap satu

## AC-07 — Laporan payroll cocok dengan jurnal

- Given jurnal akrual dan pembayaran periode uji sudah dibuat
- When laporan payroll dibuka untuk periode itu
- Then total per komponen dan per akun peran sama dengan jumlah baris jurnal yang relevan (`D-43`, J-09)

## AC-08 — Laporan TKL cocok dengan saldo beban

- Given jurnal akrual periode itu sudah dibuat
- When laporan TKL dibuka
- Then total laporan TKL sama dengan saldo peran `tenaga_kerja_langsung` dan `beban_gaji_administrasi` di buku besar untuk periode itu (`D-43`; J-06)

## AC-09 — Koreksi lewat jurnal pembalik

- Given jurnal akrual sudah diposting
- When Akuntansi perlu mengoreksi angka
- Then jurnal asli tidak diubah; koreksi tercatat sebagai jurnal pembalik baru (`D-35`, J-08)

## AC-10 — Laporan tanpa akses tidak tampil

- Given pengguna dengan peran Finance atau Supervisor Lapangan
- When membuka laporan payroll atau laporan TKL
- Then laporan tidak tampil

## AC-11 — Jurnal pembayaran per karyawan saat dibayar

- Given `NIK-UJI-001` berstatus `DIBAYAR` pada percobaan transfer berhasil (GJ-006)
- When jurnal pembayaran dibuat
- Then satu jurnal dengan debit `utang_gaji` dan kredit `kas_bank` senilai nominal bersih `NIK-UJI-001`; jenis transaksi asal pembayaran dan nomor transaksi tercatat (`D-43`)

## AC-12 — Jurnal pembayaran tidak dibuat sebelum dibayar

- Given `NIK-UJI-002` berstatus `GAGAL_TRANSFER`
- When proses jurnal pembayaran berjalan
- Then tidak ada jurnal pembayaran untuk `NIK-UJI-002`; saldo `utang_gaji` tetap

## AC-13 — Pembayaran tidak dijurnal dua kali

- Given `NIK-UJI-001` sudah punya jurnal pembayaran untuk transfer berhasil
- When pengguna atau proses mencoba menjurnal ulang pembayaran yang sama
- Then ditolak dengan pesan yang menyebut pembayaran sudah dijurnal

## AC-14 — Akrual periode lintas tahun

- Given payroll periode Desember disetujui pada Desember dan dibayar pada Januari
- When jurnal dibuat
- Then akrual masuk periode akuntansi Desember; jurnal pembayaran masuk periode akuntansi Januari (J-07)

## AC-15 — Selisih pembulatan membuat jurnal balance

- Given draft dengan selisih pembulatan pada komponen karyawan
- When jurnal akrual dibuat
- Then selisih tercatat di peran `selisih_pembulatan` dan total debit sama dengan total kredit (`D-51(b)`)

## AC-16 — Saldo kewajiban tampil di laporan

- Given jurnal akrual periode uji sudah dibuat dan belum ada penyetoran BPJS atau PPh 21
- When laporan payroll dibuka
- Then saldo `utang_bpjs` dan `utang_pph21` tampil sebagai kewajiban terbuka

## Edge cases

- Akun peran dinonaktifkan setelah jurnal: jurnal lama tidak berubah; akun baru tidak bisa dipilih (`D-50`, `FND-006`).
- Jurnal pembayaran untuk karyawan nonaktif: tetap dibuat dari transfer berhasil (GJ-006 edge case).

## Verifiability

- AC-01 sampai AC-06, AC-11 sampai AC-15 → uji manual UI dan query tabel jurnal (`debit = kredit` per jurnal).
- AC-07, AC-08, AC-16 → bandingkan angka laporan dengan query agregat jurnal.
- AC-09 → cek jurnal asli tidak berubah (diff baris).
- AC-10 → login sebagai peran tanpa izin.
