---
id: PG-004
slug: pemilihan-pemasok-harga
title: Pemilihan pemasok dan perbandingan harga
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset # graph (D-03); bukan urutan serial
type: feature
req_status: specified
delivery_status: in_progress
priority: P1 # usulan dari analisis-sia §5.3; belum dikonfirmasi
size: S # usulan agen; belum disetujui
depends_on:
  - PG-001
  - PG-002
  - PG-003
blocks:
  - PG-005
owner_role: pemilik track PG-B (belum ditetapkan)
package: docs/product/items/PG-004-pemilihan-pemasok-harga
---

# PG-004 — Pemilihan pemasok dan perbandingan harga

## Masalah

Setelah permintaan pembelian disetujui, belum ada langkah untuk memilih pemasok dan membandingkan harga barangnya. Akibatnya PO tidak punya dasar pemilihan yang bisa ditelusuri, dan tidak ada catatan mengapa pemasok tertentu dipilih.

## Outcome

Purchasing dapat menetapkan satu pemasok untuk permintaan yang sudah disetujui, membandingkan harga barang antar kandidat, dan melihat riwayat harga. Jika pemasok yang dipilih bukan yang termurah, alasan tertulis wajib diisi. Setelah pemasok ditetapkan, permintaan berpindah ke status `PEMASOK_DITETAPKAN` dan siap untuk PO.

## Aktor

| Aktor | Peran |
|---|---|
| Purchasing | memasukkan harga pembanding, memilih kandidat, dan menetapkan pemasok (`D-33`, "Pilih pemasok") |
| Manajemen | tidak terlibat di langkah ini (`D-33`) |
| Pemohon | dapat membatalkan permintaan sebelum PO terbit (`PG-002`, `D-48`); tidak memilih pemasok |
| Sistem | membaca harga dan riwayat, menolak pilihan yang tidak sah, dan mencatat penetapan |

## Cakupan

### Termasuk

- Pemilihan kandidat pemasok dari master pemasok (`PG-001`), hanya yang aktif (`D-50`).
- Input harga pembanding per barang per pemasok, bertanggal, dalam IDR, net sebelum PPN (`[USULAN-AGEN]` Q-01).
- Tampilan perbandingan harga antar kandidat untuk satu permintaan, dengan harga terendah ditandai.
- Tampilan riwayat harga per barang per pemasok (`[USULAN-AGEN]` Q-02).
- Penetapan satu pemasok untuk seluruh permintaan (`[USULAN-AGEN]` Q-09), dengan alasan bila pemasok bukan harga terendah (`[USULAN-AGEN]` Q-04).

### Tidak termasuk

- Penerbitan PO (`PG-005`).
- Pencocokan harga dengan faktur (`PG-008`).
- Penawaran yang diisi pemasok sendiri. Portal pemasok di luar cakupan (`D-23`).
- Penetapan harga master baru di luar item ini.
- Penggantian pemasok setelah ditetapkan (`D-46`: tidak ada transisi).

## Status dan transisi

Langkah ini hanya berjalan dari permintaan yang sudah disetujui (`PG-003`).

| Dari | Ke | Pemicu | Siapa | Catatan |
|---|---|---|---|---|
| `DISETUJUI` | `PEMASOK_DITETAPKAN` | pilih pemasok | Purchasing | nama status sesuai `D-46` |
| `PEMASOK_DITETAPKAN` | `DITERBITKAN` | PO terbit | Purchasing | di luar item ini (`PG-005`) |
| `PEMASOK_DITETAPKAN` | `DIBATALKAN` | dibatalkan pemohon sebelum PO terbit | pemohon | `D-48`, detail di `PG-002` |

Tidak ada transisi ganti pemasok (`D-46`). Pemasok yang sudah ditetapkan hanya bisa berubah lewat pembatalan permintaan (`PG-002`) dan permintaan baru.

Jalur gagal: permintaan `DIAJUKAN`, `REVISI`, `MENUNGGU_PERSETUJUAN`, `DITOLAK`, atau `DIBATALKAN` tidak bisa dipilih pemasoknya. Perilaku pesan ada di bagian Validasi.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Permintaan belum disetujui | Ditolak dengan pesan "Pemasok hanya bisa dipilih untuk permintaan yang sudah disetujui" `[USULAN]` |
| Harga kosong, nol, atau negatif | Ditolak dengan pesan "Harga harus lebih dari 0" `[USULAN]` |
| Tidak ada kandidat dipilih | Ditolak dengan pesan "Pilih minimal satu pemasok kandidat" `[USULAN]` |
| Pemasok nonaktif dipilih | Ditolak dengan pesan "Pemasok nonaktif tidak bisa dipilih" `[USULAN]` (`D-50`) |
| Pemasok bukan harga terendah tanpa alasan | Ditolak dengan pesan "Alasan pemilihan wajib diisi karena bukan harga terendah" `[USULAN]` (`[USULAN-AGEN]` Q-04) |
| Pengguna tanpa izin memilih | Ditolak dengan pesan izin `[USULAN]`. Izin sesuai `D-33` (Purchasing) |

## Batasan

- Harga yang dibandingkan adalah harga net sebelum PPN (`D-17`). PPN dihitung di dokumen, bukan di sini.
- Mata uang harga pembanding IDR (`D-38`).
- Termin pemasok tidak dipakai di langkah ini (`D-14`).
- Toleransi tidak dipakai di langkah ini (`D-15`).
- Item ini tidak membuat jurnal dan tidak mengubah stok. Akun debit dan kredit tidak berlaku.
- Data pemasok dan produk lewat service core (`D-25`).
- Pemasok yang sudah ditetapkan menjadi dasar PO; perubahannya hanya lewat pembatalan (`PG-002`).

## Dependensi

- `PG-002` (backlog `depends on`): permintaan yang disetujui dan barangnya.
- `PG-001` (backlog `depends on`): master pemasok, termin, dan status aktif.
- `PG-003` (logis, belum di `depends on` backlog): status `DISETUJUI` berasal dari `PG-003` (`[USULAN-AGEN]` Q-10). Lihat `03-readiness-review.md`.
- Gate fondasi `FND-001` sampai `FND-006`. `FND-002` sampai `FND-006` masih `specified` (belum `done`).
- `FND-007` (UI kit): tabel perbandingan dan form. Belum tercantum di `depends on` backlog.

## Yang membuka jalan

- `PG-005` purchase order (backlog `depends on` `PG-004`).

## Catatan serah terima

Keputusan pemilihan (termurah tidak wajib, alasan wajib bila bukan termurah, satu pemasok per permintaan) adalah `[USULAN-AGEN]` dan menunggu kunci koordinator. Item tidak boleh menambah kriteria lain tanpa keputusan baru.
