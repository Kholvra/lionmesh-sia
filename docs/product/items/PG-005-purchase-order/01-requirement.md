---
id: PG-005
slug: purchase-order
title: Purchase order dari permintaan yang disetujui
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset # graph (D-03); bukan urutan serial
type: feature
req_status: specified
delivery_status: not_started
priority: P0 # usulan dari analisis-sia §5.3; belum dikonfirmasi
size: M # usulan agen; belum disetujui
depends_on:
  - PG-003
  - PG-004
blocks:
  - PG-006
owner_role: pemilik track PG-B (belum ditetapkan)
package: docs/product/items/PG-005-purchase-order
---

# PG-005 — Purchase order dari permintaan yang disetujui

## Masalah

Permintaan yang sudah disetujui dan pemasok yang sudah ditetapkan belum bisa menjadi janji tertulis ke pemasok. Tanpa PO, barang yang datang tidak punya dasar untuk dicocokkan, dan pembelian tidak bisa dilacak dari permintaan sampai barang.

## Outcome

Purchasing dapat menerbitkan PO dari permintaan yang pemasoknya sudah ditetapkan. PO memuat barang, qty, harga net, dan PPN per baris. PO berstatus `DITERBITKAN` dan tidak mengubah stok maupun utang. Purchasing dapat mencatat konfirmasi pemasok sebagai catatan. Dokumen PO yang sudah terbit tidak diedit; koreksi dilakukan dengan pembatalan (sebelum ada penerimaan) lalu permintaan baru.

## Aktor

| Aktor | Peran |
|---|---|
| Purchasing | menerbitkan PO, mencatat konfirmasi, dan membatalkan PO sebelum penerimaan (`D-33`, "Terbitkan PO"; `D-48`) |
| Pemasok | menerima PO; tidak punya akun dan tidak berinteraksi langsung dengan sistem (`D-23`). Kirim dan konfirmasi terjadi di luar sistem |
| Sistem | memberi nomor PO dari core, menghitung PPN per baris, menolak perubahan setelah terbit, dan mencatat riwayat |

## Cakupan

### Termasuk

- Penerbitan PO dari permintaan yang berstatus `PEMASOK_DITETAPKAN` (`PG-004`). Satu PO per permintaan (`[USULAN-AGEN]` Q-03).
- Baris PO dengan barang, qty, harga net, dan PPN per baris.
- Status PO sampai `DITERBITKAN`. Status lanjutan mengikuti `D-46` dan dimulai di `PG-006`.
- Catatan konfirmasi pemasok oleh Purchasing (`[USULAN-AGEN]` Q-02).
- Pembatalan PO oleh Purchasing dengan alasan wajib, sebelum penerimaan pertama (`D-48`, `[USULAN-AGEN]` Q-05).

### Tidak termasuk

- Penerimaan barang (`PG-006`).
- QC bahan dan retur (`PG-007`).
- Faktur dan utang pemasok (`PG-008`).
- Pembayaran (`PG-009`).
- Portal pemasok (`D-23`) dan kanal kirim otomatis (`[USULAN-AGEN]` Q-01: kirim di luar sistem).
- Jurnal dan mutasi stok. PO tidak menghasilkannya.
- Revisi PO setelah terbit (`[USULAN-AGEN]` Q-06: tidak ada; koreksi dengan pembatalan atau jurnal pembalik).

## Status dan transisi

Mengikuti state machine `D-46` (`diagram-sia-lengkap.md` §5.2). Transisi pembatalan adalah tambahan `D-48` yang ditandai `[USULAN-AGEN]`.

| Dari | Ke | Pemicu | Siapa | Catatan |
|---|---|---|---|---|
| `PEMASOK_DITETAPKAN` (permintaan) | `DITERBITKAN` (PO) | PO diterbitkan | Purchasing | status yang ditulis item ini (`D-46`) |
| `DITERBITKAN` | `DIBATALKAN` (PO) | dibatalkan dengan alasan, sebelum penerimaan pertama | Purchasing | `D-48`, `[USULAN-AGEN]` |
| `DITERBITKAN` | `DIBATALKAN` (permintaan) | ikut PO | sistem | permintaan tidak bisa menjadi PO baru; pemesanan ulang lewat permintaan baru `[USULAN-AGEN]` |
| `DITERBITKAN` | `DITERIMA_SEBAGIAN` / `DITERIMA` | penerimaan barang | Gudang | di `PG-006`, bukan item ini |

