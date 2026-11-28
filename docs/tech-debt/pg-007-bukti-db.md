# PG-007: bukti database menunggu Supabase lokal

## Kondisi saat ini

PG-007 sudah diimplementasikan: QC per baris penerimaan (memakai
`catat_qc_penerimaan` milik C-013 sehingga mutasi stok dan jurnal satu
transaksi), lokasi pemisahan barang gagal, dan retur pemasok dengan persetujuan
Accounting. Migrasi `0027` menambah kolom `lokasi_pemisahan`, jenis dokumen
`RETUR_PEMASOK`, dua tabel retur, dan empat RPC.

Seluruh AC database belum dijalankan karena tidak ada Docker/Supabase lokal.
Rantai hulu juga masih tertahan: PO belum bisa terbit sampai `konfigurasi_pajak`
diisi, sehingga belum ada penerimaan yang bisa di-QC.

## Pekerjaan yang dibutuhkan

1. Isi `konfigurasi_pajak`, nyalakan Supabase lokal, `pnpm db:reset`, `pnpm db:seed:local`.
2. Siapkan PO + penerimaan `DITERIMA` dengan minimal dua baris dan dua harga
   berbeda (butuh seed tambahan; seed demo per siklus masih kosong).
3. Jalankan AC-01 sampai AC-18:
   - QC `qc@lionmesh.test`
   - lokasi pemisahan `gudang@lionmesh.test`
   - pengajuan retur `purchasing@lionmesh.test`
   - keputusan retur `accounting@lionmesh.test`
4. Ambil screenshot 1280px dan perbarui `05-evidence.md`.
5. Konfirmasi nomor migrasi `0027` dan tepi transisi `DIAJUKAN → DISETUJUI/DITOLAK/DIBATALKAN`.

## Dampak

Stok dan jurnal dari QC lulus belum pernah dijalankan di database, sehingga
angka persediaan dan GR/IR belum terbukti. Retur juga belum membuktikan
pembatasan qty terhadap qty gagal. Risiko utamanya pada nilai uang dan stok,
bukan pada tampilan.
