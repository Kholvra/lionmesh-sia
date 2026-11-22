# PR-001 — Diskusi

## Sumber permintaan

Baris backlog (`docs/product/backlog.md`, Siklus Produksi): `PR-001` — BOM berversi & toleransi (master produk di `C-011`), track PR-A master, level 2, depends on `C-011`, `FND-002`.

Cakupan track dari `docs/product/epics/EPIC-PR.md`: BOM, versinya, dan toleransinya. Master produk **bukan** milik item ini.

## Konteks

Produksi perlu tahu bahan apa dan berapa banyak per unit produk. Tanpa itu, "kebutuhan bahan" (`PR-003`) tidak bisa dihitung dan HPP (`PR-006`) tidak punya dasar angka (`analisis-sia.md` §6.3 langkah 7, gap `G2`).

Keputusan yang mengikat:

| ID | Isi | Dampak ke item ini |
|---|---|---|
| `D-11` | BOM tersimpan, satu level, berversi | bentuk data: komponen, `toleransi_scrap`, `toleransi_reject`, `versi`, `berlaku_dari` |
| `D-13` | `toleransi_reject` di master BOM | toleransi reject disimpan di BOM per versi, bukan di item QC |
| `D-06` | qty stok diturunkan dari mutasi; tidak ada kolom stok di tabel produk | BOM tidak memuat kolom stok |
| `D-09` | migrasi dinomori dan di-merge hanya oleh tech lead | DDL item ini diusulkan, bukan langsung di-merge |
| `D-25` | modul tidak membaca tabel modul lain; data lintas siklus lewat service core | master produk dibaca lewat service `C-011` |
| `D-31` | tabel domain bersama dimiliki `core/`; modul memiliki layar dan aturan alurnya | `produk_komponen` ada di `core/`; PR-001 memiliki layar dan aturan BOM |
| `D-33` | matriks izin v0 disahkan | hak "Kelola data produk" = Produksi |
| `D-38` | `C-011` mencakup kategori produk dan konversi satuan | satuan komponen mengacu ke master `C-011` |
| `D-50` | master nonaktif tidak bisa dipilih untuk dokumen baru | produk nonaktif tidak bisa dipasangi versi baru |
| `D-51` | (e) basis `toleransi_reject` = persen dari jumlah diproses per perintah produksi | nilai toleransi di BOM dibaca sebagai persen; basisnya per WO |
| `EPIC-PR` gate 4 | perubahan BOM tidak mengubah HPP WO lama | versi yang dipakai WO harus tetap bisa ditelusuri |

## Aktor / consumer

- **Produksi** — pengelola BOM dan versinya. Dasar: matriks izin v0 (`D-33`), "Kelola data produk" = Produksi.
- **Tech lead** — pemilik skema dan migrasi (`D-09`).
- **Item pemanggil** — `PR-002`, `PR-003`, dan `PR-006` membaca versi BOM lewat service core (`D-25`).

## Masalah

Tidak ada tempat resmi untuk menyimpan resep produk yang berversi. Bila resep diubah, tidak ada cara membuktikan resep mana yang dipakai WO tertentu.

## Desired outcome

Produksi bisa mencatat BOM satu level per produk, membuat versi baru dengan tanggal berlaku, dan menyimpan toleransi scrap dan reject per versi. Versi lama tidak berubah.

## Known constraints

- Satu level (`D-11`). BOM bertingkat tidak masuk cakupan.
- Toleransi reject di master BOM (`D-13`); basis persen per perintah produksi (`D-51`(e)).
- Tidak ada kolom stok atau harga di BOM (`D-06`, `D-10`).
- Master produk di `C-011`, bukan di item ini (`backlog.md`, catatan `PR-001`).

## Open questions

