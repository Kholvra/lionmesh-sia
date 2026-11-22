# PD-005 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: terbit, nilai, jatuh tempo, umur dari UI |
| 2 | Aktor dan izin jelas | lolos | Accounting terbit dan batal; Manajemen melihat piutang; Penjualan tidak (`D-33`) |
| 3 | Status dan transisi eksplisit | lolos | tabel States termasuk pembatalan dan jalur gagal |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | 10 kondisi gagal dengan pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01`..`AC-15`; nilai PPN dinyatakan T dan dibuktikan dengan uji unit |
| 6 | Semua `depends on` berstatus `done` | belum | `PD-004` dan `FND-006` masih `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 8 pertanyaan, 0 terbuka; `PQ-01`, `PQ-03`, `PQ-05`, `PQ-08` `[USULAN-AGEN]`; `PQ-02` mekanisme D-51 |
| 8 | Gate fondasi terpenuhi | belum | `FND-002`–`FND-006` dan `FND-007` belum `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran `L` (`D-50`: ukuran memakai usulan di paket): faktur, pajak per baris, aging, pembatalan, dan pemicu jurnal |

Kriteria bersyarat:

| Kondisi | Status | Catatan |
|---|---|---|
| Menyentuh uang | lolos | Dr `piutang_usaha` total / Cr `penjualan` DPP / Cr `ppn_keluaran` PPN (`D-44` (3), `D-41`); sumber angka: qty kirim, harga dan diskon baris pesanan, T dari `konfigurasi_pajak` (`D-51(a)`) |
| Mengubah stok | tidak berlaku | faktur tidak mengubah stok |
| Menyentuh status dokumen | lolos | Accounting; jejak `riwayat_status` (`D-08`); pesanan `DIFAKTURKAN` dari faktur |
| Melintasi modul | lolos | `core/ledger` (`postJournal`), `core/dokumen`; tidak membaca tabel modul lain |
| Menyentuh data pribadi | lolos | field NPWP dan alamat pelanggan bersifat nullable (`PD-001` `PQ-04`); dibaca Accounting dan Manajemen |

## Ringkasan pertanyaan terbuka

Total 8 pertanyaan. Terjawab 8 · terjawab sebagian 0 · terbuka 0. Rincian di `00-discussion.md`. Status sebelumnya: 3 terjawab, 2 sebagian, 3 terbuka.

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`. Daftar: `PD-004` dan `FND-006` (langsung); gate fondasi `FND-002`–`FND-005` dan `FND-007` (primitive UI), yang menjadi prasyarat dependensi tersebut.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Hal | Jenis | Pemilik |
|---|---|---|
| `PD-004` selesai | dependensi | tech lead |
| `FND-006` selesai (peran akun, `postJournal`, periode) | dependensi | tech lead |
| Gate `FND-002`–`FND-005`, `FND-007` | gate | tech lead |

## Usulan terkunci (menunggu koordinator)

| ID | Usulan | Dasar |
|---|---|---|
| `PQ-01` | satu faktur per pengiriman; faktur dari `DIKIRIM`; pesanan `DIFAKTURKAN` bila semua pengiriman terfaktur | `D-49`, `D-46`, `D-47(b)` |
| `PQ-03` | nomor faktur pajak wajib saat terbit, tanpa validasi format | `D-51(a)`, `D-24` |
| `PQ-05` | umur = hari lewat jatuh tempo | label bucket `D-51(f)` |
| `PQ-08` | batal faktur hanya tanpa pembayaran; pengiriman dapat difakturkan ulang | `D-35`, `D-48` |

## Pertentangan untuk koordinator

- `D-51(a)` meminta verifikasi tarif "saat `PD-005` ditulis"; instruksi paket meminta verifikasi "saat implementasi". Nilai tarif tidak ditulis di paket.

## Readiness status

Belum `Ready`. Verdict `Blocked` karena dependensi.

## Handoff boundary

- Parent epic / milestone: `EPIC-PD` / `M1`
- Lane / sequence / predecessor: `active`, graph track PD-C, level 4. Predecessor: `PD-004`, `FND-006`.
- Foundation status / evidence: `partial` (`backlog.md`).
- Artifact role / canonical source: canonical
- Next domain: `quick-dev` setelah `Ready`.
- Required input artifacts: `docs/product/decisions.md` (`D-07`, `D-08`, `D-14`, `D-17`, `D-24`, `D-35`, `D-41`, `D-43`, `D-44`, `D-49`, `D-51`).
- Implementation plan: `Not created`

## Links

- `docs/product/items/PD-005-faktur-piutang/00-discussion.md`
- `docs/product/items/PD-005-faktur-piutang/01-requirement.md`
- `docs/product/items/PD-005-faktur-piutang/02-acceptance-criteria.md`
- `docs/product/items/PD-005-faktur-piutang/04-design-contract.md`
- `docs/product/items/PD-005-faktur-piutang/05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-PD.md`
