# FND-004 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | Nomor, riwayat, approval, pembatalan, dan penolakan dinyatakan sebagai perilaku |
| 2 | Aktor dan izin jelas | lolos | Pembuat, pemroses per level, pemilik modul, dan tech lead; pemohon tidak menyetujui |
| 3 | Status dan transisi eksplisit | lolos | Daftar status dan transisi D-46/D-47, ditambah status yang disahkan D-53/D-58 |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Pesan transisi, konflik, alasan, posting, dan penghapusan diuji |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01–AC-16 diuji dengan skrip database dan sesi |
| 6 | Semua `depends on` `done` | lolos | `FND-002` dan `FND-003` `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Seluruh pertanyaan di 00 terjawab; D-58 mengesahkan usulan agen |
| 8 | Gate fondasi terpenuhi | lolos | `D-54`: item `FND-*` hanya mengikuti `depends on` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | Nomor, status, riwayat, approval, dan konkurensi berada dalam satu mesin core |

## Verdict

**`Done`**

`FND-002` dan `FND-003` sudah `done`. Migrasi `0007`, service `core/dokumen`, seed aturan approval, dan seluruh AC telah diverifikasi pada Supabase lokal terisolasi.

## Implementasi

- Migrasi `0007_dokumen_nomor_status_approval.sql`: registry status, transisi global, jenis dokumen, counter, dokumen, aturan approval, riwayat append-only, trigger, RLS, dan RPC core.
- `src/core/dokumen/`: tipe, service, query, dan konteks sesi server.
- `supabase/seeds/0010_fnd_004_aturan_approval.sql`: placeholder D-51(c), seed versi `0004`.
- `scripts/verify-fnd-004.mjs`: AC-01–AC-16 pada database terisolasi.
- `scripts/verify-fnd-004-session.mjs` dan fixture route: membuktikan aktor berasal dari sesi.

## Kontrak desain

Kontrak `04-design-contract.md` berstatus `Approved`. Semua invariant utama terverifikasi, kecuali pemeriksaan periode sumber yang menunggu tabel periode `FND-006`.

## Risiko dan batas

| Risiko / batas | Dampak | Mitigasi |
|---|---|---|
| Periode sumber belum dapat diperiksa | Dokumen sumber dapat dibuat sebelum integrasi FND-006 | Dicatat di `docs/tech-debt/fnd-004-periode-dokumen.md` |
| Kode tipe seed masih placeholder | Modul dapat memilih kode berbeda | Seed dan evidence menyatakan kode belum final |
| Approval rule berubah setelah review | Keputusan dapat berubah di tengah approval | Snapshot aturan disimpan di dokumen saat `PERIKSA` |
| Retry otomatis aksi berstatus | Dapat dianggap konflik | API memakai versi dokumen; pemanggil tidak boleh retry otomatis |

## Readiness status

`Done` — siap dipakai item modul. Gate migrasi tetap dipegang tech lead.

## Handoff boundary

- Parent epic / milestone: `EPIC-FND` / `M0`
- Lane / sequence / predecessor: `active` / `4` / `FND-002`, `FND-003` (`done`)
- Artifact role / canonical source: `docs/product/items/FND-004-dokumen-nomor-status-approval/`
- Bukti: `05-evidence.md`
- Implementasi: `supabase/migrations/0007_dokumen_nomor_status_approval.sql`, `src/core/dokumen/`, `scripts/verify-fnd-004*.mjs`

## Links

- `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-FND.md`
- `docs/tech-debt/fnd-004-periode-dokumen.md`
