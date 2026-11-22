# PR-003 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: kebutuhan, cek stok, status WO, dan permintaan tampil dari UI |
| 2 | Aktor dan izin jelas | lolos | Produksi, Gudang, Purchasing, Manajemen dari matriks v0 (`D-33`); pemisahan tugas `D-42`; mesin approval `D-37` |
| 3 | Status dan transisi eksplisit | lolos | Status permintaan dari `D-46` §5.2 dan status WO dari §5.3, termasuk jalur gagal (`DITOLAK` → `DIBATALKAN`, `REVISI`); pembatalan tidak ditambah (`D-47` (d)) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel validasi di `01-requirement.md` memuat teks pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01` sampai `AC-12` bisa diuji dengan UI, uji stok, uji service, atau review kode |
| 6 | Semua `depends on` berstatus `done` | belum | `PR-002` dan `C-013` berstatus `specified` (`backlog.md`), belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Q-01 sampai Q-09 terjawab: `D-33`, `D-37`, `D-46`, `D-47`, `D-50`, `D-52`, sumber makalah, atau `[USULAN-AGEN]` |
| 8 | Gate fondasi terpenuhi | belum | `FND-001` `done`; `FND-002` sampai `FND-006` `specified`. Item menambah UI, jadi `FND-007` juga relevan |
| 9 | Ukuran masuk akal | lolos | Ukuran M (usulan paket, `D-50`): hitung kebutuhan, cek stok, dan membuat permintaan. Approval sudah di `FND-004` |

Bersyarat:

| Kondisi | Status |
|---|---|
| Menyentuh uang | tidak |
| Mengubah stok | tidak. Hanya membaca stok |
| Menyentuh status dokumen | ya. Status WO dan permintaan; siapa mengubah dan jejak: `D-08`, `01-requirement.md` bagian Status |
| Melintasi modul | ya. Lewat `core/pengadaan` (`ajukanPR`) dan `core/inventory` (baca saldo); tidak menyebut modul Pengeluaran |
| Menyentuh data pribadi | tidak |

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`: `PR-002` dan `C-013` (keduanya `specified`).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Catatan

- Baris 8 (gate fondasi) mengikuti rantai dependensi yang sama. Ia tidak menambah alasan lain.
- Asumsi permintaan dari `DIRENCANAKAN` pada versi sebelumnya dikoreksi ke `BAHAN_KURANG` (`D-46` §5.3).

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Stok tersedia tidak menghitung reservasi penjualan (`PD-003`) | Dua modul bisa menjanjikan bahan yang sama | Koordinator memastikan `PD-003` memakai aturan tersedia yang sama; dicatat untuk `INT-003` |
| Rumus kebutuhan berbeda dengan praktik nyata | Jumlah bahan yang diajukan salah | Nilai toleransi berversi (`D-51`) dan uji dengan data uji |
| Pembatalan permintaan tidak ada (`D-47` (d)) vs `D-48` (pemohon boleh membatalkan) | Pengaju tidak bisa menarik permintaan yang keliru | Dicatat ke koordinator sebagai pertentangan; default `REVISI` dipakai sampai diputuskan |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Trust boundary | ya | Input dan identitas aktor |
| Preconditions | ya | Status WO, BOM, peran, satu permintaan aktif |
| Postconditions | ya | Permintaan tercatat dengan `wo_id` dan selisih |
| Invariants | ya | Tidak ada mutasi stok dari item ini; PR ditolak tidak jadi PO |
| State transition | ya, ringkas | Status WO terkait (`D-46` §5.3) |
| Loop/termination | tidak | Tidak ada algoritma berulang |
| Architecture boundary | ya, dirujuk | `ARCH-06`, `ARCH-04`, `D-25` |

## Handoff boundary

- Parent epic / milestone: `EPIC-PR` / `M1`
- Lane / sequence / predecessor: `active` / `unset` (hybrid) / `PR-002` dan `C-013`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` `specified`. Lihat `docs/product/backlog.md` bagian "Fondasi — serial"
- Artifact role / canonical source: `canonical` untuk paket ini
- Next domain: implementasi setelah status `Ready`
- Required input artifacts: `docs/product/items/PR-002-perintah-produksi/` (`specified`), `docs/product/items/C-013-domain-pengadaan/` (`specified`), `docs/product/items/PG-003-approval-berjenjang/` (`specified`), `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
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
