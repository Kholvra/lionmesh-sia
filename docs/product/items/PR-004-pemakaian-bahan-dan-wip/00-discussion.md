# PR-004 — Diskusi

## Sumber permintaan

Baris backlog: `PR-004` — Pemakaian bahan & WIP, track PR-B eksekusi, level 5, depends on `PR-003`, `FND-005`. Blocks `PR-006`.

Fitur analisis: `PR-4` — "keluar gudang, aktual, sisa, scrap" (`analisis-sia.md` §5.4, use case `PR09`, P0).

## Konteks

Setelah bahan diajukan dan tersedia, bahan dikeluarkan dari gudang ke lantai produksi. Produksi mencatat pemakaian aktual, sisa, dan scrap. Efeknya: stok bahan turun, WIP naik, dan selisih dicatat (`analisis-sia.md` §6.5 langkah 19–20).

Keputusan yang mengikat:

| ID | Isi | Dampak |
|---|---|---|
| `D-06` | Qty stok dari mutasi. `saldo_stok` (qty, nilai, harga_rata) di-update dalam transaksi yang sama | mutasi lewat `core/inventory` |
| `D-07` | Jurnal hanya lewat `postJournal()` | jurnal bahan keluar lewat `core/ledger` |
| `D-10` | Valuasi rata-rata bergerak | bahan keluar dinilai dengan harga rata-rata saat keluar |
| `D-13` | Reject dan toleransi | toleransi dipakai sebagai acuan selisih scrap (lihat Q-05) |
| `D-33` | Matriks izin v0 | "Catat pemakaian bahan": Gudang mencatat keluar, Produksi mengonfirmasi terpakai |
| `D-41` | COA dasar: 120 persediaan bahan, 121 barang dalam proses | akun peran `persediaan_bahan` dan `barang_dalam_proses` |
| `D-43` | Aturan jurnal: langsung diposting, tidak bisa diubah | jurnal pemakaian langsung diposting; koreksi lewat jurnal pembalik |
| `D-44` (4) | TKL dan overhead masuk WIP saat dibebankan | item ini hanya membukukan bahan |
| `D-46` | State machine perintah produksi (§5.3) | pemakaian pertama membawa WO ke `BERJALAN` |
| `D-48` | Revisi dan pembatalan | setelah mutasi, koreksi hanya lewat jurnal pembalik dan mutasi balik |
| `D-52` | Multi-gudang disiapkan; seed satu gudang | gudang sumber per WO (Q-06) |
| `ARCH-04` | Perubahan stok hanya lewat `core/inventory` | item tidak menulis `saldo_stok` langsung |
| `ARCH-001` `PRE-03` | Mutasi tidak boleh backdate | tanggal mutasi tidak boleh mendahului mutasi terakhir |

## Aktor / consumer

- **Gudang** — mencatat bahan keluar (`D-33`).
- **Produksi** — mengonfirmasi terpakai, sisa, dan scrap (`D-33`).

## Masalah

Bahan yang sudah dikeluarkan ke lantai tidak tercatat per WO. Stok di sistem tidak sesuai kenyataan, dan selisih antara rencana dan pemakaian tidak terlihat.

## Desired outcome

Bahan keluar untuk WO tercatat sebagai mutasi keluar, stok bahan turun, WIP per WO naik, dan Produksi bisa mengonfirmasi pemakaian. Selisih dari rencana terlihat.

## Known constraints

- Tidak ada stok negatif (`UC-PR09`, alur alternatif: pemakaian tidak dicatat bila stok kurang).
- Tidak ada backdate (`ARCH-001` `PRE-03`, `D-10`).
- Setiap perubahan status WO masuk riwayat (`D-08`).

## Open questions

