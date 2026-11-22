# Matriks Izin v0 (`D-33`)

Baseline hak aksi untuk 12 akun staf ditambah peran **Karyawan** self-service (`D-53`). Pelanggan dan pemasok tidak punya akun.

Diturunkan dari usulan di `reference/analisis-sia.md` §3.3, dengan tiga koreksi (ditandai **←**). Direvisi lewat `FND-003` atau keputusan baru.

## Peran (12 staf + 1 self-service)

Penjualan · Pengiriman · Gudang · Purchasing · QC · Produksi · Accounting · Finance · Manajemen · Direksi · HR · Supervisor Lapangan · Karyawan (hanya presensi dan lembur miliknya sendiri)

## Prinsip

Yang **mengeksekusi** dan yang **memverifikasi** bukan orang yang sama. Direksi dan Manajemen hanya menyetujui. Accounting tidak mengeksekusi pembayaran.

## Pendapatan

| Aksi | Boleh |
|---|---|
| Buat / ubah pelanggan | Penjualan |
| Buat pesanan | Penjualan |
| Verifikasi pesanan | Penjualan, pengguna berbeda dari pembuat pesanan (`D-48`, `D-57`) |
| Batalkan pesanan (sebelum diposting) | Penjualan (pembuatnya) |
| Ubah batas kredit pelanggan, override kredit per pesanan | Manajemen |
| Setujui retur penjualan | Accounting |
| Periksa QC barang retur | QC |
| Lihat laporan kas | Accounting, Manajemen |
| Cek & alokasi stok | Gudang |
| Buat pengiriman | Gudang, Pengiriman |
| Terbitkan faktur | Accounting |
| Lihat piutang | Accounting, Manajemen |
| Catat pembayaran | Finance |
| Verifikasi pembayaran | Accounting |
| Lihat laporan penjualan | Penjualan, Accounting, Manajemen |

## Pengeluaran

| Aksi | Boleh |
|---|---|
| Buat / ubah pemasok | Purchasing |
| Ajukan PR | Gudang, Produksi |
| Periksa PR | Purchasing |
| Setujui PR | Manajemen |
| Pilih pemasok, terbitkan PO | Purchasing |
| Catat penerimaan | Gudang |
| Catat QC | QC |
| Cocokkan dokumen | Purchasing |
| Sahkan pencocokan | Accounting |
| Catat invoice & utang | Accounting |
| Verifikasi pembayaran pemasok (`D-47`) | Accounting |
| Bayar pemasok | Finance |
| Rekonsiliasi bank **←** (baris baru, default) | Accounting |
| Lihat laporan pembelian | Purchasing, Accounting, Manajemen |

## Produksi

| Aksi | Boleh |
|---|---|
| Kelola data produk, buat perintah produksi, ajukan permintaan bahan | Produksi |
| Cek ketersediaan bahan, terima bahan, terima barang jadi | Gudang |
| Verifikasi permintaan bahan | Purchasing |
| Setujui pembelian bahan | Manajemen |
| Catat pemakaian bahan **←** | Gudang mencatat **keluar**, Produksi mengonfirmasi **terpakai** (dua langkah) |
| Catat hasil produksi | Produksi |
| Periksa QC hasil | QC |
| Catat biaya produksi | Accounting |
| Lihat laporan produksi | Produksi, Gudang, Manajemen, Accounting |

## Penggajian

| Aksi | Boleh |
|---|---|
| Kelola data karyawan | HR |
| Catat presensi / ajukan lembur (`D-53`) | Karyawan, untuk dirinya sendiri; HR atas nama karyawan atau untuk koreksi dengan otorisasi khusus |
| Rekap presensi | HR |
| Validasi presensi | Supervisor Lapangan |
| Hitung draft payroll | HR |
| Periksa payroll (angka) | Accounting |
| Setujui payroll | Direksi |
| Cek dana & bayar | Finance |
| Terbitkan slip | HR |
| Jurnal payroll | Accounting |
| Lihat laporan payroll | HR, Accounting, Direksi |

## Belum punya baris (default sementara, ditegaskan saat spec item)

| Aksi | Default |
|---|---|
| Retur penjualan / retur ke pemasok | ditentukan di `PD-007` / `PG-007` |
| Tutup / buka periode akuntansi | ditentukan di `C-010` |
| Kelola konfigurasi (tarif pajak, tarif payroll, ambang approval, COA) | di-seed tech lead; layar pengelolaan ditunda sampai ada item yang memintanya |
| Kelola akun pengguna | tech lead; tidak ada peran administrator sampai ada kebutuhan |

## Pemisahan tugas yang ditegakkan sistem (`D-42`)

| Aturan | Cara ditegakkan |
|---|---|
| Pemohon PR tidak boleh menyetujui PR-nya sendiri | cek pengguna pemohon saat persetujuan |
| Pemohon PR tidak boleh membayar invoice dari PR itu | telusuri invoice → PO → PR, tolak bila pengguna sama |
| Penghitung gaji tidak boleh membayar gaji | cek pengguna saat pembayaran |
| Pembuat pesanan penjualan tidak boleh mengirim barangnya | cek pengguna saat pengiriman |

Catatan: rancangan proses bisnis awal punya peran **Admin** untuk seluruh bagian. Peran ke-13 hanya Karyawan (`D-53`), tidak ada Admin; konfigurasi dan akun dikelola tech lead sampai ada kebutuhan.

## Tambahan default (`D-58`)

| Aksi | Boleh |
|---|---|
| Ubah dan batalkan perintah produksi | Produksi |
| Lihat BOM dan versinya | Produksi, Gudang, Purchasing, Manajemen, Accounting |
| Catat kartu jam kerja per perintah produksi | Produksi |
| Tetapkan tarif overhead dan kapasitas normal | Accounting |
| Lihat HPP perintah produksi | Produksi, Accounting, Manajemen |
| Transfer antar gudang, opname, penyesuaian stok | Gudang |
| Tutup exception selisih penerimaan | Purchasing |
| Ajukan retur ke pemasok | Purchasing |
| Setujui retur ke pemasok | Accounting |
| Catat pengeluaran fisik retur | Gudang |
