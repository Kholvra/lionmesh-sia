# PG-005: bukti database dan tarif PPN menunggu pengisian

## Kondisi saat ini

PG-005 sudah diimplementasikan: penerbitan PO dari permintaan `PEMASOK_DITETAPKAN`,
pembatalan PO yang ikut membatalkan permintaan, dan catatan konfirmasi pemasok.
Migrasi `0025` menambah `konfigurasi_pajak`, `tarif_ppn_untuk`, `terbitkan_po`,
`batalkan_po_dengan_permintaan`, dan `catat_konfirmasi_po`. Seed
`0013_pg005_jenis_po.sql` mendaftarkan jenis dokumen `PURCHASE_ORDER`.

Dua hal belum bisa dibuktikan:

1. **Tidak ada Docker/Supabase lokal**, jadi seluruh AC database belum dijalankan.
2. **`konfigurasi_pajak` belum berisi tarif.** Sesuai `D-17`/`D-51`(a), angka tarif
   tidak boleh ditulis dari ingatan; nilai regulasi diverifikasi dan dikutip saat
   `PD-005`. Selama tabel kosong, `terbitkan_po` menolak dengan pesan
   "Tarif PPN untuk tanggal ini belum tersedia".

## Pekerjaan yang dibutuhkan

1. Tech lead mengisi `konfigurasi_pajak` (tarif uji atau tarif resmi beserta
   sumbernya). Contoh bentuk baris:
   `insert into public.konfigurasi_pajak (nama, ppn_persen, berlaku_mulai) values ('Uji', 11, '2026-01-01');`
   Angka pada contoh itu **placeholder**, bukan tarif final.
2. Nyalakan Supabase lokal, `pnpm db:reset` lalu `pnpm db:seed:local`.
3. Siapkan permintaan sampai `PEMASOK_DITETAPKAN` lewat `PG-002`—`PG-004`.
4. Jalankan AC-01 sampai AC-15 di `/pengeluaran/purchase-order` dengan akun
   Purchasing; AC-14 menunggu `PG-006`.
5. Ambil screenshot 1280px dan perbarui `05-evidence.md`.
6. Konfirmasi nomor migrasi `0025` (`D-09`).

## Dampak

PO belum bisa diterbitkan di lingkungan nyata, sehingga `PG-006` (penerimaan)
belum punya dokumen hulu untuk diuji. Risiko lain sudah tertutup di kode: harga
baris wajib sama dengan harga pembanding, PO tidak menyentuh stok atau jurnal,
dan pembatalan menolak bila sudah ada penerimaan.
