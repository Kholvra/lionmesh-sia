# FND-006 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | Penolakan posting dan jurnal tak-ubah dinyatakan sebagai perilaku (01, Outcome) |
| 2 | Aktor dan izin jelas | lolos | Modul penghasil, Accounting (`D-50`), tech lead (`D-33`); pemanggil dan aktor diatur (`[USULAN-AGEN]`, OQ-06-09) |
| 3 | Status dan transisi eksplisit | lolos | Status periode, status akun, dan jalur gagal ditulis (01, Status) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel pesan lengkap di 01 (Validasi), termasuk teks periode terkunci |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-16 dengan angka uji dan perintah; AC-16 memeriksa bagan akun dasar |
| 6 | Semua `depends on` `done` | belum | `FND-002` dan `FND-003` berstatus `specified`, belum `done` (`backlog.md`) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Semua pertanyaan di 00 berstatus Terjawab (`D-33`, `D-35`, `D-38`, `D-41`, `D-43`, `D-50`, atau `[USULAN-AGEN]` menunggu kunci) |
| 8 | Gate fondasi terpenuhi | belum | `FND-001`–`FND-006` belum seluruhnya `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | `L` `[USULAN]`: COA, posting, periode, dan penegakan database dalam satu track ledger; tutup buku dan laporan tetap di `C-009`/`C-010` |

## Ringkasan pertanyaan terbuka (diperbarui 2026-11-22)

| Status | Jumlah |
|---|---|
| Terbuka | 0 |
| Terjawab (`D-xx`) | 7 |
| Terjawab `[USULAN-AGEN]` menunggu kunci koordinator | 4 (OQ-06-08..11) |

Pertanyaan `bisnis` yang memblokir: tidak ada. Nilai akun baru (`D-51`) bukan pertanyaan terbuka; mekanismenya sudah ditetapkan dan nilainya dikutip saat implementasi.

## Verdict

**`Blocked`**

Alasan (satu): dependensi belum `done`: `FND-002` dan `FND-003` (keduanya `specified`). Butir 6 belum; butir 8 belum karena gate `FND-001`–`FND-006` juga bergantung pada keduanya.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

Tidak ada pertanyaan terbuka. Keputusan yang menunggu kunci koordinator:

| ID | Keputusan | Owner |
|---|---|---|
| OQ-06-08 | daftar jenis sumber tertutup di `core/ledger` | koordinator |
| OQ-06-09 | pemanggil dan aktor `postJournal()` | koordinator |
| OQ-06-10 | balance di database lewat constraint trigger tertunda | koordinator |
| OQ-06-11 | uang `numeric(18,2)` | koordinator |
| Decisions | jurnal pembalik, seed akun 150/159/702 tanpa baris, nomor akun baru lewat `D-51` | koordinator; Accounting untuk nilai akun baru |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `high` `[USULAN]` | memblokir sepuluh item dan `C-009` |
| Ukuran | `L` `[USULAN]` | empat aspek sekaligus dalam satu track |
| Penegakan | balance di database (`[USULAN-AGEN]`, OQ-06-10) | DoD butir 6 menuntut bukti, bukan hanya layanan |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh uang, sehingga kontrak wajib.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Preconditions | ya | periode, akun, balance, sumber, dan aktor |
| Postconditions | ya | jurnal tersimpan balance; pembalik |
| Invariants | ya | `INV-01` sampai `INV-06` |
| Trust boundary | ya | modul → core, dan saat commit |
| State transition | ya (ringkas) | status periode dan akun |
| Loop/termination | tidak | tidak ada algoritma berulang |
| Architecture boundary | ya, merujuk ARCH-001 | `ARCH-03` |

Semua aturan kontrak berstatus `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Nilai akun baru belum dikutip | seed dan posting tidak bisa diuji sebelum nilai ditetapkan | mekanisme `D-51`; Accounting mengesahkan sebelum seed |
| Batas kunci periode dengan `C-010` | periode terkunci dua kali atau tidak terkunci | `D-50` (Accounting menutup); mekanisme di `C-010` |
| Penegakan hanya di layanan | jurnal tidak balance lewat jalur lain | constraint trigger tertunda (`B-03`) |

## Readiness status

`Blocked` (lihat Verdict). Tidak ada verdict `Ready`.

## Handoff boundary

- Parent epic / milestone: `EPIC-FND` / `M0`
- Lane / sequence / predecessor: `active` / `6` / `FND-002`, `FND-003` (keduanya `specified`, belum `done`)
- Foundation status / evidence: `missing` untuk ledger (`backlog.md`, status fondasi "Service bersama")
- Artifact role / canonical source: `canonical`: `docs/product/items/FND-006-ledger-coa-jurnal-periode/`
- Next domain: `quick-dev` setelah DoR `Ready`
- Required input artifacts: `docs/product/decisions.md` (D-07, D-33, D-35, D-38, D-41, D-43, D-44, D-45, D-50, D-51); `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (ARCH-03, PRE-02, INV-01); analisis §7.5, §8.3, §9.2; `pemahaman-app-e2e.md` §8.3, §10.6
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `05-evidence.md`
- `docs/product/backlog.md`, `docs/product/decisions.md`, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
