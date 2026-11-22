---
id: PD-002
slug: pesanan-penjualan-cek-kredit
title: Pesanan penjualan dan cek batas kredit
epic: EPIC-PD
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: not_started
priority: P0
size: L
depends_on:
  - FND-004
  - PD-001
blocks:
  - PD-003
  - PD-004
owner_role: kelompok Pendapatan, track PD-B (orang belum ditetapkan)
package: docs/product/items/PD-002-pesanan-penjualan-cek-kredit
---

# PD-002 — Pesanan penjualan dan cek batas kredit

## Masalah

Penjualan belum bisa mencatat permintaan pelanggan sebagai dokumen yang bernomor, berstatus, dan terverifikasi. Tanpa cek batas kredit, pelanggan bisa menerima barang melebihi kemampuan bayarnya.

## Outcome

Penjualan membuat pesanan untuk satu pelanggan dengan beberapa baris produk, melihat total (diskon, DPP, PPN, total), lalu mengajukannya untuk verifikasi. Saat verifikasi menemukan exposure pelanggan melewati batas kredit, pesanan berstatus `MENUNGGU_PERSETUJUAN_KREDIT`; hanya Manajemen yang dapat memberi override dengan alasan tertulis, atau membatalkannya.

## Aktor

| Aktor | Peran |
|---|---|
| Penjualan (pembuat) | membuat, mengubah baris selama `DRAFT` atau `REVISI`, membatalkan dengan alasan (`D-48`) |
| Penjualan (verifikator) | memverifikasi atau mengembalikan (`REVISI`) pesanan yang dibuat orang lain (`PQ-09`) |
| Manajemen | memberi override batas kredit atau menolak (membatalkan) pesanan `MENUNGGU_PERSETUJUAN_KREDIT` (`D-16`, `D-47(a)`) |
| Gudang | membaca hasil cek stok dan mengalokasikan (`PD-003`); tidak mengubah pesanan |
| Pelanggan | pihak luar; PO diterima di luar sistem (`analisis-sia.md` §6.2) |

## Cakupan

### Termasuk

- Membuat pesanan dengan nomor dari `core/dokumen` (pola `D-50`).
- Menambah, mengubah, dan menghapus baris selama `DRAFT` atau `REVISI`.
- Termin pesanan terisi dari pelanggan, bisa di-override dengan nilai hari.
- Diskon per baris (`PQ-03`).
- Hitung total: nilai kotor, diskon, DPP, PPN, total.
- Verifikasi oleh Penjualan selain pembuat, dengan cek exposure terhadap batas kredit.
- Override batas kredit oleh Manajemen dengan alasan.
- Pengembalian untuk revisi (`DRAFT → REVISI`) dan verifikasi ulang (`REVISI → VERIFIED`).
- Pembatalan (dibatalkan, tidak dihapus).
- Riwayat status untuk setiap transisi.

### Tidak termasuk

- Cek dan alokasi stok (`PD-003`).
- Pengiriman dan surat jalan (`PD-004`).
- Faktur dan piutang (`PD-005`).
- Kurs dan mata uang asing (`D-38`).
- Harga khusus per pelanggan (`PQ-04`).

## States

Daftar status mengikuti `D-46` (`diagram-sia-lengkap.md` §5.1), ditambah `MENUNGGU_PERSETUJUAN_KREDIT` (`D-47(a)`).

| Dari | Ke | Oleh | Syarat | Riwayat |
|---|---|---|---|---|
| — | `DRAFT` | Penjualan (pembuat) | pelanggan aktif; nomor dari `core/dokumen` | 1 baris |
| `DRAFT` | `DIBATALKAN` | pembuat | alasan wajib | 1 baris |
| `DRAFT` | `REVISI` | verifikator | alasan wajib | 1 baris |
| `REVISI` | `VERIFIED` | verifikator | pembuat sudah mengubah; cek kredit dijalankan ulang | baris `REVISI→VERIFIED` (+ baris kredit bila berlaku) |
| `DRAFT` | `VERIFIED` | verifikator | minimal satu baris, qty > 0; verifikator bukan pembuat | 1 baris |
| `VERIFIED` | `MENUNGGU_PERSETUJUAN_KREDIT` | sistem | dalam transaksi verifikasi: exposure > batas kredit | 1 baris (dicatat setelah `VERIFIED`) |
| `MENUNGGU_PERSETUJUAN_KREDIT` | `VERIFIED` | Manajemen | override dengan alasan | 1 baris |
| `MENUNGGU_PERSETUJUAN_KREDIT` | `DIBATALKAN` | pembuat atau Manajemen | alasan wajib | 1 baris |
| `VERIFIED` | `MENUNGGU_STOK` / `SIAP_KIRIM` | Gudang via `PD-003` | hasil cek alokasi | 1 baris |
| `VERIFIED` | `DIBATALKAN` | pembuat | `[USULAN-AGEN]` `PQ-06`: belum ada pengiriman; alasan wajib; alokasi dilepas | 1 baris |
| `MENUNGGU_STOK` | `SIAP_KIRIM` | sistem via `PD-003` | seluruh baris teralokasi | 1 baris |
| `SIAP_KIRIM` / `TERKIRIM_SEBAGIAN` | `TERKIRIM_SEBAGIAN` / `TERKIRIM` | `PD-004` | sesuai qty kirim kumulatif | 1 baris |
| `TERKIRIM` | `DIFAKTURKAN` | sistem via `PD-005` | seluruh pengiriman pesanan sudah difakturkan | 1 baris |
| `DIFAKTURKAN` | `SELESAI` | sistem via `PD-006` | seluruh faktur pesanan lunas | 1 baris |

