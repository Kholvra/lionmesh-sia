# Design Contract: FND-008 — Seed deterministik dan reset

- Source: `docs/product/items/FND-008-seed-deterministik-reset/01-requirement.md` (`FND-008`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-09`)
- Status: `Proposed`
- Profile: infrastructure / developer tooling (data seed)
- Scope: mekanisme seed bernomor, master dasar, penanda versi, penolakan seed ganda, penjaga lingkungan
- Owner: tech lead
- Referensi: `FND-001` `04-design-contract.md` (`B-02`, `PRE-03`, `PRE-04`, `POST-03`, `POST-04`, `INV-03`); `D-27`, `D-30`, `D-37`, `D-41`, `D-51`, `D-53`

## Intent and non-goals

**Intent.** Data dasar selalu sama, dan database tidak pernah berisi sisa data yang tidak bisa dibedakan dari seed yang gagal.

**Non-goals.** Isi master final milik item pemilik, skenario `INT-002`, transaksi, dan data produksi.

## Invariants

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Skrip seed | Seed tidak bergantung pada waktu sistem atau acak tanpa benih (`FND-001` `INV-03`) | `now()` atau acak di berkas seed |
| `INV-02` | Skrip seed | Dua putaran dari `siap` menghasilkan jumlah baris dan nilai kunci yang sama (`FND-001` `POST-04`) | Hasil berbeda antar putaran |
| `INV-03` | Skrip seed | Seed tidak berjalan di atas data yang sudah ada (`FND-001` `PRE-03`) | Seed ganda |
| `INV-04` | Skrip seed | Seed hanya berisi master dan akun uji; tidak ada transaksi, mutasi, atau jurnal (`OQ-08-01`) | Baris transaksi di seed |
| `INV-05` | Skrip seed | Seed hanya berjalan di lingkungan lokal (`FND-001` `PRE-04`, `OQ-08-07`) | Seed di lingkungan non-lokal |

## Preconditions and postconditions (ringkas)

| ID | Rule | Owner | Violation behavior |
|---|---|---|---|
| `PRE-01` | Seed hanya dari `siap` | Skrip seed | Tolak; sebut `pnpm db:reset` |
| `PRE-02` | Versi berkas seed sama dengan versi terpasang, atau database baru `siap` | Skrip seed | Tolak sampai reset penuh (`OQ-08-05`) |
| `POST-01` | Seed sukses → `terisi`; data dasar tetap | Skrip seed | Gagal di tengah → bukan `terisi`; reset |

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `INV-01` | `grep` waktu dan acak tanpa hasil | AC-03 | — | `Unverified` |
| `INV-02` | Dua putaran identik | AC-01 | — | `Unverified` |
| `INV-03` | Seed kedua ditolak | AC-02 | — | `Unverified` |
| `INV-04` | Tidak ada transaksi di seed | AC-06 | — | `Unverified` |
| `INV-05` | Penanda non-lokal menolak seed | AC-07 | — | `Unverified` |
| `PRE-01` | Seed dari status tidak `siap` ditolak | AC-02 | — | `Unverified` |
| `PRE-02` | Versi berbeda ditolak | AC-08 | — | `Unverified` |
| `POST-01` | Status `terisi` setelah sukses | AC-01 | — | `Unverified` |

## Keamanan kredensial

- Akun uji (13 peran, `D-53`) hanya dibuat di database lokal (`D-27`) dengan kata sandi uji.
- Penanda `_seed_meta` tidak bisa dibaca role klien (`AC-09`).

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Seed hanya master (`OQ-08-01`) | `[USULAN-AGEN]` | Transaksi di seed membuat uji tidak membuktikan proses |
| Setiap item menambah seed (`OQ-08-02`) | `[USULAN-AGEN]` | Dependensi tersembunyi ke `FND-003`–`FND-006` |
| Akun uji dan kredensial lokal (`OQ-08-03`) | `[USULAN-AGEN]` | Kredensial ikut ke lingkungan lain |
| Versi dan reset penuh (`OQ-08-05`) | `[USULAN-AGEN]` | Seed lama dianggap berlaku |
| UUID tetap (`OQ-08-06`) | `[USULAN-AGEN]` | Perbandingan AC-01 tidak stabil |
| Penjaga `db:seed` (`OQ-08-07`) | `[USULAN-AGEN]` | Seed ke non-lokal |
| RLS penanda (`OQ-08-08`) | `[USULAN-AGEN]` | Penanda terbaca klien |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | Tidak ada dokumen |
| Trust boundary | Sumber seed dari repo; dirujuk ke `FND-001` `B-02` |
| Architecture boundary | Tidak menyentuh batas modul |
| Loop/termination | Tidak ada algoritma berulang |
