# PD-001 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: aksi buat, cari, ubah, nonaktifkan dari UI |
| 2 | Aktor dan izin jelas | lolos | Penjualan (buat/ubah, nonaktifkan), Manajemen (batas kredit) per `D-33` dan `[USULAN-AGEN]` `PQ-02`; tabel izin per aksi ada di `01-requirement.md` |
| 3 | Status dan transisi eksplisit | lolos | `aktif ⇄ nonaktif`, jalur gagal (validasi, izin) ada di `01-requirement.md` dan `04-design-contract.md` |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | seluruh kondisi gagal punya pesan di `01-requirement.md` bagian Validations |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01`..`AC-11`, setiap AC punya cara membuktikan |
| 6 | Semua `depends on` berstatus `done` | lolos | `FND-003` `done` (2026-11-23) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 7 pertanyaan, 0 terbuka; semua terjawab (D-16, D-31, D-33, D-50, sumber makalah, atau `[USULAN-AGEN]`) |
| 8 | Gate fondasi terpenuhi | lolos | `FND-001`–`FND-009` `done` (2026-11-23, `D-54`, `D-62`) |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran `S` (`D-50`: ukuran memakai usulan di paket): master CRUD dengan tiga aturan nilai dan satu izin |

Kriteria bersyarat:

| Kondisi | Status | Catatan |
|---|---|---|
| Menyentuh uang | tidak berlaku | termin dan batas kredit tidak membentuk jurnal |
| Mengubah stok | tidak berlaku | tidak ada mutasi |
| Menyentuh status dokumen | tidak berlaku | status pelanggan bukan status dokumen; jejak perubahan master lewat `riwayat_status` (`D-08`) |
| Melintasi modul | lolos | tabel `pelanggan` di `core/` (`D-31`); PD-001 hanya memakai service `FND-003` |
| Menyentuh data pribadi | ya | field telepon, email, alamat; yang boleh membaca: Penjualan, Accounting, Manajemen (`PRE-04`) |

## Ringkasan pertanyaan terbuka

Total 7 pertanyaan. Terjawab 7 · terjawab sebagian 0 · terbuka 0. Rincian di `00-discussion.md`. Status sebelumnya: seluruhnya terbuka atau sebagian.

## Verdict

`Ready`

Semua kriteria DoR terpenuhi sejak 2026-11-23. Fondasi `FND-001`–`FND-009` sudah `done`, termasuk AppShell (`D-62`), sehingga layar item ini punya tempat render. Bila item membuat tabel, DDL dikirim sebagai usulan `06-ddl-proposal.sql` dan dinomori tech lead (`D-09`); layar dicari di `docs/design/inventory/<siklus>.md`.

## Blockers / decisions needed

| Hal | Jenis | Pemilik |
|---|---|---|
| `FND-003` selesai | dependensi | tech lead |
| Gate `FND-002`, `FND-004`–`FND-006` selesai | gate | tech lead |
| `FND-007` selesai (primitive UI) | gate | tech lead |

## Usulan terkunci (menunggu koordinator)

| Hal | Usulan | Dasar |
|---|---|---|
| Batas kredit diatur Manajemen | `[USULAN-AGEN]` | `D-16`, `D-48` |
| Kontak sebagai data pribadi dasar | `[USULAN-AGEN]` | sifat data kontak orang perorangan |
| NPWP dan alamat nullable | `[USULAN-AGEN]` | `D-24`, `D-51(a)` |
| Prioritas `P0`, ukuran `S` | sudah dikunci | `D-50` (prioritas dari analisis, ukuran dari paket) |

## Readiness status

Belum `Ready`. Verdict `Blocked` karena dependensi.

## Handoff boundary

- Parent epic / milestone: `EPIC-PD` / `M1`
- Lane / sequence / predecessor: `active`, graph track PD-A, level 1. Predecessor: `FND-003`.
- Foundation status / evidence: `partial` (`backlog.md`). Gate `FND-001` `done`.
- Artifact role / canonical source: canonical (`docs/product/items/PD-001-pelanggan-termin-batas-kredit/`)
- Next domain: `quick-dev` setelah `Ready`.
- Required input artifacts: `docs/product/decisions.md` (`D-14`, `D-16`, `D-23`, `D-25`, `D-31`, `D-33`, `D-48`, `D-50`), `docs/product/policies/matriks-izin.md`.
- Implementation plan: `Not created`

## Links

- `docs/product/items/PD-001-pelanggan-termin-batas-kredit/00-discussion.md`
- `docs/product/items/PD-001-pelanggan-termin-batas-kredit/01-requirement.md`
- `docs/product/items/PD-001-pelanggan-termin-batas-kredit/02-acceptance-criteria.md`
- `docs/product/items/PD-001-pelanggan-termin-batas-kredit/04-design-contract.md`
- `docs/product/items/PD-001-pelanggan-termin-batas-kredit/05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-PD.md`