Pesanan `VERIFIED` tidak diubah isinya (lihat AC). Setiap perubahan status menulis satu baris `riwayat_status` dengan aktor dan waktu (`D-08`).

## Rumus total

Per baris: nilai kotor = qty × harga; diskon = nilai kotor × persen diskon; DPP baris = nilai kotor − diskon; PPN baris = DPP baris × tarif T dari `konfigurasi_pajak` yang berlaku pada tanggal verifikasi (`D-51(a)`); dibulatkan ke dua desimal per baris.
Per pesanan: subtotal = Σ nilai kotor; diskon = Σ diskon; DPP = Σ DPP baris; PPN = Σ PPN baris; total = DPP + PPN.

## Exposure dan batas kredit (`D-16`)

Exposure pelanggan = Σ sisa piutang faktur `DITERBITKAN`/`SEBAGIAN_LUNAS` + Σ nilai belum difakturkan pesanan pelanggan pada status `VERIFIED`, `MENUNGGU_STOK`, `SIAP_KIRIM`, `TERKIRIM_SEBAGIAN`, `TERKIRIM` (`[USULAN-AGEN]` `PQ-05`).
Pesanan ditahan jika exposure (termasuk total pesanan yang sedang diverifikasi) > batas kredit. Batas 0 berarti setiap pesanan dengan total > 0 ditahan.

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Pesanan tanpa baris diverifikasi | "Pesanan belum punya barang. Tambahkan minimal satu baris." |
| Qty nol atau negatif | "Jumlah harus lebih dari nol." |
| Diskon di luar 0–100 | "Diskon harus antara 0 dan 100 persen." |
| Termin kosong dan pelanggan tidak punya termin | "Termin pembayaran wajib diisi." |
| Verifikator sama dengan pembuat | "Pembuat pesanan tidak dapat memverifikasi pesanannya sendiri." |
| Verifikasi pesanan yang bukan `DRAFT` atau `REVISI` | "Pesanan ini tidak dalam status yang bisa diverifikasi." |
| Verifikasi pesanan yang sudah diproses bersamaan | "Dokumen sudah diproses. Muat ulang halaman." |
| Override tanpa alasan | "Alasan override batas kredit wajib diisi." |
| Override oleh bukan Manajemen | "Hanya Manajemen yang dapat menyetujui melewati batas kredit." |
| Pembatalan atau pengembalian tanpa alasan | "Alasan pembatalan wajib diisi." / "Alasan pengembalian wajib diisi." |
| Ubah isi pesanan yang `VERIFIED` atau `MENUNGGU_PERSETUJUAN_KREDIT` | "Pesanan yang sudah diverifikasi tidak dapat diubah. Batalkan lalu buat pesanan baru." |
| Pesanan dibatalkan diverifikasi | "Pesanan dibatalkan tidak dapat diverifikasi." |
| Pesanan setelah ada pengiriman dibatalkan | "Pesanan sudah memiliki pengiriman dan tidak dapat dibatalkan." |
| Pelanggan nonaktif dipilih | "Pelanggan tidak aktif dan tidak bisa dipakai untuk pesanan baru." |
| Exposure melewati batas | "Pelanggan melewati batas kredit. Pesanan menunggu persetujuan Manajemen." |

## Batasan

- Pelanggan nonaktif tidak bisa dipilih (`PD-001`, `D-50`).
- Modul tidak menulis ke tabel stok atau jurnal (`ARCH-03`, `ARCH-04`).
- Modul tidak membaca tabel modul lain (`D-25`). Exposure dibaca lewat service core piutang (`PD-005` menyediakannya) dan pesanan milik modul ini sendiri.
- Pesanan tidak dihapus; salah input dibatalkan (`D-48`).

## Dependensi

- `PD-001` — pelanggan, termin, batas kredit.
- `FND-004` — nomor, status, riwayat, approval.
- Gate fondasi `FND-001`–`FND-006` dan `FND-007` (tabel, form, status badge).

## Yang membuka jalan

- `PD-003` — alokasi stok untuk pesanan `VERIFIED`.
- `PD-004` — pengiriman dari pesanan yang dialokasikan.

## Catatan serah terima

Status mengikuti `D-46` dan `D-47(a)`. Dua aturan di atas bersifat `[USULAN-AGEN]` (`PQ-05`, `PQ-06`) dan `PQ-09` menunggu kunci koordinator. Baris matriks untuk "override batas kredit" (Manajemen) belum ada; ditambahkan lewat `FND-003` sebagai revisi `D-33`.
