# FND-005: integrasi dokumen sumber

## Kondisi saat ini

Operasi inventori manual sudah diuji dengan sesi dan izin Gudang. Integrasi QC diuji dengan dokumen sintetis di lingkungan terisolasi; dokumen dan aksi bisnis sebenarnya belum tersedia. Fixture tidak membuktikan transaksi atomik antara status dokumen dan mutasi stok, maupun keamanan saat permintaan diulang.

## Pekerjaan yang dibutuhkan

Saat item pemilik aksi dan dokumen sumber diimplementasikan, pastikan aksi memeriksa izin dan status dokumen di server, mengambil aktor dari sesi, serta hanya memanggil core untuk mutasi stok. Uji dengan dokumen dan sesi nyata: aksi sah, peran salah, dokumen tidak sah atau belum memenuhi syarat, payload yang dipalsukan, rollback, dan permintaan ulang atau bersamaan. Tentukan mekanisme idempotensi sebelum mengaktifkan retry otomatis.

## Dampak

Bukti pada FND-005 belum menjamin alur dokumen produksi aman atau atomik. Jangan menganggap fixture QC sebagai implementasi atau bukti integrasi fitur bisnis yang sebenarnya.
