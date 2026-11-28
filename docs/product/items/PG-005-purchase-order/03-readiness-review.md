# PG-005 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: penerbitan PO, PPN per baris, efek nol ke stok dan utang, dan koreksi lewat pembatalan |
| 2 | Aktor dan izin jelas | lolos | matriks v0 (`D-33`): Purchasing menerbitkan dan membatalkan PO. Pemasok tanpa akun (`D-23`) |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | `D-46` untuk jalur PO; pembatalan `D-48` ditandai `[USULAN-AGEN]` dengan pemicu dan siapa. Jalur gagal (setelah penerimaan, permintaan ditolak atau dibatalkan, edit setelah terbit) ada |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | tabel Validasi memuat pesan untuk setiap kondisi gagal. Pesan dari sumber ditandai `[SUMBER]`, sisanya `[USULAN]` dan ikut kunci koordinator |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01 sampai AC-13 punya langkah uji. AC-14 lintas item (`PG-006`) dan disebut eksplisit. Uji PPN memakai seed uji dua versi |
| 6 | Semua `depends on` berstatus `done` | lolos | `PG-003` dan `PG-004` selesai di branch stack yang sama; PR menunggu merge |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 11 pertanyaan: 8 terjawab `D-xx` (dua di antaranya juga punya detail `[USULAN-AGEN]`), 3 terjawab `[USULAN-AGEN]`. Terbuka: 0 |
| 8 | Gate fondasi terpenuhi | lolos | `FND-001`-`FND-009` `done`; gate modul `D-54`/`D-67` terpenuhi |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | lolos | usulan `M` (agen). Penerbitan, PPN per baris, riwayat, dan pembatalan satu track |

## Verdict

`Ready` (2026-11-27)

Dependensi `PG-003` dan `PG-004` selesai di branch stack yang sama; gate fondasi `FND-001`–`FND-009` `done`. Satu data masih kosong: `konfigurasi_pajak` belum berisi tarif, sehingga penerbitan PO ditolak sampai tech lead mengisinya (`D-51`(a)). Bukti implementasi di `05-evidence.md`; bukti database di `docs/tech-debt/pg-005-bukti-db.md`.

## Pertanyaan terbuka (2026-11-22)

Total 11. Terjawab `D-xx`: 8 (Q-04, Q-05, Q-06, Q-07, Q-08, Q-09, Q-10, Q-11; Q-05 dan Q-06 juga punya detail `[USULAN-AGEN]`). Terjawab `[USULAN-AGEN]`: 3 (Q-01, Q-02, Q-03). Terbuka: 0. Rincian ada di `00-discussion.md`.

## Keputusan default `[USULAN-AGEN]` (menunggu kunci koordinator)

| Kode | Keputusan default | Alasan singkat |
|---|---|---|
| Q-01 | PO dikirim di luar sistem oleh Purchasing; tidak ada status kirim | `D-23`, `D-52`, `D-50`; `D-46` tidak memuat status kirim |
| Q-02 | Konfirmasi = catatan teks dengan tanggal; bukan status | `D-46` tidak memuat status konfirmasi |
| Q-03 | Satu PO per permintaan | `D-46` satu jalur; makalah per permintaan (`PG-004` Q-09) |
| Q-05 (detail) | Pembatalan PO sebelum penerimaan pertama dengan alasan; permintaan ikut `DIBATALKAN` | `D-48`; status tidak mundur |
| Q-06 (detail) | PO terbit tidak diedit; koreksi lewat pembatalan lalu permintaan baru, atau jurnal pembalik setelah penerimaan | `D-48`; `[USULAN]` G15 |

## Pertentangan yang ditemukan

- `LAPORAN_PENGERJAAN_PROYEK.txt` langkah 3 dan `diagram-sia-lengkap.md` PG06 menyebut PO memuat "ketentuan pembayaran", sedangkan `D-14` menaruh termin di pemasok dan faktur. `D-14` menang.
- `proses-bisnis.md` §12 memakai status PO `terbuka → selesai`, dikalahkan `D-46`.
- D-64 mengesahkan pembatalan PO oleh Purchasing pembuat sebelum penerimaan pertama dengan alasan wajib.
- `D-48` menyiratkan koreksi setelah diposting lewat jurnal pembalik (`D-35`), tetapi PO belum menghasilkan jurnal. Diartikan sebagai koreksi setelah penerimaan (jurnal di `PG-006`).
- Backlog gate (`FND-007`) menyatakan item dengan primitive UI menunggu `FND-007`, tetapi `depends on` tidak mencantumkannya.
- Format nomor PO: `proses-bisnis.md` memakai `PO-202609-0001`; `D-50` menang.

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `P0` | `analisis-sia.md` §5.3 menandai PG-5 P0 |
| Ukuran | `M` | penerbitan, PPN per baris, riwayat, pembatalan; satu track |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`. Kontrak wajib karena item ini menghitung PPN, memindahkan status dokumen, dan menentukan pembatalan.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Nomor akun PPN masukan belum ada sampai `FND-006` (`D-41`) | `PG-008` tidak bisa memposting | `FND-006` menetapkan nomor sebelum `PG-008` dimulai |
| Tarif PPN belum diverifikasi | total PO salah | `D-51`(a): nilai diverifikasi dan dikutip saat `PD-005`; item ini hanya mekanisme berversi. Uji memakai seed uji |
| Pembatalan PO setelah sebagian diterima | status tidak konsisten | pembatalan hanya sebelum penerimaan pertama; AC-14 lintas item |
| Kanal kirim di luar sistem tidak tercatat | PO dikirim tanpa jejak | catatan konfirmasi (Q-02); keputusan koordinator |

## Readiness status

- Status requirement: `specified`. Paket dibuat, belum `ready`.
- Baris `backlog.md` `specified`.

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: `active`, graph (`D-03`), predecessor `PG-003` dan `PG-004`, serta gate fondasi dan `FND-007`
- Foundation status / evidence: `partial` (lihat `backlog.md` bagian Status fondasi)
- Artifact role / canonical source: `canonical` (`docs/product/items/PG-005-purchase-order/`)
- Next domain: `design-contracts` untuk kontrak yang sudah disiapkan, lalu `quick-dev` setelah `Ready`
- Required input artifacts: `00-discussion.md`, `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `docs/product/backlog.md`
- `docs/product/epics/EPIC-PG.md`
- `docs/product/epics/EPIC-CORE.md` (`C-013`)
- `docs/product/decisions.md` (`D-05`, `D-07`, `D-08`, `D-14`, `D-17`, `D-23`, `D-33`, `D-35`, `D-38`, `D-41`, `D-43`, `D-46`, `D-48`, `D-50`, `D-51`)
- `docs/product/policies/matriks-izin.md` (Pengeluaran: terbitkan PO)
- `docs/product/reference/analisis-sia.md` §6.4, §6.7, §7.2, §8.1, §8.2, §9.2
- `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
