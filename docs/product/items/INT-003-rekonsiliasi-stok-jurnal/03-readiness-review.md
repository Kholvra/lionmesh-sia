# INT-003 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | pembandingan dan daftar selisih terlihat; sumber stok fisik ditetapkan (stock opname, `D-52`) |
| 2 | Aktor dan izin jelas | lolos | Accounting menjalankan dan membaca; Gudang membaca selisih qty; penguji tech lead (PT-08, `[USULAN-AGEN]`) |
| 3 | Status dan transisi eksplisit | lolos | tidak ada state machine; hasil lulus atau gagal dengan daftar selisih; keluaran saat selisih ditetapkan (PT-02, `[USULAN-AGEN]`) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap; akun persediaan sudah ada di `D-41` |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-11 punya perintah atau pembanding; AC-07 memakai PT-02 dan AC-02, AC-11 memakai PT-03 (`[USULAN-AGEN]`) |
| 6 | Semua `depends on` berstatus `done` | belum | `INT-001` berstatus `specified`; `FND-005` dan `C-009` juga belum `done` (transitif) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: 4 terjawab dari keputusan terkunci (PT-01, PT-04, PT-06, PT-10), 6 `[USULAN-AGEN]`, 0 terbuka |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` wajib `done`; baru `FND-001` yang `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran M (usulan): tiga pembandingan dan daftar selisih |

## Verdict

`Blocked`

Alasan (dependensi): `INT-001` belum `done`. `FND-005` dan `C-009` juga belum `done` (transitif), dan gate fondasi belum terpenuhi (DoR butir 6 dan 8).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 10 — 10 terjawab, 0 terbuka.

- Dependensi: `INT-001` `done`; `FND-005` `done`; `C-009` `done`; gate fondasi `done`.
- PT-01: stok fisik dari stock opname. **Terjawab — D-52.**
- PT-02: bentuk keluaran dan perilaku saat ada selisih. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-03: toleransi. **Terjawab — [USULAN-AGEN]** (nol; perlu kunci koordinator).
- PT-04: akun persediaan. **Terjawab — D-41.**
- PT-05: waktu rekonsiliasi. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-06: GR/IR dan keputusan penerimaan. **Terjawab — D-36, D-44 (1), D-41.**
- PT-07: stok negatif. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator; penegakan di `FND-005`).
- PT-08: pemilik dan penguji. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-09: prioritas dan ukuran. **Terjawab — [USULAN-AGEN]** (P0; M).
- PT-10: cakupan per gudang. **Terjawab — D-50, D-52.**

Catatan yang tetap berlaku: `D-10` ditandai "Perlu konfirmasi" (FIFO di kebijakan perusahaan dan rancangan). Keputusan terkunci berlaku sampai ada keputusan baru. Ini bukan pertanyaan terbuka item ini.

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P0` | gate `EPIC-INT` nomor 3. Analisis tidak punya prioritas untuk `INT-*` (`D-50`) |
| Ukuran | `M` | tiga pembandingan dan daftar selisih |
| Toleransi | nol untuk qty dan nilai | `D-43` mengunci debit = kredit tanpa toleransi; pembulatan memakai aturan tetap |
| Keluaran | daftar selisih per produk dan gudang; tidak memblokir; koreksi lewat opname `FND-005` | `D-06` melarang penyesuaian diam-diam |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh stok dan uang, jadi kontrak wajib ada. Semua aturan `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Saldo dan jurnal berbeda karena waktu posting berbeda | selisih palsu | PT-05 dan toleransi nol (PT-03) `[USULAN-AGEN]` |
| Akun persediaan salah | nilai neraca tidak cocok walau saldo benar | PT-04 terjawab (`D-41`) |
| Keputusan penerimaan `C-013` berubah | pembandingan harus diubah | PT-06 terjawab (`D-36`, `D-44` (1)) |
| Selisih disembunyikan dengan penyesuaian otomatis | saldo tidak bisa dipercaya | rekonsiliasi hanya membaca (AC-05, AC-07) |
| `D-10` ternyata harus diganti FIFO | nilai persediaan memakai metode yang salah | valuasi di balik satu antarmuka di `FND-005` (`D-10`) |

## Handoff boundary

- Parent epic / milestone: `EPIC-INT` / M2
- Lane / sequence / predecessor: active / n/a (join, level 10) / `INT-001`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` berstatus `specified`.
- Artifact role / canonical source: canonical, `docs/product/items/INT-003-rekonsiliasi-stok-jurnal/`
- Next domain: `quick-dev` (hanya setelah verdict `Ready`)
- Required input artifacts: `docs/product/decisions.md` (`D-06`, `D-07`, `D-10` (perlu konfirmasi), `D-36`, `D-41`, `D-43`, `D-44`, `D-50`, `D-52`), `docs/product/reference/analisis-sia.md` §6.4, §6.7, §7.1, §7.2, §7.3, §7.5, `docs/product/epics/EPIC-INT.md`, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (`INV-02`, `INV-03`)
- Implementation plan: `Not created`
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Integrasi `INT-003`)
- `docs/product/epics/EPIC-INT.md`
- `docs/product/items/INT-001-jurnal-gabungan/`
- `docs/product/items/C-013-domain-pengadaan/`
