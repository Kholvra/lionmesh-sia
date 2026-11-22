# PR-005 — Diskusi

## Sumber permintaan

Baris backlog: `PR-005` — Hasil produksi & QC (rework/reject), track PR-C mutu, level 4, depends on `PR-002`, `FND-005`. Blocks `PR-006`.

Fitur analisis: `PR-5` — "WIP, hasil, rework/reject, barang jadi" (`analisis-sia.md` §5.4, use case `PR10`–`PR12`, P0).

## Konteks

Setelah bahan dipakai, WO menghasilkan barang jadi, barang rework, dan barang reject. QC memutuskan status setiap hasil. Reject dalam toleransi diserap ke barang baik; di atas toleransi menjadi kerugian produksi abnormal (`D-13`, `D-51`(e)).

Keputusan yang mengikat:

| ID | Isi | Dampak |
|---|---|---|
| `D-13` | Reject ≤ toleransi diserap ke unit baik; di atasnya kerugian produksi. Rework masuk HPP. Retur hanya bahan | toleransi dari BOM (`PR-001`); tidak ada retur produk jadi |
| `D-06` | Stok dari mutasi; `saldo_stok` dalam transaksi yang sama | barang jadi masuk lewat mutasi |
| `D-07`, `D-43` | Jurnal lewat `postJournal()`, langsung diposting | jurnal barang jadi dan kerugian lewat `core/ledger` |
| `D-08` | Riwayat status untuk semua dokumen | status WO dan keputusan QC tercatat |
| `D-10` | Rata-rata bergerak | nilai barang jadi dari nilai WIP |
| `D-33` | Matriks izin v0 | Catat hasil = Produksi; Periksa QC = QC; Terima barang jadi = Gudang |
| `D-35`, `D-41` | Akun dipanggil lewat peran; 121, 122 bernomor; akun kerugian produksi abnormal bernomor saat `FND-006` | jurnal memakai peran `barang_dalam_proses`, `persediaan_barang_jadi`, `kerugian_produksi_abnormal` |
| `D-46` | State machine perintah produksi (§5.3) | `HASIL_DICATAT`, `QC_PASSED`, `REWORK`, `REJECTED`, `SELESAI` |
| `D-48` | Revisi, pembatalan, dan pemisahan tugas | QC tidak boleh memeriksa hasil yang dicatatnya sendiri |
| `D-51` (e) | Basis toleransi reject = persen dari jumlah diproses per WO; kerugian = biaya terserap per unit; rework = biaya tambahan nyata ke WO yang sama | rumus kerugian dan rework |

## Aktor / consumer

- **Produksi** — mencatat jumlah hasil yang diproses (`D-33`).
- **QC** — memeriksa dan membagi hasil menjadi lulus, rework, dan reject (`D-33`).
- **Gudang** — menerima barang jadi lulus (`D-33`).

## Masalah

Produksi belum punya cara mencatat hasil yang lulus, rework, dan reject per WO. Barang jadi tidak punya dasar untuk masuk gudang, dan biaya cacat tidak punya perlakuan (gap `G6`).

## Desired outcome

Produksi mencatat hasil per WO. QC membagi hasil menjadi lulus, rework, reject. Reject dalam toleransi diserap, di atas toleransi menjadi kerugian. Barang jadi lulus masuk gudang, WIP turun, dan WO selesai.

## Known constraints

- Reject ≤ toleransi diserap; di atasnya kerugian produksi (`D-13`, `D-51`(e)).
- Tidak ada retur produk jadi (`D-13`).
- Stok masuk hanya setelah keputusan QC lulus (makalah aturan 9; `D-36` untuk bahan, berlaku sama untuk barang jadi).
- Nilai WIP WO berasal dari bahan yang dikeluarkan (`PR-004`) dan dari pembebanan biaya (`PR-006`). Lihat risiko dependensi di `03-readiness-review.md`.

## Open questions

