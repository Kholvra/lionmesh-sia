# PG-008: bukti database menunggu Supabase lokal

## Kondisi saat ini

PG-008 sudah diimplementasikan: dokumen `INVOICE_PEMASOK` dengan pencocokan
tiga dokumen saat simpan, pengesahan utang + jurnal, koreksi dengan pencocokan
ulang, dan pembatalan (termasuk jurnal pembalik). Migrasi `0028` menambah dua
tabel, jenis dokumen, transisi, dan empat RPC.

Dua hal belum terbukti:

1. Tidak ada Docker/Supabase lokal, jadi seluruh AC database belum dijalankan.
2. Rantai hulu masih tertahan: tarif PPN belum diisi, jadi PO, penerimaan, dan
   invoice belum bisa dibuat end-to-end.

## Akun COA placeholder

Seed FND-006 tidak memuat `ppn_masukan` dan `selisih_harga_pembelian`. Seed
`0014_pg008_akun_ppn_selisih.sql` menambahkan nomor **113** dan **603** sebagai
placeholder. Tech lead harus mengonfirmasi atau mengganti nomornya; bila
diganti, cukup ubah `nomor` pada seed sebelum database produksi dibuat.

## Pekerjaan yang dibutuhkan

1. Isi `konfigurasi_pajak`, nyalakan Supabase lokal, `pnpm db:reset`, `pnpm db:seed:local`.
2. Siapkan PO → penerimaan → QC lulus (butuh seed atau langkah manual).
3. Jalankan AC-01 sampai AC-21:
   - catat invoice `accounting@lionmesh.test`
   - sahkan dari akun Accounting **lain** (uji pemisahan tugas)
   - koreksi dan batalkan juga dari Accounting
4. Ambil screenshot 1280px dan perbarui `05-evidence.md`.
5. Konfirmasi nomor migrasi `0028`, nomor akun 113/603, dan tepi transisi baru.

## Dampak

Pengakuan utang, jurnal GR/IR → utang usaha, toleransi harga, dan pengaruh
periode terkunci belum dibuktikan. Risiko utama pada nilai uang dan saldo akun,
bukan pada tampilan. `PG-009` (pembayaran utang) juga menunggu item ini.
