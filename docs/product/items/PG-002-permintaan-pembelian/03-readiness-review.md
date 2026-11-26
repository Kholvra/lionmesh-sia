# PG-002 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: pengajuan, antrean, pembatalan, dan revisi dengan hasil yang terlihat |
| 2 | Aktor dan izin jelas | lolos | matriks v0 (`D-33`): Gudang dan Produksi mengajukan, Purchasing memeriksa, Manajemen menyetujui. Pemohon membatalkan dan merevisi miliknya (`D-48`) |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | daftar status `D-46`; transisi `D-48` dan revisi sukarela ditulis dengan pemicu dan siapa. Jalur gagal (bukan pemohon, setelah PO, status berubah) ada |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | tabel Validasi memuat pesan untuk setiap kondisi gagal. Teks pesan ditandai `[USULAN]` dan ikut kunci koordinator. Aturan satuan mengikuti spec `C-011` (`D-38`) |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-14 punya langkah UI dari `pnpm db:reset`. AC-15 lintas item dan disebut eksplisit |
| 6 | Semua `depends on` berstatus `done` | lolos | `C-011` `done` (PR #35), `C-013` `done` (PR #37) pada 2026-11-26 (`D-57` mengeluarkan `PG-001` dari deps) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: 6 terjawab `D-xx`, 4 terjawab `[USULAN-AGEN]`. Terbuka: 0 |
| 8 | Gate fondasi terpenuhi | lolos | `FND-001`–`FND-009` `done` (2026-11-23, `D-54`, `D-62`, `D-67`), termasuk `FND-007` untuk tabel dan form |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | usulan `M` (agen). Form, antrean, riwayat, pembatalan, dan revisi satu track |

## Verdict

`Ready`

Semua kriteria DoR terpenuhi sejak 2026-11-26. Fondasi `FND-001`–`FND-009` sudah `done` dan `C-011`/`C-013` sudah `done`, sehingga layar pengajuan punya master dan domain pengadaan untuk ditulis. Bila item membuat tabel, DDL dikirim sebagai usulan `06-ddl-proposal.sql` dan dinomori tech lead (`D-09`).

## Pertanyaan terbuka (2026-11-22)

Total 10. Terjawab `D-xx`: 6 (Q-01, Q-02, Q-07, Q-08, Q-09, Q-10; Q-07 dan Q-08 juga punya detail `[USULAN-AGEN]`). Terjawab `[USULAN-AGEN]`: 4 (Q-03, Q-04, Q-05, Q-06). Terbuka: 0. Rincian ada di `00-discussion.md`.

## Keputusan default `[USULAN-AGEN]` (menunggu kunci koordinator)

| Kode | Keputusan default | Alasan singkat |
|---|---|---|
| Q-03 | Dependensi `PG-001` dihapus dari `PG-002` (`D-57`); PR tidak butuh pemasok | keputusan dependensi wewenang tech lead; backlog 2026-11-22 sudah selaras |
| Q-04 | `wo_id` wajib untuk Produksi, opsional untuk Gudang; validasi keberadaan setelah `PR-002` tersedia | `PR-002` belum ada; kewajiban di `PR-003` |
| Q-05 | Estimasi nilai IDR diisi Purchasing saat pemeriksaan, tidak wajib saat pengajuan | urutan approval sebelum pemilihan pemasok; sumber berbeda pendapat |
| Q-06 | Tanggal butuh wajib; tidak ada prioritas di v0 | sumber tidak menyebut prioritas |
| Q-07 (detail) | Pembatalan oleh pemohon dari lima status sebelum PO terbit | `D-48` mengizinkan sebelum diposting; `PO` terbit adalah batas |
| Q-08 | Revisi sukarela dari `MENUNGGU_PERSETUJUAN` dan `DISETUJUI` kembali ke `DIAJUKAN` | `D-48` mengasumsikan revisi setelah approval gugur |

## Pertentangan yang ditemukan

- `D-47`(d) menunda pembatalan PR sebagai pertanyaan bisnis, sedangkan `D-48` menetapkan aturannya. Paket mengikuti `D-48` (lebih baru dan eksplisit); koordinator perlu mengonfirmasi.
- `D-48` menyiratkan revisi setelah approval, sedangkan `D-46` tidak memuat transisi itu. Ditambahkan sebagai `[USULAN-AGEN]`.
- Backlog gate (`FND-007`) menyatakan item dengan primitive UI menunggu `FND-007`, tetapi `depends on` tidak mencantumkannya.
- Format nomor: `proses-bisnis.md` memakai `PR-202609-0002`; `D-50` menang.

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P0` | `analisis-sia.md` §5.3 menandai PG-2 P0 |
| Ukuran | `M` | form, antrean, riwayat, pembatalan, dan revisi; satu track |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`. Kontrak wajib karena item ini membuat dokumen dengan status dan transisi pembatalan (`D-08`, `D-48`).

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Pembatalan dan revisi tidak sesuai keputusan bisnis | aturan status salah di `PG-003` dan `PG-005` | keputusan `[USULAN-AGEN]` dikunci koordinator; AC-07, AC-11 sampai AC-15 |
| Revisi setelah approval tidak menggugurkan approval | approval lama dipakai untuk dokumen berubah | `INV-06`; uji lintas `PG-003` AC-11 |
| Ukuran lebih besar dari `M` karena dua pemohon dan referensi produksi | item melebar | jalur produksi hanya kolom opsional; kewajiban di `PR-003` |
| Master `C-011` belum siap | form tidak bisa memilih produk | `C-011` `specified`; urutan dijaga di backlog |

## Readiness status

- Status requirement: `specified`. Paket dibuat, belum `ready`.
- Baris `backlog.md` `specified`.

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: `active`, graph (`D-03`), predecessor `PG-001`, `C-011`, dan `C-013`, serta gate fondasi dan `FND-007`
- Foundation status / evidence: `partial` (lihat `backlog.md` bagian Status fondasi)
- Artifact role / canonical source: `canonical` (`docs/product/items/PG-002-permintaan-pembelian/`)
- Next domain: `design-contracts` untuk kontrak yang sudah disiapkan, lalu `quick-dev` setelah `Ready`
- Required input artifacts: `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `docs/product/backlog.md`
- `docs/product/epics/EPIC-PG.md`
- `docs/product/epics/EPIC-CORE.md` (`C-011`, `C-013`)
- `docs/product/decisions.md` (`D-05`, `D-08`, `D-25`, `D-33`, `D-38`, `D-42`, `D-46`, `D-47`, `D-48`, `D-50`, `D-52`)
- `docs/product/policies/matriks-izin.md` (Pengeluaran: ajukan PR, periksa PR)
- `docs/product/reference/analisis-sia.md` §2.3, §4.1, §5.3, §6.4, §8.1, §8.2
- `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
