# GJ-007 — Readiness Review

## Verdict

`Blocked` — dependensi belum `done`: `GJ-006` (`specified`, depends on `GJ-005`, `FND-006`); `FND-006` (`specified`); gate fondasi `FND-001`–`FND-007` belum `done` (D-54) (hanya `FND-001` yang `done`); `FND-007` (gate item modul, D-54).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Definition of Ready — evidence

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | Outcome sebagai perilaku | 01 bagian Outcome | Lolos |
| 2 | Aktor dan izin jelas | 01 bagian Aktor dan "Siapa boleh melihat"; J-11 terjawab (`[USULAN-AGEN]` sebagian) | Lolos |
| 3 | Status dan transisi eksplisit, jalur gagal juga | 01 bagian Status dan Jurnal: pemicu per status (`DISETUJUI`, `DIBAYAR`, `DIPOSTING`); kegagalan jurnal ditolak (AC-03) | Lolos |
| 4 | Validasi punya pesan | 01 bagian Validasi (balance, akun, periode, status, duplikat) | Lolos |
| 5 | AC bisa dibuktikan dengan langkah | 02 AC-01 sampai AC-16; uji lewat query tabel jurnal dan agregat | Lolos |
| 6 | `depends on` berstatus `done` | `backlog.md`: `GJ-006` = `specified`; `FND-006` = `specified` | Belum lolos |
| 7 | Tidak ada pertanyaan pemblokir terbuka | 00 tanpa pertanyaan terbuka; J-01 sampai J-11 terjawab; J-02, J-06, J-07 dengan `[USULAN-AGEN]` | Lolos |
| 8 | Gate fondasi terpenuhi | Hanya `FND-001` `done`; `FND-007` belum (J-10) | Belum lolos |
| 9 | Ukuran wajar untuk satu orang satu track | Usulan `M` (agen) | Lolos |

Kondisi bersyarat:

| Kondisi | Berlaku? | Evidence |
|---|---|---|
| Menyentuh uang | Ya | Akun peran dan sumber angka (draft `DISETUJUI`, pembayaran `DIBAYAR`); tabel jurnal di 01; `D-41`, `D-35`, `D-49` |
| Mengubah stok | Tidak | Alokasi TKL ke WIP bukan mutasi stok (`D-44` 4) |
| Menyentuh status dokumen | Ya | Pemicu dari `DISETUJUI`, `DIBAYAR`, `DIPOSTING`; kontrak `PRE-02`, `INV-02` |
| Melintasi modul | Ya | `postJournal()` (`D-07`); tidak membaca produksi (`D-25`) |
| Menyentuh data pribadi | Ya | Laporan per karyawan. Pembaca di 01 (`[USULAN-AGEN]`) |

## Dependensi yang belum done

| ID | Dependensi | Status |
|---|---|---|
| `GJ-006` | Pembayaran per karyawan (`depends on`) | `specified` |
| `FND-006` | COA peran, `postJournal()`, periode (`depends on`) | `specified` |
| `GJ-005`, `FND-002`–`FND-005` | Prasyarat dan gate fondasi (`backlog.md` aturan 1) | `specified`; `FND-002` `ready` |
| `FND-007` | Gate item modul (D-54, DoR butir 8) | `specified` |

## Keputusan `[USULAN-AGEN]` (disahkan `D-58`)

Tidak ada pertanyaan terbuka. Yang disahkan `D-58`: J-02 (tabel jurnal sebagai peran akun; setoran BPJS dan PPh 21 tidak dijurnal di item ini), J-06 (kolom laporan), J-07 (lintas tahun), J-10 (primitive UI), J-11 (pembaca laporan per karyawan), dan porsi perusahaan BPJS.

## Pertentangan yang perlu dikunci koordinator

- `D-46` (`DIPOSTING` setelah `DIBAYAR`) dan `D-49` (jurnal akrual saat `DISETUJUI`). Diperlakukan: akrual saat `DISETUJUI`; `DIPOSTING` = semua jurnal pembayaran selesai (J-03). Keputusan koordinator diperlukan karena nama status `DIPOSTING` di `D-46` menyiratkan jurnal setelah pembayaran.
- Setoran BPJS dan PPh 21 ke negara tidak punya use case di makalah. Default di 01: tidak dijurnal di item ini. Bila wajib, perlu item baru (koordinator).

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Waktu jurnal salah antara akrual dan pembayaran | Laporan periode keliru | AC-01, AC-14; `D-49` |
| Akun peran belum punya nomor di `FND-006` | Jurnal tidak bisa dibuat | Validasi peran (Validasi di 01); `FND-006` mengisi konfigurasi |
| Saldo BPJS dan PPh 21 tidak pernah nol tanpa setoran | Laporan menampilkan kewajiban | AC-16; keputusan setoran di koordinator |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Priority | `P1` (analisis §5.5) | Analisis membedakan P0 dan P1 |
| Size | `M` | Satu jurnal akrual, satu jurnal pembayaran, dua laporan |
| Tabel jurnal | Peran akun di 01 (bagian Jurnal) | Dipakai sebagai draf; `[USULAN-AGEN]` menunggu kunci |

## Readiness status

`Blocked` (alasan tunggal: dependensi belum `done`).

## Handoff boundary

- Parent epic / milestone: `EPIC-GJ` / M1
- Lane / sequence / predecessor: active, level 7 (derived); predecessor `GJ-006` dan `FND-006`
- Foundation status / evidence: `partial`
- Artifact role / canonical source: canonical
- Next domain: `design-contracts` (sudah ditulis di 04, status `Proposed`), lalu `quick-dev` setelah `Ready`
- Required input artifacts: `decisions.md` (D-07, D-25, D-35, D-41, D-43, D-44, D-46, D-49, D-50); `analisis-sia.md` §6.7, §6.9, §8.3, §9.2 G12; makalah UC-GJ-10, UC-GJ-11, KF-GJ-07; `EPIC-GJ`; `ARCH-001` contract
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- Requirement: `01-requirement.md`
- AC: `02-acceptance-criteria.md`
- Contract: `04-design-contract.md`
- Bukti: `05-evidence.md`
