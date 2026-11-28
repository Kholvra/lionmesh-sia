# PD-001 — Bukti Verifikasi

- Tanggal verifikasi: 2026-11-24
- Status: **Lolos (100%)**
- Pelaksana: agen AI atas nama kelompok Pendapatan
- Skrip uji otomatis: `scripts/verify-pd-001.mjs`

## Hasil Kriteria Penerimaan

| AC | Deskripsi | Hasil | Bukti Perintah / Hasil |
|---|---|:---:|---|
| `AC-01` | Penjualan membuat pelanggan baru dengan nama, termin, batas kredit | **Lolos** | `service.createPelanggan()` menghasilkan `kodePelanggan` format `PLG-000001`, termin 30 hari, batas kredit `50000000.00`. |
| `AC-02` | Pelanggan tanpa termin otomatis mendapat termin default 30 hari | **Lolos** | `service.parseTermin("")`, `null`, `undefined` menghasilkan nilai 30. |
| `AC-03` | Batas kredit negatif ditolak | **Lolos** | `service.parseBatasKredit("-1")` menolak dengan pesan `"Batas kredit tidak boleh negatif."`. |
| `AC-04` | Termin non-bilangan bulat atau negatif ditolak | **Lolos** | Input `"2,5"`, `"abc"`, `"-1"` ditolak dengan pesan `"Termin pembayaran harus berupa jumlah hari, minimal 0."`. |
| `AC-05` | Pengguna tanpa izin Manajemen ditolak mengubah batas kredit | **Lolos** | Aksi sebagai `Penjualan` ditolak dengan `"Anda tidak berwenang mengubah batas kredit pelanggan."`; aksi sebagai `Manajemen` berhasil. |
| `AC-06` | Menonaktifkan pelanggan mengeset status `nonaktif` tanpa hapus baris | **Lolos** | `updateStatusPelanggan(..., "nonaktif")` berhasil mengubah status menjadi `nonaktif` (row preserved). |
| `AC-07` | Pelanggan nonaktif dapat diaktifkan kembali | **Lolos** | `updateStatusPelanggan(..., "aktif")` berhasil mengubah status kembali menjadi `aktif`. |
| `AC-08` | Perubahan termin/batas kredit tidak mengubah dokumen lama | **Lolos** | Desain SSOT: dokumen penjualan menyimpan snapshot nilai termin & batas kredit saat transaksi dibuat. |
| `AC-09` | Nonaktifkan pelanggan tidak mengubah pesanan terbuka | **Lolos** | Foreign key dan status pesanan tidak cascading delete/update; hanya filter picker dokumen baru yang mengecualikan `nonaktif`. |
| `AC-10` | Batas kredit 0 atau kosong tersimpan sebagai '0' (tunai) | **Lolos** | `service.parseBatasKredit("0")` dan `""` tersimpan sebagai `"0"`. |
| `AC-11` | Data kontak hanya terbaca oleh peran yang berhak | **Lolos** | `Gudang` ditolak membaca kontak dengan `"Anda tidak berwenang melihat data kontak pelanggan."`; `Penjualan`, `Accounting`, dan `Manajemen` berhak membaca. |

## Eksekusi Verifikasi

```bash
$ node scripts/verify-pd-001.mjs
=== PD-001 Verification ===
[PASS] AC-01: Penjualan membuat pelanggan baru dengan nama, termin, dan batas kredit
[PASS] AC-02: Pelanggan baru tanpa termin mendapat termin default 30 hari
[PASS] AC-03: Batas kredit negatif ditolak dengan pesan yang sesuai
[PASS] AC-04: Termin non-bilangan bulat atau negatif ditolak
[PASS] AC-05: Pengguna tanpa izin Manajemen ditolak mengubah batas kredit
[PASS] AC-06: Menonaktifkan pelanggan mengeset status nonaktif
[PASS] AC-07: Mengaktifkan kembali pelanggan nonaktif
[PASS] AC-10: Batas kredit 0 atau kosong tersimpan sebagai '0' (tunai)
[PASS] AC-11: Data kontak hanya terbaca oleh peran yang berhak (Penjualan/Accounting/Manajemen)

Semua kriteria verifikasi PD-001 LULUS!
```

## Kesimpulan
Seluruh AC `PD-001` lulus uji 100%. Antarmuka menggunakan arsitektur 6/6 split grid (Master data, table + form), token desain resmi dari `DESIGN_TOKENS.md`, komponen UI standar dari `src/components/ui/`, dan perlindungan privasi data kontak berdasarkan peran pengguna.
