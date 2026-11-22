# Design Contract: PD-008 — Jurnal penjualan dan HPP

- Source: `docs/product/items/PD-008-jurnal-penjualan-hpp/01-requirement.md` (`PD-008`); `docs/product/decisions.md` (`D-07`, `D-10`, `D-17`, `D-25`, `D-35`, `D-41`, `D-43`, `D-44`); `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-11`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (uang, jurnal)
- Scope: pembentukan jurnal dari kejadian penjualan, HPP, pembalik, peran akun
- Owner: tech lead (`core/ledger` milik `FND-006`)

## Intent and non-goals

**Intent.** Setiap kejadian penjualan menghasilkan jurnal balance yang hanya bisa dibuat lewat `postJournal()`, dengan peran akun yang dikunci dan nilai HPP dari harga rata.

**Non-goals.** Laporan (`PD-009`, `C-009`), tutup buku (`C-010`), dan pembentukan COA (`FND-006`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Kejadian sumber → pembentuk jurnal | dokumen dan nilai | nilai dari dokumen tervalidasi dan harga rata | baris jurnal usulan | tolak; tidak ada jurnal |
| `B-02` | Pembentuk jurnal → `postJournal()` | baris debit/kredit berperan | `postJournal()` memeriksa balance dan peran akun | jurnal tersimpan | tolak transaksi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | `postJournal()` | periode tidak terkunci | core ledger | tolak; tidak ada baris |
| `PRE-02` | `postJournal()` | total debit = total kredit | core ledger | tolak |
| `PRE-03` | `postJournal()` | setiap peran akun aktif dan terpetakan ke akun (`FND-006`) | core ledger | tolak |
| `PRE-04` | Jurnal HPP | harga rata tersedia untuk produk dan gudang (`PQ-06`) | core inventory | tolak |
| `PRE-05` | `postJournal()` | `jenis_transaksi`, `nomor_transaksi_asal`, dan `pemicu` terisi | core ledger | tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Jurnal tersimpan dengan total debit = kredit; identitas dikembalikan | nilai dokumen sumber | baris jurnal dan buku besar |
| `POST-02` | Setiap jurnal punya `jenis_transaksi`, `nomor_transaksi_asal`, dan `pemicu` | — | — |
| `POST-03` | Nilai HPP = qty × harga rata saat pengiriman | nilai stok | — |
| `POST-04` | Pembatalan membentuk jurnal pembalik dengan baris dibalik; jurnal asal tetap | jurnal asal | jurnal pembalik |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core ledger | Debit = kredit (`ARCH-001` `INV-01`) | jurnal tidak balance tersimpan |
| `INV-02` | Core ledger | Jurnal tidak diubah atau dihapus setelah tersimpan (`D-43`) | baris jurnal diedit |
| `INV-03` | Modul Pendapatan | Tidak ada tulis langsung ke tabel jurnal (`ARCH-03`) | insert langsung |
| `INV-04` | Modul Pendapatan | Jurnal tidak dibuat tanpa dokumen sumber | jurnal tanpa `nomor_transaksi_asal` |
| `INV-05` | Modul Pendapatan | Jurnal dibuat dalam transaksi yang sama dengan perubahan status dokumen sumber | jurnal tanpa perubahan status atau sebaliknya |

State jurnal: tidak ada state pengguna. Jurnal terbentuk atau tidak terbentuk; pembatalan dengan jurnal pembalik.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Jurnal gagal di tengah | dokumen sumber tidak berubah status; tidak ada baris jurnal | ulangi kejadian |
| Periode terkunci | tolak; tidak ada baris | buka periode lewat `C-010`, atau koreksi lewat jurnal pembalik di periode berjalan (`D-44` (5)) |
| Harga rata kosong | tolak | isi saldo lewat inventory (`PQ-06`) |

## Pemetaan peran akun

| Kejadian | Dr | Cr |
|---|---|---|
| Pengiriman `DIKIRIM` | `hpp` | `persediaan_barang_jadi` |
| Faktur `DITERBITKAN` | `piutang_usaha` (total) | `penjualan` (DPP); `ppn_keluaran` (PPN) |
| Penerimaan `TERVERIFIKASI` | `kas_bank` | `piutang_usaha` |
| Retur `SELESAI` (kredit memo) | `penjualan` (DPP); `ppn_keluaran` (PPN) | `piutang_usaha` (total) |
| Retur `SELESAI` (HPP) | `persediaan_barang_jadi` | `hpp` |

Peran di atas sesuai `D-35` dan `D-41`; tidak ada nomor akun di modul.

## Architecture boundaries

- Jurnal hanya lewat `core/ledger` (`ARCH-03`).
- Nilai stok hanya dibaca dari `core/inventory`.
- Tidak membaca tabel modul lain (`D-25`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | periode terkunci ditolak | uji manual | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-02` | debit ≠ kredit ditolak | uji `postJournal()` | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-03` | peran tidak terpetakan ditolak | uji `postJournal()` | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-04` | harga rata kosong ditolak | uji manual | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-05` | jurnal tanpa sumber ditolak | uji `postJournal()` | `05-evidence.md` AC-06 | `Unverified` |
| `POST-01` | jurnal balance tersimpan | uji `postJournal()` | `05-evidence.md` AC-01, AC-02, AC-03, AC-04 | `Unverified` |
| `POST-02` | atribut sumber tersimpan | pemeriksaan basis data | `05-evidence.md` AC-06 | `Unverified` |
| `POST-03` | HPP = qty × harga rata | uji unit | `05-evidence.md` AC-01 | `Unverified` |
| `POST-04` | pembalik membalik baris | pemeriksaan jurnal | `05-evidence.md` AC-08 | `Unverified` |
| `INV-01` | jurnal tidak balance tidak tersimpan | uji `postJournal()` | `05-evidence.md` AC-05 | `Unverified` |
| `INV-02` | jurnal tidak berubah | uji basis data | `05-evidence.md` AC-08 | `Unverified` |
| `INV-03` | tidak ada insert langsung | pencarian kode + review | `05-evidence.md` AC-11 | `Unverified` |
| `INV-04` | jurnal tanpa sumber ditolak | uji `postJournal()` | `05-evidence.md` AC-06 | `Unverified` |
| `INV-05` | jurnal dan status dalam satu transaksi | uji fault injection | `05-evidence.md` AC-03 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Akun COA dan peran (`PQ-01`) — `D-35`, `D-41`; kas tunai `[USULAN-AGEN]` | terjawab; kas tunai menunggu kunci | `PRE-03`, `POST-01` |
| Waktu pengakuan (`PQ-02`) — `D-44` (3) | terjawab | periode `POST-01` |
| Periode terkunci (`PQ-03`) — `D-44` (5) | terjawab | `PRE-01` |
| Jurnal pembalik (`PQ-04`) — `D-35` | terjawab | `POST-04` |
| Dependensi retur (`PQ-05`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | urutan `PD-008` |
| Harga rata kosong (`PQ-06`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-04` |
| Dependensi `FND-005` (`PQ-07`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | urutan gate |
