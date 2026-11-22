# PR-002 — Diskusi

## Sumber permintaan

Baris backlog: `PR-002` — Perintah produksi, track PR-B eksekusi, level 3, depends on `PR-001`, `FND-004`. Blocks `PR-003` dan `PR-005`.

Fitur analisis: `PR-2` — "WO, target qty, tanggal" (`analisis-sia.md` §5.4, P0). Use case `PR02`.

## Konteks

Perintah produksi (WO, *work order*) adalah dokumen induk untuk bahan, pemakaian, hasil, dan HPP per WO (`EPIC-PR`). Tanpa WO, tidak ada yang bisa ditelusuri.

Keputusan yang mengikat:

| ID | Isi | Dampak |
|---|---|---|
| `D-08` | `riwayat_status` polimorfik untuk semua dokumen | setiap perubahan status WO masuk satu tabel riwayat |
| `D-06`, `ARCH-05` | penomoran, status, dan riwayat dokumen lewat `core/dokumen` | nomor WO tidak dibuat di modul |
| `D-25` | modul tidak membaca tabel modul lain | pesanan penjualan hanya lewat service core (bila dibutuhkan) |
| `D-31` | tabel domain bersama dimiliki `core/`; modul memiliki layar dan aturan alurnya | WO adalah dokumen milik modul Produksi; nomor lewat `core/dokumen` |
| `D-32` | audit = kolom | `created_by`, `created_at`, `updated_by`, `updated_at` di WO |
| `D-33` | matriks izin v0 disahkan | hak "Buat perintah produksi" = Produksi |
| `D-46` | daftar status mengikuti state machine perintah produksi (`diagram-sia-lengkap.md` §5.3) | daftar status WO dan transisinya |
| `D-48` | pembatalan sebelum diposting oleh pemohon dengan alasan wajib; setelah diposting hanya lewat jurnal pembalik; status tidak mundur | aturan batal WO (Q-04) |
| `D-50` | format nomor `{TIPE}/{TAHUN}/{BULAN}/{URUT}`, ditetapkan di `FND-004` | pola nomor WO |
| `EPIC-PR` gate 4 | perubahan BOM tidak mengubah HPP WO lama | WO memegang versi BOM yang dipilih |

## Aktor / consumer

- **Produksi** — membuat WO dan (`[USULAN-AGEN]`) mengubah serta membatalkannya selama aturan status mengizinkan.
- **Gudang, QC, Purchasing, Manajemen** — mengubah status WO lewat item lain (`PR-003`, `PR-004`, `PR-005`). Bukan bagian item ini.

## Masalah

Tidak ada dokumen yang mewakili satu rencana produksi untuk satu produk, dengan target dan tanggal, sehingga kebutuhan bahan dan hasil tidak punya induk.

## Desired outcome

Produksi membuat WO untuk satu produk dengan target qty dan tanggal, memakai satu versi BOM, dan melihat statusnya. Setiap perubahan status tercatat.

## Known constraints

- Dokumen tidak dihapus; yang dilakukan adalah pembatalan (`analisis-sia.md` §7.1 poin 3; `D-48`).
- Setiap perubahan status meninggalkan jejak (`D-08`, DoD 3).
- Nomor WO dibuat oleh `core/dokumen` (`ARCH-05`).

## Open questions

