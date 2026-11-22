# PR-003 — Diskusi

## Sumber permintaan

Baris backlog: `PR-003` — Kebutuhan & permintaan bahan, track PR-B eksekusi, level 4, depends on `PR-002`, `C-013`. Blocks `PR-004`.

Fitur analisis: `PR-3` — "hitung kebutuhan, cek stok, ajukan" (`analisis-sia.md` §5.4, use case `PR03`–`PR06`, P0).

## Konteks

Setelah WO dibuat, Produksi perlu tahu bahan apa yang dibutuhkan, apakah stok cukup, dan bila tidak, mengajukan permintaan ke pengadaan. Analisis menyebut langkah ini di §6.3 langkah 7–12.

`backlog.md` menjelaskan bahwa item ini bergantung pada `C-013` (domain pengadaan di core), bukan pada seluruh siklus Pengeluaran. Dengan begitu Produksi tidak menunggu `PG-005`.

Keputusan yang mengikat:

| ID | Isi | Dampak |
|---|---|---|
| `D-05` | Pengadaan adalah domain core. Tabel dan aturan di `core/pengadaan`; layar di `modules/pengeluaran` | Produksi memanggil `pengadaan.ajukanPR()`, tidak membangun PO sendiri |
| `D-06` | Qty stok dari mutasi; `saldo_stok` di-update dalam transaksi yang sama | item ini hanya membaca stok |
| `D-11` | BOM satu level, berversi | kebutuhan dihitung dari versi BOM WO |
| `D-25` | Modul tidak membaca tabel modul lain | stok dibaca lewat service core inventory |
| `ARCH-06` | Tabel pengadaan hanya di `core/pengadaan` | item tidak membuat tabel PR |
| `D-31` | `C-013` hanya permintaan, PO, penerimaan, QC; layar dan alur approval tetap di modul | tabel permintaan di `C-013`; layar di Pengeluaran |
| `D-33` | Matriks izin v0 disahkan | hak ajukan, periksa, dan setujui PR |
| `D-37` | Satu mesin approval berjenjang di `FND-004` | item ini tidak membangun approval sendiri |
| `D-42` | Pemohon PR tidak boleh menyetujui PR-nya sendiri | aturan pemisahan tugas |
| `D-46` | Status permintaan (§5.2) dan status WO (§5.3) | `DIAJUKAN` → `MENUNGGU_PERSETUJUAN` → `DISETUJUI` / `DITOLAK`; WO dari `BAHAN_KURANG` |
| `D-47` (d) | Pembatalan permintaan dan PO tidak ditambah ke state machine | pengaju tidak punya status batal; koreksi lewat `REVISI` (Q-07) |
| `D-48` | Revisi menggugurkan approval; alasan wajib saat menolak | approval diulang dari awal bila permintaan direvisi |
| `D-51` (c) | Seed approval permintaan = satu level Manajemen | seed mesin approval |
| `D-52` | Multi-gudang disiapkan; seed satu gudang | gudang sumber per WO (Q-05) |

## Aktor / consumer

- **Produksi** — mengajukan permintaan bahan (`D-33`: "Ajukan PR" = Gudang, Produksi).
- **Gudang** — cek ketersediaan bahan (`D-33`).
- **Purchasing** — memeriksa permintaan (`D-33`: "Periksa PR" = Purchasing; status `MENUNGGU_PERSETUJUAN` di §5.2).
- **Manajemen** — menyetujui pembelian bahan (`D-33`: "Setujui PR"; `DISETUJUI` di §5.2).

## Masalah

Produksi tidak tahu bahan apa yang kurang untuk sebuah WO. Tanpa perhitungan, kekurangan baru ketahuan saat lantai produksi berhenti.

## Desired outcome

Untuk satu WO, sistem menghitung kebutuhan bahan dari versi BOM, membandingkannya dengan stok yang tersedia, menandai WO bila kurang, dan membuat permintaan bahan ke pengadaan. Permintaan yang ditolak berhenti dan tidak bisa menjadi PO.

## Known constraints

- Tidak ada mutasi stok di item ini. Mutasi ada di `PR-004`.
- Permintaan dibuat lewat `pengadaan.ajukanPR()` dengan `wo_id` terisi (`D-05`).
- PR yang ditolak berhenti dan tidak bisa menjadi PO (`analisis-sia.md` §8.1, `[SUMBER]`).

