# C-011 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | satu daftar, kode unik, nonaktif tidak bisa dipilih, konversi dan kategori terlihat di layar |
| 2 | Aktor dan izin jelas | lolos | pengelola per jenis master (PT-06, `[USULAN-AGEN]`; produk oleh Produksi per `D-33`) |
| 3 | Status dan transisi eksplisit | lolos | `aktif` ↔ `nonaktif` (tidak dihapus, `D-50`); aktivasi kembali `[USULAN-AGEN]` (PT-07) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap termasuk satuan nonaktif pada konversi; teks final ditentukan implementasi |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-11 punya langkah atau perintah; AC-06 memakai PT-06 (`[USULAN-AGEN]`) |
| 6 | Semua `depends on` berstatus `done` | belum | `FND-002` berstatus `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 11 pertanyaan: 11 terjawab (8 keputusan terkunci, 3 `[USULAN-AGEN]`; PT-07 juga memuat satu usulan aktivasi kembali), 0 terbuka |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` wajib `done`; baru `FND-001` yang `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran L (usulan revisi dari M, karena `D-38` menambah kategori, konversi, dan mata uang master) |

## Verdict

`Blocked`

Alasan (dependensi): `FND-002` belum `done`; gate fondasi `FND-001`–`FND-006` belum terpenuhi (DoR butir 6 dan 8).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 11 — 11 terjawab, 0 terbuka.

- Dependensi: `FND-002` `done` (gate fondasi).
- PT-01: kategori produk. **Terjawab — D-38.**
- PT-02: mata uang dan kurs. **Terjawab — D-38.**
- PT-03: konversi satuan. **Terjawab — D-38.**
- PT-04: tipe produk. **Terjawab — D-41** (tiga nilai tipe).
- PT-05: transfer gudang. **Terjawab — D-52** (di `FND-005`).
- PT-06: izin pengelola master. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-07: nonaktif versus hapus. **Terjawab — D-50**; aktivasi kembali **[USULAN-AGEN]**.
- PT-08: batas tabel dengan `FND-002`. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator; paket `FND-002` perlu memuat tabel dasar).
- PT-09: urutan `FND-005` terhadap `C-011`. **Terjawab — [USULAN-AGEN]** (mengikuti PT-08).
- PT-10: urutan terhadap `D-20`. **Terjawab — D-34.**
- PT-11: prioritas dan ukuran. **Terjawab — D-50** (P0; ukuran L).

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P0` | analisis C11 P0 (`D-50`); memblokir `PR-001`, `PD-003`, `PG-002` dan gate `EPIC-CORE` nomor 4 |
| Ukuran | `L` | revisi dari `M`; kategori, konversi, dan mata uang master (`D-38`) |
| Pembagian izin (PT-06) | produk, kategori, satuan: Produksi; gudang: Gudang; mata uang dan kurs: Accounting | matriks-izin (`D-33`) belum punya baris untuk selain produk; perlu koordinasi |
| Tabel dasar di `FND-002` (PT-08) | produk, gudang, satuan dibuat `FND-002` | `D-31`; paket `FND-002` belum memuatnya (usulan koordinasi) |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini memengaruhi batas modul (`D-04`, `D-25`) dan menyentuh kurs (uang), jadi kontrak wajib ada. Semua aturan `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Cakupan master membengkak (kategori, mata uang, konversi) | item tidak selesai dalam satu track | cakupan sudah ditetapkan D-38; pemecahan tetap pilihan tech lead |
| Tumpang-tindih dengan `FND-002` | dua definisi tabel produk | PT-08 `[USULAN-AGEN]`; paket `FND-002` harus memuat tabel dasar |
| Matriks izin tidak punya baris untuk master selain produk | izin tidak bisa diuji | baris matriks ditambahkan lewat koordinasi (PT-06) |

## Handoff boundary

- Parent epic / milestone: `EPIC-CORE` / M1–M2
- Lane / sequence / predecessor: active / 3 (urutan Core di backlog; gelombang 1 per `D-34`) / `FND-002`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002` berstatus `specified`.
- Artifact role / canonical source: canonical, `docs/product/items/C-011-master-data/`
- Next domain: `quick-dev` (hanya setelah verdict `Ready`)
- Required input artifacts: `docs/product/decisions.md` (`D-04`, `D-06`, `D-18`, `D-25`, `D-31`, `D-33`, `D-34`, `D-38`, `D-41`, `D-50`, `D-52`, `D-53`), `docs/product/reference/analisis-sia.md` §5.1 C11, §5.6, §7.2, §9.2 G18
- Implementation plan: `Not created`
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Core, `C-011`; baris `PR-001`)
- `docs/product/epics/EPIC-CORE.md`
- `docs/product/items/FND-001-lingkungan-dan-quality-gate/` (contoh format)