Catatan:
- Tidak ada status "dikirim" atau "dikonfirmasi" untuk PO (`D-46`). Konfirmasi adalah catatan, bukan status.
- Setelah penerimaan pertama, PO tidak bisa dibatalkan. Koreksi lewat jurnal pembalik (`D-43`, `D-48`), didefinisikan di `PG-006` dan `PG-007`.
- Status tidak mundur (`D-48`): PO yang dibatalkan tidak kembali ke `PEMASOK_DITETAPKAN`.

Jalur gagal:
- PO yang gagal terbit tidak meninggalkan dokumen setengah jadi.
- Pembatalan setelah penerimaan pertama: ditolak dengan pesan.
- Pembatalan tanpa alasan: ditolak.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Permintaan ditolak | Ditolak dengan pesan "Permintaan yang ditolak tidak bisa dijadikan PO" `[SUMBER]` §8.1 |
| Permintaan dibatalkan | Ditolak dengan pesan "Permintaan yang dibatalkan tidak bisa dijadikan PO" `[USULAN]` |
| Permintaan belum punya pemasok ditetapkan | Ditolak dengan pesan "Pilih pemasok sebelum menerbitkan PO" `[USULAN]` |
| PO tanpa baris | Ditolak dengan pesan "PO harus memuat minimal satu barang" `[USULAN]` |
| Qty nol atau negatif | Ditolak dengan pesan "Qty harus lebih dari 0" `[USULAN]` |
| Edit PO yang sudah diterbitkan | Ditolak dengan pesan "Dokumen yang sudah diterbitkan tidak bisa diubah. Batalkan dan buat permintaan baru, atau koreksi lewat jurnal pembalik setelah penerimaan" `[USULAN]` |
| Pembatalan tanpa alasan | Ditolak dengan pesan "Alasan pembatalan wajib diisi" `[USULAN]` |
| Pembatalan setelah penerimaan pertama | Ditolak dengan pesan "PO sudah ada penerimaan dan tidak bisa dibatalkan. Koreksi lewat jurnal pembalik" `[USULAN]` |
| Pengguna tanpa izin menerbitkan | Ditolak dengan pesan izin `[USULAN]`. Izin sesuai `D-33` (Purchasing) |
| Tarif PPN tidak ditemukan untuk tanggal PO | Ditolak dengan pesan "Tarif PPN untuk tanggal ini belum tersedia" `[USULAN]` |

## Batasan

- PO tidak menaikkan stok dan tidak menaikkan utang. PO hanya janji (`analisis-sia.md` §6.4, `[ANALISIS]`).
- PO tidak memposting jurnal. Akun debit dan kredit untuk PO tidak berlaku. Sumber angka PO adalah harga net dari penetapan `PG-004` dan tarif PPN dari `konfigurasi_pajak` (`D-17`).
- Tarif PPN berversi: diambil dari versi yang berlaku pada tanggal PO. Nilai awal dari regulasi yang berlaku, diverifikasi dan dikutip sumbernya saat `PD-005` ditulis (`D-51`(a)). Item ini tidak menulis angka tarif.
- Akun PPN masukan: peran `ppn_masukan` (`D-35`). Nomor akun ditetapkan saat `FND-006` ditulis (`D-41`). Dibutuhkan saat `PG-008` memposting.
- Termin tidak disimpan di PO. Termin ada di pemasok dan faktur (`D-14`).
- Mata uang IDR (`D-38`).
- Harga master net, belum PPN (`D-17`).
- Dokumen tidak dihapus (`[USULAN]` §8.2 #9). Pembatalan memberi status `DIBATALKAN` (`D-48`).
- Penomoran lewat `core/dokumen` (`ARCH-05`), format `D-50`.
- Konfirmasi pemasok adalah catatan teks dengan tanggal, bukan status (`[USULAN-AGEN]` Q-02).

## Dependensi

- `PG-003` (backlog `depends on`): permintaan yang disetujui.
- `PG-004` (backlog `depends on`): pemasok yang ditetapkan dan harga pembanding.
- Gate fondasi `FND-001` sampai `FND-006`. `FND-002` sampai `FND-006` masih `specified` (belum `done`).
- Konfigurasi `konfigurasi_pajak` (tarif PPN berversi): diisi tech lead lewat seed (`D-33`). Layar pengelolaan ditunda (`[USULAN-AGEN]` Q-11: tidak perlu layar untuk item ini).
- `FND-007` (UI kit): tabel PO dan form baris. Belum tercantum di `depends on` backlog (lihat `03-readiness-review.md`).

## Yang membuka jalan

- `PG-006` penerimaan barang (backlog `depends on` `PG-005` dan `FND-005`).

## Catatan serah terima

Kanal pengiriman, konfirmasi, dan aturan pembatalan adalah `[USULAN-AGEN]` (Q-01, Q-02, Q-05) dan menunggu kunci koordinator. Angka tarif PPN bukan bagian paket ini.
