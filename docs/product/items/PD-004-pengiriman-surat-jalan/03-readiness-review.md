# PD-004 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: kirim, stok keluar, surat jalan, bukti terima dari UI |
| 2 | Aktor dan izin jelas | lolos | Gudang dan Pengiriman (`D-33`); pembuat pesanan dilarang mengirim (`D-42`); pelanggan tanpa akun |
| 3 | Status dan transisi eksplisit | lolos | status pengiriman (`DRAFT`, `DIKIRIM`, `DITERIMA`, `DIBATALKAN`) dan status pesanan (`D-46`), termasuk jalur gagal |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | 11 kondisi gagal dengan pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01`..`AC-12`; dibuktikan dengan UI, basis data, dan skrip inventory |
| 6 | Semua `depends on` berstatus `done` | belum | `PD-002` dan `PD-003` masih `specified` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 7 pertanyaan, 0 terbuka; `PQ-02`, `PQ-03`, `PQ-05`, `PQ-06` `[USULAN-AGEN]` |
| 8 | Gate fondasi terpenuhi | belum | `FND-002`–`FND-006` dan `FND-007` belum `done` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | ukuran `M` (`D-50`: ukuran memakai usulan di paket): satu aksi kirim dengan efek stok dan status |

Kriteria bersyarat:

| Kondisi | Status | Catatan |
|---|---|---|
| Menyentuh uang | lolos | nilai keluar = qty × harga rata (`D-10`); jurnal HPP di `PD-008` (Dr `hpp` / Cr `persediaan_barang_jadi`, `D-44` (3), `D-41`); sumber angka: `saldo_stok` |
| Mengubah stok | lolos | arah keluar (−qty); efek `saldo_stok`: qty dan nilai berkurang; alokasi dilepas |
| Menyentuh status dokumen | lolos | pengiriman dan pesanan; siapa: Gudang/Pengiriman, bukan pembuat pesanan; jejak `riwayat_status` (`D-08`) |
| Melintasi modul | lolos | `core/inventory`, `core/dokumen`; tidak membaca tabel lain |
| Menyentuh data pribadi | tidak | nama penerima pada bukti terima adalah nama pihak pelanggan; tidak diklasifikasi sebagai data pribadi tersendiri di item ini |

## Ringkasan pertanyaan terbuka

Total 7 pertanyaan. Terjawab 7 · terjawab sebagian 0 · terbuka 0. Rincian di `00-discussion.md`. Status sebelumnya: 2 terjawab, 2 sebagian, 3 terbuka.

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`. Daftar: `PD-002` dan `PD-003` (langsung); gate fondasi `FND-002`–`FND-006` dan `FND-007` (primitive UI), yang menjadi prasyarat dependensi tersebut.

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Hal | Jenis | Pemilik |
|---|---|---|
| `PD-002` selesai | dependensi | tech lead |
| `PD-003` selesai | dependensi | tech lead |
| Gate `FND-002`–`FND-006`, `FND-007` | gate | tech lead |

## Usulan terkunci (menunggu koordinator)

| ID | Usulan | Dasar |
|---|---|---|
| `PQ-02` | jumlah pengiriman tidak dibatasi; qty kumulatif ≤ qty pesanan | `D-46` |
| `PQ-03` | bukti terima = tanggal + nama penerima, tanpa berkas | makalah tanpa tabel lampiran pengiriman |
| `PQ-05` | qty kirim ≤ alokasi aktif baris | `PD-003` |
| `PQ-06` | pengiriman `DIKIRIM` tidak dibatalkan; koreksi via retur | `D-48` |

## Readiness status

Belum `Ready`. Verdict `Blocked` karena dependensi.

## Handoff boundary

- Parent epic / milestone: `EPIC-PD` / `M1`
- Lane / sequence / predecessor: `active`, graph track PD-B, level 3. Predecessor: `PD-002`, `PD-003`.
- Foundation status / evidence: `partial` (`backlog.md`).
- Artifact role / canonical source: canonical
- Next domain: `quick-dev` setelah `Ready`.
- Required input artifacts: `docs/product/decisions.md` (`D-06`, `D-08`, `D-10`, `D-33`, `D-41`, `D-42`, `D-44`, `D-46`, `D-47(b)`, `D-48`, `D-50`).
- Implementation plan: `Not created`

## Links

- `docs/product/items/PD-004-pengiriman-surat-jalan/00-discussion.md`
- `docs/product/items/PD-004-pengiriman-surat-jalan/01-requirement.md`
- `docs/product/items/PD-004-pengiriman-surat-jalan/02-acceptance-criteria.md`
- `docs/product/items/PD-004-pengiriman-surat-jalan/04-design-contract.md`
- `docs/product/items/PD-004-pengiriman-surat-jalan/05-evidence.md`
- `docs/product/backlog.md`, `docs/product/epics/EPIC-PD.md`
