# Design Contract: C-010 — Tutup buku dan jurnal penutup

- Source: `docs/product/items/C-010-tutup-buku/01-requirement.md` (`C-010`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-09`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app — status periode dan jurnal penutup
- Scope: penutupan periode, penguncian, jurnal penutup, penolakan posting ke periode terkunci
- Owner: tech lead
- Keputusan yang dipakai: `D-32`, `D-35`, `D-41`, `D-43`, `D-44` (4) dan (5), `D-50`

## Intent and non-goals

**Intent.** Setelah periode ditutup, angkanya tidak berubah diam-diam, dan saldo sementara berpindah ke laba ditahan lewat jurnal yang tercatat.

**Non-goals.** Tabel periode dan COA (`FND-006`), penguncian payroll (`GJ-005`), penguncian dokumen sumber (PT-02, `[USULAN-AGEN]`), laporan (`C-009`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server | permintaan tutup dan buka periode | validasi periode dan peran | periode bertipe | tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | cookie sesi | peran dari sesi dan tabel `pengguna` | `actor_id` + peran | tolak bila peran tidak sesuai PT-01 |
| `B-03` | Server → `postJournal()` | status periode | baca status di transaksi yang sama | status terkini | tolak posting; tidak ada baris |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Periode ditutup | periode berstatus `terbuka`; aktor berperan Accounting (D-50) | server | tolak; status tidak berubah |
| `PRE-02` | Periode ditutup | neraca saldo balance dan tidak ada dokumen setengah posting (D-50) | server | tolak; pesan menyebut prasyarat yang gagal |
| `PRE-03` | Periode dibuka kembali | tidak dipakai: buka kembali tidak ada (D-44 (5)) | server | tolak; status tidak berubah |
| `PRE-04` | Jurnal penutup dibuat | akun peran laba ditahan (302) dan akun nominal (401, 501, 601, 602, 701) ada di konfigurasi COA (D-35, D-41; 702 dicadangkan) | server | tolak seluruh penutupan |
| `PRE-05` | Periode ditutup | periode sebelumnya sudah `terkunci` (PT-04, `[USULAN-AGEN]`) | server | tolak; pesan menyebut periode yang belum ditutup |
| `PRE-06` | Tutup buku tahunan | semua 12 periode bulanan `terkunci`; tahun belum `ditutup` (PT-12, `[USULAN-AGEN]`) | server | tolak; status tidak berubah |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | status periode `terkunci` | periode lain | jejak penutupan di `riwayat_status` (D-32) |
| `POST-02` | saldo akun pendapatan dan beban tahun buku nol: 401, 501, 601, 602, 701 (D-44 5) | dokumen sumber, payroll | jurnal penutup tercatat lewat `postJournal()` |
| `POST-05` | status tahun buku `ditutup` (PT-12, `[USULAN-AGEN]`) | periode bulanan | jejak di `riwayat_status` |
| `POST-03` | total debit jurnal penutup = total kredit | — | — |
| `POST-04` | posting ke periode `terkunci` ditolak tanpa baris tersimpan | — | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core ledger | jurnal ke periode `terkunci` tidak pernah tersimpan | jurnal masuk ke periode terkunci |
| `INV-02` | core ledger | penutupan atomik: semua jurnal penutup tersimpan, atau tidak satu pun | jurnal penutup sebagian |
| `INV-03` | core ledger | jurnal penutup hanya ditulis lewat `postJournal()` | tulisan langsung ke `jurnal` |
| `INV-04` | core ledger | penutupan mengubah status periode dan jurnal penutup dalam satu transaksi | status `terkunci` tanpa jurnal penutup, atau sebaliknya |
| `INV-05` | core ledger | jurnal penutup nominal hanya pada tutup buku akhir tahun; koreksi periode tertutup lewat jurnal pembalik di periode berjalan (D-44 5) | jurnal penutup per bulan; jurnal baru di periode terkunci |
| `INV-06` | core ledger | tahun buku `ditutup` tidak menerima jurnal baru (PT-12, `[USULAN-AGEN]`) | jurnal baru ke tahun yang sudah `ditutup` |

| State | Transisi legal | Transisi ilegal |
|---|---|---|
| `terbuka` | → `terkunci` lewat tutup periode bulanan | — |
| `terkunci` | — tidak ada buka kembali (D-44 (5)) | semua transisi keluar |

Tahun buku (`[USULAN-AGEN]`, PT-12):

| State | Transisi legal | Transisi ilegal |
|---|---|---|
| `terbuka` | → `ditutup` lewat tutup buku tahunan, bila `PRE-06` terpenuhi | jurnal baru setelah `ditutup` (`INV-06`) |
| `ditutup` | — | semua transisi keluar |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penutupan gagal di tengah | status tetap `terbuka`; tidak ada jurnal penutup | ulangi setelah penyebab diperbaiki |
| Akun laba ditahan tidak ada | penutupan ditolak; pesan menyebut akun | tambahkan akun di COA (`FND-006`) |
| Posting ke periode terkunci | ditolak; tidak ada baris | pindahkan tanggal ke periode terbuka atau tunggu periode dibuka kembali |
| Koreksi periode tertutup | jurnal pembalik di periode berjalan (D-44 5) | — |

## Architecture boundaries

- Penutupan dan jurnal penutup berada di `core/ledger` (`D-07`).
- Modul tidak boleh menutup periode atau menulis jurnal penutup (`ARCH-03`, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`).
- Penegakan `PRE-02` di `postJournal()` (`ARCH-001`) dimiliki `FND-006`; `C-010` menentukan status periode yang dibaca.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | tutup periode terkunci ditolak | uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-02` | prasyarat gagal → ditolak | uji perilaku | `05-evidence.md` AC-12 | `Unverified` |
| `PRE-03` | buka kembali ditolak | uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-05` | penutupan melompati periode ditolak | uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-06` | tutup tahunan dengan periode terbuka ditolak | uji perilaku | `05-evidence.md` AC-13 | `Unverified` |
| `POST-05` | status tahun buku `ditutup` setelah tutup tahunan | uji fixture | `05-evidence.md` AC-13 | `Unverified` |
| `INV-06` | posting ke tahun `ditutup` ditolak | uji perilaku | `05-evidence.md` AC-13 | `Unverified` |
| `PRE-04` | akun tidak ada → penutupan ditolak | uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `POST-01` | status `terkunci` setelah tutup | uji fixture | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | saldo pendapatan dan beban nol | uji fixture | `05-evidence.md` AC-03 | `Unverified` |
| `POST-03` | debit = kredit pada jurnal penutup | uji fixture | `05-evidence.md` AC-04 | `Unverified` |
| `POST-04` | posting ke periode terkunci tidak tersimpan | perintah hitung baris | `05-evidence.md` AC-02 | `Unverified` |
| `INV-01` | tidak ada jurnal di periode terkunci | uji fixture + hitung baris | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | penutupan gagal → nol jurnal penutup | uji fixture | `05-evidence.md` AC-06 | `Unverified` |
| `INV-03` | tidak ada tulisan langsung ke `jurnal` | pencarian kode + review | — | `Unverified` |
| `INV-04` | status dan jurnal penutup konsisten | uji fixture | `05-evidence.md` AC-01, AC-03 | `Unverified` |
| `INV-05` | jurnal penutup hanya tahunan; koreksi lewat pembalik | uji fixture + hitung baris | `05-evidence.md` AC-03, AC-10 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Scope kunci: jurnal saja atau juga dokumen (PT-02) | `Proposed` `[USULAN-AGEN]` | dokumen sumber terkunci atau tidak sesuai niat |
| Buka kembali periode (PT-03) | `Terjawab — D-44 (5)` | — |
| Urutan penutupan periode (PT-04) | `Proposed` `[USULAN-AGEN]` | periode bolong, angka bergantung jurnal yang belum final |
| Jejak penutupan di `riwayat_status` (PT-05) | `Terjawab — D-32` | — |
| Tutup periode bulanan vs tutup buku tahunan (PT-11) | `Terjawab — D-50`, `D-44 (5)` | — |
| Status tahun buku dan sisa 601/602 (PT-12) | `Proposed` `[USULAN-AGEN]` | tahun tidak tertutup rapi, atau saldo sisa salah tujuan |
