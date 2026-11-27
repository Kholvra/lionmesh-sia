---
id: PD-004
slug: pengiriman-surat-jalan
title: Pengiriman dan surat jalan
epic: EPIC-PD
milestone: M1
lane: active
sequence: unset
type: feature
req_status: validated
delivery_status: done
priority: P0
size: M
depends_on:
  - PD-002
  - PD-003
blocks:
  - PD-005
  - PD-008
owner_role: kelompok Pendapatan, track PD-B (orang belum ditetapkan)
package: docs/product/items/PD-004-pengiriman-surat-jalan
---

# PD-004 — Pengiriman dan surat jalan

## Masalah

Barang keluar gudang tanpa dokumen yang mencatat apa yang dikirim, kepada siapa, dan kapan pelanggan menerimanya. Stok berkurang tanpa jejak, dan tagihan tidak punya dasar.

## Outcome

Gudang atau Pengiriman membuat pengiriman dari pesanan yang dialokasikan. Saat pengiriman dikirim (`DIKIRIM`), stok fisik berkurang, alokasi sebesar qty kirim dilepas, surat jalan terbit, dan status pesanan berubah. Setelah pelanggan menerima barang, pengiriman dicatat `DITERIMA` dengan bukti terima. Pengiriman `DIKIRIM` menjadi dasar faktur (`PD-005`).

## Aktor

| Aktor | Peran |
|---|---|
| Gudang | membuat dan mengirim pengiriman; mencatat bukti terima (`D-33`) |
| Pengiriman | membuat dan mengirim pengiriman; mencatat bukti terima (`D-33`) |
| Pembuat pesanan | tidak boleh mengirim barang pesanannya sendiri (`D-42`) |
| Penjualan | melihat status pengiriman di pesanan |
| Pelanggan | pihak luar; menerima barang fisik, tanpa akun |

## Cakupan

### Termasuk

- Membuat pengiriman dari baris pesanan `SIAP_KIRIM` atau `TERKIRIM_SEBAGIAN`.
- Mengisi qty kirim per baris, tidak melebihi alokasi aktif baris.
- Mengirim pengiriman: mengurangi stok fisik, melepas alokasi, menerbitkan surat jalan, memperbarui status pesanan.
- Mencatat bukti terima (`DITERIMA`).
- Pembatalan pengiriman yang masih `DRAFT`.

### Tidak termasuk

- Faktur (`PD-005`).
- Retur penjualan (`PD-007`); koreksi barang kembali dilakukan di sana.
- Jurnal HPP (`PD-008`); item ini hanya memicu kejadian stok.
- Transfer antar gudang.

## States

Status pengiriman (`D-47(b)`):

| Dari | Ke | Oleh | Syarat | Efek |
|---|---|---|---|---|
| — | `DRAFT` | Gudang atau Pengiriman | pesanan `SIAP_KIRIM` atau `TERKIRIM_SEBAGIAN` | belum ada efek stok |
| `DRAFT` | `DIKIRIM` | Gudang atau Pengiriman, bukan pembuat pesanan | seluruh baris qty kirim valid (`Aturan`) | stok keluar; alokasi dilepas; surat jalan terbit; status pesanan |
| `DRAFT` | `DIBATALKAN` | Gudang atau Pengiriman; alasan wajib | — | tidak ada efek stok |
| `DIKIRIM` | `DITERIMA` | Gudang atau Pengiriman | tanggal terima dan nama penerima (`[USULAN-AGEN]`) | tidak mengubah stok atau jurnal |

Status pesanan setelah `DIKIRIM` (`D-46`): `SIAP_KIRIM → TERKIRIM_SEBAGIAN` bila ada baris belum penuh; `SIAP_KIRIM` atau `TERKIRIM_SEBAGIAN → TERKIRIM` bila seluruh baris terkirim penuh.

Setiap transisi menulis `riwayat_status` dengan aktor dan waktu (`D-08`).

## Aturan pengiriman

- Qty kirim per baris > 0 dan ≤ alokasi aktif baris (`[USULAN-AGEN]` `PQ-05`).
- Qty kirim kumulatif per baris (seluruh pengiriman `DIKIRIM`) ≤ qty pesanan (`PQ-02`).
- Nilai keluar per baris = qty kirim × harga rata saat pengiriman (`D-10`).
- Saldo fisik per produk per gudang ≥ qty kirim; bila tidak, pengiriman ditolak.
- Pengiriman `DIKIRIM` tidak diubah qty atau barisnya.

## Validations

| Kondisi gagal | Pesan yang terlihat |
|---|---|
| Pesanan belum terverifikasi | "Pesanan belum terverifikasi. Pengiriman tidak dapat dibuat." |
| Qty kirim melebihi alokasi | "Qty kirim melebihi stok yang dialokasikan untuk pesanan." |
| Qty kirim melebihi sisa pesanan | "Qty kirim melebihi sisa jumlah pesanan." |
| Qty kirim nol | "Jumlah kirim harus lebih dari nol." |
| Saldo fisik tidak cukup | "Saldo fisik tidak cukup untuk pengiriman ini." |
| Pembuat pesanan mencoba mengirim | "Pembuat pesanan tidak dapat mengirim barang untuk pesanannya sendiri." |
| Ubah pengiriman yang sudah `DIKIRIM` | "Pengiriman sudah dikirim dan tidak dapat diubah." |
| Batalkan pengiriman yang sudah `DIKIRIM` | "Pengiriman yang sudah dikirim tidak dapat dibatalkan. Gunakan retur penjualan." |
| Batalkan tanpa alasan | "Alasan pembatalan wajib diisi." |
| Bukti terima tanpa tanggal atau nama penerima | "Tanggal terima dan nama penerima wajib diisi." |
| Konfirmasi bersamaan | "Dokumen sudah diproses. Muat ulang halaman." |

## Batasan

- Stok fisik hanya berubah lewat `core/inventory` (`ARCH-04`).
- Nomor dan riwayat lewat `core/dokumen` (`ARCH-05`).
- Modul tidak membaca tabel modul lain (`D-25`).
- Bukti terima tidak berupa berkas (`[USULAN-AGEN]` `PQ-03`).

## Dependensi

- `PD-002` — pesanan terverifikasi.
- `PD-003` — alokasi stok.
- Gate fondasi `FND-001`–`FND-006` dan `FND-007`.

## Yang membuka jalan

- `PD-005` — faktur dari pengiriman `DIKIRIM`.
- `PD-008` — jurnal HPP saat pengiriman.

## Catatan serah terima

Dua aturan `[USULAN-AGEN]` (`PQ-03`, `PQ-05`, `PQ-06`) dan `PQ-02` (batas jumlah pengiriman) menunggu kunci koordinator.
