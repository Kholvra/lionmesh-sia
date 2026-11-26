# C-010 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | status periode, penolakan posting, jurnal penutup tahunan, saldo nol |
| 2 | Aktor dan izin jelas | lolos | Accounting menutup (D-50); buka kembali tidak ada (D-44 (5)) |
| 3 | Status dan transisi eksplisit | lolos | `buka` → `kunci` (bulanan; UI: Terbuka/Terkunci); tahun buku `terbuka` → `ditutup` (`[USULAN-AGEN]`, PT-12; D-68); jalur gagal lengkap |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap termasuk prasyarat D-50 dan urutan periode (PT-04, `[USULAN-AGEN]`; D-58, D-68) |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-13 punya langkah atau perintah; AC-09 memakai PT-02 (`[USULAN-AGEN]`, D-58/D-68); AC-13 memakai PT-12 (`[USULAN-AGEN]`, D-58/D-68) |
| 6 | Semua `depends on` berstatus `done` | lolos | `C-009` `done` (2026-11-26, PR #36), `FND-006` `done` (2026-11-23) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 12 pertanyaan: 12 terjawab; 3 `[USULAN-AGEN]` disahkan D-58; rincian teknis D-68 |
| 8 | Gate fondasi terpenuhi | lolos | `FND-001`–`FND-009` `done` (2026-11-23, `D-54`, `D-62`, `D-67`) |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran M (usulan paket): satu aturan status, satu jurnal penutup tahunan, penolakan posting |

## Verdict

`Ready`

Semua kriteria DoR terpenuhi sejak 2026-11-26. Fondasi `FND-001`–`FND-009` sudah `done`, termasuk AppShell (`D-62`), dan `C-009` sudah `done`, sehingga penolakan posting dan jurnal penutup punya laporan pembanding. Bila item membuat tabel, DDL dikirim sebagai usulan `06-ddl-proposal.sql` dan dinomori tech lead (`D-09`).

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 12 — 12 terjawab, 0 terbuka.

- Dependensi: `C-009` `done`, `FND-006` `done` (gate fondasi).
- PT-01: peran tutup dan buka. **Terjawab — D-50** (Accounting; buka kembali tidak ada).
- PT-02: scope kunci. **Terjawab — [USULAN-AGEN], disahkan D-58; rincian D-68.**
- PT-03: buka kembali. **Terjawab — D-44 (5).**
- PT-04: urutan periode. **Terjawab — [USULAN-AGEN], disahkan D-58; rincian D-68.**
- PT-05: jejak `riwayat_status`. **Terjawab — D-32.**
- PT-06: akun laba ditahan. **Terjawab — D-41** (penyediaan akun di spec `FND-006`).
- PT-07: prasyarat penutupan. **Terjawab — D-50.**
- PT-08: koreksi setelah tutup. **Terjawab — D-44 (5).**
- PT-09: `FND-006` di `depends_on`. **Terjawab — backlog.md.**
- PT-10: prioritas dan ukuran. **Terjawab — D-50** (P1; ukuran M usulan).
- PT-11: bulanan vs tahunan. **Terjawab — D-50, D-44 (5).**
- PT-12: status tahun buku dan sisa 601/602. **Terjawab — [USULAN-AGEN], disahkan D-58; rincian D-68.**

Pertentangan yang perlu dicatat (bukan pemblokir item ini):

- `ARCH-001` menyebut "buka periode lewat prosedur `C-010`", sedangkan `D-44` (5) meniadakan buka kembali. Teks `ARCH-001` perlu diselaraskan (di luar folder item ini).

## Agent suggestions (ratified)

D-58 mensahkan semua usulan `[USULAN-AGEN]` di paket ini. D-68 merinci Desember reserved, materialisasi bulan kosong, dan definisi setengah posting.

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P1` | analisis C10 (P1, `D-50`); memblokir `INT-001`; D-58 |
| Ukuran | `M` | satu aturan status, satu jurnal penutup, penolakan posting; D-58 |
| Urutan penutupan (PT-04) | berurutan | angka periode tidak boleh bergantung pada jurnal belum final; D-58, D-68 |
| Status tahun buku (PT-12) | `terbuka` → `ditutup` | `D-50` memisahkan kunci bulanan dari tutup tahunan; D-58, D-68 |
| Hak tutup (PT-02) | jurnal saja; dokumen sumber tidak berubah | `D-50` dan `D-43` sudah mengamankan angka; D-58, D-68 |

## Kontrak desain

`04-design-contract.md` berstatus `Verified`; konten D-68 sudah diselaraskan dan bukti ada di `05-evidence.md`. Item ini menyentuh uang dan status periode, jadi kontrak wajib ada.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Penguncian periode dan payroll tercampur | gaji akhir tahun tidak bisa dibayar | `GJ-005` tetap punya kuncinya sendiri (analisis §8.3); PT-02 `[USULAN-AGEN]`, D-58, D-68 |
| Jurnal penutup tidak atomik | saldo akun tidak nol dan laporan salah | uji AC-06 wajib dijalankan |
| Ketidakselarasan `ARCH-001` soal buka kembali | implementasi membuat jalur buka kembali | `D-44` (5) dipakai; `ARCH-001` diselaraskan |

## Handoff boundary

- Parent epic / milestone: `EPIC-CORE` / M1–M2
- Lane / sequence / predecessor: active / 2 (urutan Core di backlog; gelombang 2 per `D-34`) / `C-009`, `FND-006`
- Foundation status / evidence: `done`. `FND-001`–`FND-009` `done`; `C-009` `done`.
- Artifact role / canonical source: canonical, `docs/product/items/C-010-tutup-buku/`
- Next domain: review tech lead (`05-evidence.md`)
- Required input artifacts: `docs/product/decisions.md` (`D-07`, `D-08`, `D-32`, `D-34`, `D-35`, `D-41`, `D-43`, `D-44`, `D-50`, `D-58`, `D-63`, `D-68`), `docs/product/reference/analisis-sia.md` §7.5, §8.3, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (`PRE-02`, failure semantics)
- Implementation plan: migrasi `0015`, core ledger, UI `/laporan/periode`, dan `scripts/verify-c-010.mjs` selesai; bukti di `05-evidence.md`.
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Core, `C-010`)
- `docs/product/epics/EPIC-CORE.md`
- `docs/product/items/C-009-laporan-keuangan/`
