# PG-006: bukti database dan dua keputusan state machine

## Kondisi saat ini

PG-006 sudah diimplementasikan di atas `catat_penerimaan` milik C-013: layar
penerimaan, sisa qty per baris PO, penutupan exception selisih, dan pembatalan
penerimaan sebelum QC. Migrasi `0026` menambah tepi `DITERIMA → DIBATALKAN`
dan dua RPC (`batalkan_penerimaan`, `tutup_exception_selisih`).

Seluruh AC database belum dijalankan karena tidak ada Docker/Supabase lokal.
Selain itu rantai hulu masih tertahan: PO belum bisa diterbitkan sampai
`konfigurasi_pajak` diisi (lihat `docs/tech-debt/pg-005-bukti-db.md`).

## Dua hal yang butuh keputusan tech lead

1. **Exception pada penerimaan sebagian.** `R-02` minta penerimaan `SEBAGIAN`
   tidak membuat exception, tetapi `catat_penerimaan` (C-013) mencatat
   `SELISIH_QTY` untuk setiap kekurangan. Perbaikan berarti mengganti RPC C-013
   atau menambah parameter jenis; keduanya menyentuh kode yang sudah merge.
2. **PO tidak bisa dibuka lagi dari `DITERIMA`.** `D-46` tidak punya transisi
   mundur, sehingga pembatalan penerimaan yang menutup PO ditolak dengan pesan
   agar koreksi lewat QC. Bila pembatalan penuh harus mengembalikan PO ke
   `DITERIMA_SEBAGIAN`, dibutuhkan keputusan state machine baru.

## Pekerjaan yang dibutuhkan

1. Nyalakan Supabase lokal, `pnpm db:reset`, `pnpm db:seed:local`.
2. Siapkan PO `DITERBITKAN` (butuh tarif PPN lebih dulu) dan satu gudang aktif.
3. Jalankan AC-01 sampai AC-14 di `/pengeluaran/penerimaan` dengan akun Gudang;
   AC-14 dengan akun Purchasing.
4. Ambil screenshot 1280px dan perbarui `05-evidence.md`.
5. Konfirmasi nomor migrasi `0026` dan tepi transisi baru (`D-09`, `D-46`).

## Dampak

Penerimaan belum terbukti menolak kelebihan kirim, menghitung status PO turunan,
dan membatalkan tanpa efek stok. Risiko utama ada pada kebenaran qty dan status,
bukan pada tampilan.
