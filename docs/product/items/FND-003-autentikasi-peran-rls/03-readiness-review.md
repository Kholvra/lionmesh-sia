# FND-003 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | Masuk, aksi sesuai peran, penolakan, dan pencabutan sesi dinyatakan sebagai perilaku (01, Outcome) |
| 2 | Aktor dan izin jelas | lolos | Staf (12), Karyawan (`D-53`), tech lead (pengelola akun, `D-33`), pengguna tanpa akun |
| 3 | Status dan transisi eksplisit | lolos | Status akun `tanpa peran`, `aktif`, `nonaktif` dengan transisi; efek pada sesi dari `D-48` |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel pesan lengkap di 01 (Validasi); login gagal memakai pesan generik sesuai `D-42` |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-14 berupa langkah atau perintah. AC-06 memakai permintaan uji pada item ini dan diulang saat `FND-004` |
| 6 | Semua `depends on` `done` | lolos | `FND-002` selesai dan telah di-merge melalui PR #5. |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Semua pertanyaan di 00 berstatus Terjawab (`D-33`, `D-42`, `D-48`, `D-53`, atau diratifikasi melalui `D-58`) |
| 8 | Gate fondasi terpenuhi | lolos | Gate modul tidak berlaku untuk item FND sesuai D-54. |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | `M` `[USULAN]`: tiga tabel domain dan `profiles`; pembatasan Karyawan satu mekanisme yang dipakai `GJ-002` |

## Ringkasan pertanyaan terbuka (diperbarui 2026-11-22)

| Status | Jumlah |
|---|---|
| Terbuka | 0 |
| Terjawab (`D-xx`) | 6 |
| Terjawab dan diratifikasi `D-58` | 5 |

Pertanyaan `bisnis` yang memblokir: tidak ada.

## Verdict

**`Ready`**

FND-002 sudah selesai; D-54 mengecualikan item FND dari gate modul dan D-58 meratifikasi usulan tingkat item yang konsisten.

## Blockers / decisions needed

Tidak ada pertanyaan terbuka. Usulan berikut diratifikasi melalui D-58:

| ID | Keputusan | Owner |
|---|---|---|
| OQ-03-04 | karyawan yang juga staf tidak mendapat akun kedua | koordinator |
| OQ-03-05 | pendaftaran mandiri dimatikan | koordinator |
| OQ-03-08 | teks pesan | koordinator |
| OQ-03-09 | RLS semua tabel domain yang ada | koordinator |
| OQ-03-10, OQ-03-11 | C1 dan C2 di item ini; `profiles` diperluas | koordinator |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `high` `[USULAN]` | memblokir `FND-004`, `FND-006`, `C-014`, dan tiga item master |
| Ukuran | `M` `[USULAN]` | RLS dasar dan pembatasan Karyawan; matriks sudah disahkan |
| Peran dibaca per permintaan | `[USULAN]` analisis §10.1 | perubahan peran tetap diikuti pencabutan sesi (`D-48`) |
| Judul item | selaraskan dari "12 peran" ke "13 peran" di `backlog.md` | `D-53` |

## Kontrak desain

`04-design-contract.md` berstatus `Partially verified`; bukti parsial dan uji yang masih diperlukan dicatat di `05-evidence.md`. Item ini menyentuh identitas dan peran, sehingga kontrak wajib.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Preconditions | ya | sesi, peran, dan pembatasan Karyawan |
| Postconditions | ya | hasil penolakan dan pencabutan sesi |
| Invariants | ya | 13 peran; identitas dari sesi; satu peran per akun |
| Trust boundary | ya | klien, server, database, dan perubahan akun |
| State transition | ya | status akun |
| Loop/termination | tidak | tidak ada algoritma berulang |
| Architecture boundary | ya, merujuk ARCH-001 | `BOUNDARY-01`–`03`, `ARCH-09` (perlu diselaraskan ke 13) |

Status bukti setiap aturan dicatat di `04-design-contract.md` dan `05-evidence.md`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| `ARCH-001` masih menulis 12 peran | pemeriksa arsitektur menolak peran ke-13 | koordinator menyelaraskan `ARCH-09` dengan `D-53` |
| RLS lintas tabel melebar | item melebar | `OQ-03-09` membatasi ke tabel yang ada dan wajib untuk tabel baru |
| Pembatasan Karyawan diuji hanya di `profiles` | presensi bocor | AC-11 diulang saat `GJ-002` |

## Readiness status

`Ready` (lihat Verdict); implementasi sedang berlangsung.

## Handoff boundary

- Parent epic / milestone: `EPIC-FND` / `M0`
- Lane / sequence / predecessor: `active` / `3` / `FND-002` (`done`)
- Foundation status / evidence: `missing` untuk peran dan otorisasi (`backlog.md`); login `available` (`src/app/login/page.tsx`)
- Artifact role / canonical source: `canonical`: `docs/product/items/FND-003-autentikasi-peran-rls/`
- Next domain: `quick-dev` setelah DoR `Ready`
- Required input artifacts: `docs/product/decisions.md` (D-18, D-23, D-33, D-42, D-48, D-53); `docs/product/policies/matriks-izin.md`; `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (BOUNDARY-01..03, ARCH-09); analisis §3, §10.1, §10.2
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `05-evidence.md`
- `docs/product/backlog.md`, `docs/product/decisions.md`, `docs/product/epics/EPIC-FND.md`
