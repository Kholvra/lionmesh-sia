# C-013 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | PR, PO, penerimaan, dan QC terlihat; penerimaan melebihi PO ditolak; penerimaan parsial; pembatalan |
| 2 | Aktor dan izin jelas | lolos | aktor dan hak per aksi dari matriks-izin (`D-33`); pemisahan tugas ditegakkan (`D-42`, `D-48`; AC-14) |
| 3 | Status dan transisi eksplisit | lolos | daftar status dari diagram §5.2 (`D-46`, `D-47`); jalur gagal (`DITOLAK` berhenti, `DIBATALKAN` batas PT-13) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap termasuk over-receipt (`D-49`); teks final ditentukan implementasi |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-15 punya langkah atau perintah; AC-01 memakai PT-05 dan AC-08, AC-15 memakai PT-13 (`[USULAN-AGEN]`) |
| 6 | Semua `depends on` berstatus `done` | belum | `FND-002`, `FND-004`, `FND-005` berstatus `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 14 pertanyaan: 10 terjawab dari keputusan terkunci, 4 `[USULAN-AGEN]` (PT-05, PT-09, PT-11, PT-13), 0 terbuka |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` wajib `done`; baru `FND-001` yang `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran L (usulan revisi dari XL; `D-31` mengeluarkan invoice dan utang); satu item tanpa pemecahan (PT-11, `[USULAN-AGEN]`) |

## Verdict

`Blocked`

Alasan (dependensi): `FND-002`, `FND-004`, dan `FND-005` belum `done`; gate fondasi `FND-001`–`FND-006` belum terpenuhi (DoR butir 6 dan 8).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 14 — 14 terjawab, 0 terbuka.

- Dependensi: `FND-002`, `FND-004`, `FND-005` `done` (gate fondasi).
- PT-01: cakupan tabel. **Terjawab — D-31.**
- PT-02: waktu stok masuk. **Terjawab — D-36.**
- PT-03: daftar status. **Terjawab — D-46, D-47.**
- PT-04: transisi approval yang ditegakkan core. **Terjawab — D-37.**
- PT-05: referensi `wo_id`. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-06: penerimaan parsial. **Terjawab — D-49, D-46.**
- PT-07: qty penerimaan lebih dari PO. **Terjawab — D-49.**
- PT-08: hak per transisi. **Terjawab — D-33, D-42, D-48.**
- PT-09: pembuktian DoD butir 1 untuk item core. **Terjawab — [USULAN-AGEN]** (uji service; perlu kunci koordinator).
- PT-10: approval nominal di `FND-004`. **Terjawab — D-37.**
- PT-11: pemecahan item. **Terjawab — [USULAN-AGEN]** (tidak dipecah; perlu kunci koordinator).
- PT-12: konflik urutan dengan `D-20`. **Terjawab — D-34.**
- PT-13: pembatalan PR dan PO. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator; bertentangan dengan `D-47` (d), lihat pertentangan).
- PT-14: PR `DITOLAK` diajukan ulang atau tidak. **Terjawab — D-46.**

Pertentangan yang perlu keputusan koordinator (bukan pemblokir item ini secara langsung):

- `D-47` (d) menyatakan pembatalan PR dan PO tidak ditambah, sedangkan `D-48` mengizinkan pembatalan oleh pemohon sebelum posting. Usulan PT-13 memilih `D-48` dan memakai `DIBATALKAN` yang sudah ada di `D-47` (a).

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P0` | analisis P0 untuk PR dan PO; memblokir `PG-002` dan `PR-003`; titik kritis awal di `backlog.md` |
| Ukuran | `L` | revisi dari `XL`; `D-31` mengeluarkan invoice dan utang; QC masuk; 16 status dan dua pemohon |
| Pemecahan (PT-11) | tidak dipecah | `D-31` sudah mempersempit cakupan; pemecahan tetap pilihan tech lead lewat `decompose` |
| `wo_id` (PT-05) | nullable tanpa foreign key; FK menyusul di `PR-002` | `PR-002` belum ada saat C-013 dibangun |
| Pembuktian (PT-09) | uji service; layar `PG-002` sebagai bukti akhir | C-013 tidak punya layar sendiri (`D-05`) |
| Pembatalan (PT-13) | PR selama PO belum terbit; PO selama belum ada penerimaan; `DIBATALKAN` dengan alasan | `D-48` lebih baru dan umum; `D-47` (a) sudah memakai `DIBATALKAN` |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh stok, status dokumen, dan batas modul, jadi kontrak wajib ada. Semua aturan `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Item terlalu besar untuk satu track | `PG-002` dan `PR-003` menunggu lama | pertimbangkan pemecahan (PT-11, tech lead) |
| Penerimaan dan stok tidak sinkron | saldo tidak bisa dipercaya | `D-36`; AC-06 dan AC-13 |
| Modul menulis tabel pengadaan langsung | dua definisi pembelian | AC-09 dan review |
| Permintaan Produksi bergantung pada `PR-002` | `wo_id` tidak punya target | PT-05 `[USULAN-AGEN]`; FK menyusul di `PR-002` |
| Layar Pengeluaran belum ada saat core selesai | DoD butir 1 tidak bisa dibuktikan | PT-09 `[USULAN-AGEN]`: uji service |
| Pembatalan PO setelah barang datang | stok dan utang tidak cocok | PT-13: PO tidak bisa dibatalkan setelah penerimaan pertama (AC-15) |

## Handoff boundary

- Parent epic / milestone: `EPIC-CORE` / M1–M2
- Lane / sequence / predecessor: active / 5 (urutan Core di backlog; gelombang 1 per `D-34`) / `FND-002`, `FND-004`, `FND-005`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`, `FND-004`, `FND-005` berstatus `specified`.
- Artifact role / canonical source: canonical, `docs/product/items/C-013-domain-pengadaan/`
- Next domain: `quick-dev` (hanya setelah verdict `Ready`)
- Required input artifacts: `docs/product/decisions.md` (`D-05`, `D-06`, `D-08`, `D-09`, `D-15`, `D-18`, `D-31`, `D-33`, `D-34`, `D-35`, `D-36`, `D-37`, `D-41`, `D-42`, `D-44`, `D-46`, `D-47`, `D-48`, `D-49`, `D-50`), `docs/product/reference/analisis-sia.md` §3.3, §4.1, §6.4, §7.2, §8.1, §8.2 #3, §8.2 #9
- Implementation plan: `Not created`
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Core `C-013`; baris `PG-002` dan `PR-003`)
- `docs/product/epics/EPIC-CORE.md`
- `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (`ARCH-06`)
