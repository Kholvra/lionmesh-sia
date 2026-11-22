# Design Contract: PD-003 — Cek dan reservasi stok untuk pesanan

- Source: `docs/product/items/PD-003-cek-reservasi-stok/01-requirement.md` (`PD-003`); `docs/product/decisions.md` (`D-06`, `D-25`, `D-31`, `D-46`, `D-52`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-13`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (stok)
- Scope: cek ketersediaan, alokasi, pelepasan alokasi, status pesanan dari alokasi
- Owner: tech lead (`core/inventory` milik `FND-005`)

## Intent and non-goals

**Intent.** Alokasi tidak pernah melebihi stok tersedia atau qty baris pesanan, dan tidak pernah mengubah saldo fisik atau mutasi.

**Non-goals.** Mutasi keluar saat pengiriman (`PD-004`), valuasi (`FND-005`), dan transfer antar gudang (`D-52`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | produk, gudang, qty alokasi | parse dan validasi di server | qty bertipe | tolak; tidak menulis |
| `B-02` | Server → core inventory | permintaan alokasi | hanya lewat service core | saldo dibaca dari sumber | tolak bila saldo tidak cukup |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Alokasi dibuat | qty > 0; qty ≤ tersedia; qty ≤ sisa qty baris | service core | tolak; tidak ada alokasi tersimpan |
| `PRE-02` | Alokasi dibuat | produk dan gudang ada (master `C-011`) | service core | tolak |
| `PRE-03` | Alokasi dibuat | pesanan `VERIFIED` atau `MENUNGGU_STOK`; bukan `DIBATALKAN` | server action | tolak |
| `PRE-04` | Alokasi dibuat | gudang dipilih bila gudang lebih dari satu (`D-52`) | server action | tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Tersedia = saldo − Σ alokasi aktif | `saldo_stok` dan `mutasi_stok` tidak berubah | baris `alokasi_stok` |
| `POST-02` | Pelepasan sebesar qty lepas; tersedia bertambah sebesar yang dilepas | saldo fisik | baris `alokasi_stok` berstatus `dilepas` |
| `POST-03` | Status pesanan mengikuti hasil alokasi: `SIAP_KIRIM` bila seluruh baris teralokasi, `MENUNGGU_STOK` bila ada kekurangan | nomor dan baris pesanan | baris `riwayat_status` |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core inventory | Σ alokasi aktif ≤ saldo qty per produk per gudang | alokasi melebihi saldo |
| `INV-02` | Core inventory | Alokasi tidak membuat baris `mutasi_stok` | alokasi menjadi mutasi |
| `INV-03` | Core inventory | Saldo qty = Σ `mutasi_stok` (`ARCH-001` `INV-03`) | saldo dihitung ulang dengan rumus lain |
| `INV-04` | Core inventory | Σ alokasi aktif per baris pesanan ≤ qty baris dikurangi qty terkirim | alokasi melebihi qty pesanan |
| `INV-05` | Core inventory | Stok masuk tidak mengubah alokasi | alokasi otomatis tanpa aksi Gudang |

State alokasi: `teralokasi → dilepas` (sebagian atau penuh); tidak ada jalur kembali. State pesanan dari alokasi: `VERIFIED → MENUNGGU_STOK | SIAP_KIRIM`, `MENUNGGU_STOK → SIAP_KIRIM` (`D-46`).

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Dua alokasi bersamaan | hanya yang sah tersimpan; yang lain dipotong (`PRE-01`) | pesan "Stok tersedia berubah. Muat ulang..." |
| Pelepasan gagal di tengah | alokasi tetap aktif; status pesanan tidak berubah | ulangi pelepasan |
| Penulisan status pesanan gagal setelah alokasi | seluruh alokasi dibatalkan dalam transaksi yang sama | ulangi |

## Architecture boundaries

- Perubahan stok dan alokasi hanya lewat `core/inventory` (`ARCH-04`).
- Tabel `alokasi_stok` dimiliki `core/inventory` (`D-31`); modul pesanan tidak menulis langsung (`D-25`).
- Status pesanan ditulis lewat `core/dokumen` (`ARCH-05`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | alokasi > tersedia atau > qty baris ditolak | uji manual | `05-evidence.md` AC-03, AC-09 | `Unverified` |
| `PRE-03` | pesanan `DRAFT` / `MENUNGGU_PERSETUJUAN_KREDIT` ditolak | uji manual | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-04` | gudang tidak dipilih ditolak saat multi-gudang | uji manual | `05-evidence.md` AC-12 | `Unverified` |
| `POST-01` | tersedia = saldo − alokasi | uji inventory | `05-evidence.md` AC-01, AC-02 | `Unverified` |
| `POST-02` | pembatalan melepas alokasi | uji manual | `05-evidence.md` AC-05 | `Unverified` |
| `POST-03` | status pesanan dari hasil alokasi | uji manual | `05-evidence.md` AC-08 | `Unverified` |
| `INV-01` | total alokasi ≤ saldo | uji concurrency | `05-evidence.md` AC-04 | `Unverified` |
| `INV-02` | `mutasi_stok` tidak bertambah saat alokasi | pemeriksaan basis data | `05-evidence.md` AC-11 | `Unverified` |
| `INV-03` | saldo = jumlah mutasi | uji inventory | `05-evidence.md` AC-07 | `Unverified` |
| `INV-04` | alokasi per baris ≤ qty baris | uji manual | `05-evidence.md` AC-09 | `Unverified` |
| `INV-05` | stok masuk tidak mengalokasikan otomatis | uji lintas `FND-005` | `05-evidence.md` AC-13 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Lokasi tabel alokasi (`PQ-01`) — `D-31` | terjawab | `ARCH-04`, lingkup `FND-005` |
| Waktu alokasi (`PQ-02`) — `D-46` | terjawab | `PRE-03` |
| Alokasi parsial dan stok masuk (`PQ-03`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `INV-05`, `POST-03` |
| Urutan prioritas (`PQ-04`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `INV-01` pada konkurensi |
| Gudang (`PQ-05`) — `D-52` | terjawab | `PRE-04` |
