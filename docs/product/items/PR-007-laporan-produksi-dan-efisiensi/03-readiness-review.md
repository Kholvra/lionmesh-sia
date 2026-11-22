# PR-007 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: laporan dibuka dari UI dan angkanya bisa dicocokkan |
| 2 | Aktor dan izin jelas | lolos | Empat peran dari matriks izin v0 (`D-33`), termasuk Accounting; laporan tidak menulis data |
| 3 | Status dan transisi eksplisit | lolos | Laporan tidak punya status (`[USULAN-AGEN]`; makalah Tabel 4.2.6 nomor 36). Jalur gagal (periode terbalik, data belum lengkap, pembagi nol) tertulis |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel validasi di `01-requirement.md` memuat teks pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01` sampai `AC-13` bisa diuji dengan UI, uji database, atau review kode |
| 6 | Semua `depends on` berstatus `done` | belum | `PR-006` berstatus `specified` (`backlog.md`), belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Q-01 sampai Q-07 terjawab: `D-33`, `D-43`, `D-50`, `D-51`(f), `D-52`, atau `[USULAN-AGEN]` |
| 8 | Gate fondasi terpenuhi | belum | `FND-001` `done`; `FND-002` sampai `FND-006` `specified`. Item menambah UI, jadi `FND-007` juga relevan |
| 9 | Ukuran masuk akal | lolos | Ukuran M (usulan paket, `D-50`): tiga laporan, rumus efisiensi, dan filter periode |

Bersyarat:

| Kondisi | Status |
|---|---|
| Menyentuh uang | tidak langsung. Laporan membaca nilai HPP dan WIP dari buku besar; tidak memposting jurnal |
| Mengubah stok | tidak. Hanya membaca |
| Menyentuh status dokumen | tidak |
| Melintasi modul | ya. Lewat service core atau read model (`D-25`) |
| Menyentuh data pribadi | tidak. Laporan tidak menampilkan jam per karyawan (hanya total per WO) |

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`: `PR-006` (berstatus `specified`).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Catatan

- Baris 8 (gate fondasi) mengikuti rantai dependensi yang sama. Ia tidak menambah alasan lain.
- Pertentangan `D-43` dan `D-06` untuk laporan persediaan dicatat ke koordinator (`00-discussion.md`).

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Nilai buku besar dan kuantitas `saldo_stok` berbeda karena jeda posting | Laporan persediaan tidak cocok | Uji `AC-03`; `INT-003` memeriksa rekonsiliasi |
| Konfigurasi per gudang tidak diuji di seed satu gudang | Layar dua gudang belum teruji | Uji `AC-13` dengan dua gudang uji |
| Pertentangan `D-43` dan `D-06` | Aturan sumber laporan persediaan tidak tunggal | Dicatat ke koordinator; default ditulis di `01-requirement.md` |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Trust boundary | ya | Parameter periode dan hak akses |
| Preconditions | ya | Periode valid; peran |
| Postconditions | ya | Laporan tidak menulis data |
| Invariants | ya | Angka laporan sama dengan sumber |
| State transition | tidak | Laporan tidak punya status |
| Loop/termination | tidak | Tidak ada algoritma berulang |
| Architecture boundary | ya, dirujuk | `ARCH-08`, `D-25` |

## Handoff boundary

- Parent epic / milestone: `EPIC-PR` / `M1`
- Lane / sequence / predecessor: `active` / `unset` (hybrid) / `PR-006`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` `specified`. Lihat `docs/product/backlog.md` bagian "Fondasi — serial"
- Artifact role / canonical source: `canonical` untuk paket ini
- Next domain: implementasi setelah status `Ready`
- Required input artifacts: `docs/product/items/PR-006-biaya-produksi-dan-hpp/` (`specified`), `docs/product/items/C-009-laporan-keuangan/` (`specified`, bila laporan memakai read model keuangan), `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`
- `01-requirement.md`
- `02-acceptance-criteria.md`
- `04-design-contract.md`
- `05-evidence.md`
- `docs/product/backlog.md`
- `docs/product/epics/EPIC-PR.md`
- `docs/product/decisions.md`
