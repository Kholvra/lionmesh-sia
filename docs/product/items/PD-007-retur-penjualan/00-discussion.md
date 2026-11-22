# PD-007 — Diskusi

## Konteks

Pelanggan dapat mengembalikan barang yang sudah dikirim dan difakturkan. `analisis-sia.md` §5.2 (PD-7) menyebut retur, kredit memo, persetujuan, dan stok masuk kembali setelah QC. Item ini adalah track PD-C, level 5, dengan dependensi `PD-005` dan `FND-005`. Prioritas P1 di analisis. Cakupan retur penjualan dipastikan oleh `D-01` (46 fitur) dan `D-49` (aturan retur).

## Actor / consumer

Penjualan atau Gudang mengajukan retur (`D-49` membolehkan dokumen tersendiri; pengajuan oleh Penjualan atau Gudang). Accounting menyetujui (`D-49`). QC memeriksa barang. Accounting menerbitkan kredit memo lewat jurnal.

## Problem

Barang yang dikembalikan pelanggan tidak punya jalur dokumen. Piutang tidak berkurang, stok tidak kembali, dan laporan tidak menunjukkan retur.

## Desired outcome

Retur dibuat dari faktur, disetujui Accounting, diperiksa QC. Jika lulus QC, stok kembali dan kredit memo mengurangi piutang dalam satu transaksi berjurnal.

## Known constraints

- `D-01`: retur penjualan termasuk 46 fitur; tidak dipotong.
- `D-06`, `D-10`: qty dari mutasi, nilai harga rata.
- `D-07`, `D-43`: jurnal lewat `postJournal()`; langsung diposting; tidak bisa diubah.
- `D-08`: riwayat status.
- `D-15`: selisih qty tidak pernah otomatis (dibahas di `PQ-04`).
- `D-33`: Accounting, QC, Penjualan, Gudang per aksi.
- `D-48`: pemohon tidak menyetujui dokumennya sendiri; pembatalan sebelum posting.
- `D-49`: wajib merujuk faktur; qty tidak melebihi yang dikirim; disetujui Accounting; tidak ada saldo kredit.

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka.

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-01` | Siapa menyetujui retur dan adakah ambang nominal? | Terjawab — D-49: disetujui Accounting. Ambang nominal: [USULAN-AGEN] tidak ada; satu level persetujuan untuk semua nilai. Alasan: `D-49` tidak menyebut ambang, dan `D-37` hanya mengatur ambang untuk PR, payroll, dan pemasok. |
| `PQ-02` | Kredit memo: mengurangi faktur berikutnya, dikembalikan sebagai uang, atau saldo kredit? | Terjawab — [USULAN-AGEN]: kredit memo mengurangi sisa faktur asal, tanpa saldo kredit dan tanpa pengembalian uang (`D-49`). Nilai retur tidak boleh melebihi sisa faktur asal; bila faktur asal sudah lunas, retur ditolak sampai ada alur pengembalian dana. PPN retur memakai tarif yang dipakai faktur asal. |
| `PQ-03` | Siapa QC retur dan apa yang terjadi pada barang yang gagal QC? | Terjawab — [USULAN-AGEN]: QC (peran `QC`, `D-33`) mencatat hasil. Retur gagal QC menjadi `DITOLAK` dengan alasan; barang tidak masuk stok dan tidak dikreditkan; tindak lanjut fisik di luar sistem. Alasan: tidak ada status baru di luar daftar (`D-47`). |
| `PQ-04` | Apakah `D-15` berlaku untuk retur? | Terjawab — [USULAN-AGEN]: berlaku. Qty lulus QC dicatat apa adanya; selisih antara qty disetujui dan qty lulus tidak disesuaikan otomatis: bagian yang tidak lulus tidak masuk stok dan tidak dikreditkan. Alasan: prinsip `EPIC-PD` dan `D-15`. |
| `PQ-05` | Retur wajib merujuk faktur dan pengiriman asal? Qty tidak boleh melebihi terkirim? | Terjawab — D-49: retur wajib merujuk faktur asal; jumlah retur kumulatif per baris tidak melebihi qty yang dikirim. |
| `PQ-06` | Akun jurnal retur? | Terjawab — [USULAN-AGEN]: tanpa akun baru. Kredit memo: Dr `penjualan` (DPP retur), Dr `ppn_keluaran` (PPN retur), Cr `piutang_usaha` (total). Pengembalian stok: Dr `persediaan_barang_jadi`, Cr `hpp` (nilai stok masuk). Semua memakai peran yang sudah ada di `D-41`. |
| `PQ-07` | Apakah "retur hanya untuk bahan" (`D-13`) membatasi retur penjualan? | Terjawab — D-13 dibaca sebagai batasan retur reject produksi (retur ke pemasok); retur penjualan diatur secara eksplisit oleh D-49 dan termasuk cakupan `D-01`. |
| `PQ-08` | Nilai stok masuk kembali: harga rata saat retur atau saat pengiriman asal? | Terjawab — [USULAN-AGEN]: harga rata saat retur (`D-10`), qty lulus × harga rata. Alasan: rata-rata bergerak tidak melacak lapisan asal; selisih terhadap HPP asal diterima sebagai konsekuensi metode. |

## Decisions

| ID | Decision | Sumber | Consequence |
|---|---|---|---|
| `D-06`, `D-10` | qty dan nilai stok | decisions.md | retur masuk sebagai mutasi |
| `D-15` | selisih tidak otomatis | decisions.md; diterapkan `PQ-04` | tidak ada penyesuaian diam-diam |
| `D-49` | aturan retur | decisions.md | faktur wajib; qty ≤ dikirim; Accounting menyetujui |

## Assumptions (agent-proposed)

- `[USULAN]` Retur tidak mengubah faktur asal; pengurangan lewat kredit memo (`analisis-sia.md` §8.2 #13).
- `[USULAN]` Stok masuk kembali hanya setelah QC lulus (`analisis-sia.md` §8.2 #3).

## Rejected alternatives

- Retur dengan menghapus faktur asal: ditolak (`analisis-sia.md` §7.1).
- Saldo kredit pelanggan sebagai tempat menampung retur: ditolak (`D-49`).

## Catatan pertentangan

- Makalah menyatakan siklus pendapatan "tidak mencakup retur"; `D-01` dan `backlog.md` memasukkan `PD-007`. Keputusan terkunci menang.
- `backlog.md` menaruh `PD-007` sebagai dependensi `PD-008`; keputusan itu dipertahankan (`PD-008` `PQ-05`).

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item menunggu `PD-005`, `FND-005`, dan gate fondasi (lihat `03-readiness-review.md`).