## Open questions

Klasifikasi: `Terjawab — D-xx` (keputusan terkunci), `Terjawab — [USULAN-AGEN]` (default agen, menunggu pengesahan koordinator), `Terjawab — sumber` (makalah). Tidak ada pertanyaan `Terbuka`.

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| Q-01 | Di mana alur approval permintaan bahan ditempatkan? | Menentukan apakah `PR-003` membangun approval sendiri atau memanggil mesin bersama. | User / tech lead | **Terjawab — D-37** (dengan `D-31`): satu mesin approval berjenjang di `FND-004`; `PR-003` hanya memanggil aturan dan layar. `C-013` memiliki tabel dan status permintaan, tidak memiliki alur approval. |
| Q-02 | Rumus kebutuhan: apakah toleransi scrap ikut dihitung, dan bagaimana pembulatannya? Satuan mengikuti apa? | Menentukan jumlah bahan yang diajukan. | User | **Terjawab — [USULAN-AGEN]**: kebutuhan komponen = qty WO × `qty_per_unit` × (1 + `toleransi_scrap`); hasil dibulatkan ke atas pada presisi satuan master `C-011`, per komponen per WO. Satuan mengikuti `C-011` (`D-38`). Alasan: `analisis-sia.md` FR-02 menyebut "kuantitas target × formula BOM", dan `D-11` menyimpan toleransi susut di BOM; pembulatan ke atas agar bahan tidak kurang. Nilai toleransi mengikuti `D-51` (mekanisme berversi). |
| Q-03 | Stok "tersedia": stok fisik, atau stok fisik dikurangi kebutuhan yang sudah dijanjikan? | Tanpa aturan ini, dua WO bisa menjanjikan bahan yang sama. | User | **Terjawab — [USULAN-AGEN]**: tersedia = `saldo_stok.qty` di gudang sumber dikurangi kebutuhan WO lain yang sudah `BAHAN_CUKUP` atau `BAHAN_SIAP` dan belum dikeluarkan. Dihitung saat cek, tanpa tabel alokasi baru. Pengeluaran tetap dicek ulang di `PR-004` (stok tidak boleh negatif). Alasan: mencegah janji ganda tanpa menambah tabel dan tanpa mengubah `D-06`. Reservasi penjualan (`PD-003`) belum dihitung; lihat `PR-004`. |
| Q-04 | Kekurangan sebagian: permintaan untuk selisih saja, atau seluruh kebutuhan? | Mempengaruhi jumlah PR dan PO. | User | **Terjawab — [USULAN-AGEN]**: permintaan untuk selisih (kebutuhan dikurangi tersedia) per komponen. Bahan tidak dikeluarkan sebagian; WO menunggu `BAHAN_SIAP` lalu `BERJALAN`. Alasan: pengeluaran parsial tidak diatur sumber; satu titik tunggu lebih mudah diuji. |
| Q-05 | Gudang sumber ketika multi-gudang? | Stok dibaca per gudang. | User | **Terjawab — [USULAN-AGEN]** dengan `D-52`: WO menyimpan gudang sumber (default gudang utama dari seed); cek dan permintaan dilakukan untuk gudang itu. Pilihan gudang di layar hanya tampil bila ada lebih dari satu gudang (`D-52`). |
| Q-06 | Satu permintaan per WO, atau bisa digabung beberapa WO? | Mempengaruhi jumlah dokumen di pengadaan. | User | **Terjawab — sumber: `Makalah_Siklus_Produksi.txt`**, kamus `permintaan_bahan`: `id_perintah` = perintah produksi yang menjadi dasar. Satu permintaan merujuk satu WO. |
| Q-07 | Setelah permintaan ditolak atau dibatalkan, ke mana WO kembali? Bagaimana pengaju mengoreksi permintaan? | Menentukan status WO di `PR-002`. | User | **Terjawab — D-46** (§5.2–§5.3): permintaan `DITOLAK` membawa WO dari `BAHAN_KURANG` ke `DIBATALKAN`; WO tidak kembali ke `DIRENCANAKAN`. **Terjawab — D-47 (d)** untuk pembatalan oleh pengaju: tidak ditambahkan. **Terjawab — [USULAN-AGEN]** untuk koreksi: selama `DIAJUKAN`, pemeriksa Purchasing mengembalikan permintaan lewat `REVISI` (§5.2); pengaju mengajukan ulang, dan approval gugur (`D-48`). WO tetap `BAHAN_KURANG`. |
| Q-08 | Hak akses: siapa boleh mengajukan, memverifikasi, menyetujui. | Tanpa keputusan, aturan hak akses tidak bisa diuji. | User | **Terjawab — D-33**: Ajukan PR = Gudang, Produksi; Periksa PR = Purchasing; Setujui PR = Manajemen. Pemohon tidak menyetujui PR-nya sendiri: `D-42`. |
| Q-09 | Prioritas dan ukuran. | Lihat `PR-001/00-discussion.md`. | Tim | **Terjawab — D-50**: prioritas P0 (analisis §5.4). Ukuran **[USULAN-AGEN]** M. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-33` | Matriks izin v0 | 2026-11-22 | Keputusan pengguna | Menjawab Q-08 |
| `D-37` | Mesin approval berjenjang di `FND-004` | 2026-11-22 | Keputusan pengguna | Menjawab Q-01 |
| `D-46` | Daftar status mengikuti state machine | 2026-11-22 | Keputusan pengguna | Menjawab Q-07 sebagian |
| `D-47` | Penambal state machine | 2026-11-22 | Keputusan pengguna | Pembatalan permintaan tidak ditambah (Q-07) |
| `D-48` | Pembatalan, revisi, approval | 2026-11-22 | Keputusan pengguna | Revisi menggugurkan approval (Q-07) |
| `D-51` | Parameter dan rumus (c) | 2026-11-22 | Keputusan pengguna | Seed approval permintaan = satu level Manajemen |

Keputusan di atas berlaku lintas item. Item ini tidak punya keputusan sendiri.

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` Permintaan dibuat dari WO berstatus `BAHAN_KURANG`. Koreksi dari versi sebelumnya: asumsi lama "dari `DIRENCANAKAN`" dibatalkan karena `D-46` §5.3 menempatkan permintaan sesudah cek bahan.
- `[USULAN-AGEN]` Kebutuhan dihitung dari versi BOM yang dipilih WO, bukan versi terbaru.

