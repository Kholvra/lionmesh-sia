# GJ-003 — Readiness Review

## Verdict

`Blocked` — dependensi belum `done`: `GJ-002` (`specified`, depends on `GJ-001`, `FND-004`); gate fondasi `FND-001`–`FND-007` belum `done` (D-54) (hanya `FND-001` yang `done`); `FND-007` (gate item modul, D-54).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Definition of Ready — evidence

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | Outcome sebagai perilaku | 01 bagian Outcome | Lolos |
| 2 | Aktor dan izin jelas | 01 bagian Aktor dan "Siapa boleh melihat"; Q-01 dan Q-06 terjawab (`[USULAN-AGEN]`) | Lolos |
| 3 | Status dan transisi eksplisit, jalur gagal juga | 01 bagian Status: `TERBUKA`, `REKAP`, `TERVALIDASI` (`D-46`, `D-47` c); pengembalian dan koreksi | Lolos |
| 4 | Validasi punya pesan | 01 bagian Validasi (karyawan tanpa entri, validator, alasan, otorisasi) | Lolos |
| 5 | AC bisa dibuktikan | 02 AC-01 sampai AC-11 | Lolos |
| 6 | `depends on` berstatus `done` | `backlog.md`: `GJ-002` = `specified` | Belum lolos |
| 7 | Tidak ada pertanyaan pemblokir terbuka | 00 tanpa pertanyaan terbuka; Q-01 sampai Q-07 terjawab (sebagian `[USULAN-AGEN]` sudah disahkan `D-58` (tingkat item)) | Lolos |
| 8 | Gate fondasi terpenuhi | Lewat `GJ-002`; hanya `FND-001` `done`; `FND-007` belum (Q-07) | Belum lolos |
| 9 | Ukuran wajar untuk satu orang satu track | Usulan `S` (agen) | Lolos |

Kondisi bersyarat:

| Kondisi | Berlaku? | Evidence |
|---|---|---|
| Menyentuh uang | Tidak | Hanya status; uang di GJ-004 |
| Mengubah stok | Tidak | — |
| Menyentuh status dokumen | Ya | Status periode `TERBUKA`, `REKAP`, `TERVALIDASI`; jejak `riwayat_status` (`D-08`); kontrak `PRE-03`, `POST-01`, `INV-01` |
| Melintasi modul | Ya | Data karyawan dan presensi lewat service core (`D-25`) |
| Menyentuh data pribadi | Ya | Rekap per karyawan; pembaca di 01 (`[USULAN-AGEN]`) |

## Dependensi yang belum done

| ID | Dependensi | Status |
|---|---|---|
| `GJ-002` | Presensi dan lembur (`depends on`) | `specified` |
| `GJ-001`, `FND-004` | Prasyarat `GJ-002` | `specified` |
| `FND-002`, `FND-003`, `FND-005`, `FND-006` | Gate fondasi (`backlog.md` aturan 1) | `specified`; `FND-002` `ready` |
| `FND-007` | Gate item modul (D-54, DoR butir 8) | `specified` |

## Keputusan `[USULAN-AGEN]` (disahkan `D-58`)

Tidak ada pertanyaan terbuka. Yang disahkan `D-58`: Q-01 (satu Supervisor per departemen), Q-02 bagian batas waktu (tanpa batas otomatis), Q-03 (transisi `TERVALIDASI` → `REKAP` dengan otorisasi), Q-04 (karyawan tanpa entri), Q-05 (validasi per departemen), Q-06 (pembaca rekap), Q-07 (primitive UI).

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Transisi `TERVALIDASI` → `REKAP` belum ada di `D-46`/`D-47` | Koreksi setelah validasi bisa mengubah dasar hitung | Syarat: draft belum `DISETUJUI`; otorisasi Manajemen; ditunggu kunci koordinator |
| Batas waktu validasi tidak ada | Rekap bisa tertahan lama | Pengingat lewat `C-012`; tidak ada batas otomatis di versi awal |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Priority | `P0` (analisis §5.5) | Gate payroll |
| Size | `S` | Satu rekap dan satu validasi per departemen |
| Status pengembalian | `TERBUKA` (`D-47` c), menggantikan `DITOLAK` | Sudah ada di keputusan terkunci |

## Readiness status

`Blocked` (alasan tunggal: dependensi belum `done`).

## Handoff boundary

- Parent epic / milestone: `EPIC-GJ` / M1
- Lane / sequence / predecessor: active, level 3 (derived); predecessor `GJ-002`
- Foundation status / evidence: `partial`
- Artifact role / canonical source: canonical
- Next domain: `design-contracts` (sudah ditulis di 04, status `Proposed`), lalu `quick-dev` setelah `Ready`
- Required input artifacts: `decisions.md` (D-08, D-33, D-46, D-47, D-48, D-53); `analisis-sia.md` §3.1, §3.3, §5.4, §6.9, §8.1; makalah UC-GJ-03, UC-GJ-04
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- Requirement: `01-requirement.md`
- AC: `02-acceptance-criteria.md`
- Contract: `04-design-contract.md`
- Bukti: `05-evidence.md`
