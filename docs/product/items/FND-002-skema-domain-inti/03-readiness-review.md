# FND-002 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | Setelah `db:reset`, skema berisi tiga tabel dasar dan migrasi bernomor; bisa diperiksa dengan perintah (AC-01, AC-02) |
| 2 | Aktor dan izin jelas | lolos | Tech lead (menomori, `D-09`), anggota kelompok, CI |
| 3 | Status dan transisi eksplisit | lolos | Tidak ada state dokumen; kondisi lingkungan merujuk `FND-001` |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Pengguna item ini adalah tim; pesan constraint menyebut nama constraint (01, bagian Validasi) |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-09 berupa perintah SQL dan dump yang bisa diulang; daftar tabel final dan constraint sudah ada |
| 6 | Semua `depends on` `done` | lolos | Satu-satunya dependensi `FND-001` sudah `done` (`backlog.md`, 2026-11-22; bukti CI merah→hijau di PR #3) |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Semua pertanyaan di 00 berstatus Terjawab (`D-31`, `D-32`, `D-38`, `D-55`, `D-56`, atau `[USULAN-AGEN]` yang disahkan `D-58`) |
| 8 | Gate fondasi terpenuhi | lolos | Gate `FND-001`–`FND-007` berlaku untuk item modul, bukan untuk item `FND-*` (`D-54`; `OQ-02-12`) |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | Tiga tabel dasar dan satu migrasi; daftar lengkap dipangkas dari analisis §7.2 karena tabel lain dibuat pemiliknya (`D-31`) |

## Ringkasan pertanyaan terbuka (diperbarui 2026-11-22)

| Status | Jumlah |
|---|---|
| Terbuka | 0 |
| Terjawab (`D-xx`) | 4 |
| Terjawab `[USULAN-AGEN]`, disahkan `D-58` | 8 |

Pertanyaan `bisnis` yang memblokir: tidak ada. Pertanyaan `spec` semuanya sudah dijawab.

## Verdict

**`Ready`**

Alasan: semua butir DoR terpenuhi. Satu-satunya dependensi langsung (`FND-001`) sudah `done`; outcome, aktor, constraint, validasi, dan acceptance criteria (AC-01 sampai AC-09) bisa dibuktikan dengan perintah; tidak ada pertanyaan terbuka (14 terjawab oleh `D-31`, `D-32`, `D-38`, `D-52`, `D-55`, `D-56`, dan `D-58`); butir gate fondasi (8) tidak berlaku bagi item `FND-*` (`D-54`); ukuran tiga tabel dan satu migrasi wajar untuk satu orang dalam satu track.

Catatan: ini kesiapan untuk **memulai implementasi**, bukan bukti bahwa item selesai. `05-evidence.md` tetap kosong sampai AC dijalankan.

## Blockers / decisions needed

Tidak ada. Keputusan berikut semula `[USULAN-AGEN]` dan telah disahkan `D-55`, `D-56`, `D-58`:

| ID | Keputusan | Owner |
|---|---|---|
| OQ-02-01, OQ-02-03 | tiga tabel dasar di `FND-002` | koordinator |
| OQ-02-07 | tipe angka dan waktu | koordinator |
| OQ-02-08..10 | kolom modul, constraint pemilik, satu berkas per item | koordinator |
| OQ-02-11, OQ-02-12 | bukti SQL; gate fondasi sebagai urutan | koordinator |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `high` `[USULAN]` | memblokir `FND-003`–`FND-008` dan `C-011`, `C-013` |
| Ukuran | `S`-`M` `[USULAN]` | tiga tabel dan satu migrasi (turun dari `L` setelah pemangkasan) |
| Tipe | `chore` `[USULAN]` | perubahan skema tanpa layar |
| Pengecualian `D-31` | `produk`, `gudang`, `satuan` dibuat di item ini `[USULAN]` | menghindari dependensi tersembunyi `FND-005` ke `C-011` |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh batas modul dan kepemilikan tabel, sehingga kontrak wajib.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Preconditions | ya | migrasi dan kepemilikan tabel |
| Postconditions | ya | hasil reset, foreign key, dan kode unik |
| Invariants | ya | kepemilikan tunggal, tanpa kolom stok, konvensi tipe |
| Trust boundary | ya | DDL dari kelompok sebagai usulan |
| State transition | ya (ringkas) | kondisi lingkungan dari `FND-001` |
| Loop/termination | tidak | tidak ada algoritma berulang |
| Architecture boundary | ya, merujuk ARCH-001 | `ARCH-07`, `ARCH-08` |

Semua aturan kontrak berstatus `Unverified` (tidak ada bukti).

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Pengecualian `D-31` tidak dikunci | pola "DDL oleh item pertama" dilanggar | koordinator kunci `OQ-02-03` |
| Konvensi tipe salah | kolom uang dan harga harus diubah lewat migrasi baru | `INV-06` dan AC-09 |
| Migrasi bertabrakan antar kelompok | merge macet | `D-09`; kelompok hanya mengirim DDL usulan |

## Readiness status

`Ready` (lihat Verdict).

## Handoff boundary

- Parent epic / milestone: `EPIC-FND` / `M0`
- Lane / sequence / predecessor: `active` / `2` / `FND-001` (done)
- Foundation status / evidence: `partial`. Skema domain `missing` (`backlog.md`). Migrasi `0001_initial.sql` (profiles) ada.
- Artifact role / canonical source: `canonical`: `docs/product/items/FND-002-skema-domain-inti/`
- Next domain: `quick-dev` setelah DoR `Ready`. `repo-workflow` tidak diperlukan untuk skema; baseline runner sudah `available`.
- Required input artifacts: `docs/product/decisions.md` (D-04, D-06, D-07, D-08, D-09, D-27, D-30, D-31, D-32, D-38, D-52); `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`; `docs/product/reference/analisis-sia.md` §4, §7, §10.3, §10.6, §11.4
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `05-evidence.md`
- `docs/product/backlog.md`, `docs/product/decisions.md`, `docs/product/epics/EPIC-FND.md`
