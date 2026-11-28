# PG-009: bukti database dan dua placeholder

## Kondisi saat ini

PG-009 sudah diimplementasikan: pembayaran pemasok dengan alokasi otomatis ke
invoice tertua, verifikasi Accounting, hasil transfer (berhasil/gagal), jurnal
Dr 201 / Cr 102, bukti transfer di Supabase Storage, dan pembatalan dengan
jurnal pembalik. Migrasi `0034` menambah master rekening, dua tabel pembayaran,
jenis dokumen, transisi, dan bucket `bukti-transfer`.

Dua hal belum terbukti:

1. Tidak ada Docker/Supabase lokal, jadi seluruh AC database belum dijalankan.
2. Rantai hulu masih tertahan: tarif PPN belum diisi, sehingga invoice (PG-008)
   belum ada, dan pembayaran belum punya utang nyata untuk diuji.

## Placeholder yang harus diganti tech lead

- `rekening_bank` seed `0017`: "Bank Uji" nomor `0000000000`. Ganti dengan
  rekening perusahaan yang sebenarnya sebelum produksi.
- Bucket `bukti-transfer` dibuat privat dengan akses hanya lewat service role.
  Perlu keputusan retensi/penghapusan berkas bukti transfer.

## Pekerjaan yang dibutuhkan

1. Isi `konfigurasi_pajak`, nyalakan Supabase lokal, `pnpm db:reset`, `pnpm db:seed:local`.
2. Siapkan PO → penerimaan → QC → invoice `TERCATAT` (PG-005..PG-008).
3. Jalankan AC-01 sampai AC-19:
   - catat pembayaran dan hasil transfer: `finance@lionmesh.test`
   - verifikasi: `accounting@lionmesh.test`
4. Uji lampiran bukti transfer (PDF/JPG/PNG, maks 5 MB), lalu buka lewat tautan signed URL.
5. Ambil screenshot 1280px dan perbarui `05-evidence.md`.
6. Konfirmasi nomor migrasi `0034`, status `DIPOSTING`, dan tepi balik status invoice.

## Dampak

Saldo utang, jurnal pembayaran, penolakan kelebihan bayar, pemisahan tugas, dan
pembalikan belum terbukti. Risiko utama pada angka utang dan kas, bukan tampilan.
Item ini juga menjadi prasyarat `INT-001`.
