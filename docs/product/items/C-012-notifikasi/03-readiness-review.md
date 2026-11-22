# C-012 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | notifikasi in-app terlihat; email untuk kejadian bertanda kanal email; status kirim terlihat |
| 2 | Aktor dan izin jelas | lolos | penerima per kejadian (PT-02, `[USULAN-AGEN]`); pengguna yang tidak berhak tidak melihat (AC-02) |
| 3 | Status dan transisi eksplisit | lolos | `belum dibaca` → `sudah dibaca`; `menunggu` → `terkirim` atau `gagal`; tidak ada kirim ulang manual (PT-07) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | kondisi gagal lengkap (alamat kosong, penyedia mati, penerima tidak berhak); teks final ditentukan implementasi |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-10 punya langkah atau perintah; AC-03 memakai PT-03 (`[USULAN-AGEN]`) |
| 6 | Semua `depends on` berstatus `done` | belum | `FND-004` berstatus `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: 10 terjawab (4 keputusan terkunci, 6 `[USULAN-AGEN]`), 0 terbuka |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` wajib `done`; baru `FND-001` yang `done`. `FND-007` sebagai dependensi koordinasi (PT-06) ikut dicatat |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran M (usulan): satu kanal in-app, satu kanal email, dan antrean dengan status |

## Verdict

`Blocked`

Alasan (dependensi): `FND-004` belum `done`; gate fondasi `FND-001`–`FND-006` belum terpenuhi (DoR butir 6 dan 8).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Pertanyaan (`00-discussion.md`): 10 — 10 terjawab, 0 terbuka.

- Dependensi: `FND-004` `done` (gate fondasi `FND-001`–`FND-006`).
- PT-01: daftar kejadian pemicu. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-02: penerima per jenis notifikasi. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-03: penyedia email. **Terjawab — [USULAN-AGEN]** (adaptor tunggal; perlu kunci koordinator).
- PT-04: WhatsApp. **Terjawab — D-52.**
- PT-05: data pribadi dan isi email. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-06: batas `FND-007`. **Terjawab — [USULAN-AGEN]**: `FND-007` jadi dependensi koordinasi (bukan `depends_on` backlog).
- PT-07: kebijakan kirim ulang. **Terjawab — [USULAN-AGEN]** (perlu kunci koordinator).
- PT-08: preferensi pengguna. **Terjawab — D-50** (ditunda).
- PT-09: prioritas P2 versus level 1. **Terjawab — D-34 dan D-50.**
- PT-10: urutan terhadap `D-20`. **Terjawab — D-34.**

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P2` | analisis P2 (`D-50`); tidak memblokir item lain di backlog |
| Ukuran | `M` | satu kanal in-app, satu kanal email, dan antrean dengan status |
| Dependensi koordinasi | tambah `FND-007` ke `depends_on` C-012 bila komponen UI dipakai (PT-06) | DoR butir 8 dan backlog aturan UI; perubahan backlog di luar item ini |
| Kejadian dan penerima (PT-01, PT-02) | empat kejadian makalah plus pemberitahuan approver | sumber hanya memberi empat kejadian |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh data pribadi (alamat email) dan status kirim, jadi kontrak wajib ada. Semua aturan `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kejadian pemicu salah daftar | notifikasi salah sasaran | PT-01 dan PT-02 `[USULAN-AGEN]`; kunci koordinator sebelum `Ready` |
| Notifikasi membocorkan angka | pelanggaran hak akses | PT-05 `[USULAN-AGEN]` dan AC-09 |
| Slip karyawan lewat email (makalah penggajian) bertentangan dengan D-18 | kanal email untuk karyawan dibangun tanpa keputusan | `D-18` dan `D-53` berlaku; tidak masuk C-012 |
| WhatsApp dianggap menyusul | cakupan tidak jelas | `D-52` dan `D-01` |

## Handoff boundary

- Parent epic / milestone: `EPIC-CORE` / M1–M2
- Lane / sequence / predecessor: active / 4 (urutan Core di backlog; gelombang 2 per `D-34`) / `FND-004`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-004` berstatus `specified`.
- Artifact role / canonical source: canonical, `docs/product/items/C-012-notifikasi/`
- Next domain: `quick-dev` (hanya setelah verdict `Ready`)
- Required input artifacts: `docs/product/decisions.md` (`D-01`, `D-04`, `D-18`, `D-25`, `D-34`, `D-50`, `D-52`, `D-53`), `docs/product/reference/analisis-sia.md` §5.1 C12, §5.6, §7.2, §8.2 #12
- Implementation plan: `Not created`
- Out of scope for this skill: eksekusi setup, breakdown tugas teknis, kompilasi kontrak, strategi test, dan perubahan kode.

## Links

- `docs/product/backlog.md` (baris Core, `C-012`)
- `docs/product/epics/EPIC-CORE.md`
