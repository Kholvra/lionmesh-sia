# GJ-005 — Readiness Review

## Verdict

`Blocked` — dependensi belum `done`: `GJ-004` (`specified`, depends on `GJ-003`, `FND-002`); `FND-004` (`specified`); gate fondasi `FND-001`–`FND-007` belum `done` (D-54) (hanya `FND-001` yang `done`, termasuk `FND-006` untuk jurnal akrual); `FND-007` (gate item modul, D-54).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Definition of Ready — evidence

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | Outcome sebagai perilaku | 01 bagian Outcome | Lolos |
| 2 | Aktor dan izin jelas | 01 bagian Aktor dan "Siapa boleh melihat"; R-01, R-02 terjawab; R-03 dan R-08 `[USULAN-AGEN]` | Lolos |
| 3 | Status dan transisi eksplisit, jalur gagal juga | 01 bagian Status: `DRAFT_TERHITUNG`, `DIPERIKSA`, `DISETUJUI`, `REVISI` (`D-46`); pengembalian; kunci tanpa buka kunci (R-05) | Lolos |
| 4 | Validasi punya pesan | 01 bagian Validasi (pemeriksaan, peran, pemohon, kunci, alasan, periode tertutup) | Lolos |
| 5 | AC bisa dibuktikan dengan langkah | 02 AC-01 sampai AC-12; AC-08 diuji dengan periode uji ditandai tertutup sebelum `C-010` | Lolos |
| 6 | `depends on` berstatus `done` | `backlog.md`: `GJ-004` = `specified`; `FND-004` = `specified` | Belum lolos |
| 7 | Tidak ada pertanyaan pemblokir terbuka | 00 tanpa pertanyaan terbuka; R-01 sampai R-09 terjawab (sebagian `[USULAN-AGEN]`) | Lolos |
| 8 | Gate fondasi terpenuhi | Hanya `FND-001` `done`; `FND-006` (jurnal akrual) dan `FND-007` belum | Belum lolos |
| 9 | Ukuran wajar untuk satu orang satu track | Usulan `M` (agen) | Lolos |

Kondisi bersyarat:

| Kondisi | Berlaku? | Evidence |
|---|---|---|
| Menyentuh uang | Ya | Mengunci nominal yang dibayar; memicu jurnal akrual (`D-49`); akun peran di GJ-007 (`D-41`, `D-35`) |
| Mengubah stok | Tidak | — |
| Menyentuh status dokumen | Ya | `DIPERIKSA`, `DISETUJUI`, `REVISI`; `riwayat_status` (`D-08`); kontrak `PRE-02`, `INV-02`, `INV-03` |
| Melintasi modul | Ya | Jurnal lewat `postJournal()` core (`D-07`); data karyawan dan presensi lewat service core |
| Menyentuh data pribadi | Ya | Rincian per karyawan; pembaca di 01 (`[USULAN-AGEN]`) |

## Dependensi yang belum done

| ID | Dependensi | Status |
|---|---|---|
| `GJ-004` | Draft payroll (`depends on`) | `specified` |
| `FND-004` | Approval dan status dokumen (`depends on`) | `specified` |
| `FND-002`, `FND-003`, `FND-005`, `FND-006` | Gate fondasi (`backlog.md` aturan 1); `FND-006` untuk jurnal akrual | `specified`; `FND-002` `ready` |
| `FND-007` | Gate item modul (D-54, DoR butir 8) | `specified` |

## Keputusan `[USULAN-AGEN]` (disahkan `D-58`)

Tidak ada pertanyaan terbuka. Yang disahkan `D-58`: R-03 (Accounting dan Direksi boleh mengembalikan), R-05 (tidak ada buka kunci), R-06 ("ditutup" berarti `DISETUJUI`), R-07 (persetujuan ditolak bila periode akuntansi tertutup), R-08 (pembaca rincian), R-09 (catatan opsional di `riwayat_status`).

## Pertentangan yang perlu dikunci koordinator

- `D-49` (jurnal akrual saat DISETUJUI) dan `D-46` (`DIPOSTING` setelah `DIBAYAR`). Lihat GJ-007 J-03.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Periode akuntansi tertutup saat persetujuan | Persetujuan gagal di saat kritis | R-07: pesan jelas; tutup buku (`C-010`) mengikuti jadwal payroll |
| Dua persetujuan bersamaan | Jurnal akrual ganda | Constraint status dan satu jurnal akrual per periode (`GJ-007` INV-03) |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Priority | `P0` (analisis §5.5) | Gate pembayaran |
| Size | `M` | Dua persetujuan, kunci, dan pemicu jurnal |
| Kunci otomatis | Saat `DISETUJUI` (`D-49`, EPIC-GJ) | Sesuai keputusan terkunci |

## Readiness status

`Blocked` (alasan tunggal: dependensi belum `done`).

## Handoff boundary

- Parent epic / milestone: `EPIC-GJ` / M1
- Lane / sequence / predecessor: active, level 5 (derived); predecessor `GJ-004` dan `FND-004`
- Foundation status / evidence: `partial`
- Artifact role / canonical source: canonical
- Next domain: `design-contracts` (sudah ditulis di 04, status `Proposed`), lalu `quick-dev` setelah `Ready`
- Required input artifacts: `decisions.md` (D-08, D-33, D-35, D-37, D-43, D-44, D-46, D-48, D-49, D-51(c)); `analisis-sia.md` §3.2, §3.3, §6.9, §7.5, §8.1, §8.3; makalah UC-GJ-06, UC-GJ-07; `EPIC-GJ`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- Requirement: `01-requirement.md`
- AC: `02-acceptance-criteria.md`
- Contract: `04-design-contract.md`
- Bukti: `05-evidence.md`