Klasifikasi: `Terjawab — D-xx` (keputusan terkunci), `Terjawab — [USULAN-AGEN]` (default agen, menunggu pengesahan koordinator). Tidak ada pertanyaan `Terbuka`.

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| Q-01 | Daftar status WO lengkap dan transisinya. | Tanpa daftar, status dan jejak tidak bisa diuji. | User | **Terjawab — D-46**: daftar dan transisi mengikuti `diagram-sia-lengkap.md` §5.3. Nama status final: `DIRENCANAKAN`, `CEK_BAHAN`, `BAHAN_CUKUP`, `BAHAN_KURANG`, `MENUNGGU_PEMBELIAN`, `BAHAN_SIAP`, `BERJALAN`, `HASIL_DICATAT`, `QC_PASSED`, `REWORK`, `REJECTED`, `SELESAI`, dan `DIBATALKAN` (batal tambahan, Q-04). |
| Q-02 | Apakah WO terhubung ke pesanan penjualan (`pesanan_id`) atau berdiri sendiri? | Ikatan ini membutuhkan service core lintas siklus (`D-25`) dan memengaruhi alokasi stok di `PR-004`/`PR-005`. | User | **Terjawab — [USULAN-AGEN]**: WO berdiri sendiri pada versi awal, tanpa `pesanan_id`. Alasan: kamus makalah `perintah_produksi` tidak punya kolom pesanan, dan ikatan lintas siklus tanpa sumber menambah dependensi yang tidak diminta. Dapat ditambah lewat keputusan baru. |
| Q-03 | Apakah WO butuh approval sebelum bahan diajukan? | Menentukan jumlah langkah dan hak akses. | User | **Terjawab — D-46**: state machine §5.3 tidak punya langkah approval WO; `DIRENCANAKAN` → `CEK_BAHAN` langsung. Approval hanya untuk permintaan bahan (`D-37`, `PR-003`). |
| Q-04 | Aturan ubah dan batal WO: sampai status apa? Apa akibat pembatalan setelah bahan keluar? | Pembatalan setelah pemakaian mengubah stok. | User | **Terjawab — D-48** (pembatalan sebelum diposting dengan alasan wajib; setelah diposting tidak mundur) dengan batas status **[USULAN-AGEN]**: WO dibatalkan oleh Produksi hanya dari `DIRENCANAKAN`, `CEK_BAHAN`, atau `BAHAN_CUKUP` (belum ada mutasi stok dan belum ada permintaan aktif). Dari `BAHAN_KURANG` hanya lewat penolakan permintaan (`D-46`). Setelah `BERJALAN` tidak ada pembatalan; sisa bahan dikembalikan lewat `PR-004` dan WO ditutup lewat `REJECTED` atau `SELESAI`. Ubah target qty dan tanggal hanya saat `DIRENCANAKAN`. |
| Q-05 | Format nomor WO. | Nomor dibuat `core/dokumen`; pola ditetapkan di sana. | Tech lead | **Terjawab — D-50**: format `{TIPE}/{TAHUN}/{BULAN}/{URUT}`. Nilai kode tipe **[USULAN-AGEN]** `WO`; `URUT` direset tiap bulan per tipe. Alasan: kode pendek dan konsisten dengan contoh analisis; reset bulanan mengikuti komponen bulan pada format. |
| Q-06 | Rentang tanggal target dan validasinya. | Sumber hanya menyebut "tanggal". | User | **Terjawab — [USULAN-AGEN]**: satu tanggal target selesai (`tgl_target_selesai`, sumber makalah kamus) dan tanggal perintah dibuat. Tanggal target tidak boleh sebelum tanggal perintah dibuat. Alasan: sumber menyebut satu tanggal target; tanggal mundur tidak masuk akal untuk rencana. |
| Q-07 | Versi BOM dipilih kapan dan oleh siapa? | Terkait `EPIC-PR` gate 4. | User | **Terjawab — [USULAN-AGEN]**: versi dipilih saat WO dibuat (sama dengan `PR-001` Q-02), dan tidak berubah sesudahnya. |
| Q-08 | Hak akses lengkap: siapa boleh membuat, mengubah, membatalkan. | Matriks v0 hanya memuat "buat". | User | **Terjawab — D-33** (buat = Produksi) dan `D-48` (pemohon membatalkan dengan alasan). **Terjawab — [USULAN-AGEN]** untuk ubah dan batal: Produksi (pemohon), dengan batas status di Q-04. Alasan: matriks v0 tidak memuat baris ini; default mengikuti pemohon sesuai `D-48`. |
| Q-09 | Prioritas dan ukuran item. | Lihat `PR-001/00-discussion.md`. | Tim | **Terjawab — D-50**: prioritas P0 (analisis §5.4). Ukuran **[USULAN-AGEN]** M. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-33` | Matriks izin v0 disahkan | 2026-11-22 | Keputusan pengguna | Buat WO = Produksi (Q-08) |
| `D-46` | Daftar status dokumen mengikuti state machine | 2026-11-22 | Keputusan pengguna | Menjawab Q-01 dan Q-03 |
| `D-48` | Pembatalan, revisi, approval | 2026-11-22 | Keputusan pengguna | Menjawab Q-04 dan Q-08 sebagian |
| `D-50` | Format nomor dokumen | 2026-11-22 | Keputusan pengguna | Menjawab Q-05 sebagian |

Keputusan di atas berlaku lintas item. Item ini tidak punya keputusan sendiri.

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` Pembatalan WO mengubah status ke `DIBATALKAN`, bukan menghapus baris. `DIBATALKAN` adalah status terminal.
- `[USULAN-AGEN]` Target qty harus lebih dari nol.

## Pertentangan sumber dan keputusan

| Sumber | Isi | Keputusan terkunci | Tindakan |
|---|---|---|---|
| `Makalah_Siklus_Produksi.txt` kamus `perintah_produksi` | `status` = "Direncanakan, Diproses, Selesai, Dibatalkan" | `D-46`: state machine §5.3 | `D-46` menang. |
| `Makalah_Siklus_Produksi.txt` UC-PR02 | "Perintah produksi tersimpan dengan status Planned." | `D-46` | `D-46` menang. |
| `proses-bisnis.md` §12 (catatan, [USULAN]) | "`terbuka` → `berjalan` → `selesai`" | `D-46` | `D-46` menang. |
| `siklus-produksi-lmsh.md` FR-02 (catatan, [USULAN]) | `DRAFT` → `DISETUJUI` → `BERJALAN` → `QC_INSPECTION` → `SELESAI` | `D-46` (tidak ada `DISETUJUI` WO) | `D-46` menang. |

## Rejected alternatives

- **WO dibuat dari setiap baris pesanan secara otomatis.** Ditolak (Q-02, default berdiri sendiri).
- **Nomor WO dibuat di modul Produksi.** Ditolak: `ARCH-05` mewajibkan `core/dokumen`.
- **Hapus WO dari UI.** Ditolak: dokumen tidak dihapus (`analisis-sia.md` §7.1).

## Prioritas dan ukuran

- Prioritas: P0 (`analisis-sia.md` §5.4, `PR-2`), mengikuti `D-50`.
- Ukuran: `[USULAN-AGEN]` M. Satu dokumen dengan status, riwayat, dan tiga layar (buat, daftar, detail).

## Next step

Tidak ada pertanyaan terbuka. Item boleh naik ke `ready` begitu `PR-001`, `FND-004` berstatus `done`.
