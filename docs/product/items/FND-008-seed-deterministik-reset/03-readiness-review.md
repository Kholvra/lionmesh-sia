# FND-008 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | Reset dan seed master deterministik dinyatakan sebagai perilaku (01, Outcome) |
| 2 | Aktor dan izin jelas | lolos | Anggota kelompok, CI, tech lead, dan pemilik tabel untuk berkas seed-nya |
| 3 | Status dan transisi eksplisit | lolos | Transisi `kosong`/`siap`/`terisi` dari `FND-001` dirujuk di 01 (Status) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Pesan penolakan seed sudah ada (`FND-001` AC-07); teks lain ditulis di 01 (Validasi) |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-09 dengan perintah; AC-05 dan AC-06 dibuktikan saat item pemilik selesai, dicatat di 02 |
| 6 | Semua `depends on` `done` | belum | `FND-001` done; `FND-002` `specified`, belum `done` (`backlog.md`) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Semua pertanyaan di 00 berstatus Terjawab (`D-51` g, atau `[USULAN-AGEN]` menunggu kunci) |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` belum seluruhnya `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | `M` `[USULAN]`: mekanisme sudah ada dari `FND-001`; item ini menambah isi master dan penanda versi |

## Ringkasan pertanyaan terbuka (diperbarui 2026-11-22)

| Status | Jumlah |
|---|---|
| Terbuka | 0 |
| Terjawab (`D-xx`, atau `D-51` untuk skenario) | 1 |
| Terjawab `[USULAN-AGEN]` menunggu kunci koordinator | 7 |

Pertanyaan `bisnis` yang memblokir: tidak ada.

## Verdict

**`Blocked`**

Alasan (satu): dependensi belum `done`: `FND-002` (status `specified`). `FND-001` sudah `done`. Butir 6 belum; butir 8 belum karena gate `FND-001`–`FND-006` juga bergantung pada `FND-002`.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Tidak ada pertanyaan terbuka. Keputusan yang menunggu kunci koordinator (`[USULAN-AGEN]`):

| ID | Keputusan | Owner |
|---|---|---|
| OQ-08-01, OQ-08-02 | seed hanya master; setiap item menambah berkas seed | koordinator |
| OQ-08-03, OQ-08-07 | 13 akun uji lokal; `db:seed` memakai penjaga | koordinator |
| OQ-08-05, OQ-08-06, OQ-08-08 | versi dan reset penuh; UUID tetap; RLS penanda | koordinator |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `medium` `[USULAN]` | tidak memblokir `FND-003`–`FND-006`; `INT-002` bergantung pada seluruh rantai |
| Ukuran | `M` `[USULAN]` | mekanisme sudah ada; isi master dan penanda versi |
| Urutan | seed ditambah per item untuk tabel yang dibuat item itu `[USULAN-AGEN]` | menghindari dependensi tersembunyi ke `FND-003`–`FND-006` |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh kredensial uji dan penanda, sehingga kontrak ringkas dengan alasan tertulis. Aturan seed dari `FND-001` (`B-02`, `POST-04`, `INV-03`) dirujuk, tidak diduplikasi.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Preconditions / Postconditions | ya (ringkas) | kondisi seed dan reset |
| Invariants | ya | determinisme, tanpa transaksi, lokal saja |
| Trust boundary | ya (rujuk FND-001 `B-02`) | sumber seed dari repo |
| State transition | ya (rujuk FND-001) | kondisi lingkungan |
| Loop/termination | tidak | tidak ada algoritma berulang |
| Architecture boundary | tidak | milik `ARCH-001` |

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kredensial uji ikut ke lingkungan lain | akses tidak sah | penjaga lingkungan (`OQ-08-07`); database lokal (`D-27`) |
| Berkas seed item pemilik terlambat | rantai uji `INT-002` tertahan | urutan seed dicatat tech lead; AC-05 dan AC-06 dicek saat item pemilik selesai |
| Skenario tidak lengkap | rantai uji tidak mencakup kasus gagal | skenario per siklus (`OQ-08-04`) dan `D-51` (g) |

## Readiness status

`Blocked` (lihat Verdict). Tidak ada verdict `Ready`.

## Handoff boundary

- Parent epic / milestone: `EPIC-FND` / `M0`
- Lane / sequence / predecessor: `active` / `8` / `FND-001` (done), `FND-002` (`specified`, belum `done`)
- Foundation status / evidence: `available` untuk reset dan seed dasar (`backlog.md`: "Seed & reset"; `scripts/db-seed.mjs`, `supabase/seed.sql`); isi data domain `missing`
- Artifact role / canonical source: `canonical`: `docs/product/items/FND-008-seed-deterministik-reset/`
- Next domain: `quick-dev` setelah DoR `Ready`
- Required input artifacts: `docs/product/items/FND-001-lingkungan-dan-quality-gate/04-design-contract.md` (B-02, POST-03, POST-04, INV-03); `docs/product/decisions.md` (D-27, D-30, D-37, D-51, D-53); `docs/product/epics/EPIC-FND.md`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `05-evidence.md`
- `docs/product/backlog.md`, `docs/product/decisions.md`, `docs/product/epics/EPIC-FND.md`, `docs/product/items/FND-001-lingkungan-dan-quality-gate/`
