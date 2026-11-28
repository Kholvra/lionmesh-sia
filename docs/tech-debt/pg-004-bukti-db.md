# PG-004: bukti database menunggu Supabase lokal

## Kondisi saat ini

PG-004 sudah diimplementasikan: tabel `penawaran_harga`, layar perbandingan
harga, dan penetapan satu pemasok dengan alasan. Migrasi `0024` menambah
`permintaan_pembelian.alasan_pemilihan` serta dua RPC
(`simpan_penawaran_harga`, `tetapkan_pemasok_pr_dengan_alasan`).

Seluruh AC yang butuh database belum dijalankan karena mesin penulis tidak
punya Docker/Supabase lokal. Yang terbukti baru `pnpm verify` dan unit test
perhitungan harga (8 test).

## Pekerjaan yang dibutuhkan

1. Nyalakan Supabase lokal, jalankan `pnpm db:reset` lalu `pnpm db:seed:local`.
2. Siapkan satu permintaan `DISETUJUI` (lewat `PG-002` + `PG-003`) dan dua
   pemasok aktif (`PG-001`).
3. Jalankan AC-01 sampai AC-11 dari `02-acceptance-criteria.md` lewat
   `/pengeluaran/pemilihan-pemasok` dengan akun Purchasing.
4. Uji juga alasan wajib: pilih pemasok dengan total lebih tinggi tanpa alasan,
   lalu dengan alasan.
5. Ambil screenshot 1280px dan perbarui `05-evidence.md`.
6. Konfirmasi nomor migrasi `0024` ke tech lead (`D-09`; `0016` milik GJ-001,
   `0017` dipakai PG-003).

## Dampak

Harga pembanding, aturan "alasan wajib bila bukan termurah", dan tombol
penetapan belum terbukti bekerja di database. Risikonya pada kebenaran
perbandingan harga dan transisi status, bukan pada tampilan.
