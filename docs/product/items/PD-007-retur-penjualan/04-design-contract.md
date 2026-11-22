# Design Contract: PD-007 — Retur penjualan dan kredit memo

- Source: `docs/product/items/PD-007-retur-penjualan/01-requirement.md` (`PD-007`); `docs/product/decisions.md` (`D-06`, `D-07`, `D-08`, `D-10`, `D-15`, `D-33`, `D-41`, `D-43`, `D-44`, `D-48`, `D-49`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-14`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (stok, uang, status dokumen)
- Scope: retur, persetujuan, QC retur, stok masuk, kredit memo, jurnal retur
- Owner: tech lead

## Intent and non-goals

**Intent.** Stok hanya kembali untuk qty yang lulus QC dan disetujui, dan piutang hanya berkurang lewat kredit memo yang punya jurnal balance dan tidak melebihi sisa faktur asal.

**Non-goals.** Retur bahan ke pemasok, retur produksi, pengembalian dana, dan penerbitan ulang faktur.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | qty retur, qty lulus, alasan | parse dan validasi | nilai bertipe | tolak |
| `B-02` | Sesi → identitas aktor | cookie sesi | identitas dari sesi | peran dan `actor_id` tepercaya | tolak persetujuan tanpa izin |
| `B-03` | Server → core inventory | mutasi masuk | hanya service core | mutasi tervalidasi | tolak |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Ajukan retur | faktur asal ada; kumulatif qty ≤ qty dikirim per baris (`D-49`) | server action | tolak |
| `PRE-02` | Setujui retur | aktor berperan Accounting; aktor bukan pengaju (`D-48`) | server action | tolak |
| `PRE-03` | Catat hasil QC | status `DISETUJUI`; aktor berperan QC; qty lulus ≤ qty disetujui | server action | tolak; tidak ada mutasi |
| `PRE-04` | Kredit memo dan stok masuk | periode akuntansi tidak terkunci (`ARCH-001` `PRE-02`); total ≤ sisa faktur asal (`PQ-02`) | core ledger / server action | tolak; tidak ada mutasi atau jurnal |
| `PRE-05` | Batalkan retur | status `DIAJUKAN` atau `DISETUJUI`; belum ada hasil QC; alasan tidak kosong; aktor pengaju | server action | tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Mutasi masuk sebesar qty lulus dalam transaksi yang sama dengan `saldo_stok` | faktur asal | mutasi masuk |
| `POST-02` | Sisa faktur asal berkurang sebesar total kredit memo | nilai faktur | status faktur turunan |
| `POST-03` | Dua jurnal balance lewat `postJournal()`: kredit memo dan pembalik HPP | nomor retur | baris jurnal |
| `POST-04` | Retur `SELESAI` dengan riwayat tiga transisi | — | riwayat |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core inventory | Stok masuk hanya dari qty lulus QC pada retur `DISETUJUI` | stok masuk tanpa QC |
| `INV-02` | Core ledger | Debit = kredit (`ARCH-001` `INV-01`) | jurnal tidak balance |
| `INV-03` | Modul Pendapatan | Retur tidak dihapus | baris retur hilang |
| `INV-04` | Modul Pendapatan | Selisih qty tidak disesuaikan otomatis (`PQ-04`) | penyesuaian diam-diam |
| `INV-05` | Modul Pendapatan | Kumulatif retur per baris ≤ qty dikirim (`D-49`) | retur melebihi kiriman |
| `INV-06` | Modul Pendapatan | Pengaju ≠ penyetuju (`D-48`) | persetujuan oleh pengaju |
| `INV-07` | Modul Pendapatan | Total kredit memo ≤ sisa faktur asal | kredit melebihi tagihan |

State retur: `DIAJUKAN → DISETUJUI → SELESAI | DITOLAK`; `DIAJUKAN → DITOLAK`; `DIAJUKAN | DISETUJUI → DIBATALKAN`.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Mutasi masuk gagal | status tetap `DISETUJUI`; tidak ada kredit memo; tidak ada jurnal | ulangi |
| Jurnal gagal | mutasi dibatalkan bersama; status tetap `DISETUJUI` | ulangi |
| Dua QC bersamaan | hanya satu berhasil (update bersyarat `WHERE status = 'DISETUJUI'`) | pesan "Dokumen sudah diproses" |

## Architecture boundaries

- Mutasi masuk hanya lewat `core/inventory` (`ARCH-04`).
- Jurnal hanya lewat `core/ledger` (`ARCH-03`).
- Nomor dan riwayat lewat `core/dokumen` (`ARCH-05`).
- Tidak membaca tabel modul lain (`D-25`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | retur tanpa faktur atau melebihi kiriman ditolak | uji manual | `05-evidence.md` AC-01, AC-11 | `Unverified` |
| `PRE-02` | penyetuju tidak sah atau pengaju ditolak | uji otomatis | `05-evidence.md` AC-02, AC-09 | `Unverified` |
| `PRE-03` | QC sebelum setujui ditolak; lulus > setujui ditolak | uji manual | `05-evidence.md` AC-13 | `Unverified` |
| `PRE-04` | periode terkunci ditolak; kredit melebihi sisa ditolak | uji manual | `05-evidence.md` AC-05, AC-14 | `Unverified` |
| `PRE-05` | batal setelah QC ditolak | uji manual | `05-evidence.md` AC-12 | `Unverified` |
| `POST-01` | saldo bertambah sesuai qty lulus | pemeriksaan basis data | `05-evidence.md` AC-03, AC-10 | `Unverified` |
| `POST-02` | piutang berkurang sesuai kredit memo | uji manual | `05-evidence.md` AC-05 | `Unverified` |
| `POST-03` | dua jurnal balance | uji `postJournal()` | `05-evidence.md` AC-06 | `Unverified` |
| `POST-04` | riwayat tiga transisi | pemeriksaan basis data | `05-evidence.md` AC-08 | `Unverified` |
| `INV-01` | stok tidak masuk saat gagal QC | uji inventory | `05-evidence.md` AC-04 | `Unverified` |
| `INV-02` | debit = kredit | uji `postJournal()` | `05-evidence.md` AC-06 | `Unverified` |
| `INV-04` | selisih tidak otomatis | uji manual | `05-evidence.md` AC-07 | `Unverified` |
| `INV-05` | kumulatif ≤ kiriman | uji manual | `05-evidence.md` AC-11 | `Unverified` |
| `INV-06` | pengaju tidak menyetujui | uji otomatis | `05-evidence.md` AC-09 | `Unverified` |
| `INV-07` | kredit ≤ sisa | uji manual | `05-evidence.md` AC-05 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Persetujuan dan ambang (`PQ-01`) — `D-49`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-02` |
| Kredit memo (`PQ-02`) — `D-49`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-02`, `INV-07` |
| QC dan gagal QC (`PQ-03`) — `D-33`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-03`, `INV-01` |
| `D-15` untuk retur (`PQ-04`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `INV-04` |
| Retur wajib faktur dan batas kiriman (`PQ-05`) — `D-49` | terjawab | `PRE-01` |
| Akun retur (`PQ-06`) — `D-41`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-03` |
| Tafsir `D-13` (`PQ-07`) | terjawab | cakupan retur |
| Nilai stok masuk (`PQ-08`) — `D-10`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-01`, jurnal HPP |
