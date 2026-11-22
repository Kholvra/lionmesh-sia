# PD-002 — Diskusi

## Konteks

Pesanan penjualan adalah dokumen pertama di alur pendapatan (`analisis-sia.md` §6.2). Pelanggan mengirim PO, Penjualan mencatatnya, lalu pesanan diverifikasi dan dicek kreditnya. Pesanan ini memicu cek stok (`PD-003`) dan pengiriman (`PD-004`). Item ini adalah track PD-B transaksi, level 2, dengan dependensi `PD-001` dan `FND-004` (dokumen: nomor, status, riwayat, approval).

## Actor / consumer

Penjualan (membuat pesanan; verifikasi oleh Penjualan lain, lihat `PQ-06`). Manajemen (override batas kredit, `D-16`). Gudang membaca dan mengalokasikan stok lewat `PD-003`.

## Problem

Tanpa pesanan terstruktur, dua pesanan bisa menjanjikan barang yang sama, nilai tagihan bisa melebihi kemampuan bayar pelanggan, dan tidak ada jejak siapa yang memverifikasi.

## Desired outcome

Pesanan dengan baris produk, diskon, PPN, dan total dibuat dan diverifikasi. Jika exposure pelanggan melewati batas kredit, pesanan berstatus `MENUNGGU_PERSETUJUAN_KREDIT` dan hanya Manajemen yang dapat memberi override dengan alasan, atau membatalkannya.

## Known constraints

- `D-14`: termin pesanan default dari pelanggan, bisa di-override per pesanan.
- `D-16`: exposure = piutang + pesanan terbuka. Blokir + override per pesanan dengan alasan.
- `D-17`: harga master bersih (belum PPN). PPN dihitung di dokumen. Tarif dari `konfigurasi_pajak` berversi (`D-51(a)`).
- `D-08`: setiap perubahan status masuk `riwayat_status`.
- `D-37`: mesin approval berjenjang hanya dipakai `PG-003`, `PR-003`, dan `GJ-005` (bukan pesanan).
- `D-42`, `D-48`: pemisahan tugas; pemohon tidak menyetujui dokumen miliknya.
- `D-46`, `D-47(a)`: daftar status pesanan dan titik masuk `MENUNGGU_PERSETUJUAN_KREDIT`.
- `D-38`: transaksi IDR; kurs di luar cakupan.

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka.

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-01` | Daftar status sah pesanan? | Terjawab — D-46 + D-47(a): `DRAFT`, `REVISI`, `VERIFIED`, `MENUNGGU_PERSETUJUAN_KREDIT`, `MENUNGGU_STOK`, `SIAP_KIRIM`, `TERKIRIM_SEBAGIAN`, `TERKIRIM`, `DIFAKTURKAN`, `SELESAI`, `DIBATALKAN`. Nama mengikuti D-46 dan tidak diubah. Urutan titik kredit: `VERIFIED` dicatat dulu, lalu cek kredit dalam transaksi yang sama (`D-47(a)` dibaca sebagai titik verifikasi; lihat "Pertentangan"). |
| `PQ-02` | Apakah pesanan memerlukan approval berjenjang nominal (C3)? | Terjawab — [USULAN-AGEN]: tidak ada approval berjenjang nominal untuk pesanan; verifikasi tunggal oleh Penjualan selain pembuat, ditambah cek kredit (`D-16`). Alasan: `D-37` dan `D-51(c)` hanya menyebut PR, payroll, dan pemasok; makalah UC-PD03 tanpa tingkat nominal. |
| `PQ-03` | Jenis diskon: per item, per dokumen, atau per pelanggan? | Terjawab — [USULAN-AGEN]: diskon per baris, dinyatakan persen (0–100) dari nilai kotor baris. Alasan: satu-satunya sumber adalah usulan `analisis-sia.md` §8.2 #14; diskon per dokumen dan per pelanggan tidak diperlukan untuk versi awal. |
| `PQ-04` | Sumber harga jual per produk? | Terjawab — [USULAN-AGEN]: harga diambil dari master produk di `C-011` (harga net, `D-17`), disalin ke baris saat pesanan dibuat; harga baris boleh diubah selama `DRAFT`; tidak ada daftar harga per pelanggan di versi awal. Alasan: `D-17` menetapkan harga master, dan harga khusus tidak punya sumber. |
| `PQ-05` | Status mana saja yang masuk "pesanan terbuka" pada exposure? | Terjawab — [USULAN-AGEN]: exposure dihitung dari sisa piutang faktur (`DITERBITKAN`, `SEBAGIAN_LUNAS`) ditambah nilai pesanan yang belum difakturkan pada status `VERIFIED`, `MENUNGGU_STOK`, `SIAP_KIRIM`, `TERKIRIM_SEBAGIAN`, `TERKIRIM`. Nilai belum difakturkan dipakai agar tidak ada penghitungan ganda dengan piutang. |
| `PQ-06` | Apakah pesanan boleh diubah setelah diverifikasi? | Terjawab — [USULAN-AGEN]: pesanan `VERIFIED` tidak diubah diam-diam. Koreksi dilakukan dengan membatalkan pesanan (`VERIFIED` → `DIBATALKAN`, alasan wajib, alokasi dilepas) sebelum pengiriman pertama, lalu membuat pesanan baru. Alasan: `D-48` mengizinkan pembatalan sebelum posting; `D-46` tidak memuat transisi ini, sehingga ditulis sebagai usulan (lihat "Pertentangan"). |
| `PQ-07` | Pesanan dalam mata uang asing di Fase 1? | Terjawab — D-38: transaksi IDR; mata uang dan kurs hanya master sampai ada kebutuhan. |
| `PQ-08` | Batas kredit 0 saat membuat pesanan: ditahan atau langsung diblokir? | Terjawab — D-16: pesanan ditahan di `MENUNGGU_PERSETUJUAN_KREDIT` sampai override dengan alasan. |

Tambahan (dari pertentangan `D-48` vs matriks, lihat di bawah):

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-09` | Boleh pembuat pesanan memverifikasi pesanannya sendiri? | Terjawab — [USULAN-AGEN]: tidak. `D-48` melarang pemohon menyetujui dokumen miliknya, dan `matriks-izin.md` baris "Buat dan verifikasi pesanan" tetap berlaku untuk peran Penjualan, dengan verifikator berbeda orang. Alasan: menjaga baseline `D-33` tanpa melanggar `D-48`. |

