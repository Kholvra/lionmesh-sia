# Design Contract: PG-004 — Pemilihan pemasok dan perbandingan harga

- Source: `docs/product/items/PG-004-pemilihan-pemasok-harga/01-requirement.md` (`PG-004`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-11`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app (keputusan pemilihan dengan harga)
- Scope: penetapan satu pemasok per permintaan dan penyimpanan harga pembanding dengan riwayat
- Owner: pemilik track PG-B (belum ditetapkan)

## Intent and non-goals

**Intent.** Pemasok yang dipakai di PO selalu berasal dari keputusan penetapan yang tercatat, dari permintaan yang sudah disetujui, dengan harga net sebagai pembanding, dan alasan tercatat bila tidak memilih yang termurah.

**Non-goals.** Penerbitan PO (`PG-005`), pencocokan harga dengan faktur (`PG-008`), dan penawaran dari pemasok (`D-23`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser ke server action | harga, pemasok kandidat, alasan | parse dan validasi skema | nilai tervalidasi bertipe | tolak dengan pesan |
| `B-02` | Sesi ke identitas penetap | cookie sesi | ambil pengguna dan peran dari sesi (`ARCH-001` BOUNDARY-02) | `actor_id` dan peran tepercaya | tolak bila tidak ada sesi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | penetapan pemasok | permintaan berstatus `DISETUJUI` (`PG-003`) dan pengguna berperan Purchasing (`D-33`) | service core | tolak sebelum mengubah status |
| `PRE-02` | harga pembanding disimpan | harga lebih dari 0 `[USULAN]` | service core | tolak dengan pesan |
| `PRE-03` | penetapan pemasok | pemasok kandidat berstatus aktif (`D-50`) dan bertermin (`D-14`) | service core | tolak dengan pesan |
| `PRE-04` | penetapan pemasok bukan harga terendah | alasan terisi `[USULAN-AGEN]` (Q-04) | service core | tolak dengan pesan |
| `PRE-05` | penetapan pemasok | tepat satu pemasok per permintaan `[USULAN-AGEN]` (Q-09) | service core | tolak dengan pesan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | status permintaan berpindah ke `PEMASOK_DITETAPKAN` dengan pemasok tercatat (`D-46`) | status lain | baris riwayat |
| `POST-02` | harga pembanding tersimpan dengan pemasok, barang, dan tanggal, dalam IDR, net (`D-38`, `D-17`) | harga lama | baris harga |
| `POST-03` | alasan pemilihan (bila diwajibkan) tersimpan bersama penetapan `[USULAN-AGEN]` | riwayat lama | baris penetapan |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core pengadaan | permintaan yang belum `DISETUJUI` tidak punya pemasok ditetapkan | pemasok ditetapkan pada permintaan `DIAJUKAN` |
| `INV-02` | core pengadaan | harga pembanding adalah harga net sebelum PPN (`D-17`) | PPN ditambahkan ke harga pembanding |
| `INV-03` | core dokumen | riwayat penetapan append-only (`ARCH-001` INV-05) | baris riwayat diubah |
| `INV-04` | core pengadaan | pemasok ditetapkan tidak diganti; hanya bisa dibatalkan lewat `PG-002` (`D-46`) | perubahan pemasok pada status `PEMASOK_DITETAPKAN` |

Transisi (`D-46`, `diagram-sia-lengkap.md` §5.2; `D-48` ditandai):

| Dari | Ke | Pemicu |
|---|---|---|
| `DISETUJUI` | `PEMASOK_DITETAPKAN` | penetapan pemasok oleh Purchasing |
| `PEMASOK_DITETAPKAN` | `DITERBITKAN` | PO terbit (`PG-005`, di luar item ini) |
| `PEMASOK_DITETAPKAN` | `DIBATALKAN` | pembatalan pemohon sebelum PO terbit (`D-48`, `PG-002`) |

Tidak ada transisi `PEMASOK_DITETAPKAN → PEMASOK_DITETAPKAN` (ganti pemasok) di `D-46`.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penetapan gagal di tengah | status dan pemasok tidak berubah sebagian | ulangi penetapan |
| Harga tidak tersimpan | penetapan tidak berjalan | ulangi input harga |
| Alasan wajib tidak tersimpan | penetapan tidak berjalan | ulangi dengan alasan |

## Architecture boundaries

| ID | Rule | Sumber | Catatan |
|---|---|---|---|
| `ARCH-06` | aturan pengadaan di `core/pengadaan` | `D-05` | item ini memanggil service core |
| `ARCH-08` | modul tidak membaca tabel modul lain | `D-25` | harga dan pemasok lewat service core |
| `ARCH-05` | status dan riwayat dokumen lewat `core/dokumen` | `D-08` | item ini tidak menulis riwayat langsung |

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | permintaan belum disetujui ditolak | uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-02` | harga nol ditolak | uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-03` | pemasok nonaktif ditolak | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-04` | pemasok bukan termurah tanpa alasan ditolak | uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-05` | satu pemasok per permintaan | uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-01` | status dan riwayat | uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | harga tersimpan per tanggal | uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `POST-03` | alasan tersimpan | uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `INV-01` | pemasok hanya setelah disetujui | uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `INV-02` | harga tanpa PPN | uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `INV-04` | tidak ada ganti pemasok | uji perilaku | `05-evidence.md` AC-09 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Sumber harga (Q-01) | Terjawab — `[USULAN-AGEN]` (input manual per pemasok, IDR net) | POST-02 dan AC-02 |
| Dasar riwayat harga (Q-02) | Terjawab — `[USULAN-AGEN]` (harga pembanding tersimpan) | AC-06 |
| Kriteria pemilihan (Q-03) | Terjawab — `[USULAN-AGEN]` (termurah tidak wajib) | PRE-04 |
| Alasan wajib (Q-04) | Terjawab — `[USULAN-AGEN]` (wajib bila bukan termurah) | PRE-04, POST-03, AC-07 |
| Nama status (Q-05) | Terjawab — `D-46` | transisi |
| Penggantian pemasok (Q-06) | Terjawab — `D-46` (tidak ada transisi) | INV-04 dan AC-09 |
| Kandidat aktif dan bertermin (Q-07) | Terjawab — `D-50` dan `D-14` | PRE-03 |
| Mata uang (Q-08) | Terjawab — `D-38` (IDR) | POST-02 |
| Granularitas penetapan (Q-09) | Terjawab — `[USULAN-AGEN]` (satu pemasok per permintaan) | PRE-05, AC-01, `PG-005` Q-03 |
| Dependensi `PG-003` (Q-10) | Terjawab — `[USULAN-AGEN]` (dependensi logis; backlog tidak diubah) | urutan, bukan perilaku |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine generik | milik `C-013` |
| Loop/termination | tidak ada algoritma berulang |
| Batas modul | milik `ARCH-001` |
| Riwayat dari PO atau faktur | membuat dependensi ke `PG-005` dan `PG-008`; ditunda sebagai pengembangan |
