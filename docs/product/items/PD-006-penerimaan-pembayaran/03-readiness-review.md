# PD-006 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: catat, verifikasi, alokasi, sisa faktur dari UI |
| 2 | Aktor dan izin jelas | lolos | Finance mencatat, Accounting memverifikasi (`D-33`); pencatat tidak memverifikasi (`D-48`) |
| 3 | Status dan transisi eksplisit | lolos | status penerimaan dan status faktur turunan, termasuk pembatalan dan jalur gagal |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | 9 kondisi gagal dengan pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01`..`AC-16` dengan langkah dan pemeriksaan jurnal |
| 6 | Semua `depends on` berstatus `done` | belum | `PD-005` dan `FND-006` masih `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 6 pertanyaan, 0 terbuka; `PQ-02`, `PQ-03`, `PQ-06` `[USULAN-AGEN]`; `PQ-01`, `PQ-04`, `PQ-05` keputusan terkunci |
| 8 | Gate fondasi terpenuhi | belum | `FND-002`–`FND-006` dan `FND-007` belum `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran `M` (`D-50`: ukuran memakai usulan di paket): satu penerimaan dengan alokasi tertua dulu |

Kriteria bersyarat:

| Kondisi | Status | Catatan |
|---|---|---|
| Menyentuh uang | lolos | Dr `kas_bank` / Cr `piutang_usaha` (`D-35`, `D-41`); sumber angka: nominal penerimaan dan sisa faktur |
| Mengubah stok | tidak berlaku | |
| Menyentuh status dokumen | lolos | Finance dan Accounting; jejak `riwayat_status` (`D-08`) |
| Melintasi modul | lolos | `core/ledger`, `core/dokumen`; tidak membaca tabel lain |
| Menyentuh data pribadi | tidak | nomor referensi transfer bukan data pribadi |

## Ringkasan pertanyaan terbuka

Total 6 pertanyaan. Terjawab 6 · terjawab sebagian 0 · terbuka 0. Rincian di `00-discussion.md`. Status sebelumnya: 1 terjawab, 4 sebagian, 1 terbuka.

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`. Daftar: `PD-005` dan `FND-006` (langsung); gate fondasi `FND-002`–`FND-005` dan `FND-007` (primitive UI), yang menjadi prasyarat dependensi tersebut.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Hal | Jenis | Pemilik |
|---|---|---|
| `PD-005` selesai | dependensi | tech lead |
| `FND-006` selesai | dependensi | tech lead |
| Gate `FND-002`–`FND-005`, `FND-007` | gate | tech lead |

## Usulan terkunci (menunggu koordinator)

| ID | Usulan | Dasar |
|---|---|---|
| `PQ-02` | total alokasi = nominal; tanpa selisih otomatis | `D-49` |
| `PQ-03` | metode Transfer dan Giro saja; referensi teks | `D-41` tanpa akun kas tunai |
| `PQ-05` | penerimaan `DICATAT` tidak berjurnal; verifikasi memposting | `D-43`, makalah |
| `PQ-06` | pembatalan `TERVERIFIKASI` lewat jurnal pembalik | `D-35`, `D-48` |

## Readiness status

Belum `Ready`. Verdict `Blocked` karena dependensi.

## Handoff boundary

- Parent epic / milestone: `EPIC-PD` / `M1`
- Lane / sequence / predecessor: `active`, graph track PD-C, level 5. Predecessor: `PD-005`, `FND-006`.
- Foundation status / evidence: `partial` (`backlog.md`).
- Artifact role / canonical source: canonical
- Next domain: `quick-dev` setelah `Ready`.
- Required input artifacts: `docs/product/decisions.md` (`D-07`, `D-08`, `D-33`, `D-35`, `D-41`, `D-43`, `D-44`, `D-48`, `D-49`).
- Implementation plan: `Not created`

## Links

- `docs/product/items/PD-006-penerimaan-pembayaran/00-discussion.md`
- `docs/product/items/PD-006-penerimaan-pembayaran/01-requirement.md`
- `docs/product/items/PD-006-penerimaan-pembayaran/02-acceptance-criteria.md`
- `docs/product/items/PD-006-penerimaan-pembayaran/04-design-contract.md`
- `docs/product/items/PD-006-penerimaan-pembayaran/05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-PD.md`
