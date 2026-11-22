# FND-004 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | Nomor, riwayat, approval, pembatalan, dan penolakan dinyatakan sebagai perilaku (01, Outcome) |
| 2 | Aktor dan izin jelas | lolos | Pembuat, pemroses per level (`D-51` c), pemilik modul, dan tech lead; pemohon tidak menyetujui (`D-48`) |
| 3 | Status dan transisi eksplisit | lolos | Tabel transisi lengkap dengan "oleh", syarat, dan jejak (01, Status); penambalan `D-47` dicatat per pemilik |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel pesan lengkap di 01 (Validasi); pesan konflik `[USULAN-AGEN]` |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-16 berupa langkah atau perintah; AC-02 dan AC-06 memakai skrip paralel |
| 6 | Semua `depends on` `done` | belum | `FND-002` dan `FND-003` berstatus `specified`, belum `done` (`backlog.md`) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Semua pertanyaan di 00 berstatus Terjawab (`D-31`, `D-46`–`D-48`, `D-50`, `D-51`, atau `[USULAN-AGEN]` menunggu kunci) |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` belum seluruhnya `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | `L` `[USULAN]`: empat aspek (nomor, status, approval, konkurensi) tetapi satu mesin dan satu tabel riwayat; layar dan daftar status per jenis tetap milik pemilik modul |

## Ringkasan pertanyaan terbuka (diperbarui 2026-11-22)

| Status | Jumlah |
|---|---|
| Terbuka | 0 |
| Terjawab (`D-xx`) | 9 |
| Terjawab `[USULAN-AGEN]` menunggu kunci koordinator | 1 (OQ-04-08), ditambah tiga keputusan di Decisions |

Pertanyaan `bisnis` yang memblokir: tidak ada. Ambang nominal seed masih placeholder bertanda belum final (`D-37`), bukan pertanyaan terbuka.

## Verdict

**`Blocked`**

Alasan (satu): dependensi belum `done`: `FND-002` dan `FND-003` (keduanya `specified`). Butir 6 belum; butir 8 belum karena gate `FND-001`–`FND-006` juga belum.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Tidak ada pertanyaan terbuka. Keputusan yang menunggu kunci koordinator:

| ID | Keputusan | Owner |
|---|---|---|
| OQ-04-04 | pemilik modul mendaftarkan status dan penanda diposting | koordinator |
| OQ-04-08 | teks pesan konflik | koordinator |
| catatan approval | persetujuan sebagai baris `riwayat_status` | koordinator |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `high` `[USULAN]` | memblokir `PD-002`, `PG-003`, `PR-002`, `GJ-005`, `C-012`, `C-013`, `C-014` |
| Ukuran | `L` `[USULAN]` | empat aspek sekaligus tetapi satu mesin |
| Penanda diposting | fail-safe: dianggap diposting bila tidak terbaca `[USULAN]` | mencegah pembatalan dokumen yang sudah berefek |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh status dokumen dan nominal approval, sehingga kontrak wajib.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Preconditions | ya | periode, status asal, level, dan pemisahan |
| Postconditions | ya | nomor, riwayat, dan gugur approval |
| Invariants | ya | nomor unik, riwayat tambah-saja, status final, status terdaftar |
| Trust boundary | ya | pemroses, klien, dan penanda posting |
| State transition | ya | tabel transisi |
| Loop/termination | tidak | tidak ada algoritma berulang |
| Architecture boundary | ya, merujuk ARCH-001 | `ARCH-05` |

Semua aturan kontrak berstatus `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Ambang seed placeholder dianggap final | approval salah di produksi | penanda belum final di seed (`D-37`); kunci ambang di Accounting |
| Pola status dipaksakan ke semua modul | modul kehilangan status yang sah | daftar status hanya dari `D-46`/`D-47` (`INV-07`) |
| Konkurensi tidak teruji | nomor atau status ganda | AC-02 dan AC-06 dijalankan paralel |
| Penanda posting tidak konsisten antar modul | pembatalan dokumen posting lolos | fail-safe (`B-03`) |

## Readiness status

`Blocked` (lihat Verdict). Tidak ada verdict `Ready`.

## Handoff boundary

- Parent epic / milestone: `EPIC-FND` / `M0`
- Lane / sequence / predecessor: `active` / `4` / `FND-002`, `FND-003` (keduanya `specified`, belum `done`)
- Foundation status / evidence: `missing` untuk dokumen (`backlog.md`, status fondasi "Service bersama")
- Artifact role / canonical source: `canonical`: `docs/product/items/FND-004-dokumen-nomor-status-approval/`
- Next domain: `quick-dev` setelah DoR `Ready`
- Required input artifacts: `docs/product/decisions.md` (D-08, D-33, D-35, D-37, D-42, D-43, D-46, D-47, D-48, D-50, D-51); `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (ARCH-05, INV-04, INV-05); analisis §2.3, §8, §10.4, §10.5; `diagram-sia-lengkap.md` §5
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `05-evidence.md`
- `docs/product/backlog.md`, `docs/product/decisions.md`, `docs/product/epics/EPIC-FND.md`
