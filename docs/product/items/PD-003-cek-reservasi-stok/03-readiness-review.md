# PD-003 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: qty diminta, tersedia, teralokasi, dan status pesanan dari UI |
| 2 | Aktor dan izin jelas | lolos | Gudang (`D-33`: "Cek & alokasi stok"); sistem untuk status turunan; Penjualan hanya membaca |
| 3 | Status dan transisi eksplisit | lolos | status alokasi (`teralokasi`, `dilepas`) dan status pesanan (`MENUNGGU_STOK`, `SIAP_KIRIM`) dengan jalur gagal |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | 8 kondisi gagal dengan pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01`..`AC-13`; setiap AC punya langkah dan pemeriksaan saldo |
| 6 | Semua `depends on` berstatus `done` | belum | `C-011`, `FND-005`, dan `PD-002` masih `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 6 pertanyaan, 0 terbuka; `PQ-03` dan `PQ-04` `[USULAN-AGEN]`, sisanya keputusan terkunci |
| 8 | Gate fondasi terpenuhi | belum | `FND-002`–`FND-006` dan `FND-007` belum `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran `M` (`D-50`: ukuran memakai usulan di paket): satu layar dan satu aksi alokasi dengan pelepasan |

Kriteria bersyarat:

| Kondisi | Status | Catatan |
|---|---|---|
| Menyentuh uang | tidak berlaku | alokasi tidak membentuk jurnal |
| Mengubah stok | lolos | arah alokasi: tidak ada mutasi. Efek `saldo_stok`: nol; efek "tersedia": − qty alokasi. Pelepasan (`PD-002`, `PD-004`): tersedia + qty lepas |
| Menyentuh status dokumen | lolos | status pesanan dari alokasi oleh Gudang atau sistem; jejak `riwayat_status` (`D-08`) |
| Melintasi modul | lolos | tabel `alokasi_stok` di `core/inventory` (`D-31`); modul memakai service core |
| Menyentuh data pribadi | tidak | |

## Ringkasan pertanyaan terbuka

Total 6 pertanyaan. Terjawab 6 · terjawab sebagian 0 · terbuka 0. Rincian di `00-discussion.md`. Status sebelumnya: 1 terjawab, 3 sebagian, 2 terbuka.

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`. Daftar: `C-011`, `FND-005`, dan `PD-002` (langsung); gate fondasi `FND-002`–`FND-006` dan `FND-007` (primitive UI), yang menjadi prasyarat dependensi tersebut.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Hal | Jenis | Pemilik |
|---|---|---|
| `C-011` selesai | dependensi | tech lead |
| `FND-005` selesai | dependensi | tech lead |
| `PD-002` selesai | dependensi | tech lead |
| Gate `FND-002`–`FND-006`, `FND-007` | gate | tech lead |

## Usulan terkunci (menunggu koordinator)

| ID | Usulan | Dasar |
|---|---|---|
| `PQ-03` | alokasi parsial diizinkan; stok masuk tidak otomatis | `analisis-sia.md` UC-PD04 (makalah), `D-46` |
| `PQ-04` | first-come; sisa dipotong, bukan ditolak total | tanpa sumber; konsisten `INV-01` |

## Readiness status

Belum `Ready`. Verdict `Blocked` karena dependensi.

## Handoff boundary

- Parent epic / milestone: `EPIC-PD` / `M1`
- Lane / sequence / predecessor: `active`, graph track PD-B, level 1. Predecessor: `C-011`, `FND-005`, `PD-002`.
- Foundation status / evidence: `partial` (`backlog.md`).
- Artifact role / canonical source: canonical
- Next domain: `quick-dev` setelah `Ready`.
- Required input artifacts: `docs/product/decisions.md` (`D-06`, `D-25`, `D-31`, `D-46`, `D-52`), `docs/product/backlog.md`.
- Implementation plan: `Not created`

## Links

- `docs/product/items/PD-003-cek-reservasi-stok/00-discussion.md`
- `docs/product/items/PD-003-cek-reservasi-stok/01-requirement.md`
- `docs/product/items/PD-003-cek-reservasi-stok/02-acceptance-criteria.md`
- `docs/product/items/PD-003-cek-reservasi-stok/04-design-contract.md`
- `docs/product/items/PD-003-cek-reservasi-stok/05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-PD.md`