Klasifikasi: `Terjawab — D-xx`, `Terjawab — [USULAN-AGEN]`, `Terjawab — sumber`. Tidak ada pertanyaan `Terbuka`.

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| Q-01 | Basis `toleransi_reject`: persen dari apa, per batch, atau per WO? | Menentukan kapan reject menjadi kerugian. | User | **Terjawab — D-51 (e)**: persen dari jumlah diproses per perintah produksi. Nilai persen di BOM per versi; nilainya diverifikasi saat implementasi. |
| Q-02 | Perlakuan fisik reject: dibuang, dijual sebagai sisa, atau disimpan sebagai stok? | Menentukan mutasi stok. | User | **Terjawab — [USULAN-AGEN]**: reject tidak masuk saldo (tidak ada mutasi masuk). Secara fisik dipisahkan dan dibuang tanpa nilai jual pada versi awal. Nilainya tetap di WIP WO, lalu diserap ke barang baik atau menjadi kerugian sesuai Q-01. Alasan: makalah aturan 10 hanya menyebut pemisahan; `D-41` tidak punya akun scrap. |
| Q-03 | Akun kerugian produksi (abnormal) di COA. | Tanpa akun, jurnal kerugian tidak bisa dibuat. | Accounting | **Terjawab — D-41**: nomor akun kerugian produksi abnormal ditetapkan saat `FND-006` ditulis; nomornya tidak ditulis di sini. Modul memanggil peran `kerugian_produksi_abnormal`. |
| Q-04 | Rework: apakah memakai bahan tambahan? Status WO setelah rework lulus? | Menentukan mutasi dan status. | User | **Terjawab — D-46** (§5.3): `HASIL_DICATAT` → `REWORK` → `HASIL_DICATAT`. **Terjawab — [USULAN-AGEN]** untuk bahan: bahan tambahan dikeluarkan lewat `PR-004` dari status `REWORK`; biayanya masuk WIP WO yang sama (`D-51` (e)). |
| Q-05 | Barang jadi lulus sebagian boleh masuk gudang sebagian? Bagaimana dengan "sebagian lolos"? | Menentukan mutasi masuk dan jumlah status QC. | User | **Terjawab — [USULAN-AGEN]**: satu catatan keputusan QC per WO membagi jumlah diproses menjadi lulus (L), rework (R), dan reject (J) dengan L + R + J = jumlah diproses. Status WO mengikuti aturan berikut dan tetap tiga status `D-46`. Penerimaan barang jadi boleh sebagian sampai jumlah L habis, tidak boleh melebihi L. Alasan: `D-46` tidak punya status "sebagian lolos"; makalah kamus `pemeriksaan_qc_produk` memuat "sebagian lolos", dipetakan ke pembagian L/R/J. Aturan status: (1) bila R > 0 → `REWORK`; penerimaan ditunda sampai WO kembali ke `QC_PASSED`; (2) bila R = 0 dan L > 0 → `QC_PASSED`; (3) bila L = 0 dan R = 0 → `REJECTED`. |
| Q-06 | Jurnal barang jadi masuk gudang? | Uang. Bentuk laporan keuangan. | Accounting | **Terjawab — D-41, D-43 + [USULAN-AGEN]**: penerimaan barang jadi lulus diposting Dr `persediaan_barang_jadi` / Cr `barang_dalam_proses` senilai qty diterima × nilai per unit baik (lihat Q-07). Diposting langsung saat mutasi. Alasan: `D-43` mewajibkan jurnal dari transaksi; akun 121 dan 122 ada di `D-41`. |
| Q-07 | Nilai HPP sementara dihitung dari apa? | Dasar nilai barang jadi. | User | **Terjawab — [USULAN-AGEN]**: nilai per unit baik = (nilai WIP WO saat `QC_PASSED` − kerugian produksi abnormal) ÷ jumlah L. Dihitung sekali saat `QC_PASSED`, dipakai untuk semua penerimaan. Sisa beban yang muncul setelahnya diselesaikan oleh `PR-006` saat WO `SELESAI`. Alasan: `D-43` melarang draft, sehingga HPP sementara dibukukan sekali; makalah UC-PR13 dan `proses-bisnis.md` B5 setuju atas dasar ini. |
| Q-08 | Apakah QC wajib untuk semua WO, atau sebagian (sampel)? | Menentukan alur. | User | **Terjawab — sumber: makalah** Tabel 4.6 aturan 9: setiap hasil wajib diperiksa QC. Tidak ada sampling. |
| Q-09 | Hak akses lengkap. | Tanpa keputusan, hak tidak bisa diuji. | User | **Terjawab — D-33**: Catat hasil = Produksi; Periksa QC = QC; Terima barang jadi = Gudang. Pemisahan tugas `D-48`: pencatat hasil tidak memeriksa hasil yang sama. |
| Q-10 | Prioritas dan ukuran. | Lihat `PR-001/00-discussion.md`. | Tim | **Terjawab — D-50**: prioritas P0. Ukuran **[USULAN-AGEN]** M. |

