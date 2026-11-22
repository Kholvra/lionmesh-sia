# PR-007 — Diskusi

## Sumber permintaan

Baris backlog: `PR-007` — Laporan produksi & efisiensi, track PR-D biaya, level 7, depends on `PR-006`. Blocks `INT-001`.

Fitur analisis: `PR-7` — "produksi, WIP, persediaan" (`analisis-sia.md` §5.4, use case `PR14`, P1).

## Konteks

Setelah HPP tersedia, Produksi dan manajemen perlu melihat hasil produksi, posisi WIP, dan persediaan. Analisis tidak membahas laporan selain tabel `laporan` yang dibuang (G14, `[USULAN]`). Makalah (Tabel 4.2.6 nomor 36) menyatakan laporan produksi "dihasilkan melalui query dari data transaksi dan tidak perlu disimpan".

Judul backlog menyebut efisiensi. Definisinya sudah dikunci di `D-51`(f).

Keputusan yang mengikat:

| ID | Isi | Dampak |
|---|---|---|
| `D-25` | Laporan lintas siklus lewat service core atau read model core | laporan membaca dari core, bukan tabel modul lain |
| `ARCH-08` | Modul tidak membaca tabel modul lain | sama dengan `D-25` |
| `D-06` | Qty stok dari mutasi; nilai di `saldo_stok` | kuantitas persediaan dibaca dari `saldo_stok` |
| `D-33` | Matriks izin v0 | "Lihat laporan produksi" = Produksi, Gudang, Manajemen, Accounting |
| `D-43` | Semua laporan membaca buku besar, tidak menghitung ulang dari tabel transaksi | nilai persediaan dan WIP dari buku besar (lihat Pertentangan) |
| `D-50` | Laporan tampil di layar dulu; ekspor menyusul. Prioritas P1 | format keluaran dan prioritas |
| `D-51` (f) | Efisiensi = yield (lolos ÷ diproses) dan efisiensi bahan (bahan standar BOM untuk output lolos ÷ bahan aktual) | rumus efisiensi (Q-01) |
| `D-52` | Multi-gudang disiapkan; pilihan gudang hanya tampil bila ada lebih dari satu | cakupan per gudang (Q-02) |
| `EPIC-PR` gate 3 | Reject melebihi toleransi tampil sebagai kerugian | laporan menampilkan kerugian |

## Aktor / consumer

- **Produksi**, **Gudang**, **Manajemen**, **Accounting** — `Lihat laporan produksi` (`D-33`).

## Masalah

Tidak ada tampilan yang menunjukkan hasil produksi, posisi WIP, dan persediaan per periode. Tidak ada cara membandingkan rencana dan hasil.

## Desired outcome

Pengguna yang berwenang membuka laporan produksi, WIP, dan persediaan untuk periode yang dipilih. Angka dalam laporan sama dengan angka dari dokumen sumber. Indikator efisiensi tampil dengan rumus `D-51`(f).

## Known constraints

- Laporan dihitung saat dibuka, tidak disimpan (makalah Tabel 4.2.6 nomor 36; `analisis-sia.md` §9.2 G14).
- Laporan tidak menulis data.
- Data lintas siklus lewat service core (`D-25`).

## Open questions

