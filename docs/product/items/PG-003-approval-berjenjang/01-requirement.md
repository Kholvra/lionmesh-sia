---
id: PG-003
slug: approval-berjenjang
title: Review dan approval permintaan pembelian berjenjang
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset # graph (D-03); bukan urutan serial
type: feature
req_status: specified
delivery_status: in_progress
priority: P0 # usulan dari analisis-sia §5.3; belum dikonfirmasi
size: M # usulan agen; belum disetujui
depends_on:
  - FND-004
  - PG-002
blocks:
  - PG-004
  - PG-005
owner_role: pemilik track PG-B (belum ditetapkan)
package: docs/product/items/PG-003-approval-berjenjang
---

# PG-003 — Review dan approval permintaan pembelian berjenjang

## Masalah

Permintaan pembelian yang diajukan belum punya pemeriksaan dan persetujuan. Tanpa itu, setiap permintaan bisa langsung menjadi PO, dan tidak ada jejak siapa yang memutuskan dan atas dasar nilai berapa.

## Outcome

Permintaan pembelian melewati dua tahap: review oleh Purchasing (dengan estimasi nilai), lalu approval oleh Manajemen. Jenjang yang dilalui ditentukan oleh nilai sesuai aturan yang tersimpan sebagai data. Setiap keputusan tercatat dengan siapa dan kapan. Permintaan yang ditolak berhenti dan tidak bisa menjadi PO.

## Aktor

| Aktor | Peran |
|---|---|
| Purchasing | memeriksa permintaan, mengisi estimasi nilai, meneruskan atau mengembalikannya (`D-33`, "Periksa PR") |
| Manajemen | menyetujui atau menolak permintaan per jenjang (`D-33`, "Setujui PR"). Direksi tidak punya baris PR |
| Pemohon | menerima hasil keputusan; tidak menyetujui permintaannya sendiri (`D-42`, `D-48`) |
| Sistem | menentukan jenjang dari aturan, menggugurkan approval saat revisi, dan mencatat setiap keputusan |

## Cakupan

### Termasuk

- Tahap review oleh Purchasing dan tahap approval oleh Manajemen. Review wajib untuk semua nilai (`D-46`).
- Estimasi nilai PR (IDR) diisi Purchasing saat pemeriksaan (`[USULAN-AGEN]` Q-07).
- Jenjang approval dari aturan per jenjang (`aturan_approval`). Seed v0: satu jenjang Manajemen untuk semua nilai (`D-51`(c)). Mesin mendukung N jenjang (`D-37`).
- Keputusan setujui dan tolak, dengan alasan penolakan.
- Jejak setiap keputusan dengan aktor, waktu, jenjang, dan keputusan.
- Antrean approval untuk setiap peran.
- Gugurnya approval saat pemohon merevisi dokumen (`D-48`, lihat `PG-002`).

### Tidak termasuk

- Mesin approval generik yang dipakai dokumen lain. Satu mesin di `FND-004` (`D-37`). PG-003 hanya mengisi aturan dan layar.
- Pembuatan PO setelah disetujui (`PG-005`).
- Pemilihan pemasok (`PG-004`).
- Approval pembelian bahan oleh Manajemen di siklus Produksi. Memakai mesin yang sama (`D-37`, `PR-003`).
- Ambang nominal dan jumlah jenjang final. Data bisnis; seed ditandai belum final (`D-37`).

## Status dan transisi

Mengikuti state machine `D-46` (`diagram-sia-lengkap.md` §5.2). Tidak ada status baru: jenjang antara tercatat di riwayat keputusan, bukan di status (`[USULAN-AGEN]` Q-12).

| Dari | Ke | Pemicu | Siapa | Catatan |
|---|---|---|---|---|
| `DIAJUKAN` | `MENUNGGU_PERSETUJUAN` | diperiksa dan diteruskan, dengan estimasi nilai terisi | Purchasing | review wajib untuk semua nilai (`D-46`) |
| `DIAJUKAN` | `REVISI` | dikembalikan | Purchasing | dari `DIAJUKAN` saja (`D-46`) |
| `MENUNGGU_PERSETUJUAN` | (tetap) | jenjang antara lulus | Manajemen | dicatat di riwayat keputusan; tidak mengubah status (`[USULAN-AGEN]` Q-12) |
| `MENUNGGU_PERSETUJUAN` | `DISETUJUI` | jenjang terakhir lulus | Manajemen | hanya bila semua jenjang yang disyaratkan lulus (`D-46`) |
| `MENUNGGU_PERSETUJUAN` | `DITOLAK` | ditolak dengan alasan | Manajemen | final; tidak bisa menjadi PO (`D-46`) |
| `MENUNGGU_PERSETUJUAN` | `DIBATALKAN` | dibatalkan pemohon | pemohon | `D-48`, detail di `PG-002` |
| `DISETUJUI` | `DIAJUKAN` | pemohon merevisi; approval gugur | pemohon | `D-48`, detail di `PG-002`; approval diulang dari awal |

