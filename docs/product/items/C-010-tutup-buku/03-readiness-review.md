# C-010 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | status periode, penolakan posting, jurnal penutup tahunan, saldo nol |
| 2 | Aktor dan izin jelas | lolos | Accounting menutup (D-50); buka kembali tidak ada (D-44 (5)) |
| 3 | Status dan transisi eksplisit | lolos | `terbuka` → `terkunci` (bulanan); tahun buku `terbuka` → `ditutup` (`[USULAN-AGEN]`, PT-12); jalur gagal lengkap |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap termasuk prasyarat D-50 dan urutan periode (PT-04, `[USULAN-AGEN]`) |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-13 punya langkah atau perintah; AC-09 memakai PT-02 (`[USULAN-AGEN]`); AC-13 memakai PT-12 (`[USULAN-AGEN]`) |
| 6 | Semua `depends on` berstatus `done` | belum | `C-009` dan `FND-006` berstatus `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 12 pertanyaan: 12 terjawab (9 keputusan terkunci, 3 `[USULAN-AGEN]`), 0 terbuka |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` wajib `done`; baru `FND-001` yang `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran M (usulan paket): satu aturan status, satu jurnal penutup tahunan, penolakan posting |

## Verdict

`Blocked`

Alasan (dependensi): `C-009` dan `FND-006` belum `done`; gate fondasi `FND-001`–`FND-006` belum terpenuhi (DoR butir 6 dan 8).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 12 — 12 terjawab, 0 terbuka.

- Dependensi: `C-009` `done`, `FND-006` `done` (gate fondasi).
- PT-01: peran tutup dan buka. **Terjawab — D-50** (Accounting; buka kembali tidak ada).
- PT-02: scope kunci. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-03: buka kembali. **Terjawab — D-44 (5).**
- PT-04: urutan periode. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-05: jejak `riwayat_status`. **Terjawab — D-32.**
- PT-06: akun laba ditahan. **Terjawab — D-41** (penyediaan akun di spec `FND-006`).
- PT-07: prasyarat penutupan. **Terjawab — D-50.**
- PT-08: koreksi setelah tutup. **Terjawab — D-44 (5).**
- PT-09: `FND-006` di `depends_on`. **Terjawab — backlog.md.**
- PT-10: prioritas dan ukuran. **Terjawab — D-50** (P1; ukuran M usulan).
- PT-11: bulanan vs tahunan. **Terjawab — D-50, D-44 (5).**
- PT-12: status tahun buku dan sisa 601/602. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).

Pertentangan yang perlu dicatat (bukan pemblokir item ini):

- `ARCH-001` menyebut "buka periode lewat prosedur `C-010`", sedangkan `D-44` (5) meniadakan buka kembali. Teks `ARCH-001` perlu diselaraskan (di luar folder item ini).

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P1` | analisis C10 (P1, `D-50`); memblokir `INT-001` |
| Ukuran | `M` | satu aturan status, satu jurnal penutup, penolakan posting |
| Urutan penutupan (PT-04) | berurutan | angka periode tidak boleh bergantung pada jurnal belum final |
| Status tahun buku (PT-12) | `terbuka` → `ditutup` | `D-50` memisahkan kunci bulanan dari tutup tahunan |
| Hak tutup (PT-02) | jurnal saja; dokumen sumber tidak berubah | `D-50` dan `D-43` sudah mengamankan angka |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh uang dan status periode, jadi kontrak wajib ada. Semua aturan `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Penguncian periode dan payroll tercampur | gaji akhir tahun tidak bisa dibayar | `GJ-005` tetap punya kuncinya sendiri (analisis §8.3); PT-02 `[USULAN-AGEN]` |
| Jurnal penutup tidak atomik | saldo akun tidak nol dan laporan salah | uji AC-06 wajib dijalankan |
| Ketidakselarasan `ARCH-001` soal buka kembali | implementasi membuat jalur buka kembali | `D-44` (5) dipakai; `ARCH-001` diselaraskan |

## Handoff boundary

- Parent epic / milestone: `EPIC-CORE` / M1–M2
- Lane / sequence / predecessor: active / 2 (urutan Core di backlog; gelombang 2 per `D-34`) / `C-009`, `FND-006`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` berstatus `specified`.
- Artifact role / canonical source: canonical, `docs/product/items/C-010-tutup-buku/`
- Next domain: `quick-dev` (hanya setelah verdict `Ready`)
- Required input artifacts: `docs/product/decisions.md` (`D-07`, `D-08`, `D-32`, `D-34`, `D-35`, `D-41`, `D-43`, `D-44`, `D-50`), `docs/product/reference/analisis-sia.md` §7.5, §8.3, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (`PRE-02`, failure semantics)
- Implementation plan: `Not created`
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Core, `C-010`)
- `docs/product/epics/EPIC-CORE.md`
- `docs/product/items/C-009-laporan-keuangan/`