Klasifikasi: `Terjawab — D-xx`, `Terjawab — [USULAN-AGEN]`, `Terjawab — sumber`. Tidak ada pertanyaan `Terbuka`.

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| Q-01 | Sisa bahan (yang tidak terpakai) dikembalikan ke gudang atau tetap di lantai? | Mengubah arah mutasi stok. | User | **Terjawab — [USULAN-AGEN]**: sisa dikembalikan ke gudang sumber sebagai mutasi masuk, dinilai pada harga per unit saat keluar untuk WO itu. WIP turun sebesar nilai sisa. Alasan: sisa yang tidak kembali membuat saldo tidak sesuai kenyataan; harga saat keluar menjaga WIP tetap sama dengan yang keluar. |
| Q-02 | Scrap bahan: arah mutasinya dan nilainya. | Mengubah stok dan nilai WIP/HPP. | User | **Terjawab — [USULAN-AGEN]**: scrap tidak membuat mutasi tambahan. Qty scrap termasuk dalam qty keluar yang terpakai habis; nilainya tetap di WIP WO dan diserap ke barang baik (`D-13`). Tidak ada nilai jual scrap pada versi awal. Alasan: `D-41` tidak punya akun scrap; penjualan scrap belum punya sumber. |
| Q-03 | Jurnal pemakaian bahan diperlukan dan di titik mana? | Uang. Menentukan jumlah dan bentuk jurnal. | Accounting | **Terjawab — D-41, D-43, D-07 + [USULAN-AGEN]**: setiap bahan keluar diposting Dr `barang_dalam_proses` / Cr `persediaan_bahan` senilai qty keluar × harga per unit; setiap sisa kembali diposting kebalikannya. Diposting langsung saat mutasi. Alasan: `D-43` mewajibkan jurnal dari transaksi operasional, dan nilai WIP harus lahir dari pemakaian. Konfirmasi Accounting tidak menghalangi karena `D-43` berlaku. |
| Q-04 | Akun WIP dan cara nilai WIP per WO dihitung: hanya bahan, atau bahan plus TKL dan overhead? | Menentukan posting dan HPP (`PR-006`). | Accounting | **Terjawab — D-41 dan D-44 (4)**: akun WIP = `barang_dalam_proses` (121). TKL dan overhead masuk WIP lewat `PR-006` saat dibebankan. **Terjawab — [USULAN-AGEN]** untuk cakupan item ini: `PR-004` membukukan nilai bahan saja. Alasan: pembebanan TKL dan overhead adalah tanggung jawab `PR-006`. |
| Q-05 | Selisih aktual vs rencana: diperlakukan sebagai apa, dan kapan dianggap perlu investigasi? | Menentukan apakah selisih masuk HPP atau jurnal lain. | User | **Terjawab — [USULAN-AGEN]**: selisih per komponen = pemakaian aktual (keluar − sisa) − kebutuhan standar untuk jumlah diproses. Selisih di dalam `toleransi_scrap` pada versi BOM dianggap wajar; di luar itu ditandai "perlu investigasi" (penanda, tidak memblokir). Selisih tetap di WIP WO dan ikut HPP (`PR-006`); tidak ada jurnal terpisah. Alasan: memakai toleransi yang sudah ada, tanpa akun atau ambang baru. |
| Q-06 | Gudang sumber untuk setiap pemakaian (multi-gudang). | Mutasi per gudang. | User | **Terjawab — D-52 + [USULAN-AGEN]**: pemakaian mengikuti gudang sumber WO (`PR-003` Q-05). Seed satu gudang. |
| Q-07 | Apakah pemakaian di atas BOM perlu approval? | Hak akses dan alur. | User | **Terjawab — [USULAN-AGEN]**: tidak perlu approval pada versi awal; selisih hanya ditandai (Q-05). Alasan: matriks v0 tidak punya baris persetujuan pemakaian, dan approval baru adalah aturan tanpa sumber. Mesin approval `FND-004` (`D-37`) tersedia bila keputusan berubah. |
| Q-08 | Hak akses lengkap. | Tanpa keputusan, aturan hak akses tidak bisa diuji. | User | **Terjawab — D-33**: Gudang mencatat keluar; Produksi mengonfirmasi terpakai, sisa, dan scrap. |
| Q-09 | Prioritas dan ukuran. | Lihat `PR-001/00-discussion.md`. | Tim | **Terjawab — D-50**: prioritas P0. Ukuran **[USULAN-AGEN]** M. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-33` | Matriks izin v0 | 2026-11-22 | Keputusan pengguna | Menjawab Q-08 |
| `D-41` | COA dasar | 2026-11-22 | Keputusan pengguna | Akun 120 dan 121 bernomor (Q-03, Q-04) |
| `D-43` | Aturan jurnal | 2026-11-22 | Keputusan pengguna | Jurnal langsung diposting (Q-03) |
| `D-44` | Saat pengakuan | 2026-11-22 | Keputusan pengguna | TKL dan overhead bukan cakupan item ini (Q-04) |
| `D-46` | Daftar status | 2026-11-22 | Keputusan pengguna | WO `BERJALAN` saat pemakaian pertama |
| `D-48` | Pembatalan dan revisi | 2026-11-22 | Keputusan pengguna | Koreksi setelah mutasi hanya lewat pembalik |
| `D-50` | Prioritas dan ukuran | 2026-11-22 | Keputusan pengguna | Menjawab Q-09 |

Keputusan di atas berlaku lintas item. Item ini tidak punya keputusan sendiri.

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` Pemakaian dinilai dengan harga rata-rata bergerak saat mutasi terjadi (`D-10`).
- `[USULAN-AGEN]` Pemakaian dicatat per WO, per komponen, dan per gudang.
- `[USULAN-AGEN]` Konfirmasi pemakaian (terpakai + sisa + scrap = keluar) wajib selesai sebelum WO bisa mencatat hasil (`PR-005`).

## Pertentangan sumber dan keputusan

| Sumber | Isi | Keputusan terkunci | Tindakan |
|---|---|---|---|
| `proses-bisnis.md` B2 dan `siklus-produksi-lmsh.md` §Penilaian (catatan [USULAN]) | Pengeluaran bahan dinilai FIFO | `D-10`: rata-rata bergerak | `D-10` menang. Valuasi di balik antarmuka `FND-005`. |
| `Makalah_Siklus_Produksi.txt` kamus `barang` dan `produk` | kolom `stok` | `D-06`: qty dari mutasi | `D-06` menang. |
| `Makalah_Siklus_Produksi.txt` kamus `detail_pemakaian_bahan` | `harga_satuan` "saat dipakai" | `D-10` | `D-10` menang. Harga diturunkan dari `saldo_stok`. |

## Rejected alternatives

- **Stok dikurangi saat permintaan disetujui.** Ditolak: stok bergerak saat bahan keluar secara fisik (`analisis-sia.md` §6.4).
- **Kolom `stok` di tabel produk.** Ditolak: `D-06`.
- **Mutasi terpisah untuk scrap (Q-02).** Ditolak: tidak ada akun dan nilai scrap; scrap sudah termasuk qty keluar.

## Prioritas dan ukuran

- Prioritas: P0 (`analisis-sia.md` §5.4, `PR-4`), mengikuti `D-50`.
- Ukuran: `[USULAN-AGEN]` M. Satu mutasi, satu konfirmasi, satu layar pemakaian; risiko mutasi stok dan jurnal dicatat di `03-readiness-review.md`.

## Next step

Tidak ada pertanyaan terbuka. Item boleh naik ke `ready` begitu `PR-003` dan `FND-005` berstatus `done`.
