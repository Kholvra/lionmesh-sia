# Design Contract: FND-005 — Inventory

- Source: `docs/product/items/FND-005-inventory-mutasi-saldo-valuasi/01-requirement.md` (`FND-005`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-15`)
- Status: `Approved`
- Profile: product app / stock and valuation
- Scope: mutasi stok, saldo qty dan nilai, rata-rata bergerak, transfer antar gudang, stock opname
- Owner: tech lead
- Referensi: `ARCH-001` (`ARCH-04`, `PRE-03`, `INV-02`, `INV-03`); `D-06`, `D-10`, `D-36`, `D-44`, `D-50`, `D-52`

## Intent and non-goals

**Intent.** Stok hanya berubah lewat mutasi tak-ubah. Saldo qty dan nilai selalu konsisten dengan mutasi dan harga rata-rata bergerak, dan diperbarui bersama mutasinya.

**Non-goals.** Reservasi (`PD-003`), jurnal persediaan (`FND-006`), dokumen sumber, dan mata uang.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Modul → `core/inventory` | produk, gudang, qty, harga, tanggal, sumber, alasan | qty bukan nol; produk dan gudang aktif; tanggal tidak mendahului; harga positif untuk masuk | mutasi tervalidasi | Tolak sebelum menyentuh data |
| `B-02` | Layanan → database | penulisan mutasi dan saldo | satu transaksi; hak akses role klien dicabut (`OQ-05-07`) | baris konsisten | Rollback seluruh transaksi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Mutasi dibuat | Pemanggil lewat `core/inventory`; aktor sesi sah (`FND-003`) | Core | Tolak |
| `PRE-02` | Mutasi dibuat | Produk dan gudang ada dan aktif (`D-50`); qty bukan nol | Core inventory | Tolak dengan alasan yang menyebut aturan |
| `PRE-03` | Mutasi dibuat | Tanggal tidak mendahului mutasi terakhir pada pasangan produk dan gudang (`ARCH-001` `PRE-03`) | Core inventory | Tolak; pesan menyebut tanggal terakhir |
| `PRE-04` | Keluar atau transfer keluar | Qty keluar ≤ `saldo_stok.qty` (`OQ-05-02`) | Core inventory | Tolak; pesan menyebut qty tersedia |
| `PRE-05` | Transfer | Gudang asal ≠ gudang tujuan | Core inventory | Tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Mutasi tersimpan dan saldo diperbarui dalam satu transaksi (`ARCH-001` `POST-02`) | `INV-01`, `INV-02` | Baris mutasi dan saldo |
| `POST-02` | Masuk: `harga_rata` baru = pembulatan(nilai baru ÷ qty baru, 4) | Qty total | Tidak ada |
| `POST-03` | Keluar tidak mengubah `harga_rata`; nilai keluar = pembulatan(qty × harga rata, 2), atau nilai sisa bila menghabiskan saldo | Harga rata | Nilai saldo berkurang |
| `POST-04` | Transfer menghasilkan dua mutasi dan total nilai tidak berubah | Total nilai dan qty lintas gudang | Dua baris mutasi |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core inventory | Selisih absolut nilai saldo terhadap qty × harga rata ≤ 0,01 + qty × 0,00005 setelah setiap mutasi (`ARCH-001` `INV-02`) | Nilai dan qty dari sumber berbeda |
| `INV-02` | Core inventory | Qty saldo = jumlah `mutasi_stok` bertanda (`ARCH-001` `INV-03`) | Saldo dihitung dengan rumus lain |
| `INV-03` | Database | `mutasi_stok` tak-ubah | UPDATE atau DELETE mutasi |
| `INV-04` | Database | `saldo_stok` hanya ditulis lewat fungsi `core/inventory` (`ARCH-001` `ARCH-04`) | Role klien menulis saldo langsung |
| `INV-05` | Core inventory | Saldo qty tidak pernah negatif (`OQ-05-02`) | Qty saldo < 0 |
| `INV-06` | Core inventory | Transfer tidak mengubah total nilai dan total qty lintas gudang | Nilai hilang atau tercipta saat transfer |

Keadaan saldo: belum ada → ada (qty > 0) → nol (nilai nol, `harga_rata` dipertahankan). Transisi hanya lewat mutasi.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penulisan saldo gagal | Mutasi tidak tersimpan (rollback) | Ulangi mutasi |
| Transfer gagal di tengah | Dua mutasi dan kedua saldo batal | Ulangi transfer |
| Tanggal mundur | Ditolak | Gunakan tanggal sah; koreksi lewat mutasi baru |
| Dua mutasi bersamaan pada pasangan sama | Keduanya berurutan (kunci baris saldo); saldo tetap konsisten | Tidak ada perubahan manual |

## Architecture boundaries

- `ARCH-04`: `saldo_stok` hanya ditulis di `core/inventory`. Penegakan database lewat hak akses (`B-02`, `INV-04`).
- `ARCH-001` `ARCH-08`: modul tidak membaca `saldo_stok` milik modul lain selain lewat layanan.

## Menyentuh stok dan nilai

- Setiap mutasi menyebut arah (masuk, keluar, transfer, penyesuaian) dan efeknya ke `saldo_stok` (qty, nilai, `harga_rata`).
- Sumber angka uang: `nilai_masuk` dari PO (`D-44` (1)) dan `nilai_keluar` untuk HPP (`D-44` (3)). Jurnal dan akunnya ditulis item pemicu (`D-35`); item ini tidak memposting jurnal.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Mutasi tidak valid ditolak | AC-07, AC-08, AC-14, AC-15 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `B-02` | Kegagalan saldo membatalkan mutasi | AC-05, AC-12 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `PRE-01` | Penulisan langsung ditolak | AC-06 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `PRE-02` | Produk, gudang nonaktif, qty nol ditolak | AC-08, AC-14 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `PRE-03` | Backdate ditolak | AC-07 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `PRE-04` | Keluar melebihi stok ditolak | AC-10 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `PRE-05` | Transfer ke gudang sama ditolak | AC-12 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `POST-01` | Mutasi dan saldo konsisten | AC-01, AC-05 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `POST-02` | Harga rata masuk sesuai rumus | AC-01 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `POST-03` | Keluar tidak mengubah harga rata | AC-02, AC-11 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `POST-04` | Transfer menjaga total | AC-12 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `INV-01` | Nilai = qty × harga rata dalam toleransi | AC-04 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `INV-02` | Qty saldo = jumlah mutasi | AC-03 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `INV-03` | Mutasi tidak bisa diubah | AC-09 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `INV-04` | Role klien tidak menulis saldo | AC-06 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `INV-05` | Saldo tidak negatif | AC-10 | `node scripts/verify-fnd-005.mjs` | `PASS` |
| `INV-06` | Transfer tidak mengubah total | AC-12 | `node scripts/verify-fnd-005.mjs` | `PASS` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Rumus rata-rata bergerak (`D-10`) | Terjawab (metode); pembulatan `[USULAN-AGEN]` (`OQ-05-03`) | Angka saldo berbeda dari uji |
| Stok tidak negatif (`OQ-05-02`) | `[USULAN-AGEN]` | HPP tidak bisa dipertanggungjawabkan |
| `harga_rata` disimpan (`OQ-05-08`, `D-06`, `D-10`) | Terjawab | — |
| Penegakan `ARCH-04` lewat hak akses (`OQ-05-07`) | `[USULAN-AGEN]` | Penulisan langsung masih mungkin |
| Tipe `numeric(18,4)` dan `numeric(18,2)` (`FND-002` `OQ-02-07`) | `[USULAN-AGEN]` | Pembulatan salah |
| Transfer dan opname oleh Gudang (matriks belum punya baris, `OQ-05-06`) | `[USULAN-AGEN]` | Matriks tidak sesuai implementasi |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | Tidak ada dokumen di item ini |
| Loop/termination | Tidak ada algoritma berulang; rumus rata-rata tidak iteratif |
| Otorisasi per peran | Milik `FND-003` |
| FIFO atau lapisan stok | Ditolak `D-10`; valuasi di balik antarmuka (`D-10`) |
