# GJ-008 — Readiness Review

## Verdict

`Blocked` — dependensi belum `done`: `GJ-002` (`specified`, depends on `GJ-001`, `FND-004`), ditambah gate fondasi `FND-001`–`FND-007` untuk item modul (D-54; hanya `FND-001` yang `done`).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Definition of Ready — evidence

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | Outcome sebagai perilaku | 01 bagian Outcome | Lolos |
| 2 | Aktor dan izin jelas | 01 bagian Aktor dan "Siapa boleh melihat"; M-03 dan M-07 terjawab (`D-52`, `D-53`, `[USULAN-AGEN]`) | Lolos |
| 3 | Status dan transisi eksplisit, jalur gagal juga | 01 bagian Status: impor atomik tanpa status tersimpan (`D-47`); tiga jalur gagal dan alasan di tabel | Lolos |
| 4 | Validasi punya pesan | 01 bagian Validasi (format, baris rusak, tanpa NIK, berkas ulang, bentrok, periode, ID ganda) | Lolos |
| 5 | AC bisa dibuktikan dengan langkah | 02 AC-01 sampai AC-14; uji dengan berkas contoh dari profil uji (bukan merek mesin) | Lolos |
| 6 | `depends on` berstatus `done` | `backlog.md`: `GJ-002` = `specified` (`DISC-001` bukan dependensi, `D-60`(e)) | Belum lolos |
| 7 | Tidak ada pertanyaan pemblokir terbuka | 00 tanpa pertanyaan terbuka; M-01 sampai M-08 terjawab (sebagian `[USULAN-AGEN]`) | Lolos |
| 8 | Gate fondasi terpenuhi | Lewat `GJ-002`; hanya `FND-001` `done`; `FND-007` belum (M-08) | Belum lolos |
| 9 | Ukuran wajar untuk satu orang satu track | Usulan `M` (agen); tidak lagi bergantung pada protokol mesin khusus (`D-52`) | Lolos |

Kondisi bersyarat:

| Kondisi | Berlaku? | Evidence |
|---|---|---|
| Menyentuh uang | Tidak | Presensi tidak menghitung uang |
| Mengubah stok | Tidak | — |
| Menyentuh status dokumen | Ya | Presensi hasil impor memakai status `MENUNGGU_VALIDASI_SUPERVISOR`; tidak ada status impor (`D-47`); kontrak `PRE-03`, `POST-01`, `INV-02` |
| Melintasi modul | Ya | Data karyawan lewat service core (`D-25`); presensi lewat aturan GJ-002 |
| Menyentuh data pribadi | Ya | ID mesin, NIK, waktu masuk dan keluar. Pembaca di 01 (`[USULAN-AGEN]`) |

## Dependensi yang belum done

| ID | Dependensi | Status |
|---|---|---|
| `DISC-001` | Spike merek dan format ekspor mesin: non-pemblokir, hanya mengisi profil pemetaan (`D-60`(e), `D-52`) | `idea` (tidak memblokir) |
| `GJ-002` | Presensi dan aturan entri (`depends on`) | `specified` |
| `GJ-001`, `FND-004` | Prasyarat `GJ-002` | `specified` |
| `FND-002`, `FND-003`, `FND-005`, `FND-006` | Gate fondasi (`backlog.md` aturan 1) | `specified`; `FND-002` `ready` |
| `FND-007` | Gate item modul (D-54, DoR butir 8) | `specified` |

## Keputusan `[USULAN-AGEN]` (disahkan `D-58`)

Tidak ada pertanyaan terbuka. Yang disahkan `D-58`: M-02 (profil pemetaan, baris judul, baris HADIR), M-03 (HR mengisi pemetaan), M-04 (berkas identik ditolak), M-05 (bentrok dilewati), M-08 (primitive UI).

## Pertentangan yang perlu dikunci koordinator

- Terselesaikan oleh `D-60`(e): `DISC-001` bukan dependensi `GJ-008`, sejalan dengan `D-52` (hasil spike hanya mengisi profil pemetaan). `backlog.md` sudah mencerminkan keputusan ini; item ini tidak menunggu spike.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Berkas mesin tidak konsisten dengan profil | Baris salah masuk atau banyak tidak terpetakan | AC-02, AC-04; profil dapat diubah tanpa kode (AC-11) |
| Waktu di luar periode atau tanggal salah format | Presensi salah periode | Baris dilewati dengan alasan; validasi periode GJ-002 |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Priority | `P2` (analisis §5.5) | Tidak memblokir item lain |
| Size | `M` | Profil pemetaan, impor atomik, pemetaan ID, dan daftar hasil |
| Status impor | Tidak ada status tersimpan | `D-47` melarang status baru |

## Readiness status

`Blocked` (alasan tunggal: dependensi belum `done`).

## Handoff boundary

- Parent epic / milestone: `EPIC-GJ` / M1
- Lane / sequence / predecessor: active, level 3 (derived); predecessor `GJ-002` (`DISC-001` spike non-pemblokir, `D-60`(e))
- Foundation status / evidence: `partial`
- Artifact role / canonical source: canonical
- Next domain: `design-contracts` (sudah ditulis di 04, status `Proposed`), lalu `quick-dev` setelah `Ready`
- Required input artifacts: `decisions.md` (D-01, D-39, D-47, D-52, D-53, D-25, D-32); `analisis-sia.md` §5.5, §5.6, §9.3 G19; `GJ-002` 01 dan 04
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- Requirement: `01-requirement.md`
- AC: `02-acceptance-criteria.md`
- Contract: `04-design-contract.md`
- Bukti: `05-evidence.md`
