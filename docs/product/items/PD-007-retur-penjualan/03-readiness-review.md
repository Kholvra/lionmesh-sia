# PD-007 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: ajukan, setujui, QC, stok masuk, kredit memo dari UI |
| 2 | Aktor dan izin jelas | lolos | pengaju (Penjualan/Gudang), Accounting menyetujui (`D-49`), QC mencatat (`D-33`); pengaju tidak menyetujui (`D-48`) |
| 3 | Status dan transisi eksplisit | lolos | tabel States: `DIAJUKAN`, `DISETUJUI`, `DITOLAK`, `DIBATALKAN`, `SELESAI`, dengan jalur gagal |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | 11 kondisi gagal dengan pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01`..`AC-14`; setiap AC punya langkah dan pemeriksaan stok atau jurnal |
| 6 | Semua `depends on` berstatus `done` | belum | `PD-005` dan `FND-005` masih `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 8 pertanyaan, 0 terbuka; `PQ-01`..`PQ-04`, `PQ-06`, `PQ-08` `[USULAN-AGEN]`; `PQ-05`, `PQ-07` keputusan terkunci |
| 8 | Gate fondasi terpenuhi | belum | `FND-002`–`FND-006` dan `FND-007` belum `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran `M` (`D-50`: ukuran memakai usulan di paket): satu alur dengan QC dan kredit memo |

Kriteria bersyarat:

| Kondisi | Status | Catatan |
|---|---|---|
| Menyentuh uang | lolos | kredit memo: Dr `penjualan`, Dr `ppn_keluaran`, Cr `piutang_usaha`; pembalik HPP: Dr `persediaan_barang_jadi`, Cr `hpp` (`D-41`, `D-44`); sumber angka: qty lulus, harga baris faktur asal, T faktur asal, harga rata (`D-10`) |
| Mengubah stok | lolos | arah masuk (+qty lulus) setelah QC; efek `saldo_stok`: qty dan nilai bertambah pada harga rata saat retur |
| Menyentuh status dokumen | lolos | pengaju, Accounting, QC per aksi; jejak `riwayat_status` (`D-08`) |
| Melintasi modul | lolos | `core/inventory`, `core/ledger`, `core/dokumen`; tidak membaca tabel lain |
| Menyentuh data pribadi | tidak | |

## Ringkasan pertanyaan terbuka

Total 8 pertanyaan. Terjawab 8 · terjawab sebagian 0 · terbuka 0. Rincian di `00-discussion.md`. Status sebelumnya: 0 terjawab, 2 sebagian, 6 terbuka.

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`. Daftar: `PD-005` dan `FND-005` (langsung); gate fondasi `FND-002`–`FND-004`, `FND-006`, dan `FND-007` (primitive UI), yang menjadi prasyarat dependensi tersebut.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Hal | Jenis | Pemilik |
|---|---|---|
| `PD-005` selesai | dependensi | tech lead |
| `FND-005` selesai | dependensi | tech lead |
| Gate `FND-002`–`FND-004`, `FND-006`, `FND-007` | gate | tech lead |

## Usulan terkunci (menunggu koordinator)

| ID | Usulan | Dasar |
|---|---|---|
| `PQ-01` | tanpa ambang nominal, satu level Accounting | `D-49`, `D-37` |
| `PQ-02` | kredit memo mengurangi sisa faktur asal; tanpa saldo kredit | `D-49` |
| `PQ-03` | QC mencatat; gagal = `DITOLAK` tanpa stok dan tanpa kredit | `D-33`, `D-47` |
| `PQ-04` | `D-15` berlaku: selisih tidak otomatis | `EPIC-PD`, `D-15` |
| `PQ-06` | akun retur memakai peran yang sudah ada | `D-41` |
| `PQ-08` | nilai stok masuk = harga rata saat retur | `D-10` |

## Readiness status

Belum `Ready`. Verdict `Blocked` karena dependensi.

## Handoff boundary

- Parent epic / milestone: `EPIC-PD` / `M1`
- Lane / sequence / predecessor: `active`, graph track PD-C, level 5. Predecessor: `PD-005`, `FND-005`.
- Foundation status / evidence: `partial` (`backlog.md`).
- Artifact role / canonical source: canonical
- Next domain: `quick-dev` setelah `Ready`.
- Required input artifacts: `docs/product/decisions.md` (`D-01`, `D-06`, `D-07`, `D-10`, `D-13`, `D-15`, `D-33`, `D-41`, `D-44`, `D-48`, `D-49`).
- Implementation plan: `Not created`

## Links

- `docs/product/items/PD-007-retur-penjualan/00-discussion.md`
- `docs/product/items/PD-007-retur-penjualan/01-requirement.md`
- `docs/product/items/PD-007-retur-penjualan/02-acceptance-criteria.md`
- `docs/product/items/PD-007-retur-penjualan/04-design-contract.md`
- `docs/product/items/PD-007-retur-penjualan/05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-PD.md`
