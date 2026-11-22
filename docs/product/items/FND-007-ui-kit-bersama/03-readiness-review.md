# FND-007 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | Empat primitive dengan perilaku yang bisa diamati (01, Outcome) |
| 2 | Aktor dan izin jelas | lolos | Pengembang modul, staf dan Karyawan, tech lead |
| 3 | Status dan transisi eksplisit | lolos | Keadaan dialog, tabel, dan badge ditulis (01, Status) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel pesan lengkap di 01 (Validasi) |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-08 dengan langkah manual terekam atau perintah; `arch:check` dan `grep` untuk AC-05 dan AC-06 |
| 6 | Semua `depends on` `done` | belum | `FND-002` berstatus `specified`, belum `done` (`backlog.md`) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Semua pertanyaan di 00 berstatus Terjawab (`D-46`, `D-47`, atau `[USULAN-AGEN]` menunggu kunci) |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` belum seluruhnya `done`; `FND-007` sendiri termasuk yang dinanti (aturan gate) |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | `S` atau `M` `[USULAN]` untuk empat komponen tanpa logika domain |

## Ringkasan pertanyaan terbuka (diperbarui 2026-11-22)

| Status | Jumlah |
|---|---|
| Terbuka | 0 |
| Terjawab (`D-xx`) | 1 |
| Terjawab `[USULAN-AGEN]` menunggu kunci koordinator | 6 |

Pertanyaan `bisnis` yang memblokir: tidak ada.

## Verdict

**`Blocked`**

Alasan (satu): dependensi belum `done`: `FND-002` (status `specified`). Butir 6 belum; butir 8 belum karena gate `FND-001`–`FND-006` juga bergantung pada `FND-002`.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Tidak ada pertanyaan terbuka. Keputusan yang menunggu kunci koordinator:

| ID | Keputusan | Owner |
|---|---|---|
| OQ-07-01 | aturan gate UI sebagai DoR butir 6; kolom `depends_on` di `backlog.md` | koordinator |
| OQ-07-02, OQ-07-04..06 | perilaku tabel, konfirmasi, pesan, aksesibilitas | koordinator |
| OQ-07-07 | bukti manual sampai runner ada | koordinator |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Dependensi | `FND-007` ditambahkan ke `depends on` item modul yang menambah layar `[USULAN]` | mengikuti aturan gate; keputusan ada di koordinator (`backlog.md` tidak diubah di sini) |
| Ukuran | `S` atau `M` `[USULAN]` | empat komponen, tanpa logika domain |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini tidak menyentuh uang, stok, status dokumen, atau kepercayaan; kontrak ringkas dengan alasan tertulis.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Preconditions / Postconditions | ringkas | perilaku komponen |
| Invariants | ya | komponen tanpa logika domain; badge dari daftar status |
| Trust boundary | tidak | input dari pengguna divalidasi di server oleh item pemanggil (`ARCH-001` `BOUNDARY-01`) |
| State transition | ya (ringkas) | keadaan dialog |
| Loop/termination | tidak | tidak ada algoritma berulang |
| Architecture boundary | ya, merujuk ARCH-001 | `ARCH-01`, `ARCH-02` |

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Gate UI tidak masuk `depends_on` (`OQ-07-01`) | item modul mulai tanpa primitive | koordinator memutuskan; DoR butir 6 membaca aturan gate |
| Setiap modul membuat tabel sendiri sebelum item ini | duplikasi | gate pada `FND-007` |
| Bukti manual tidak berulang | AC UI sulit diverifikasi ulang | tangkapan layar di `05-evidence.md`; runner nanti |

## Readiness status

`Blocked` (lihat Verdict). Tidak ada verdict `Ready`.

## Handoff boundary

- Parent epic / milestone: `EPIC-FND` / `M0`
- Lane / sequence / predecessor: `active` / `7` / `FND-002` (`specified`, belum `done`)
- Foundation status / evidence: `missing` untuk UI kit (`backlog.md`); `src/components/` ada sebagai folder, isi tidak diverifikasi
- Artifact role / canonical source: `canonical`: `docs/product/items/FND-007-ui-kit-bersama/`
- Next domain: `quick-dev` setelah DoR `Ready`
- Required input artifacts: `docs/product/decisions.md` (D-46, D-47, D-48); `docs/product/backlog.md` (Fondasi, Aturan gate 1); `docs/product/epics/EPIC-FND.md`; `docs/product/README.md` (aturan gate); `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (ARCH-01, ARCH-02)
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-FND.md`
