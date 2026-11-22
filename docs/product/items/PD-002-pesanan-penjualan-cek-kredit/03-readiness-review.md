# PD-002 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: pesanan dengan baris, total, verifikasi, dan penahanan kredit dari UI |
| 2 | Aktor dan izin jelas | lolos | pembuat, verifikator (bukan pembuat, `PQ-09`), Manajemen (override, tolak) didefinisikan per aksi |
| 3 | Status dan transisi eksplisit | lolos | tabel States memuat setiap transisi, siapa, syarat, riwayat, termasuk jalur gagal (`REVISI`, `DIBATALKAN`) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | 15 kondisi gagal dengan pesan di `01-requirement.md` |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01`..`AC-17`; rumus total memakai T dari konfigurasi, dibuktikan dengan uji unit |
| 6 | Semua `depends on` berstatus `done` | belum | `PD-001` dan `FND-004` masih `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 9 pertanyaan (`PQ-01`..`PQ-09`), 0 terbuka; sisanya `[USULAN-AGEN]` atau keputusan terkunci |
| 8 | Gate fondasi terpenuhi | belum | `FND-002`–`FND-006` dan `FND-007` belum `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran `L` (`D-50`: ukuran memakai usulan di paket): status, diskon, pajak, total, cek kredit, override, pengembalian, pembatalan |

Kriteria bersyarat:

| Kondisi | Status | Catatan |
|---|---|---|
| Menyentuh uang | lolos | total memengaruhi exposure; tidak membentuk jurnal (jurnal di `PD-008`); sumber angka: nilai baris, diskon, tarif T (`D-51(a)`) |
| Mengubah stok | tidak berlaku | pesanan tidak mengubah saldo maupun alokasi (alokasi di `PD-003`) |
| Menyentuh status dokumen | lolos | pembuat, verifikator, Manajemen per aksi; jejak `riwayat_status` (`D-08`) |
| Melintasi modul | lolos | memakai service `core/dokumen` (nomor, status, riwayat) dan service core piutang untuk exposure; tidak membaca tabel modul lain |
| Menyentuh data pribadi | tidak | data pelanggan dibaca lewat `PD-001` |

## Ringkasan pertanyaan terbuka

Total 9 pertanyaan. Terjawab 9 · terjawab sebagian 0 · terbuka 0. Rincian di `00-discussion.md`. Status sebelumnya: 2 terjawab, 4 sebagian, 2 terbuka.

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`. Daftar: `PD-001` dan `FND-004` (langsung); gate fondasi `FND-002`, `FND-003`, `FND-005`, `FND-006` dan `FND-007` (primitive UI), yang menjadi prasyarat dua dependensi itu.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Hal | Jenis | Pemilik |
|---|---|---|
| `PD-001` selesai | dependensi | tech lead |
| `FND-004` selesai | dependensi | tech lead |
| Gate `FND-002`, `FND-003`, `FND-005`, `FND-006`, `FND-007` | gate | tech lead |

## Usulan terkunci (menunggu koordinator)

| ID | Usulan | Dasar |
|---|---|---|
| `PQ-02` | tanpa approval berjenjang nominal untuk pesanan | `D-37`, `D-51(c)` |
| `PQ-03` | diskon per baris, persen | `analisis-sia.md` §8.2 #14 |
| `PQ-04` | harga dari master `C-011`, disalin ke baris | `D-17` |
| `PQ-05` | komposisi exposure dan status terbuka | `D-16`, `D-46` |
| `PQ-06` | pesanan `VERIFIED` dibatalkan, bukan diedit | `D-48` (`D-46` tidak memuat transisi ini) |
| `PQ-09` | verifikator bukan pembuat | `D-48` vs `matriks-izin.md` |

## Pertentangan terbuka untuk koordinator

- `D-47(a)` "dari `VERIFIED`" dibaca literal (lihat `00-discussion.md`).

## Readiness status

Belum `Ready`. Verdict `Blocked` karena dependensi.

## Handoff boundary

- Parent epic / milestone: `EPIC-PD` / `M1`
- Lane / sequence / predecessor: `active`, graph track PD-B, level 2. Predecessor: `PD-001`, `FND-004`.
- Foundation status / evidence: `partial` (`backlog.md`). Gate `FND-001` `done`.
- Artifact role / canonical source: canonical
- Next domain: `quick-dev` setelah `Ready`.
- Required input artifacts: `docs/product/decisions.md` (`D-08`, `D-14`, `D-16`, `D-17`, `D-33`, `D-37`, `D-38`, `D-42`, `D-46`, `D-47`, `D-48`, `D-50`, `D-51`), `docs/product/policies/matriks-izin.md`.
- Implementation plan: `Not created`

## Links

- `docs/product/items/PD-002-pesanan-penjualan-cek-kredit/00-discussion.md`
- `docs/product/items/PD-002-pesanan-penjualan-cek-kredit/01-requirement.md`
- `docs/product/items/PD-002-pesanan-penjualan-cek-kredit/02-acceptance-criteria.md`
- `docs/product/items/PD-002-pesanan-penjualan-cek-kredit/04-design-contract.md`
- `docs/product/items/PD-002-pesanan-penjualan-cek-kredit/05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-PD.md`
