# Design Contract: INT-001 — Jurnal gabungan

- Source: `docs/product/items/INT-001-jurnal-gabungan/01-requirement.md` (`INT-001`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-09`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app — pemeriksaan jurnal gabungan (uang)
- Scope: keseimbangan, akun, dan sumber seluruh jurnal; penolakan posting ke periode terkunci
- Owner: tech lead (PT-08, `[USULAN-AGEN]`)
- Keputusan yang dipakai: `D-07`, `D-25`, `D-30`, `D-35`, `D-41`, `D-43`, `D-44`, `D-45`, `D-49`, `D-51` (b)

## Intent and non-goals

**Intent.** Jurnal dari empat siklus membentuk satu jurnal yang konsisten. Pemeriksaan ini menangkap perbedaan asumsi antar modul, bukan kesalahan logika siklus.

**Non-goals.** Logika jurnal per siklus, rekonsiliasi stok (`INT-003`), rantai seed (`INT-002`), dan pemetaan akun per kejadian (PT-02 terjawab; `00`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Modul → core ledger | baris jurnal dari setiap siklus | validasi keseimbangan dan akun di `postJournal()` | jurnal tervalidasi | tolak; tidak ada baris |
| `B-02` | Data uji → pemeriksa | hasil `db:seed` dan run siklus | pemeriksa hanya membaca | angka dari jurnal | gagal bila tidak balance |
| `B-03` | Pemeriksa → hasil | angka jurnal dan neraca | pembanding angka | status lulus/gagal yang bisa dibaca mesin | gagal; menyebut jurnal |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | pemeriksaan dijalankan | data uji dari `db:reset` lalu `db:seed` (`D-30`) | penguji | tolak jalan; sebut perintah |
| `PRE-02` | jurnal diposting | periode `terbuka` (`C-010`) | core ledger | tolak |
| `PRE-03` | jurnal diposting | total debit = total kredit; akun ada dan aktif; sumber ada | core ledger (`FND-006`) | tolak; tidak ada baris |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | seluruh jurnal balance | jurnal sumber | — |
| `POST-02` | neraca saldo dari `C-009` balance | — | — |
| `POST-03` | jumlah dan total jurnal sama pada dua kali run | data uji | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core ledger | setiap jurnal tersimpan balance (`INV-01` dari ARCH-001) | jurnal tidak balance tersimpan |
| `INV-02` | core ledger | setiap baris jurnal punya sumber (analisis §7.5 `[USULAN]`) | baris tanpa sumber |
| `INV-03` | core ledger | jurnal ke periode terkunci tidak tersimpan | jurnal masuk periode terkunci |
| `INV-04` | modul | tidak ada modul menulis tabel jurnal langsung (`D-07`) | tulisan langsung ke `jurnal` |
| `INV-05` | core ledger | jurnal tidak bisa diubah atau dihapus; koreksi lewat jurnal pembalik; debit = kredit tanpa toleransi (`D-43`, `D-35`) | ubah atau hapus jurnal tersimpan |
| `INV-06` | modul | setiap baris jurnal memakai peran akun dari konfigurasi; tidak ada nomor akun literal di modul (`D-35`, `D-41`) | nomor akun literal di kode modul |
| `POST-04` | core ledger | pembayaran pemasok: Dr `utang_usaha` / Cr `kas_bank`, alokasi tertua dulu (`D-49`) | alokasi tidak urut |
| `POST-05` | core ledger | gaji akrual Dr beban / Cr `utang_gaji`; pembayaran Dr `utang_gaji` / Cr `kas_bank` (`D-49`) | jurnal gaji tanpa peran akun |

Tidak ada state machine.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Jurnal tidak balance | pemeriksaan gagal; menyebut jurnal | perbaiki di siklus sumber lewat `core/` |
| Akun tidak dikenal | pemeriksaan gagal; menyebut akun | tambahkan akun di COA (`FND-006`) atau perbaiki pemetaan (PT-02) |
| Data uji tidak ada | pemeriksaan tidak jalan | `db:reset` + `db:seed` |

## Architecture boundaries

- Penulisan jurnal hanya di `core/ledger` (`D-07`, `ARCH-03`).
- Pemeriksaan lintas siklus membaca lewat core (`D-25`, `ARCH-08`).
- Temuan diselesaikan di `core/`, bukan di modul (`EPIC-INT`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | data uji dari reset + seed | perintah | `05-evidence.md` AC-09 | `Unverified` |
| `PRE-02` | posting ke periode terkunci ditolak | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-03` | jurnal tidak balance ditolak | uji fixture | `05-evidence.md` AC-02 | `Unverified` |
| `POST-01` | total debit = total kredit | perintah SQL | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | neraca saldo balance | pembanding dari `C-009` | `05-evidence.md` AC-05 | `Unverified` |
| `POST-03` | dua run identik | pembanding | `05-evidence.md` AC-09 | `Unverified` |
| `INV-01` | tidak ada jurnal tidak balance | perintah SQL | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | tidak ada baris tanpa sumber | perintah SQL | `05-evidence.md` AC-04 | `Unverified` |
| `INV-03` | tidak ada jurnal di periode terkunci | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `INV-04` | tidak ada tulisan langsung | pencarian kode | `05-evidence.md` AC-07 | `Unverified` |
| `INV-05` | jurnal tidak berubah; koreksi lewat pembalik | uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `INV-06` | tidak ada nomor akun literal di modul | pencarian kode | `05-evidence.md` AC-13 | `Unverified` |
| `POST-04` | alokasi pembayaran pemasok sesuai | uji fixture | `05-evidence.md` AC-11 | `Unverified` |
| `POST-05` | jurnal gaji akrual dan pembayaran sesuai | uji fixture | `05-evidence.md` AC-12 | `Unverified` |
| `POST-06` (kejadian 1–7) | setiap kejadian punya jenis transaksi asal dan peran akun yang benar | uji fixture | `05-evidence.md` AC-14 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Pemetaan jurnal per kejadian (PT-02) | `Terjawab — D-41, D-44, D-49` | jurnal benar secara teknis tapi salah secara akuntansi, bila salah |
| Definisi akun menggantung (PT-03) | `Proposed` `[USULAN-AGEN]` | pemeriksaan terlalu longgar atau terlalu ketat |
| Akun GR/IR (PT-04) | `Terjawab — D-35, D-41` (akun 202) | utang belum diakui tercatat |
| Toleransi pembulatan (PT-06) | `Terjawab — D-43` (nol) | pemeriksaan gagal atau lolos karena pembulatan |
| Predecessor PR-007 (PT-01) | `Terjawab — backlog.md` (transitif ke PR-006) | jurnal HPP tidak ikut diuji, bila salah |
| Seed sebelum INT-001 (PT-05) | `Proposed` `[USULAN-AGEN]` (koordinasi) | data uji tidak lengkap |
| Masuk CI atau manual (PT-07) | `Proposed` `[USULAN-AGEN]` (manual/terjadwal) | regresi jurnal lolos tanpa terdeteksi |
