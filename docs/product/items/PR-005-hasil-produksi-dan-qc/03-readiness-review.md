# PR-005 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: hasil, keputusan QC, dan penerimaan tampil dari UI |
| 2 | Aktor dan izin jelas | lolos | Produksi, QC, Gudang dari matriks v0 (`D-33`); pemisahan tugas `D-48` |
| 3 | Status dan transisi eksplisit | lolos | Status dari `D-46` §5.3 dan aturan keputusan QC (R > 0, L = 0, dan seterusnya) di `01-requirement.md`; jalur gagal dan terminal `REJECTED` tertulis |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel validasi di `01-requirement.md` memuat teks pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01` sampai `AC-14` bisa diuji dengan UI, uji database, `postJournal()`, atau hitung manual |
| 6 | Semua `depends on` berstatus `done` | belum | `PR-002` dan `FND-005` berstatus `specified` (`backlog.md`), belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Q-01 sampai Q-10 terjawab: `D-13`, `D-33`, `D-41`, `D-46`, `D-50`, `D-51`, sumber makalah, atau `[USULAN-AGEN]` |
| 8 | Gate fondasi terpenuhi | belum | `FND-001` `done`; `FND-002` sampai `FND-006` `specified`. Item menambah UI, jadi `FND-007` juga relevan |
| 9 | Ukuran masuk akal | lolos | Ukuran M (usulan paket, `D-50`): tiga keputusan, satu penerimaan, satu laporan kecil. Risiko naik ke L dicatat di bawah |

Bersyarat:

| Kondisi | Status |
|---|---|
| Menyentuh uang | ya. Jurnal barang jadi dan kerugian produksi abnormal; akun `persediaan_barang_jadi`, `barang_dalam_proses`, dan `kerugian_produksi_abnormal` (`D-41`, nomor kerugian saat `FND-006`). Sumber angka: `D-51`(e) dan harga WIP |
| Mengubah stok | ya. Penerimaan barang jadi menaikkan saldo barang jadi; efek di transaksi yang sama (`D-06`). Reject tidak masuk saldo |
| Menyentuh status dokumen | ya. Status WO dan keputusan QC; siapa mengubah: QC untuk keputusan, Gudang untuk penerimaan (`D-33`); jejak `D-08` |
| Melintasi modul | ya. Lewat `core/inventory` dan `core/ledger`; nilai WIP dari modul Produksi (lihat Risiko) |
| Menyentuh data pribadi | tidak |

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`: `PR-002` dan `FND-005` (keduanya `specified`).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Catatan

- Baris 8 (gate fondasi) mengikuti rantai dependensi yang sama. Ia tidak menambah alasan lain.
- Dependensi tersirat ke `PR-004` (nilai WIP per WO) tidak tercantum di `backlog.md`. Lihat Risiko. Front-matter tetap sesuai backlog; keputusan ada di koordinator.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Dependensi tersirat ke `PR-004`: nilai WIP per WO dan konfirmasi pemakaian berasal dari `PR-004`, tetapi `backlog.md` hanya mencantumkan `PR-002` dan `FND-005` | Penerimaan dan kerugian tidak punya nilai WIP sebelum `PR-004` selesai | Dicatat ke koordinator sebagai pertentangan dengan backlog. Backlog tidak diubah pada tugas ini; koordinator memutuskan apakah `PR-004` masuk `depends on` |
| Kerugian dan nilai per unit memakai biaya yang masih berubah (TKL dan overhead) | Angka sementara berbeda dengan final | Penyesuaian final di `PR-006` (`D-43`, `D-44`) |
| Keputusan QC dengan rework dan lulus sekaligus (aturan `[USULAN-AGEN]`) | Layar QC bisa membingungkan | Uji `AC-11`; koordinator mengunci aturan |
| Ukuran naik ke L bila rework menambah alur baru | Item sulit selesai dalam satu track | Pecah bisa dipertimbangkan setelah implementasi awal; tidak dipecah sekarang |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Trust boundary | ya | Input hasil dan keputusan QC |
| Preconditions | ya | Peran QC, status WO, jumlah cocok |
| Postconditions | ya | Stok dan WIP berubah dalam satu transaksi |
| Invariants | ya | Reject ≤ toleransi diserap; saldo sama dengan mutasi; L + R + J = D |
| State transition | ya | Status WO dan keputusan QC (`D-46`) |
| Loop/termination | tidak | Tidak ada algoritma berulang |
| Architecture boundary | ya, dirujuk | `ARCH-03`, `ARCH-04`, `D-25` |

## Handoff boundary

- Parent epic / milestone: `EPIC-PR` / `M1`
- Lane / sequence / predecessor: `active` / `unset` (hybrid) / `PR-002` dan `FND-005`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` `specified`. Lihat `docs/product/backlog.md` bagian "Fondasi — serial"
- Artifact role / canonical source: `canonical` untuk paket ini
- Next domain: implementasi setelah status `Ready`
- Required input artifacts: `docs/product/items/PR-002-perintah-produksi/` (`specified`), `docs/product/items/PR-001-bom-berversi-dan-toleransi/` (toleransi), `docs/product/items/PR-004-pemakaian-bahan-dan-wip/` (nilai WIP, tersirat; lihat Risiko), `docs/product/items/FND-005-inventory-mutasi-saldo-valuasi/` (`specified`), `docs/product/items/FND-006-ledger-coa-jurnal-periode/` (`specified`), `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
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