Klasifikasi: `Terjawab — D-xx` (keputusan terkunci), `Terjawab — [USULAN-AGEN]` (default agen, menunggu pengesahan koordinator). Tidak ada pertanyaan `Terbuka`.

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| Q-01 | Tabel `produk_komponen` milik track PR-A, atau milik core? | Menentukan siapa yang boleh menulis tabel dan jalur aksesnya (`D-25`, `ARCH-06`). | Tech lead | **Terjawab — D-31**: `produk_komponen` (BOM) dimiliki `core/`; modul PR-001 memiliki layar dan aturan BOM. `backlog.md` menyebut BOM "dimiliki" track PR-A dalam arti aturan; `D-31` menang. DDL dibuat oleh item pertama yang membutuhkannya, dinomori tech lead (`D-09`). |
| Q-02 | WO yang sudah dibuat memakai versi BOM yang mana? Kapan versi dipilih? | Gate `EPIC-PR` 4 melarang perubahan HPP WO lama, tetapi tidak menyebut waktu pemilihan. | Produksi | **Terjawab — [USULAN-AGEN]**: versi dipilih saat WO dibuat, yaitu versi dengan `berlaku_dari` terbesar yang tidak melewati tanggal pembuatan WO; setelah itu versi WO tidak berubah. Alasan: `EPIC-PR` gate 4 dan `D-11` (berversi) menuntut versi yang tetap bisa ditelusuri, dan pemilihan saat dibuat paling sederhana. |
| Q-03 | Format `toleransi_scrap` dan `toleransi_reject`: persen, kuantitas, atau keduanya? Basis dan rentang? | Tanpa format, kebutuhan (`PR-003`) dan batas reject (`PR-005`) tidak bisa diuji. | Produksi | **Terjawab — D-51** untuk `toleransi_reject`: persen dari jumlah diproses per perintah produksi (`D-51`(e)); nilai diverifikasi saat implementasi. **Terjawab — [USULAN-AGEN]** untuk `toleransi_scrap`: persen terhadap kebutuhan per unit, format sama dengan reject; rentang sah 0 sampai kurang dari 100 persen. Alasan: `D-11` menyebut toleransi susut di BOM; format disamakan agar satu mekanisme. |
| Q-04 | Apakah komponen boleh berupa produk bertipe WIP atau barang jadi, atau hanya bahan? | `D-11` satu level dan `D-13` menyebut retur hanya untuk bahan. | Produksi | **Terjawab — [USULAN-AGEN]**: komponen hanya produk bertipe `bahan` di master `C-011`; WIP dan barang jadi ditolak. Alasan: `D-11` menyebut "bahan per unit produk" dan barang jadi tidak dibeli atau diambil dari gudang bahan. |
| Q-05 | Satuan `qty_per_unit` mengikuti satuan master `C-011`? Apakah konversi satuan dipakai di BOM? | Mempengaruhi kebutuhan bahan dan konsistensi satuan. | Tech lead | **Terjawab — D-38** (satuan dan konversi di `C-011`). **Terjawab — [USULAN-AGEN]** untuk BOM: `qty_per_unit` dinyatakan dalam satuan dasar komponen di `C-011`, tanpa konversi di level BOM. Alasan: satu sumber konversi mengurangi kesalahan. |
| Q-06 | Aturan validasi BOM: komponen duplikat, BOM tanpa komponen, `berlaku_dari` yang tumpang tindih. | Tidak ada di sumber. | Tech lead | **Terjawab — [USULAN-AGEN]**: komponen duplikat dalam satu versi ditolak; versi wajib memuat minimal satu komponen; versi baru tidak boleh punya `berlaku_dari` lebih kecil dari versi terakhir, dan tidak boleh sama dengan versi yang sudah ada. Alasan: tanpa itu WO tidak bisa memilih versi yang pasti. |
| Q-07 | Siapa yang boleh membuat versi dan apakah versi perlu disetujui sebelum berlaku? | Matriks v0 tidak punya baris persetujuan BOM. | Produksi | **Terjawab — [USULAN-AGEN]**: Produksi membuat versi; tidak ada persetujuan sebelum berlaku. Lihat BOM (baca saja): Produksi, Gudang, Purchasing, Manajemen, Accounting. Alasan: matriks v0 (`D-33`) tidak memuat aturan persetujuan BOM, dan menambahnya berarti aturan baru tanpa sumber. Baris "lihat BOM" juga belum ada di matriks (lihat laporan koordinator). |
| Q-08 | Field apa dari master produk di `C-011` yang dibutuhkan? | Item tidak bisa dispesifikasi lengkap sebelum kontrak `C-011` ada. | Tech lead | **Terjawab — [USULAN-AGEN]** (dengan `D-38`): field yang dibaca dari `C-011`: kode produk, nama, satuan dasar, tipe (`bahan`, `wip`, `jadi`), status aktif, kategori. Alasan: `makalah` kamus `produk` memuat kode, nama, spesifikasi, satuan; `D-38` menambah kategori; `diagram-sia-lengkap.md` §6.1 menambah tipe. Kontrak final mengikuti `C-011` saat selesai (dependensi, bukan pertanyaan). |
| Q-09 | Prioritas dan ukuran item. | Lihat catatan prioritas di bawah. | Tim | **Terjawab — D-50**: prioritas P0 (analisis §5.4); pemilik track diisi kelompok Produksi. Ukuran: **[USULAN-AGEN] M**, lihat bagian di bawah. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-31` | Tabel domain bersama dimiliki `core/` | 2026-11-22 | Keputusan pengguna | Menjawab Q-01 |
| `D-33` | Matriks izin v0 disahkan | 2026-11-22 | Keputusan pengguna | Hak "Kelola data produk" = Produksi (Q-07) |
| `D-38` | `C-011` mencakup kategori dan konversi satuan | 2026-11-22 | Keputusan pengguna | Menjawab Q-05 dan Q-08 sebagian |
| `D-50` | Prioritas dan ukuran | 2026-11-22 | Keputusan pengguna | Menjawab Q-09 |
| `D-51` | Parameter dan rumus (e) | 2026-11-22 | Keputusan pengguna | Basis `toleransi_reject` (Q-03) |

Keputusan di atas berlaku lintas item. Item ini tidak punya keputusan sendiri.

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` Satu produk hanya punya satu versi yang berlaku pada satu tanggal.
- `[USULAN-AGEN]` Versi lama tidak dihapus dan tidak diedit; koreksi dibuat sebagai versi baru (sejalan dengan prinsip "dokumen tidak pernah dihapus", `analisis-sia.md` §7.1).
- `[USULAN-AGEN]` Nomor versi naik otomatis per produk.

