# Design Contract: GJ-005 — Periksa dan setujui payroll

- Source: `01-requirement.md`, `02-acceptance-criteria.md`; `decisions.md` (D-07, D-08, D-33, D-35, D-37, D-43, D-44, D-46, D-48, D-49); `analisis-sia.md` §6.9, §8.1, §8.3; `EPIC-GJ`
- Status: `Proposed`
- Profile: product app (uang, status dokumen, kunci)
- Alasan kontrak wajib: menyentuh uang (kunci dan jurnal akrual) dan status dokumen
- Owner: tech lead

## Intent and non-goals

**Intent.** Draft yang disetujui tidak bisa berubah. Persetujuan selalu didahului pemeriksaan dan dilakukan oleh orang yang bukan penghitungnya. Persetujuan dan jurnal akrual terjadi bersama.

**Non-goals.** Hitungan (GJ-004); pembayaran (GJ-006); penyusunan jurnal (GJ-007); buka kunci (tidak ada di versi awal).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Aksi periksa, setujui, atau kembalikan → server | Keputusan dan catatan | Parse; peran dari sesi | Keputusan tervalidasi | Tolak |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Dari sesi | `actor_id`, peran, dan pencatat hitungan draft | Tolak bila tidak ada sesi |
| `B-03` | Persetujuan → service core jurnal | Pemicu akrual | Lewat `postJournal()` (`D-07`) dalam transaksi yang sama | Jurnal balance | Tolak seluruh transisi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Periksa | Status `DRAFT_TERHITUNG`; aktor Accounting | Server | Tolak |
| `PRE-02` | Setujui | Status `DIPERIKSA`; aktor Direksi; aktor bukan penghitung draft (`D-48`) | Server | Tolak; sebut pemeriksaan atau pemohon |
| `PRE-03` | Ubah draft | Status bukan `DISETUJUI` | Server + database | Tolak; sebut kunci |
| `PRE-04` | Kembalikan | Status `DIPERIKSA`; aktor Accounting atau Direksi; alasan terisi (`D-48`) | Server | Tolak; sebut alasan |
| `PRE-05` | Setujui | Periode akuntansi tempat jurnal akrual dibuat terbuka (R-07, `D-44` 5) | Server + core ledger | Tolak; sebut periode tertutup |

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | Status sesuai transisi legal | Angka draft | Riwayat |
| `POST-02` | Draft `DISETUJUI` tidak berubah angkanya | Seluruh angka | Kunci aktif |
| `POST-03` | Tepat satu jurnal akrual dibuat saat `DISETUJUI` (`D-49`) | Jurnal lain | Baris jurnal (lewat GJ-007) |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Server | Tidak ada `DISETUJUI` tanpa `DIPERIKSA` sebelumnya | Persetujuan langsung dari `DRAFT_TERHITUNG` |
| `INV-02` | Database | Draft `DISETUJUI` tidak bisa di-`UPDATE` pada nominal | Angka berubah setelah disetujui |
| `INV-03` | Core dokumen (`ARCH-05`) | Setiap transisi punya riwayat | Status berubah tanpa riwayat |
| `INV-04` | Server | Pencatat draft tidak memeriksa atau menyetujui draft itu (`D-48`) | Penghitung menyetujui hasilnya |
| `INV-05` | Server | Persetujuan dan jurnal akrual dalam satu transaksi: keduanya berhasil atau tidak keduanya (`D-43`) | Status `DISETUJUI` tanpa jurnal, atau jurnal tanpa status |

Transisi legal: `DRAFT_TERHITUNG` → `DIPERIKSA` (Accounting); `DIPERIKSA` → `DISETUJUI` (Direksi, `PRE-02`, `PRE-05`); `DIPERIKSA` → `REVISI` (Accounting atau Direksi, `PRE-04`); `REVISI` → `DRAFT_TERHITUNG` (HR menghitung ulang, GJ-004). `DISETUJUI` tidak punya transisi keluar.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Persetujuan gagal di tengah (termasuk jurnal gagal) | Status tidak berubah; jurnal tidak dibuat (`INV-05`) | Ulangi |
| Dua persetujuan bersamaan | Hanya satu yang berhasil (constraint status) | — |
| Periode akuntansi tertutup | Persetujuan ditolak (`PRE-05`) | Tutup buku dibuka lewat `C-010` bila berlaku, atau tunggu periode terbuka |
| Angka salah setelah `DISETUJUI` | Koreksi lewat jurnal pembalik dan komponen koreksi di periode berikutnya (`D-35`, `D-43`) | Di luar item ini |

## Architecture boundaries

Mengikuti `ARCH-001`. Status dokumen lewat `core/dokumen` (`ARCH-05`). Jurnal lewat `core/ledger` (`ARCH-03`, `D-07`). Modul GJ-005 hanya memanggil service core; tidak mengimpor GJ-007 (`D-04`). Orkestrasi transisi dan jurnal dijalankan oleh service core, bukan modul.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Keputusan tidak valid ditolak | Uji perilaku | — | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | Jurnal hanya lewat `postJournal()`; gagal jurnal membatalkan persetujuan | Uji perilaku + review | — | `Unverified` |
| `PRE-01` | Periksa dari status salah ditolak | Uji perilaku | — | `Unverified` |
| `PRE-02` | Setujui sebelum periksa, atau oleh penghitung, ditolak (AC-03, AC-05, AC-09) | Uji perilaku | — | `Unverified` |
| `PRE-03` | Ubah draft terkunci ditolak (AC-04) | Uji perilaku | — | `Unverified` |
| `PRE-04` | Kembalikan tanpa alasan ditolak (AC-06) | Uji perilaku | — | `Unverified` |
| `PRE-05` | Periode akuntansi tertutup menolak persetujuan (AC-08) | Uji perilaku | — | `Unverified` |
| `POST-01` | Status dan riwayat (AC-01, AC-02, AC-10, AC-11) | Uji perilaku | — | `Unverified` |
| `POST-02` | Angka tidak berubah setelah disetujui (AC-04, AC-07) | Uji database | — | `Unverified` |
| `POST-03` | Tepat satu jurnal akrual (AC-02) | Uji database | — | `Unverified` |
| `INV-01` | Tidak ada lompatan status | Uji perilaku | — | `Unverified` |
| `INV-02` | Update pada draft terkunci ditolak database | Uji database | — | `Unverified` |
| `INV-03` | Setiap transisi punya riwayat (AC-11) | Uji database | — | `Unverified` |
| `INV-04` | Penghitung tidak menyetujui hasilnya (AC-09) | Uji perilaku | — | `Unverified` |
| `INV-05` | Persetujuan dan jurnal atomik (AC-02, AC-08) | Uji database | — | `Unverified` |

Semua aturan `Unverified`.
