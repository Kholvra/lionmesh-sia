# INT-001 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | jurnal konsisten, neraca balance, laba rugi tertelusur, akun dikenal |
| 2 | Aktor dan izin jelas | lolos | penguji tech lead atau yang ditunjuk; owner tech lead (PT-08, `[USULAN-AGEN]`) |
| 3 | Status dan transisi eksplisit | lolos | tidak ada state machine; status periode `terbuka` dan `terkunci` dari `C-010` |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap; definisi akun menggantung (PT-03, `[USULAN-AGEN]`) |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-14 punya perintah atau pembanding; AC-03 memakai PT-03 (`[USULAN-AGEN]`) |
| 6 | Semua `depends on` berstatus `done` | belum | tujuh item di `depends_on` (`PD-008`, `PG-009`, `PR-007`, `GJ-007`, `C-009`, `C-010`, `PG-010`) belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: 10 terjawab (5 keputusan terkunci atau backlog, 5 `[USULAN-AGEN]`), 0 terbuka |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` wajib `done`; baru `FND-001` yang `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran M (usulan): satu rantai uji, pemeriksaan jurnal, dan pembanding angka |

## Verdict

`Blocked`

Alasan (dependensi): tujuh item di `depends_on` (`PD-008`, `PG-009`, `PR-007`, `GJ-007`, `C-009`, `C-010`, `PG-010`) belum `done`; gate fondasi `FND-001`–`FND-006` belum terpenuhi (DoR butir 6 dan 8).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 10 — 10 terjawab, 0 terbuka.

- Dependensi: tujuh item di `depends_on` `done`; gate fondasi `FND-001`–`FND-006` `done`.
- PT-01: predecessor `PR-007`. **Terjawab — backlog.md** (transitif ke `PR-006`).
- PT-02: pemetaan jurnal per kejadian. **Terjawab — D-41, D-44, D-49.**
- PT-03: definisi akun menggantung. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-04: akun GR/IR. **Terjawab — D-35, D-41.**
- PT-05: data uji dan `FND-008`. **Terjawab — [USULAN-AGEN]** (koordinasi: `FND-008` `done` sebelum dijalankan).
- PT-06: toleransi pembulatan. **Terjawab — D-43.**
- PT-07: masuk CI atau manual. **Terjawab — [USULAN-AGEN]** (manual dan terjadwal; perlu kunci koordinator).
- PT-08: pemilik dan penguji. **Terjawab — [USULAN-AGEN]** (tech lead; perlu kunci koordinator).
- PT-09: prioritas dan ukuran. **Terjawab — [USULAN-AGEN]** (P0; ukuran M).
- PT-10: konflik urutan `D-20`. **Terjawab — D-34.**

Catatan koordinasi (tidak memblokir item ini):

- `D-28` mengunci lima gerbang PR. Penambahan INT-001 sebagai gerbang PR (PT-07) memerlukan keputusan baru bila diinginkan.
- `EPIC-INT` gate mulai menyebut tujuh item; backlog `depends_on` INT-001 juga memuat tujuh item (termasuk `PG-010`). Selaras.

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Tipe | `chore` | item ini memeriksa persimpangan, bukan fitur baru |
| Prioritas | `P0` | gate join; memblokir `INT-002` dan `INT-003`. Analisis tidak punya prioritas untuk `INT-*` (`D-50`) |
| Ukuran | `M` | satu rantai uji, pemeriksaan jurnal, dan pembanding angka |
| Owner | tech lead | `EPIC-INT` tidak menetapkan pemilik (PT-08) |
| Seed (PT-05) | `FND-008` harus `done` sebelum dijalankan | semua siklus butuh master dari seed; bukan perubahan `depends_on` |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh uang (jurnal), jadi kontrak wajib ada. Semua aturan `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Asumsi antar modul berbeda | jurnal gabungan tidak balance | pemeriksaan di core; temuan diselesaikan di `core/` |
| Pemetaan jurnal salah | laporan keuangan salah walau tiap siklus benar | PT-02 sudah dikunci (`D-41`, `D-44`, `D-49`); AC-14 |
| `PR-007` salah sebagai predecessor | jurnal HPP produksi tidak diuji | PT-01 terjawab: transitif ke `PR-006` |
| Data uji tidak lengkap | pengujian lulus tanpa mencakup semua siklus | PT-05 `[USULAN-AGEN]` |

## Handoff boundary

- Parent epic / milestone: `EPIC-INT` / M2
- Lane / sequence / predecessor: active / n/a (join, level 9) / tujuh item di `depends_on`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` berstatus `specified`.
- Artifact role / canonical source: canonical, `docs/product/items/INT-001-jurnal-gabungan/`
- Next domain: `quick-dev` (hanya setelah verdict `Ready`)
- Required input artifacts: `docs/product/decisions.md` (`D-07`, `D-25`, `D-28`, `D-30`, `D-34`, `D-35`, `D-41`, `D-43`, `D-44`, `D-45`, `D-49`, `D-51`), `docs/product/reference/analisis-sia.md` §6.7, §7.5, `docs/product/epics/EPIC-INT.md`, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (`ARCH-03`, `INV-01`)
- Implementation plan: `Not created`
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Integrasi `INT-001`)
- `docs/product/epics/EPIC-INT.md`
- `docs/product/items/C-009-laporan-keuangan/`
- `docs/product/items/C-010-tutup-buku/`