## Pertentangan sumber dan keputusan

| Sumber | Isi | Keputusan terkunci | Tindakan |
|---|---|---|---|
| `Makalah_Siklus_Produksi.txt` §4.2.6 (Keputusan Tabel, no. 7) | tabel `bom` "Tidak dipakai": "Analisis tidak mendefinisikan komposisi bahan per produk." | `D-11`: BOM satu level, berversi, dikunci | `D-11` menang. BOM dipakai; kebutuhan dihitung dari BOM (`PR-003`). |
| `D-13` (toleransi di BOM per versi) dan `D-51`(e) (basis per perintah produksi) | Lokasi nilai dan basis perhitungan berbeda | Keduanya terkunci dan tidak bertentangan | Nilai disimpan per versi BOM; basis persen dihitung per WO. Dicatat untuk konfirmasi koordinator. |

## Rejected alternatives

- **BOM bertingkat (multi-level).** Ditolak: `D-11` mengunci satu level.
- **Kebutuhan bahan diketik manual per WO.** Ditolak: `Q2` sudah dijawab dengan BOM tersimpan (`analisis-sia.md` §14.1).
- **Tabel produk khusus Produksi.** Ditolak: master produk ada di `C-011` (`backlog.md`).

## Prioritas dan ukuran

- Prioritas: P0 (`analisis-sia.md` §5.4, `PR-1`), mengikuti `D-50`.
- Ukuran: `[USULAN-AGEN]` M. Satu tabel BOM, versi, toleransi, dan dua layar (daftar dan detail). Diajukan ke koordinator untuk pengesahan.

## Next step

Tidak ada pertanyaan terbuka. Item boleh naik ke `ready` begitu `C-011` dan `FND-002` berstatus `done`.
