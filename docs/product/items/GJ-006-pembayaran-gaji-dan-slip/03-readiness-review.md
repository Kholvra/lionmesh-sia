# GJ-006 — Readiness Review

## Verdict

`Blocked` — dependensi belum `done`: `GJ-005` (`specified`, depends on `GJ-004`, `FND-004`); `FND-006` (`specified`, dibuat di gate fondasi); gate fondasi `FND-001`–`FND-007` belum `done` (D-54) (hanya `FND-001` yang `done`); `FND-007` (gate item modul, D-54).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Definition of Ready — evidence

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | Outcome sebagai perilaku | 01 bagian Outcome | Lolos |
| 2 | Aktor dan izin jelas | 01 bagian Aktor dan "Siapa boleh melihat"; T-07 terjawab (D-33) | Lolos |
| 3 | Status dan transisi eksplisit, jalur gagal juga | 01 bagian Status: `DIBAYAR`, `GAGAL_TRANSFER` per karyawan dan per draft (D-46, D-47); percobaan ulang (D-49) | Lolos |
| 4 | Validasi punya pesan | 01 bagian Validasi (bukti, alasan, rekening, dana, pemisahan tugas) | Lolos |
| 5 | AC bisa dibuktikan dengan langkah | 02 AC-01 sampai AC-17 | Lolos |
| 6 | `depends on` berstatus `done` | `backlog.md`: `GJ-005` = `specified`; `FND-006` = `specified` | Belum lolos |
| 7 | Tidak ada pertanyaan pemblokir terbuka | 00 tanpa pertanyaan terbuka; T-01 sampai T-11 terjawab (sebagian `[USULAN-AGEN]`) | Lolos |
| 8 | Gate fondasi terpenuhi | Hanya `FND-001` `done`; `FND-007` belum (T-11) | Belum lolos |
| 9 | Ukuran wajar untuk satu orang satu track | Usulan `M` (agen) | Lolos |

Kondisi bersyarat:

| Kondisi | Berlaku? | Evidence |
|---|---|---|
| Menyentuh uang | Ya | Kas turun saat dibayar. Jurnal pembayaran di GJ-007 (akun peran `kas_bank` dan `utang_gaji`, `D-41`, `D-35`). Sumber nominal: draft `DISETUJUI` |
| Mengubah stok | Tidak | — |
| Menyentuh status dokumen | Ya | `DIBAYAR`, `GAGAL_TRANSFER`; `riwayat_status` (`D-08`); kontrak `PRE-02`, `POST-01`, `INV-01` |
| Melintasi modul | Ya | Ledger lewat `postJournal()` (`D-07`) di GJ-007; data karyawan lewat service core |
| Menyentuh data pribadi | Ya | Rekening, nominal, slip. Pembaca di 01 (`[USULAN-AGEN]`) |

## Dependensi yang belum done

| ID | Dependensi | Status |
|---|---|---|
| `GJ-005` | Draft `DISETUJUI` (`depends on`) | `specified` |
| `FND-006` | Ledger dan periode (`depends on`) | `specified` |
| `FND-004` | Prasyarat `GJ-005` | `specified` |
| `FND-002`, `FND-003`, `FND-005` | Gate fondasi (`backlog.md` aturan 1) | `specified`; `FND-002` `ready` |
| `FND-007` | Gate item modul (D-54, DoR butir 8) | `specified` |

## Keputusan `[USULAN-AGEN]` (disahkan `D-58`)

Tidak ada pertanyaan terbuka. Yang disahkan `D-58`: T-01 (batch berkas CSV generik), T-02 (status per karyawan tanpa `PARSIAL`), T-03 (percobaan ulang tanpa batas jumlah), T-04 (bukti per batch), T-05 (isi slip), T-06 (format cetak), T-08 (slip pengganti oleh HR), T-09 (pembaca rekening dan nominal), T-10 (batch serentak), T-11 (primitive UI).

## Pertentangan yang perlu dikunci koordinator

- `D-46` (`DIPOSTING` setelah `DIBAYAR`) dan `D-49` (jurnal pembayaran per transfer berhasil). Lihat GJ-007 J-03.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Format bank belum dikonfirmasi (`DISC-002`) | Berkas batch harus diubah | T-01: berkas CSV generik; format bank dikunci saat `DISC-002` bila bank meminta. `DISC-002` tidak ada di `depends on` backlog |
| Pembayaran ganda | Gaji ganda | INV-02 dan AC-15 |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Priority | `P0` (analisis §5.5) | Tanpa pembayaran, payroll tidak selesai |
| Size | `M` | Batch, status per karyawan, bukti, dan slip |
| Siapa cetak slip | HR (`D-33`, `D-53`) | Sudah ada di keputusan terkunci |

## Readiness status

`Blocked` (alasan tunggal: dependensi belum `done`).

## Handoff boundary

- Parent epic / milestone: `EPIC-GJ` / M1
- Lane / sequence / predecessor: active, level 6 (derived); predecessor `GJ-005` dan `FND-006`
- Foundation status / evidence: `partial`
- Artifact role / canonical source: canonical
- Next domain: `design-contracts` (sudah ditulis di 04, status `Proposed`), lalu `quick-dev` setelah `Ready`
- Required input artifacts: `decisions.md` (D-07, D-08, D-33, D-35, D-41, D-42, D-46, D-47, D-49, D-53); `analisis-sia.md` §3.2, §5.6, §6.9, §8.1, §7.3; makalah UC-GJ-08, UC-GJ-09, KF-GJ-05; `EPIC-GJ`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- Requirement: `01-requirement.md`
- AC: `02-acceptance-criteria.md`
- Contract: `04-design-contract.md`
- Bukti: `05-evidence.md`
