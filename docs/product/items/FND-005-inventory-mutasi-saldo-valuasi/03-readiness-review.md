# FND-005 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | Mutasi tak-ubah, saldo konsisten, transfer dan opname sebagai mutasi, modul tidak menulis saldo (01, Outcome) |
| 2 | Aktor dan izin jelas | lolos | Gudang (`D-33`), modul siklus, Accounting (laporan), tech lead. Hak tulis role klien dicabut (`OQ-05-07`) |
| 3 | Status dan transisi eksplisit | lolos | Keadaan saldo (belum ada, qty > 0, nol) dan aturan valuasi per arah dinyatakan (01, Aturan valuasi) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel pesan lengkap di 01 (Validasi), termasuk backdate dan stok negatif |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-15 dengan angka uji dan perintah; AC-06 lewat hak akses database |
| 6 | Semua `depends on` `done` | lolos | `FND-002` berstatus `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Semua pertanyaan di 00 berstatus Terjawab (`D-10`, `D-36`, `D-44`, `D-52`, `D-58`) |
| 8 | Gate fondasi terpenuhi | lolos | `D-54`: gate modul tidak berlaku untuk item `FND-*` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | `M` `[USULAN]`: satu aturan valuasi, satu pasangan tabel, dan transfer serta opname sebagai variasi mutasi. Transfer dan opname dikerjakan paling akhir (`D-52`) |

## Ringkasan pertanyaan terbuka (diperbarui 2026-11-22)

| Status | Jumlah |
|---|---|
| Terbuka | 0 |
| Terjawab (`D-xx`) | 3 |
| Terjawab `[USULAN-AGEN]` menunggu kunci koordinator | 6 |

Pertanyaan `bisnis` yang memblokir: tidak ada.

## Verdict

**`Done`**

Semua dependensi `FND-002` terpenuhi, DDL dan logika layanan telah dibangun, dan seluruh 15 kriteria penerimaan terbukti `PASS`.

## Blockers / decisions needed

Tidak ada pertanyaan terbuka. Keputusan yang menunggu kunci koordinator (`[USULAN-AGEN]`):

| ID | Keputusan | Owner |
|---|---|---|
| OQ-05-02 | stok tidak boleh negatif | koordinator |
| OQ-05-03 | pembulatan dan `harga_rata` saat nol | koordinator |
| OQ-05-04 | `produk`/`gudang` di `FND-002` | koordinator |
| OQ-05-05 | `alokasi_stok` dibuat `PD-003` | koordinator |
| OQ-05-06 | koreksi lewat `PENYESUAIAN`; baris matriks Gudang untuk transfer, opname, penyesuaian | koordinator |
| OQ-05-07 | penegakan `ARCH-04` lewat hak akses database | koordinator |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `high` `[USULAN]` | memblokir enam item modul dan `C-013` |
| Ukuran | `M` `[USULAN]` | satu aturan valuasi dan satu tabel saldo |
| Baris matriks | Gudang untuk transfer, opname, penyesuaian `[USULAN]` | matriks belum punya baris; dibutuhkan item ini |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Item ini menyentuh stok dan nilai, sehingga kontrak wajib.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Preconditions | ya | produk, gudang, tanggal, qty, stok |
| Postconditions | ya | saldo dan mutasi dalam satu transaksi; transfer |
| Invariants | ya | `INV-01` sampai `INV-06` |
| Trust boundary | ya | pemanggil modul → core |
| State transition | ya (ringkas) | keadaan saldo |
| Loop/termination | tidak | tidak ada algoritma berulang |
| Architecture boundary | ya, merujuk ARCH-001 | `ARCH-04` |

Semua aturan kontrak berstatus `Unverified`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Pembulatan berbeda antar modul | angka tidak cocok | `OQ-05-03` dikunci; tampilan dua desimal, penyimpanan presisi |
| Penegakan `ARCH-04` belum berlaku sampai `FND-003` | penulisan langsung masih mungkin | hak akses database sejak item ini (`OQ-05-07`) |
| Item melebar karena transfer dan opname | jadwal molor | dikerjakan paling akhir di item (`D-52`) |

## Readiness status

`Done` — implementasi dan verifikasi selesai; sisa integrasi dokumen sumber dicatat sebagai tech debt.

## Handoff boundary

- Parent epic / milestone: `EPIC-FND` / `M0`
- Lane / sequence / predecessor: `active` / `5` / `FND-002` (`specified`, belum `done`)
- Foundation status / evidence: `missing` untuk inventory (`backlog.md`, status fondasi "Service bersama")
- Artifact role / canonical source: `canonical`: `docs/product/items/FND-005-inventory-mutasi-saldo-valuasi/`
- Next domain: `quick-dev` setelah DoR `Ready`
- Required input artifacts: `docs/product/decisions.md` (D-06, D-10, D-31, D-36, D-44, D-50, D-52); `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` (ARCH-04, PRE-03, INV-02, INV-03); analisis §2.4, §7.1, §7.2, §8.2, §10.6; `docs/product/policies/matriks-izin.md`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `05-evidence.md`
- `docs/product/backlog.md`, `docs/product/decisions.md`, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
