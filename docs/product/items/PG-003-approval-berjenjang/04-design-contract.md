# Design Contract: PG-003 — Review dan approval permintaan pembelian berjenjang

- Source: `docs/product/items/PG-003-approval-berjenjang/01-requirement.md` (`PG-003`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-12`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app (approval dokumen dengan aturan nilai)
- Scope: review, estimasi nilai, approval berjenjang N jenjang, penolakan, gugurnya approval saat revisi, dan jejak keputusan
- Owner: pemilik track PG-B (belum ditetapkan)

## Intent and non-goals

**Intent.** Tidak ada permintaan pembelian yang menjadi PO tanpa seluruh jenjang approval yang disyaratkan aturannya, dan setiap keputusan bisa ditelusuri. Pemohon tidak pernah menjadi approver dokumennya sendiri.

**Non-goals.** Mesin approval generik (`FND-004`, `D-37`), penomoran, PO (`PG-005`), dan nilai ambang final (keputusan bisnis).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser ke server action | alasan keputusan, estimasi nilai, pilihan setujui atau tolak | parse dan validasi skema | keputusan tervalidasi | tolak dengan pesan |
| `B-02` | Sesi ke identitas approver | cookie sesi | ambil pengguna dan peran dari sesi (`ARCH-001` BOUNDARY-02) | `actor_id` dan peran tepercaya | tolak bila tidak ada sesi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Review dilakukan | permintaan berstatus `DIAJUKAN` dan pengguna berperan Purchasing (`D-33`). Hasilnya `MENUNGGU_PERSETUJUAN` (`D-46`) | service core | tolak sebelum mengubah status |
| `PRE-02` | Approval jenjang dilakukan | permintaan berstatus `MENUNGGU_PERSETUJUAN` dan pengguna berperan Manajemen (`D-33`) | service core | tolak sebelum mengubah status |
| `PRE-03` | Jenjang ditentukan | nilai permintaan punya aturan jenjang di `aturan_approval` (seed v0: satu jenjang untuk semua nilai, `D-51`(c)) | service core | tolak dengan pesan (AC-08) |
| `PRE-04` | Keputusan tolak | alasan penolakan terisi `[USULAN]` (`D-48`) | service core | tolak dengan pesan |
| `PRE-05` | Approver bukan pemohon | `actor_id` approver tidak sama dengan pengaju (`D-42`, `D-48`) | service core | tolak dengan pesan |
| `PRE-06` | Jenjang n+1 diproses | jenjang n sudah lulus untuk permintaan ini `[USULAN-AGEN]` (Q-12) | service core | tolak dengan pesan; tidak ada perubahan |
| `PRE-07` | Approver jenjang n+1 | berbeda dari approver jenjang sebelumnya untuk permintaan yang sama `[USULAN-AGEN]` (Q-13) | service core | tolak dengan pesan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | setiap keputusan tersimpan dengan aktor, waktu, jenjang, dan jenis keputusan (`ARCH-001` POST-04) | riwayat lama | baris riwayat |
| `POST-02` | permintaan `DISETUJUI` hanya setelah jenjang terakhir yang disyaratkan lulus (`D-46`) | status lain | perubahan status |
| `POST-03` | permintaan `DITOLAK` tidak bisa diubah kembali | status final | tidak ada |
| `POST-04` | review menyimpan estimasi nilai PR dalam IDR (`D-38`, `[USULAN-AGEN]` Q-07) | nilai lama bila belum final | baris PR |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core pengadaan | `DITOLAK` adalah status final (`analisis-sia.md` §8.1) | permintaan ditolak menjadi disetujui |
| `INV-02` | core pengadaan | permintaan yang ditolak tidak bisa menjadi PO (ditegakkan di `PG-005`) | PO dari permintaan `DITOLAK` |
| `INV-03` | core dokumen | riwayat keputusan bersifat append-only (`ARCH-001` INV-05) | baris riwayat diubah atau dihapus |
| `INV-04` | service core | aturan jenjang diambil dari `aturan_approval` dan dikunci saat permintaan diteruskan ke `MENUNGGU_PERSETUJUAN` `[USULAN-AGEN]` | aturan disalin ke kode, atau aturan berubah di tengah keputusan |
| `INV-05` | service core | pemohon tidak menyetujui dokumennya sendiri (`D-42`, `D-48`) | approval oleh pengaju |
| `INV-06` | service core | jenjang antara tidak mengubah status; status `DISETUJUI` hanya setelah jenjang terakhir (`D-46`, `[USULAN-AGEN]` Q-12) | status `DISETUJUI` sebelum jenjang terakhir |
| `INV-07` | service core | revisi dari `DISETUJUI` menggugurkan seluruh approval; jenjang dimulai ulang (`D-48`, `PG-002`) `[USULAN-AGEN]` | approval lama masih dihitung setelah revisi |

Transisi status (`D-46`, `diagram-sia-lengkap.md` §5.2; `D-48` ditandai):

| Dari | Ke | Pemicu |
|---|---|---|
| `DIAJUKAN` | `MENUNGGU_PERSETUJUAN` | diperiksa Purchasing dan diteruskan |
| `DIAJUKAN` | `REVISI` | dikembalikan oleh Purchasing (bukan tolak) |
| `MENUNGGU_PERSETUJUAN` | `MENUNGGU_PERSETUJUAN` (tanpa perubahan status) | jenjang antara lulus `[USULAN-AGEN]` |
| `MENUNGGU_PERSETUJUAN` | `DISETUJUI` | jenjang terakhir lulus oleh Manajemen |
| `MENUNGGU_PERSETUJUAN` | `DITOLAK` | ditolak Manajemen dengan alasan |
| `MENUNGGU_PERSETUJUAN` | `DIBATALKAN` | dibatalkan pemohon (`D-48`, detail di `PG-002`) |
| `DISETUJUI` | `DIAJUKAN` | revisi pemohon, approval gugur (`D-48`) `[USULAN-AGEN]` |

Purchasing tidak dapat menolak. Dari `MENUNGGU_PERSETUJUAN` tidak ada transisi `REVISI` oleh approver (`D-46`).

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Dua keputusan bersamaan | hanya satu yang berlaku; lainnya ditolak dengan pesan (`[USULAN-AGEN]` Q-10) | muat ulang permintaan |
| Aturan jenjang tidak ditemukan | keputusan ditolak; status tidak berubah | isi aturan jenjang (data) |
| Penyimpanan keputusan gagal di tengah | status dan riwayat tidak berubah sebagian | ulangi keputusan |
| Revisi gagal menggugurkan approval | status tetap `DISETUJUI` | ulangi revisi |

## Architecture boundaries

| ID | Rule | Sumber | Catatan |
|---|---|---|---|
| `ARCH-05` | status dan riwayat dokumen melalui `core/dokumen` | `D-08` | approval memakai service core |
| `ARCH-06` | aturan pengadaan di `core/pengadaan` | `D-05` | layar milik track PG-B |
| `ARCH-08` | modul tidak membaca tabel modul lain | `D-25` | tidak ada |
| `ARCH-09` | peran mengikuti 12 akun staf; Direksi tidak menyetujui PR | `D-18`, `D-33` | Q-02 terjawab |
| `ARCH-10` | mesin approval satu-satunya di `FND-004`; PG-003 hanya mengisi aturan dan layar | `D-37` | Q-06 terjawab |

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | peran tidak diizinkan ditolak | uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-02` | approval tanpa peran ditolak | uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-03` | nilai tanpa aturan ditolak | uji perilaku (seed uji) | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-04` | tolak tanpa alasan ditolak | uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-05` | pemohon tidak menyetujui sendiri | uji service | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-06` | jenjang n+1 tanpa jenjang n ditolak | uji perilaku (seed uji) | `05-evidence.md` AC-02 | `Unverified` |
| `PRE-07` | approver sama di dua jenjang ditolak | uji service (seed uji) | `05-evidence.md` AC-02 | `Unverified` |
| `POST-01` | riwayat tercatat per keputusan | uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `POST-02` | disetujui hanya setelah jenjang terakhir | uji perilaku | `05-evidence.md` AC-01, AC-02 | `Unverified` |
| `POST-03` | ditolak final | uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `POST-04` | estimasi nilai tersimpan | uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `INV-01` | ditolak tidak bisa disetujui | uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `INV-03` | riwayat tidak diubah | uji database dan review | — | `Unverified` |
| `INV-04` | aturan tidak disalin ke kode; tidak berubah di tengah keputusan | pencarian kode; uji perilaku | `05-evidence.md` edge case | `Unverified` |
| `INV-06` | status tetap saat jenjang antara lulus | uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `INV-07` | revisi menggugurkan approval | uji perilaku lintas item | `05-evidence.md` AC-11; `PG-002` AC-13 | `Unverified` |
| — | pembatalan pemohon menghentikan approval | uji perilaku | `05-evidence.md` AC-12 | `Unverified` |
| — | konkurensi dua approver | uji perilaku dua sesi | `05-evidence.md` AC-09 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Aturan jenjang, jumlah jenjang, pemutus (Q-01) | Terjawab — `D-51`(c) (seed satu jenjang Manajemen untuk semua nilai). Ambang final: bisnis, ditandai belum final (`D-37`) | PRE-03 dan AC-01, AC-02 |
| Peran Direksi (Q-02) | Terjawab — `D-33` (Direksi tidak menyetujui PR) | PRE-02 |
| Review untuk semua nilai (Q-03) | Terjawab — `D-46` (wajib) | transisi |
| Pemohon menyetujui sendiri (Q-04) | Terjawab — `D-42` (tidak boleh) | PRE-05 dan INV-05 |
| Pengembalian saat approval (Q-05) | Terjawab — `D-46` (`REVISI` hanya dari `DIAJUKAN`) | transisi |
| Pembagian dengan `FND-004` (Q-06) | Terjawab — `D-37` (satu mesin) | ARCH-10 |
| Dasar nilai (Q-07) | Terjawab — `[USULAN-AGEN]` (estimasi nilai PR dari Purchasing) | POST-04 |
| Mata uang (Q-08) | Terjawab — `D-38` (IDR) | POST-04 |
| Approval pembelian bahan Produksi (Q-09) | Terjawab — `D-37` (mesin yang sama) | arsitektur |
| Konkurensi (Q-10) | Terjawab — `[USULAN-AGEN]` (keputusan pertama berlaku) | failure dan AC-09 |
| Notifikasi approver (Q-11) | Terjawab — `D-50` dan `[USULAN-AGEN]` (antrean utama; `C-012` bukan dependensi) | - |
| Rentang nilai dan jenjang antara (Q-12) | Terjawab — `[USULAN-AGEN]` (`min` inklusif, `max` eksklusif; status tidak berubah) | INV-06, AC-02 |
| Approver berbeda per jenjang (Q-13) | Terjawab — `[USULAN-AGEN]` | PRE-07 |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine generik dokumen | milik `FND-004` dan `C-013` |
| Status baru untuk jenjang antara | `D-47`: tidak ada status di luar daftar tanpa keputusan baru |
| Loop/termination | tidak ada algoritma berulang |
| Batas modul | milik `ARCH-001` |