Klasifikasi: `Terjawab — D-xx`, `Terjawab — [USULAN-AGEN]`, `Terjawab — sumber`. Tidak ada pertanyaan `Terbuka`.

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| Q-01 | Definisi "efisiensi": rumus dan basisnya. | Judul backlog memuat efisiensi tanpa definisi. | User | **Terjawab — D-51 (f)**: dua indikator. Yield = lolos QC ÷ diproses. Efisiensi bahan = bahan standar BOM untuk output lolos ÷ bahan aktual yang dikonfirmasi (`PR-004`). Nilai dan basis dihitung per WO dan per periode. |
| Q-02 | Cakupan persediaan di laporan: bahan, WIP, barang jadi? Per gudang atau gabungan? | Menentukan query dan angka. | User | **Terjawab — D-52 + [USULAN-AGEN]**: cakupan bahan (`persediaan_bahan`), WIP (`barang_dalam_proses`), dan barang jadi (`persediaan_barang_jadi`). Tampilan per gudang dengan total gabungan; pilihan gudang hanya tampil bila ada lebih dari satu gudang (`D-52`). Alasan: `proses-bisnis.md` §14 memuat tiga akun persediaan; `D-52` menetapkan struktur multi-gudang. |
| Q-03 | Filter periode: per periode akuntansi, atau rentang tanggal bebas? | Menentukan cara WO lintas periode dibaca. | User | **Terjawab — D-43 + [USULAN-AGEN]**: filter per periode akuntansi (bulan, dari `FND-006`). Angka nilai dari jurnal pada periode itu; WO lintas periode tampil di periode tempat transaksinya dibukukan. Alasan: `D-43` membaca buku besar, dan `D-44` (5) menetapkan periode posting. |
| Q-04 | Hak lihat per laporan. | Hak akses. | User | **Terjawab — D-33**: matriks izin v0 disahkan, "Lihat laporan produksi" = Produksi, Gudang, Manajemen, Accounting. Pertentangan dengan dua baris makalah dicatat; `D-33` menang. |
| Q-05 | Format keluaran: layar atau ekspor file? | Menambah pekerjaan bila ekspor. | User | **Terjawab — D-50**: laporan tampil di layar dulu; ekspor menyusul (di luar item ini). |
| Q-06 | Read model core, atau query service core? | Menentukan item pemilik. | Tech lead | **Terjawab — D-25 dan D-43 + [USULAN-AGEN]**: query service core tanpa read model dan tanpa tabel laporan pada versi awal. Alasan: `D-43` meminta laporan membaca buku besar, dan makalah menyatakan laporan tidak disimpan. Read model dibuat hanya bila performa membutuhkannya, lewat keputusan baru. |
| Q-07 | Prioritas dan ukuran. | Lihat `PR-001/00-discussion.md`. | Tim | **Terjawab — D-50**: prioritas P1 (analisis §5.4). Ukuran **[USULAN-AGEN]** M (dengan efisiensi dan filter periode terdefinisi). |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-33` | Matriks izin v0 | 2026-11-22 | Keputusan pengguna | Menjawab Q-04 |
| `D-43` | Aturan jurnal; laporan membaca buku besar | 2026-11-22 | Keputusan pengguna | Menjawab Q-03 dan Q-06 |
| `D-50` | Laporan tampil di layar; prioritas | 2026-11-22 | Keputusan pengguna | Menjawab Q-05 dan Q-07 |
| `D-51` | Parameter dan rumus (f) | 2026-11-22 | Keputusan pengguna | Menjawab Q-01 |
| `D-52` | Cakupan multi-gudang | 2026-11-22 | Keputusan pengguna | Menjawab Q-02 |

Keputusan di atas berlaku lintas item. Item ini tidak punya keputusan sendiri.

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` Laporan hanya membaca; tidak menulis data.
- `[USULAN-AGEN]` Laporan tidak disimpan sebagai tabel; dihitung saat dibuka (makalah Tabel 4.2.6 nomor 36).

## Pertentangan sumber dan keputusan

| Sumber | Isi | Keputusan terkunci | Tindakan |
|---|---|---|---|
| `Makalah_Siklus_Produksi.txt` UC-PR14 (narasi, Tabel 4.21) | Aktor: "Manajemen dan Accounting" | `D-33`: Produksi, Gudang, Manajemen, Accounting | `D-33` menang. |
| `Makalah_Siklus_Produksi.txt` Tabel 4.5 (UC-PR14) | Aktor: "Produksi, Gudang, Manajemen" | `D-33` | `D-33` menang. |
| `D-43` ("semua laporan membaca buku besar") dan `D-06` (kuantitas dari `saldo_stok`) | Laporan persediaan memakai dua sumber | Keduanya terkunci | Nilai dari buku besar, kuantitas dari `saldo_stok`, dan dicocokkan. Pertentangan dicatat untuk koordinator. |
| `Makalah_Siklus_Produksi.txt` kamus `produk` dan `barang` | kolom `stok` sebagai sumber laporan persediaan | `D-06` | `D-06` menang. |

## Rejected alternatives

- **Laporan produksi disimpan sebagai tabel.** Ditolak: G14 dan makalah Tabel 4.2.6 nomor 36.
- **Laporan produksi di modul keuangan.** Ditolak: laporan keuangan milik `C-009`.

## Prioritas dan ukuran

- Prioritas: P1 (`analisis-sia.md` §5.4, `PR-7`), mengikuti `D-50`.
- Ukuran: `[USULAN-AGEN]` M. Tiga laporan, rumus efisiensi, dan filter periode.

## Next step

Tidak ada pertanyaan terbuka. Item boleh naik ke `ready` begitu `PR-006` berstatus `done`.
