# PG-003 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: dua tahap, estimasi nilai, jenjang, dan jejak keputusan |
| 2 | Aktor dan izin jelas | lolos | matriks v0 (`D-33`): Purchasing memeriksa, Manajemen menyetujui, Direksi tidak. Pemohon tidak menyetujui sendiri (`D-42`, `D-48`) |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | transisi mengikuti `D-46` dan `D-48`. Jenjang antara tidak menambah status (`[USULAN-AGEN]` Q-12). Jalur gagal (tolak tanpa alasan, nilai tanpa aturan, konkurensi, revisi) ada |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | tabel Validasi memuat pesan untuk setiap kondisi gagal. Teks ditandai `[USULAN]` dan ikut kunci koordinator |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-12 punya langkah uji. Uji jenjang tambahan memakai seed uji yang disebut eksplisit; AC-06 lewat service karena satu akun satu peran |
| 6 | Semua `depends on` berstatus `done` | belum | `PG-002` dan `FND-004` masih `specified`, belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 13 pertanyaan: 8 terjawab `D-xx`, 5 terjawab `[USULAN-AGEN]` (termasuk turunan Q-12 dan Q-13). Terbuka: 0 |
| 8 | Gate fondasi terpenuhi | belum | `FND-001` `done`; `FND-002` sampai `FND-006` masih `specified`. `FND-007` juga belum (lihat Dependensi) |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | usulan `M` (agen). Mesin N jenjang di `FND-004`; PG-003 hanya aturan dan layar |

## Verdict

`Blocked`

Alasan (dependensi belum `done`): `PG-002` dan `FND-004` (`depends on` di `backlog.md`), beserta gate fondasi `FND-002` sampai `FND-006` yang menjadi prasyarat keduanya; serta `FND-007` karena antrean dan dialog memakai primitive UI.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Pertanyaan terbuka (2026-11-22)

Total 13 (11 asli + 2 turunan). Terjawab `D-xx`: 8 (Q-01, Q-02, Q-03, Q-04, Q-05, Q-06, Q-08, Q-09). Terjawab `[USULAN-AGEN]`: 5 (Q-07, Q-10, Q-11, Q-12, Q-13). Terbuka: 0. Rincian ada di `00-discussion.md`.

## Keputusan default `[USULAN-AGEN]` (menunggu kunci koordinator)

| Kode | Keputusan default | Alasan singkat |
|---|---|---|
| Q-07 | Dasar nilai = estimasi nilai PR (IDR) dari Purchasing; kosong dihitung 0 | approval sebelum pemilihan pemasok; seed satu jenjang tidak bergantung pada nilai |
| Q-10 | Keputusan pertama berlaku; yang kedua ditolak dengan pesan | `D-46` tidak memberi jalur untuk status yang sudah berubah |
| Q-11 | Antrean sebagai jalur utama; `C-012` bukan dependensi | `D-50` menunda preferensi notifikasi; backlog tidak mencantumkan `C-012` |
| Q-12 | Rentang `min` inklusif, `max` eksklusif; jenjang antara tidak mengubah status | `D-47` melarang status baru tanpa keputusan baru |
| Q-13 | Approver tiap jenjang harus orang berbeda | prinsip pemisahan tugas `D-42` dan `D-48` |

## Pertentangan yang ditemukan

- `D-37` meminta ambang nominal "diisi placeholder di seed dan ditandai belum final", sedangkan `D-51`(c) menetapkan seed satu jenjang untuk semua nilai. Dibaca sebagai: seed memakai satu jenjang tanpa ambang; ambang bertingkat ditambah kemudian sebagai data.
- Backlog gate (`FND-007`) menyatakan item dengan primitive UI menunggu `FND-007`, tetapi `depends on` tidak mencantumkannya.
- `D-48` menyiratkan revisi setelah approval menggugurkannya; `D-46` tidak memuat transisi itu. Paket mengikuti `D-48` (lihat `PG-002`).

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P0` | `analisis-sia.md` §5.3 menandai PG-3 P0 |
| Ukuran | `M` | dua tahap, aturan jenjang, riwayat, dan gugurnya approval; satu track |
| Alasan penolakan wajib | ya | keputusan tolak perlu jejak alasan (`[USULAN]`; `LAPORAN_PENGERJAAN_PROYEK.txt` UC-PG04) |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`. Kontrak wajib karena item ini memindahkan status dokumen dan menentukan siapa boleh memutuskan.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Dua mesin approval (`FND-004` dan PG-003) | logika ganda dan riwayat tidak utuh | `D-37`: satu mesin di `FND-004` |
| Ambang bertingkat belum ditetapkan manajemen | seed satu jenjang dianggap final | ditandai belum final (`D-37`); tambah jenjang lewat data |
| Konkurensi approval | status bisa berubah dua kali | `[USULAN-AGEN]` Q-10 dan AC-09 |
| Pemohon menyetujui lewat dua peran | pemisahan tugas gagal | uji service AC-06; satu akun satu peran (`D-48`) |

## Readiness status

- Status requirement: `specified`. Paket dibuat, belum `ready`.
- Baris `backlog.md` `specified`.

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: `active`, graph (`D-03`), predecessor `PG-002` dan `FND-004`, serta gate fondasi dan `FND-007`
- Foundation status / evidence: `partial` (lihat `backlog.md` bagian Status fondasi)
- Artifact role / canonical source: `canonical` (`docs/product/items/PG-003-approval-berjenjang/`)
- Next domain: `design-contracts` untuk kontrak yang sudah disiapkan, lalu `quick-dev` setelah `Ready`
- Required input artifacts: `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `docs/product/backlog.md`
- `docs/product/epics/EPIC-PG.md`
- `docs/product/decisions.md` (`D-05`, `D-08`, `D-33`, `D-37`, `D-38`, `D-42`, `D-46`, `D-48`, `D-50`, `D-51`)
- `docs/product/policies/matriks-izin.md` (Pengeluaran: periksa PR, setujui PR)
- `docs/product/reference/analisis-sia.md` §2.3, §3.2, §3.3, §5.3, §6.4, §7.2, §8.1, §8.2
- `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
