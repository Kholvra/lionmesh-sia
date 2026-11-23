# C-009 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: tujuh laporan, angka dari jurnal, penelusuran ke baris jurnal |
| 2 | Aktor dan izin jelas | lolos | aktor jelas; hak empat laporan keuangan per PT-02 (`[USULAN-AGEN]`: Accounting, Manajemen, Direksi) |
| 3 | Status dan transisi eksplisit | lolos | tidak ada state machine; status periode dibaca dari `FND-006` (`terbuka`, `terkunci`); laporan saat terkunci tetap bisa dibuka (`[USULAN]`) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap termasuk rentang lebih dari satu bulan (D-50); teks final ditentukan implementasi |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-11 punya langkah atau perintah; AC-03 memakai akun peran (D-41); AC-04 memakai PT-03 (`[USULAN-AGEN]`); AC-08 memakai PT-02 (`[USULAN-AGEN]`) |
| 6 | Semua `depends on` berstatus `done` | lolos | `FND-006` `done` (2026-11-23) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: 10 terjawab (6 keputusan terkunci, 4 `[USULAN-AGEN]`), 0 terbuka |
| 8 | Gate fondasi terpenuhi | lolos | `FND-001`–`FND-009` `done` (2026-11-23, `D-54`, `D-62`) |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran L (usulan paket, `D-50`): empat laporan, penelusuran, dan pembanding angka uji |

## Verdict

`Ready`

Semua kriteria DoR terpenuhi sejak 2026-11-23. Fondasi `FND-001`–`FND-009` sudah `done`, termasuk AppShell (`D-62`), sehingga layar item ini punya tempat render. Bila item membuat tabel, DDL dikirim sebagai usulan `06-ddl-proposal.sql` dan dinomori tech lead (`D-09`); layar dicari di `docs/design/inventory/<siklus>.md`.

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 10 — 10 terjawab, 0 terbuka.

- Dependensi: `FND-006` `done` (gate fondasi `FND-001`–`FND-006`).
- PT-01: periode laporan. **Terjawab — D-50.**
- PT-02: hak akses empat laporan keuangan. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-03: definisi neraca sebelum tutup. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-04: kelompok akun laba rugi. **Terjawab — D-41** (nomor final di `FND-006`, spec).
- PT-05: format keluaran. **Terjawab — D-50.**
- PT-06: multi-mata uang. **Terjawab — D-38.**
- PT-07: data uji dan `FND-008`. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-08: dokumen batal di laporan. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-09: urutan `D-20` vs backlog. **Terjawab — D-34.**
- PT-10: prioritas dan ukuran. **Terjawab — D-50.**

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P0` | analisis §5.1 C9 P0 (`D-50`); tanpa ini `C-010` dan `INT-001` tidak bisa diuji |
| Ukuran | `L` | empat laporan, penelusuran ke jurnal, dan pembanding angka uji |
| Lokasi kode | `core/ledger` | `D-07`, `D-25`; usulan mengikuti struktur analisis §11.2 |
| Hak laporan (PT-02) | Accounting, Manajemen, Direksi | pola matriks-izin dan analisis §3.1; baris matriks perlu ditambahkan (koordinasi) |
| Laba tahun berjalan (PT-03) | baris ekuitas di neraca bulanan | `D-44` (5) menutup nominal hanya di akhir tahun |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh uang, jadi kontrak wajib ada. Semua aturan `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Data uji lintas siklus belum ada | AC-01 sampai AC-04 hanya bisa dibuktikan dengan jurnal uji buatan | fixture `postJournal()` sampai `FND-008` selesai; catat keterbatasan di `05-evidence.md` |
| Laporan dibangun sebelum `FND-006` stabil | angka berubah saat COA berubah | tunggu `FND-006` `done`; jangan mengunci kelompok akun sebelum nomor final di spec `FND-006` |
| Ukuran `L` melampaui satu orang | jadwal molor | bila tech lead setuju, pecah per laporan melalui `decompose` (bukan dilakukan di sini) |

## Handoff boundary

- Parent epic / milestone: `EPIC-CORE` / M1–M2
- Lane / sequence / predecessor: active / 1 (urutan Core di backlog; gelombang 2 per `D-34`) / `FND-006`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` berstatus `specified`. Lihat tabel status di `docs/product/backlog.md`.
- Artifact role / canonical source: canonical, `docs/product/items/C-009-laporan-keuangan/`
- Next domain: `quick-dev` (hanya setelah verdict `Ready`); `design-contracts` sudah tercermin di `04-design-contract.md`
- Required input artifacts: `docs/product/decisions.md` (`D-06`, `D-07`, `D-18`, `D-25`, `D-34`, `D-35`, `D-38`, `D-41`, `D-43`, `D-44`, `D-50`, `D-52`), `docs/product/reference/analisis-sia.md` §5.1, §8.3, §10.6
- Implementation plan: `Not created`
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Core, `C-009`)
- `docs/product/epics/EPIC-CORE.md`
- `docs/product/items/FND-001-lingkungan-dan-quality-gate/` (contoh format)