## Pertentangan sumber dan keputusan

| Sumber | Isi | Keputusan terkunci | Tindakan |
|---|---|---|---|
| `Makalah_Siklus_Produksi.txt` kamus `permintaan_bahan` | `status` = "Diajukan, Diverifikasi, Dikembalikan, Dipenuhi" | `D-46` §5.2 | `D-46` menang. |
| `Makalah_Siklus_Produksi.txt` UC-PR05 | "berstatus terverifikasi ... atau berstatus ditolak" | `D-46` §5.2 | `D-46` menang. |
| `Makalah_Siklus_Produksi.txt` kamus `pengguna` | enam peran | `D-18`, `D-33`: 12 staf dan matriks | `D-33` menang. |
| `D-46` §5.3 vs asumsi lama item (permintaan dari `DIRENCANAKAN`) | Permintaan lahir setelah cek bahan, dari `BAHAN_KURANG` | `D-46` | `D-46` menang; asumsi diperbaiki. |

## Rejected alternatives

- **Produksi membangun PR/PO sendiri.** Ditolak: `D-05` dan `analisis-sia.md` §4.1.
- **Kebutuhan diketik manual.** Ditolak: `analisis-sia.md` §6.3.
- **Tabel alokasi baru untuk stok tersedia (Q-03).** Ditolak: menambah tabel tanpa sumber; hitungan dari WO sudah cukup untuk v0.

## Prioritas dan ukuran

- Prioritas: P0 (`analisis-sia.md` §5.4, `PR-3`), mengikuti `D-50`.
- Ukuran: `[USULAN-AGEN]` M. Alur approval sudah di `FND-004` (`D-37`), jadi item ini hanya mengisi aturan dan layar.

## Next step

Tidak ada pertanyaan terbuka. Item boleh naik ke `ready` begitu `PR-002` dan `C-013` berstatus `done`.
