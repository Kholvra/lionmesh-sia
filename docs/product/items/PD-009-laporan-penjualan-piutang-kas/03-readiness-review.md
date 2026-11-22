# PD-009 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: tiga laporan di layar dengan angka yang bisa dicocokkan |
| 2 | Aktor dan izin jelas | lolos | Penjualan (penjualan), Accounting dan Manajemen (ketiganya; kas `[USULAN-AGEN]`) per `D-33` |
| 3 | Status dan transisi eksplisit | lolos | laporan tidak punya status; jalur gagal (periode kosong, periode masa depan, izin) ada |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | 5 kondisi gagal dengan pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01`..`AC-12`; setiap AC punya langkah dan pembanding buku besar atau jurnal |
| 6 | Semua `depends on` berstatus `done` | belum | `C-009`, `PD-005`, `PD-006`, `PD-007` masih `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 6 pertanyaan, 0 terbuka; `PQ-05` `[USULAN-AGEN]` untuk akses kas; sisanya keputusan terkunci |
| 8 | Gate fondasi terpenuhi | belum | `FND-002`–`FND-006` dan `FND-007` belum `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran `M` (`D-50`: ukuran memakai usulan di paket): tiga laporan baca, tanpa tabel baru |

Kriteria bersyarat:

| Kondisi | Status | Catatan |
|---|---|---|
| Menyentuh uang | lolos (baca) | laporan hanya membaca; angka sama dengan buku besar (`D-43`); tidak membuat jurnal |
| Mengubah stok | tidak | |
| Menyentuh status dokumen | tidak | |
| Melintasi modul | lolos | kas dan jurnal lintas siklus lewat service core (`D-25`, `D-43`); faktur, penerimaan, retur dari modul Pendapatan sendiri |
| Menyentuh data pribadi | tidak | nama pelanggan pada laporan hanya tampil bagi peran yang berhak |

## Ringkasan pertanyaan terbuka

Total 6 pertanyaan. Terjawab 6 · terjawab sebagian 0 · terbuka 0. Rincian di `00-discussion.md`. Status sebelumnya: 2 terjawab, 1 sebagian, 3 terbuka.

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`. Daftar: `C-009`, `PD-005`, `PD-006`, `PD-007` (langsung); gate fondasi `FND-002`–`FND-006` dan `FND-007` (primitive UI), yang menjadi prasyarat dependensi tersebut.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Hal | Jenis | Pemilik |
|---|---|---|
| `C-009` selesai | dependensi | tech lead |
| `PD-005`, `PD-006`, `PD-007` selesai | dependensi | tech lead |
| Gate `FND-002`–`FND-006`, `FND-007` | gate | tech lead |

## Usulan terkunci (menunggu koordinator)

| ID | Usulan | Dasar |
|---|---|---|
| `PQ-05` (kas) | Accounting dan Manajemen melihat laporan kas | `D-33` (pola "Lihat piutang") |
| Tafsir umur | umur = hari lewat jatuh tempo (`PD-005`) | label bucket `D-51(f)` |

## Readiness status

Belum `Ready`. Verdict `Blocked` karena dependensi.

## Handoff boundary

- Parent epic / milestone: `EPIC-PD` / `M1`
- Lane / sequence / predecessor: `active`, graph track PD-D, level 6. Predecessor: `PD-005`–`PD-007`, `C-009`.
- Foundation status / evidence: `partial` (`backlog.md`).
- Artifact role / canonical source: canonical
- Next domain: `quick-dev` setelah `Ready`.
- Required input artifacts: `docs/product/decisions.md` (`D-25`, `D-33`, `D-43`, `D-50`, `D-51(f)`), `ARCH-001` `ARCH-08`.
- Implementation plan: `Not created`

## Links

- `docs/product/items/PD-009-laporan-penjualan-piutang-kas/00-discussion.md`
- `docs/product/items/PD-009-laporan-penjualan-piutang-kas/01-requirement.md`
- `docs/product/items/PD-009-laporan-penjualan-piutang-kas/02-acceptance-criteria.md`
- `docs/product/items/PD-009-laporan-penjualan-piutang-kas/04-design-contract.md`
- `docs/product/items/PD-009-laporan-penjualan-piutang-kas/05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-PD.md`
