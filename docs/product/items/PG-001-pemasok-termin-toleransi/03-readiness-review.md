# PG-001 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: pengelolaan pemasok dari UI, termin dan toleransi tersimpan, dokumen baru memakai nilai terbaru |
| 2 | Aktor dan izin jelas | lolos | matriks v0 disahkan (`D-33`): hanya Purchasing mengelola pemasok. Accounting membaca kontak. Manajemen tanpa aksi |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | `aktif` dan `nonaktif` dengan transisi tertulis. Nonaktif dengan dokumen terbuka: diizinkan, dokumen tetap berjalan (`D-50`). Aktivasi ulang didefinisikan (`[USULAN-AGEN]` Q-07) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | tabel Validasi memuat pesan untuk setiap kondisi gagal. Teks pesan ditandai `[USULAN]` dan ikut kunci koordinator |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-13 punya langkah UI dari `pnpm db:reset`. AC-07 dan AC-09 bersifat lintas item dan disebut eksplisit |
| 6 | Semua `depends on` berstatus `done` | lolos | `FND-003` `done` (2026-11-23) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 9 pertanyaan: 5 terjawab `D-xx`, 4 terjawab `[USULAN-AGEN]`. Terbuka: 0 |
| 8 | Gate fondasi terpenuhi | lolos | `FND-001`–`FND-007` `done` (2026-11-23); `FND-008` juga `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | usulan `M` (agen), satu track PG-A |

## Verdict

`Blocked`

Sembilan kriteria DoR terpenuhi sejak 2026-11-23, tetapi item tetap `Blocked` karena satu prasyarat teknis belum punya item pemilik: belum ada AppShell. Rincian di bagian berikut.

## Pemblokir baru (2026-11-23)

Gate fondasi `FND-001`–`FND-008` sudah `done`, jadi kriteria 6 dan 8 lolos. Blokir yang tersisa bukan soal requirement:

1. **AppShell belum dimiliki item mana pun.** `src/app/(app)/layout.tsx` — sidebar 200/220px, guard sesi, `<nav>`/`<main>` — tidak ada di `src/` dan tidak ada baris di `backlog.md` yang memilikinya. `FND-007` hanya mengirim empat primitive (tabel, form, status badge, dialog). Tanpa shell, layar pemasok hanya bisa dibangun dengan membuat shell kedua, yang dilarang `docs/design/COMPONENTS.md` §1.
2. **Lebar sidebar belum diputuskan.** `DESIGN_TOKENS.md` mengunci 200px; `docs/design/FIGMA_V2_DELTAS.md` §1 mengukur 220px pada 375 dari 375 frame v2. Item yang membangun shell harus memakai nilai yang sudah diputuskan, bukan menebak.
3. **Tabel `pemasok` belum ada di migrasi.** `D-31` menaruhnya di `core/`; PG-001 mengirim DDL sebagai usulan dan tech lead menomori (`D-09`). Ini prosedur normal, bukan kegagalan DoR, tetapi harus selesai sebelum implementasi dimulai.

Verdict menjadi `Ready` setelah item AppShell (usulan `FND-009`) ada dan `done`. Tidak ada pemblokir requirement yang tersisa.

## Pertanyaan terbuka (2026-11-22)

Total 9. Terjawab `D-xx`: 5 (Q-01, Q-02, Q-04, Q-05, Q-07). Terjawab `[USULAN-AGEN]`: 4 (Q-03, Q-06, Q-08, Q-09). Terbuka: 0. Rincian ada di `00-discussion.md`.

## Keputusan default `[USULAN-AGEN]` (menunggu kunci koordinator)

| Kode | Keputusan default | Alasan singkat |
|---|---|---|
| Q-03 | Wajib: nama, termin, status. Kontak PIC = data pribadi, dibaca Purchasing dan Accounting | sumber tidak menyebut wajib; peran pencocokan dan pembayaran perlu membaca |
| Q-06 | Kedua toleransi berlaku bersama; batas lebih ketat menang | default 0 menuntut batas ketat |
| Q-08 | Perubahan hanya untuk dokumen baru; nilai disalin ke dokumen saat dibuat | sejalan `D-43` dan `D-48` |
| Q-09 | Kolom audit saja; nilai lama per field tidak disimpan | `D-32` tanpa tabel audit |

Keputusan aktivasi ulang pemasok (Q-07, bagian dari `D-50`) juga `[USULAN-AGEN]`.

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`. Kontrak wajib karena item ini menyimpan angka toleransi nominal, termin yang memengaruhi jatuh tempo, dan status pemasok.

## Pertentangan yang ditemukan

- Backlog gate (`FND-007`) menyatakan item dengan primitive UI menunggu `FND-007`, tetapi `depends on` `PG-001` tidak mencantumkannya. Front-matter tetap sesuai backlog (`backlog.md` tidak diubah).

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P0` | `analisis-sia.md` §5.3 menandai PG-1 P0 |
| Ukuran | `M` | satu master dengan CRUD, dua atribut toleransi, termin, dan aktivasi |
| Validasi teks | pesan nama, toleransi, izin, dan nama ganda | belum ada sumber teks; ditandai `[USULAN]` |

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kombinasi toleransi keliru (Q-06) | `PG-008` menghitung dengan aturan yang salah | aturan ditulis di requirement dan `INV-06`; uji di `PG-008` |
| Perubahan termin merambat ke dokumen lama | dokumen berubah diam-diam | snapshot (POST-03), uji lintas item AC-09 |
| Tabel `pemasok` di core, bukan di track | track PG-A menulis tabel milik core | `D-31`. DDL lewat tech lead (`D-09`) |
| Kontak PIC terlihat peran yang tidak berhak | pelanggaran data pribadi | RLS per field di `FND-003`; uji AC-13 |

## Readiness status

- Status requirement: `specified`. Paket dibuat, belum `ready`.
- Baris `backlog.md` `specified`.
- Verdict diperbarui 2026-11-23: kriteria 6 dan 8 lolos setelah fondasi `done`; status tetap `Blocked` karena AppShell belum punya item pemilik.

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: `active`, graph (`D-03`), predecessor `FND-003` dan gate fondasi, serta `FND-007` (primitive UI)
- Foundation status / evidence: `done` (`FND-001`–`FND-008`)
- Artifact role / canonical source: `canonical` (`docs/product/items/PG-001-pemasok-termin-toleransi/`)
- Next domain: `design-contracts` untuk kontrak yang sudah disiapkan, lalu `quick-dev` setelah `Ready` (menunggu item AppShell, usulan `FND-009`)
- Required input artifacts: `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `docs/product/backlog.md`
- `docs/product/epics/EPIC-PG.md`
- `docs/product/decisions.md` (`D-05`, `D-08`, `D-09`, `D-14`, `D-15`, `D-23`, `D-25`, `D-31`, `D-32`, `D-33`, `D-38`, `D-43`, `D-48`, `D-50`)
- `docs/product/policies/matriks-izin.md` (Pengeluaran: buat / ubah pemasok)
- `docs/product/reference/analisis-sia.md` §3.1, §5.3, §7.2, §8.2, §9.1
- `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
