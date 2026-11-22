# Design Contract: PD-009 — Laporan penjualan, piutang, dan kas

- Source: `docs/product/items/PD-009-laporan-penjualan-piutang-kas/01-requirement.md` (`PD-009`); `docs/product/decisions.md` (`D-25`, `D-33`, `D-43`, `D-50`, `D-51(f)`); `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (`ARCH-08`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-12`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (laporan baca, angka uang)
- Scope: pembacaan data penjualan, piutang, dan kas untuk laporan
- Owner: tech lead

## Intent and non-goals

**Intent.** Laporan hanya membaca; angkanya sama dengan buku besar dan jurnal untuk periode yang sama; tidak ada tabel laporan yang menyimpan angka sendiri.

**Non-goals.** Laporan keuangan standar (`C-009`), tutup buku (`C-010`), penulisan jurnal, dan ekspor (`D-50`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server | periode, tanggal laporan, filter | parse tanggal; tidak melewati hari ini | periode bertipe | tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | cookie sesi | peran dari sesi | peran tepercaya | tolak akses |
| `B-03` | Core → modul (baca) | saldo dan mutasi buku besar | hanya lewat service core (`D-25`, `D-43`) | angka dari buku besar | tolak bila service tidak tersedia |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Buka laporan | aktor berperan sesuai `D-33` untuk laporan itu (kas: `[USULAN-AGEN]`) | server | tolak |
| `PRE-02` | Buka laporan | periode valid dan tidak melewati hari ini; tanggal laporan piutang tidak melewati hari ini | server | tolak dengan pesan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Angka laporan = jumlah dari dokumen dan buku besar untuk periode | semua data sumber | tidak ada |
| `POST-02` | Tidak ada baris yang ditulis | — | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Modul Pendapatan | Laporan tidak disimpan sebagai tabel | tabel laporan dibuat |
| `INV-02` | Modul Pendapatan | Angka penjualan laporan = kredit dikurangi debit `penjualan` pada buku besar untuk periode | selisih antara laporan dan jurnal |
| `INV-03` | Modul Pendapatan | Tidak membaca tabel modul lain (`ARCH-08`) | query ke tabel lintas siklus |
| `INV-04` | Modul Pendapatan | Rincian per pelanggan dan per produk menjumlah ke total | total tidak sama dengan rincian |

State: tidak ada.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Service core tidak tersedia | laporan tidak tampil; pesan error | ulangi |
| Periode tanpa data | pesan kosong, bukan tabel kosong | — |

## Architecture boundaries

- Kas dan jurnal lintas siklus lewat service core atau read model core (`D-25`, `ARCH-08`).
- Pemeriksaan `ARCH-08` belum punya checker otomatis (status `Unverified`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | pengguna tanpa izin ditolak | uji otomatis | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-02` | periode masa depan ditolak | uji manual | `05-evidence.md` AC-09, AC-11 | `Unverified` |
| `POST-01` | total laporan = total dokumen dan buku besar | pemeriksaan data seed | `05-evidence.md` AC-01, AC-03 | `Unverified` |
| `POST-02` | tidak ada baris ditulis | pemeriksaan basis data | `05-evidence.md` AC-08 | `Unverified` |
| `INV-01` | tidak ada tabel laporan | pemeriksaan skema | `05-evidence.md` AC-08 | `Unverified` |
| `INV-02` | laporan = jurnal | uji lintas item | `05-evidence.md` AC-04 | `Unverified` |
| `INV-03` | tidak ada query tabel lintas siklus | pencarian SQL + review | `05-evidence.md` AC-12 | `Unverified` |
| `INV-04` | rincian menjumlah ke total | uji manual | `05-evidence.md` AC-10 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Sumber kas dan penjualan (`PQ-02`) — `D-43`, `D-25` | terjawab | `B-03`, `INV-03` |
| Dependensi `C-009` (`PQ-03`) — `D-25`, `backlog.md` | terjawab | urutan |
| Definisi dan periode laporan (`PQ-01`) — `D-51(f)`, `D-50` | terjawab | `POST-01` |
| Bucket umur (`PQ-04`) — `D-51(f)`; tafsir umur `[USULAN-AGEN]` | terjawab, tafsir menunggu kunci | `AC-02` |
| Akses laporan kas (`PQ-05`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-01` |
| Format keluaran (`PQ-06`) — `D-50` | terjawab | cakupan |
