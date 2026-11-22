# Design Contract: PD-004 — Pengiriman dan surat jalan

- Source: `docs/product/items/PD-004-pengiriman-surat-jalan/01-requirement.md` (`PD-004`); `docs/product/decisions.md` (`D-06`, `D-08`, `D-10`, `D-25`, `D-33`, `D-41`, `D-42`, `D-44`, `D-46`, `D-47(b)`, `D-48`, `D-50`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-12`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (stok, status dokumen)
- Scope: pengiriman, kirim, mutasi keluar, surat jalan, bukti terima, status pengiriman dan pesanan
- Owner: tech lead

## Intent and non-goals

**Intent.** Stok keluar tepat sekali per pengiriman `DIKIRIM`, sebesar qty kirim dan dengan nilai harga rata; pengiriman yang sudah dikirim tidak berubah diam-diam.

**Non-goals.** Faktur (`PD-005`), jurnal HPP (`PD-008`), retur (`PD-007`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | qty kirim, baris, alasan, bukti terima | parse dan validasi | qty bertipe | tolak |
| `B-02` | Sesi → identitas aktor | cookie sesi | identitas dari sesi | peran dan `actor_id` tepercaya | tolak |
| `B-03` | Server → core inventory | mutasi keluar | hanya service core | mutasi tervalidasi | tolak; tidak ada mutasi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Kirim pengiriman | pengiriman `DRAFT`; qty > 0; qty ≤ alokasi aktif per baris | server action | tolak; tidak ada mutasi |
| `PRE-02` | Kirim pengiriman | saldo fisik per produk per gudang ≥ qty kirim | core inventory | tolak; tidak ada mutasi |
| `PRE-03` | Kirim pengiriman | pesanan `SIAP_KIRIM` atau `TERKIRIM_SEBAGIAN`; qty kumulatif ≤ qty pesanan | server action | tolak |
| `PRE-04` | Kirim pengiriman | aktor bukan pembuat pesanan (`D-42`) | server action | tolak; tidak ada mutasi |
| `PRE-05` | Batalkan pengiriman | status `DRAFT`; alasan tidak kosong | server action | tolak |
| `PRE-06` | Bukti terima | status `DIKIRIM`; tanggal dan nama penerima terisi | server action | tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Satu baris `mutasi_stok` keluar per baris pengiriman; `saldo_stok` diperbarui dalam transaksi yang sama | nilai = qty × harga rata (`D-10`) | mutasi keluar |
| `POST-02` | Alokasi sebesar qty kirim dilepas; sisa alokasi tetap aktif | alokasi lain | baris `alokasi_stok` |
| `POST-03` | Surat jalan terbit dengan nomor unik (`D-50`) | nomor pengiriman | nomor terpakai |
| `POST-04` | Status pesanan: `TERKIRIM_SEBAGIAN` atau `TERKIRIM` sesuai kumulatif | nomor pesanan | baris `riwayat_status` pesanan |
| `POST-05` | Bukti terima tersimpan; status `DITERIMA` | saldo dan mutasi tidak berubah | baris `riwayat_status` pengiriman |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core inventory | Mutasi dan saldo diubah dalam satu transaksi (`ARCH-001` `POST-02`) | mutasi tanpa saldo atau sebaliknya |
| `INV-02` | Core inventory | Saldo ≥ 0 | saldo negatif |
| `INV-03` | Modul Pendapatan | Pengiriman `DIKIRIM` tidak diubah qty atau barisnya | qty berubah setelah `DIKIRIM` |
| `INV-04` | Core dokumen | Setiap transisi punya `riwayat_status` (`ARCH-001` `INV-05`) | status berubah tanpa jejak |
| `INV-05` | Modul Pendapatan | Qty kumulatif terkirim per baris ≤ qty pesanan | kirim melebihi pesanan |
| `INV-06` | Modul Pendapatan | Pembuat pesanan tidak mengonfirmasi kirim pesanannya (`D-42`) | kirim oleh pembuat |

State pengiriman: `DRAFT → DIKIRIM → DITERIMA`; `DRAFT → DIBATALKAN`. Tidak ada jalur kembali setelah `DIKIRIM`. State pesanan: `SIAP_KIRIM → TERKIRIM_SEBAGIAN → TERKIRIM` (`D-46`).

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Mutasi gagal di tengah | seluruh kirim dibatalkan; tidak ada status berubah | ulangi |
| Nomor surat jalan gagal | kirim dibatalkan | ulangi |
| Dua kirim bersamaan | hanya satu berhasil (update bersyarat `WHERE status = 'DRAFT'`) | pesan "Dokumen sudah diproses" |

## Architecture boundaries

- Perubahan stok hanya lewat `core/inventory` (`ARCH-04`).
- Nomor dan riwayat lewat `core/dokumen` (`ARCH-05`).
- Tidak membaca tabel modul lain (`D-25`, `ARCH-08`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | qty > alokasi ditolak | uji manual | `05-evidence.md` AC-02 | `Unverified` |
| `PRE-02` | saldo tidak cukup ditolak | uji inventory | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-03` | kirim dari `DRAFT` pesanan ditolak; kumulatif > pesanan ditolak | uji manual | `05-evidence.md` AC-01, AC-10 | `Unverified` |
| `PRE-04` | pembuat pesanan tidak bisa kirim | uji otomatis | `05-evidence.md` AC-09 | `Unverified` |
| `PRE-05` | batal tanpa alasan ditolak | uji manual | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-06` | bukti terima tanpa nama ditolak | uji manual | `05-evidence.md` AC-08 | `Unverified` |
| `POST-01` | satu mutasi keluar sesuai qty × harga rata | pemeriksaan basis data | `05-evidence.md` AC-03, AC-12 | `Unverified` |
| `POST-02` | alokasi berkurang sesuai qty kirim | uji manual | `05-evidence.md` AC-03 | `Unverified` |
| `POST-03` | nomor surat jalan unik | uji manual | `05-evidence.md` AC-04 | `Unverified` |
| `POST-04` | status pesanan dari kumulatif | uji manual | `05-evidence.md` AC-10 | `Unverified` |
| `POST-05` | bukti terima tersimpan tanpa mengubah saldo | pemeriksaan basis data | `05-evidence.md` AC-08 | `Unverified` |
| `INV-01` | mutasi dan saldo konsisten | uji inventory | `05-evidence.md` AC-03 | `Unverified` |
| `INV-02` | saldo tidak negatif | uji inventory | `05-evidence.md` AC-11 | `Unverified` |
| `INV-03` | `DIKIRIM` tidak bisa diubah | uji manual | `05-evidence.md` AC-07 | `Unverified` |
| `INV-04` | riwayat per transisi | pemeriksaan basis data | `05-evidence.md` AC-05 | `Unverified` |
| `INV-05` | kumulatif ≤ pesanan | uji manual | `05-evidence.md` AC-10 | `Unverified` |
| `INV-06` | pembuat pesanan tidak bisa kirim | uji otomatis | `05-evidence.md` AC-09 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Role pengiriman (`PQ-01`) — `D-33`, `D-42` | terjawab | `PRE-04` |
| Parsial dan jumlah pengiriman (`PQ-02`) — `D-46`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `INV-05` |
| Bukti terima (`PQ-03`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-05` |
| Format surat jalan (`PQ-04`) — `D-50` | terjawab | `POST-03` |
| Qty kirim vs alokasi (`PQ-05`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-01` |
| Pembatalan setelah `DIKIRIM` (`PQ-06`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-05`, `INV-03` |
| Akun HPP (`PQ-07`) — `D-41`, `D-44` (3) | terjawab | `PD-008` |