## Decisions

| ID | Decision | Sumber | Consequence |
|---|---|---|---|
| `D-14` | termin default 30 hari, override per pesanan | decisions.md | termin pesanan wajib terisi |
| `D-16` | blokir + override dengan alasan | decisions.md | status `MENUNGGU_PERSETUJUAN_KREDIT` |
| `D-17` | harga bersih, PPN di dokumen | decisions.md | PPN tidak disimpan di header tanpa detail baris |
| `D-46` | state machine pesanan | decisions.md | daftar status |
| `D-47(a)` | penambalan `MENUNGGU_PERSETUJUAN_KREDIT` | decisions.md | kembali ke `VERIFIED` (override) atau `DIBATALKAN` |
| `D-48` | pembatalan, revisi, approval | decisions.md | alasan wajib; pemohon tidak menyetujui dokumennya |

## Assumptions (agent-proposed)

- `[USULAN]` Pesanan dibuat per pelanggan dengan banyak baris; tiap baris punya produk, qty, harga, diskon, dan tarif PPN yang sama untuk seluruh baris.
- `[USULAN]` Pesanan menyimpan tarif yang berlaku saat verifikasi; faktur (`PD-005`) memakai tarif saat terbit dan itulah yang mengikat.
- `[USULAN]` Pengiriman pesanan dapat bertahap (`PD-004`); pesanan tidak ditutup pada pengiriman pertama.

## Rejected alternatives

- Stok dikurangi saat pesanan dibuat: ditolak. `EPIC-PD`: stok berkurang saat pengiriman. Alokasi (`PD-003`) hanya mengurangi "tersedia".
- Batas kredit dihitung hanya dari piutang, tanpa pesanan terbuka: ditolak. `D-16` memasukkan pesanan terbuka.

## Pertentangan antar keputusan terkunci (untuk koordinator)

1. `D-46` tidak memuat transisi `VERIFIED → DIBATALKAN`, sedangkan `D-48` mengizinkan pembatalan sebelum posting. Ditulis sebagai `[USULAN-AGEN]` (`PQ-06`).
2. `D-47(a)` menulis "dari `VERIFIED` bila exposure melebihi batas", sedangkan `D-16` dan makalah menjalankan cek kredit saat verifikasi. Dibaca literal: `VERIFIED` dicatat lalu cek kredit dalam transaksi yang sama, sehingga `MENUNGGU_PERSETUJUAN_KREDIT` lahir dari `VERIFIED`. Tidak ada usulan baru; perlu dikonfirmasi.
3. `D-48` melarang pemohon menyetujui dokumen miliknya; `matriks-izin.md` memberi Penjualan "buat dan verifikasi pesanan" sebagai pengecualian sadar. Diselesaikan dengan verifikator berbeda orang (`PQ-09`).
4. Makalah memakai status "Menunggu Verifikasi", "Terverifikasi", "Perlu Konfirmasi Ulang", "Perlu Koordinasi dengan Produksi", dan "Siap Dikirim". `D-46` menang.

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item menunggu dependensi `PD-001`, `FND-004`, dan gate fondasi (lihat `03-readiness-review.md`).