Catatan:
- Purchasing tidak dapat menolak. Purchasing hanya meneruskan atau mengembalikan.
- Dari `MENUNGGU_PERSETUJUAN` tidak ada transisi `REVISI` oleh approver (`D-46`).
- Keputusan approval menulis baris riwayat (`D-08`).

Jalur gagal:
- Approval pada permintaan yang statusnya sudah berubah oleh pengguna lain: ditolak dengan pesan, status tidak berubah (`[USULAN-AGEN]` Q-10).
- Nilai tanpa aturan jenjang: ditolak (lihat Validasi).
- Penyimpanan keputusan gagal di tengah: status dan riwayat tidak berubah sebagian.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Tolak tanpa alasan | Ditolak dengan pesan "Alasan penolakan wajib diisi" `[USULAN]` |
| Pemohon menyetujui permintaannya sendiri | Ditolak dengan pesan "Pemohon tidak dapat menyetujui permintaannya sendiri" `[USULAN]`, dengan rujukan aturan pemisahan tugas `D-42` |
| Approver jenjang berikutnya sama dengan jenjang sebelumnya | Ditolak dengan pesan "Jenjang berikutnya harus disetujui orang yang berbeda" `[USULAN]` (`[USULAN-AGEN]` Q-13) |
| Pengguna tanpa peran tahap ini | Ditolak dengan pesan "Anda tidak berwenang memproses tahap ini" `[USULAN]` |
| Nilai tidak punya aturan jenjang | Ditolak dengan pesan "Aturan approval untuk nilai ini belum ada" `[USULAN]` |
| Estimasi nilai kosong saat diteruskan | Diperlakukan sebagai 0 dan masuk jenjang tunggal seed (`[USULAN-AGEN]` Q-07) |
| Permintaan sudah diproses pengguna lain | Ditolak dengan pesan "Permintaan sudah diproses oleh pengguna lain" `[USULAN]` (`[USULAN-AGEN]` Q-10) |

## Batasan

- Permintaan yang `DITOLAK` tidak bisa kembali ke status disetujui dan tidak bisa menjadi PO (`analisis-sia.md` §8.1, `[SUMBER]`).
- Aturan approval berasal dari data `aturan_approval`, bukan dari kode (`[USULAN]` §8.2 #10, `D-37`). Rentang per jenjang: `min` inklusif, `max` eksklusif, `max` kosong berarti tanpa batas (`[USULAN-AGEN]` Q-12).
- Seed v0 (`D-51`(c)): satu jenjang, pemutus Manajemen, semua nilai. Ditandai belum final.
- Item ini tidak membuat jurnal. Akun debit dan kredit tidak berlaku. Ambang adalah parameter, bukan nilai yang diposting.
- Mata uang ambang dan estimasi nilai IDR (`D-38`).
- Identitas approver diambil dari sesi (`ARCH-001` BOUNDARY-02).
- Riwayat keputusan tidak diubah setelah tercatat (`ARCH-001` INV-05).
- Pemisahan tugas: pemohon tidak menyetujui dokumen miliknya; approver berbeda per jenjang (`D-42`, `D-48`, `[USULAN-AGEN]` Q-13).

## Dependensi

- `PG-002` (backlog `depends on`): permintaan yang diperiksa dan disetujui.
- `FND-004` (backlog `depends on`): dokumen, penomoran, status, riwayat, dan approval berjenjang. Satu mesin approval di sana (`D-37`). Status `specified` (belum `done`).
- Gate fondasi `FND-001` sampai `FND-006`.
- `FND-007` (UI kit): antrean approval memakai tabel dan dialog. Belum tercantum di `depends on` backlog (lihat `03-readiness-review.md`).
- `C-012` untuk notifikasi: tidak menjadi dependensi (`[USULAN-AGEN]` Q-11).

## Yang membuka jalan

- `PG-005` purchase order (backlog `depends on` `PG-003`).

## Catatan serah terima

Nilai ambang final, jumlah jenjang, dan pemutus per jenjang adalah keputusan bisnis Manajemen di luar paket ini. Item ini menegakkan mesin dan seed v0 `D-51`(c).
