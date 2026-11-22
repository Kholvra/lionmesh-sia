# INT-002 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | rantai dan status akhir terlihat; skenario kawat dan tiga jalur gagal ditetapkan (`D-51` (g)) |
| 2 | Aktor dan izin jelas | lolos | penguji tech lead atau yang ditunjuk (PT-07, `[USULAN-AGEN]`); aktor tiap langkah dari siklusnya |
| 3 | Status dan transisi eksplisit | lolos | perpindahan dicatat; status akhir dicatat sebelum run (PT-02, `[USULAN-AGEN]`); nama status dari `D-46` |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap; tiga jalur gagal dengan penolakan yang sesuai (AC-08) |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-10 punya perintah atau pembanding; AC-02 dan AC-05 memakai nilai yang dicatat sebelum run (PT-02, `[USULAN-AGEN]`) |
| 6 | Semua `depends on` berstatus `done` | belum | `INT-001` dan `FND-008` berstatus `specified`; seluruh siklus yang dilalui rantai harus `done` (transitif) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 9 pertanyaan: 3 terjawab dari keputusan terkunci (PT-01, PT-04, PT-09), 6 `[USULAN-AGEN]`, 0 terbuka |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` wajib `done`; baru `FND-001` yang `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran L (usulan): menyentuh seluruh siklus dan laporan; banyak titik gagal |

## Verdict

`Blocked`

Alasan (dependensi): `INT-001` dan `FND-008` belum `done` (dan seluruh siklus yang dilalui rantai, transitif lewat `INT-001`); gate fondasi `FND-001`–`FND-006` belum terpenuhi (DoR butir 6 dan 8).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 9 — 9 terjawab, 0 terbuka.

- Dependensi: `INT-001` `done`; `FND-008` `done`; siklus yang dilalui `done`; gate fondasi `done`.
- PT-01: skenario acuan. **Terjawab — D-51 (g).**
- PT-02: nilai yang diharapkan dan tempatnya. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-03: `FND-008` menyeed seluruh master. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-04: cakupan jalur gagal. **Terjawab — D-51 (g).**
- PT-05: skrip atau layar. **Terjawab — [USULAN-AGEN]** (skrip; perlu kunci koordinator).
- PT-06: lokal atau CI. **Terjawab — [USULAN-AGEN]** (lokal, bukan gerbang PR; perlu kunci koordinator).
- PT-07: pemilik dan penguji. **Terjawab — [USULAN-AGEN]** (tech lead; perlu kunci koordinator).
- PT-08: prioritas dan ukuran. **Terjawab — [USULAN-AGEN]** (P0; ukuran L).
- PT-09: urutan `D-20`. **Terjawab — D-34.**

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Tipe | `chore` | item ini membuktikan rantai, bukan fitur baru |
| Prioritas | `P0` | gate `EPIC-INT` nomor 5; satu-satunya bukti rantai end-to-end. Analisis tidak punya prioritas untuk `INT-*` (`D-50`) |
| Ukuran | `L` | menyentuh seluruh siklus dan laporan; banyak titik gagal |
| Nilai yang diharapkan (PT-02) | dihitung tangan dan dicatat sebelum run | mencegah rantai lulus karena mengikuti hasil |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh uang (jurnal dan laporan) dan status dokumen, jadi kontrak wajib ada. Semua aturan `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Nilai yang diharapkan dihitung dari hasil | rantai lulus karena salah | PT-02 `[USULAN-AGEN]`: dicatat sebelum run |
| Data uji lintas siklus tidak lengkap | rantai gagal di tengah atau lolos tanpa mencakup semua siklus | PT-03 `[USULAN-AGEN]` |
| Item terlalu besar | menunda seluruh gate join | pertimbangkan pemecahan per segmen rantai lewat `decompose` (keputusan tech lead) |
| Rantai menutupi kegagalan dengan data sisa | bug tidak terdeteksi | AC-07 dan `db:reset` sebelum setiap run |

## Handoff boundary

- Parent epic / milestone: `EPIC-INT` / M2
- Lane / sequence / predecessor: active / n/a (join, level 10) / `INT-001`, `FND-008`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` dan `FND-008` berstatus `specified`.
- Artifact role / canonical source: canonical, `docs/product/items/INT-002-rantai-end-to-end/`
- Next domain: `quick-dev` (hanya setelah verdict `Ready`)
- Required input artifacts: `docs/product/decisions.md` (`D-16`, `D-27`, `D-28`, `D-30`, `D-34`, `D-42`, `D-43`, `D-46`, `D-51`), `docs/product/reference/analisis-sia.md` §6, §12.1, §12.2, `docs/product/epics/EPIC-INT.md`
- Implementation plan: `Not created`
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Integrasi `INT-002`)
- `docs/product/epics/EPIC-INT.md`
- `docs/product/items/INT-001-jurnal-gabungan/`