## Aturan keputusan QC (`[USULAN-AGEN]`)

| Kondisi | Status WO | Akibat |
|---|---|---|
| R > 0 | `REWORK` | penerimaan lulus ditunda; Produksi mencatat hasil ulang untuk unit rework; QC memutuskan lagi |
| R = 0 dan L > 0 | `QC_PASSED` | kerugian dihitung dan dibukukan; nilai per unit baik ditetapkan; penerimaan boleh sebagian |
| L = 0 dan R = 0 | `REJECTED` (terminal) | seluruh saldo WIP WO dibukukan sebagai kerugian (tidak ada unit baik untuk menyerap) |

Kerugian produksi abnormal = max(0, J kumulatif − toleransi persen × jumlah diproses) × biaya terserap per unit. Biaya terserap per unit = total biaya WO yang sudah dibebankan ÷ jumlah diproses (`D-51`(e)).

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-13` | Reject dan rework | 2026-11-22 | Keputusan pengguna | Basis kerugian dan rework (Q-01, Q-04) |
| `D-33` | Matriks izin v0 | 2026-11-22 | Keputusan pengguna | Menjawab Q-09 |
| `D-41` | COA dasar | 2026-11-22 | Keputusan pengguna | Akun 121 dan 122; akun kerugian menunggu `FND-006` (Q-03, Q-06) |
| `D-46` | Daftar status | 2026-11-22 | Keputusan pengguna | Status WO dan rework (Q-04) |
| `D-51` | Parameter dan rumus (e) | 2026-11-22 | Keputusan pengguna | Basis toleransi dan rumus kerugian (Q-01) |

Keputusan di atas berlaku lintas item. Item ini tidak punya keputusan sendiri.

## Pertentangan sumber dan keputusan

| Sumber | Isi | Keputusan terkunci | Tindakan |
|---|---|---|---|
| `Makalah_Siklus_Produksi.txt` UC-PR10 (langkah 7) | status "Waiting QC" | `D-46` §5.3: `HASIL_DICATAT` | `D-46` menang. |
| `Makalah_Siklus_Produksi.txt` kamus `pemeriksaan_qc_produk` | "Lolos, Sebagian lolos, Ditolak" (empat nilai) | `D-46` (tiga keputusan WO) | Dipetakan ke pembagian L/R/J; status tetap tiga (Q-05). |
| `Makalah_Siklus_Produksi.txt` kamus `produk` dan `penerimaan_barang_jadi` | stok barang jadi di tabel produk | `D-06` | `D-06` menang. |

## Rejected alternatives

- **Stok barang jadi masuk saat hasil dicatat.** Ditolak: barang belum diperiksa ikut terhitung tersedia (`analisis-sia.md` §6.4).
- **Retur produk jadi dari item ini.** Ditolak: `D-13` hanya retur bahan.
- **Status WO "sebagian lolos" baru.** Ditolak: tidak ada di `D-46`; diselesaikan dengan aturan di atas.

## Prioritas dan ukuran

- Prioritas: P0 (`analisis-sia.md` §5.4, `PR-5`), mengikuti `D-50`.
- Ukuran: `[USULAN-AGEN]` M. Naik ke L bila rework menambah alur baru (lihat risiko).

## Next step

Tidak ada pertanyaan terbuka. Item boleh naik ke `ready` begitu `PR-002` dan `FND-005` berstatus `done`, dan koordinator memutuskan dependensi tersirat ke `PR-004` (lihat `03-readiness-review.md`).
