# GJ-002 — Readiness Review

## Verdict

`Blocked` — dependensi belum `done`: `GJ-001` (`specified`); `FND-004` (`specified`); gate fondasi `FND-001`–`FND-007` belum `done` (D-54) (hanya `FND-001` yang `done`); `FND-007` (gate item modul, D-54).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Definition of Ready — evidence

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | 01 bagian Outcome | Lolos |
| 2 | Aktor dan izin jelas | 01 bagian Aktor dan "Siapa boleh melihat"; keputusan `D-53` dan baris `[USULAN-AGEN]` (P-08) | Lolos |
| 3 | Status dan transisi eksplisit, jalur gagal juga | 01 bagian Status: `MENUNGGU_VALIDASI_SUPERVISOR`, `TERVALIDASI`, `DIBATALKAN`, `TERBUKA`, `REKAP` (`D-46`, `D-47`, `D-53`); jalur gagal di Status dan Validasi | Lolos |
| 4 | Validasi punya pesan yang bisa dibaca | 01 bagian Validasi (SPL, jam pulang, periode, otorisasi, pembatalan) | Lolos |
| 5 | AC bisa dibuktikan dengan langkah | 02 AC-01 sampai AC-16 | Lolos |
| 6 | `depends on` berstatus `done` | `backlog.md`: `GJ-001` = `specified`; `FND-004` = `specified` | Belum lolos |
| 7 | Tidak ada pertanyaan pemblokir terbuka | 00 tanpa pertanyaan terbuka; P-02 sampai P-09 terjawab, sebagian `[USULAN-AGEN]` sudah disahkan `D-58` (tingkat item) | Lolos |
| 8 | Gate fondasi terpenuhi | Hanya `FND-001` `done`; `FND-007` belum (P-09) | Belum lolos |
| 9 | Ukuran wajar untuk satu orang satu track | Usulan `M` (agen, belum disetujui) | Lolos |

Kondisi bersyarat:

| Kondisi | Berlaku? | Evidence |
|---|---|---|
| Menyentuh uang | Tidak langsung | Presensi tidak menghitung uang; nilainya dipakai GJ-004 |
| Mengubah stok | Tidak | — |
| Menyentuh status dokumen | Ya | Status presensi dan lembur; jejak `riwayat_status` (`D-08`); kontrak `PRE-06`, `POST-03` |
| Melintasi modul | Ya | Data karyawan lewat service core (`D-25`) |
| Menyentuh data pribadi | Ya | Field: NIK, tanggal, jam, status kehadiran, nomor SPL. Pembaca di 01 (`[USULAN-AGEN]`) |

## Dependensi yang belum done

| ID | Dependensi | Status |
|---|---|---|
| `GJ-001` | Data karyawan (`depends on`) | `specified` |
| `FND-004` | Penomoran, status, riwayat, approval (`depends on`) | `specified` |
| `FND-002`, `FND-003`, `FND-005`, `FND-006` | Gate fondasi (`backlog.md` aturan 1) | `specified`; `FND-002` `ready` |
| `FND-007` | Gate item modul (D-54, DoR butir 8) | `specified` |

## Keputusan `[USULAN-AGEN]` (disahkan `D-58`)

Tidak ada pertanyaan terbuka. Yang disahkan `D-58`: P-02 (SPL tanpa approval berjenjang), P-03 (nilai kehadiran), P-04 (pembulatan jam lembur), P-05 (transisi per baris), P-06 (rentang periode), P-07 (pemberi otorisasi koreksi), P-08 (pembaca), P-09 (primitive UI). Setiap jawaban ada di 00-discussion.md.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Karyawan mencatat presensi palsu untuk orang lain | Gaji salah | RLS per pemilik (`INV-05`); HR atas nama dicatat dengan jejak (AC-12) |
| Koreksi setelah validasi menyentuh periode yang sudah dihitung | Angka payroll berubah | `PRE-07`; transisi `TERVALIDASI` → `REKAP` sudah disahkan `D-58` (tingkat item) |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Priority | `P0` (analisis §5.5) | Memblokir GJ-003 |
| Size | `M` | Dua jenis catatan (presensi dan lembur) plus self-service |
| Status presensi | `MENUNGGU_VALIDASI_SUPERVISOR` (`D-53`) | Nama dari keputusan terkunci |

## Readiness status

`Blocked` (alasan tunggal: dependensi belum `done`).

## Handoff boundary

- Parent epic / milestone: `EPIC-GJ` / M1
- Lane / sequence / predecessor: active, level 2 (derived); predecessor `GJ-001` dan `FND-004`
- Foundation status / evidence: `partial` (lihat `backlog.md` status fondasi)
- Artifact role / canonical source: canonical
- Next domain: `design-contracts` (sudah ditulis di 04, status `Proposed`), lalu `quick-dev` setelah `Ready`
- Required input artifacts: `decisions.md` (D-08, D-33, D-47, D-48, D-53, D-25); `analisis-sia.md` §3.1, §3.3, §5.5, §6.9, §8.1; makalah UC-GJ-02, UC-GJ-03, UC-GJ-04; `ARCH-001` contract
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- Requirement: `01-requirement.md`
- AC: `02-acceptance-criteria.md`
- Contract: `04-design-contract.md`
- Bukti: `05-evidence.md`
