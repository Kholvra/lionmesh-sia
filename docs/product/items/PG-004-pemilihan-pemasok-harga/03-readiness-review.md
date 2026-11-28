# PG-004 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: pemilihan satu pemasok, perbandingan harga, riwayat, dan alasan bila bukan termurah |
| 2 | Aktor dan izin jelas | lolos | matriks v0 (`D-33`): pilih pemasok oleh Purchasing. Manajemen tidak terlibat |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | `DISETUJUI → PEMASOK_DITETAPKAN` (`D-46`). Tidak ada ganti pemasok. Pembatalan oleh pemohon (`D-48`) di `PG-002`. Jalur gagal (belum disetujui, nonaktif, tanpa alasan) ada |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | tabel Validasi memuat pesan untuk setiap kondisi gagal. Teks ditandai `[USULAN]` dan ikut kunci koordinator |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-11 punya langkah UI dari `pnpm db:reset` |
| 6 | Semua `depends on` berstatus `done` | lolos | `PG-001` (2026-11-26) dan `PG-002` (2026-11-27) `done`; `PG-003` selesai di branch yang sama, PR menunggu merge |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: 4 terjawab `D-xx`, 6 terjawab `[USULAN-AGEN]`. Terbuka: 0 |
| 8 | Gate fondasi terpenuhi | lolos | `FND-001`-`FND-009` `done`; gate modul `D-54`/`D-67` terpenuhi |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | usulan `S` (agen): satu layar pilih dan bandingkan. Sumber harga sudah ditetapkan sebagai input manual |

## Verdict

`Ready` (2026-11-27)

Dependensi `PG-001` dan `PG-002` sudah `done`; `PG-003` selesai di branch yang sama dan menunggu merge. Gate fondasi `FND-001`–`FND-009` `done`. Tidak ada pemblokir lain. Bukti implementasi ada di `05-evidence.md`; bukti database menyusul di `docs/tech-debt/pg-004-bukti-db.md`.

## Keputusan yang ditetapkan saat implementasi (2026-11-27)

| Hal | Keputusan | Alasan |
|---|---|---|
| Dasar "harga terendah" untuk banyak barang | Total harga terbaru seluruh barang permintaan per pemasok; pemasok harus mengutip semua barang | Satu pemasok untuk seluruh permintaan (`Q-09`) butuh dasar pembanding tunggal; harga sebagian tidak bisa menjadi dasar PO |

## Pertanyaan terbuka (2026-11-22)

Total 10 (9 asli + 1 baru, Q-10). Terjawab `D-xx`: 4 (Q-05, Q-06, Q-07, Q-08). Terjawab `[USULAN-AGEN]`: 6 (Q-01, Q-02, Q-03, Q-04, Q-09, Q-10). Terbuka: 0. Rincian ada di `00-discussion.md`.

## Keputusan default `[USULAN-AGEN]` (menunggu kunci koordinator)

| Kode | Keputusan default | Alasan singkat |
|---|---|---|
| Q-01 | Harga pembanding diinput manual per barang per pemasok, bertanggal, IDR net | `D-23` tidak ada portal; sumber tidak menyebut daftar harga pemasok |
| Q-02 | Riwayat = harga pembanding tersimpan sebelumnya | menghindari dependensi ke `PG-005` dan `PG-008` |
| Q-03 | Termurah tidak wajib; sistem menandai harga terendah | sumber tidak mewajibkan termurah |
| Q-04 | Alasan wajib bila pemasok bukan harga terendah | jejak untuk keputusan yang menyimpang |
| Q-09 | Satu pemasok per permintaan | makalah per permintaan; satu permintaan satu PO |
| Q-10 | `PG-003` dipandang dependensi logis; backlog tidak diubah | status `DISETUJUI` berasal dari `PG-003` |

## Pertentangan yang ditemukan

- `backlog.md` tidak mencantumkan `PG-003` pada `depends on` PG-004, padahal alur `D-46` mulai dari `DISETUJUI`. Front-matter tetap sesuai backlog; koordinator perlu memutuskan.
- Backlog gate (`FND-007`) menyatakan item dengan primitive UI menunggu `FND-007`, tetapi `depends on` tidak mencantumkannya.
- `diagram-sia-lengkap.md` PG05 menyebut "Tetapkan pemasok per item", sedangkan makalah per permintaan. Diputuskan per permintaan (Q-09).

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P1` | `analisis-sia.md` §5.3 menandai PG-4 P1 |
| Ukuran | `S` | satu layar pilih dan bandingkan; sumber harga sudah ditetapkan |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`. Kontrak wajib karena item ini memengaruhi pilihan pemasok yang menjadi dasar PO dan harga net.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Harga pembanding diinput tidak akurat | perbandingan tidak bisa dipercaya | jejak tanggal dan pemasok; uji AC-02 dan AC-06 |
| Penggantian pemasok tanpa jejak | PO memakai pemasok yang tidak tercatat | tidak ada transisi ganti (`D-46`); pembatalan dengan alasan (`PG-002`) |
| Ukuran `S` terlalu optimis | item melebar bila riwayat dibentuk dari PO atau faktur | Q-02 menetapkan riwayat dari input saja |

## Readiness status

- Status requirement: `specified`. Paket dibuat, belum `ready`.
- Baris `backlog.md` `specified`.

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: `active`, graph (`D-03`), predecessor `PG-001` dan `PG-002` (serta `PG-003` secara logis), serta gate fondasi dan `FND-007`
- Foundation status / evidence: `partial` (lihat `backlog.md` bagian Status fondasi)
- Artifact role / canonical source: `canonical` (`docs/product/items/PG-004-pemilihan-pemasok-harga/`)
- Next domain: `design-contracts` untuk kontrak yang sudah disiapkan, lalu `quick-dev` setelah `Ready`
- Required input artifacts: `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `docs/product/backlog.md`
- `docs/product/epics/EPIC-PG.md`
- `docs/product/decisions.md` (`D-14`, `D-15`, `D-17`, `D-23`, `D-25`, `D-33`, `D-38`, `D-46`, `D-48`, `D-50`)
- `docs/product/policies/matriks-izin.md` (Pengeluaran: pilih pemasok)
- `docs/product/reference/analisis-sia.md` §5.3, §6.4, §8.2
- `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
