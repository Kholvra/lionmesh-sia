# FND-004 — Diskusi

## Konteks

`backlog.md` mendefinisikan `FND-004` sebagai "Dokumen: penomoran, status, riwayat, approval berjenjang", sequence 4, `depends on` `FND-002` dan `FND-003` (status `specified`, belum `done`). `EPIC-FND` mencatat bahwa modul tidak boleh mulai sebelum `FND-004`, `FND-005`, dan `FND-006` selesai.

Analisis §2.3 menyebut satu pola siklus hidup dokumen yang dipakai ulang, dengan daftar status berbeda per jenis dokumen. Analisis §2.4 menaruh `dokumen` sebagai service core. `D-08` menetapkan satu tabel `riwayat_status` untuk semua dokumen.

## Pembaruan 2026-11-22

Keputusan terkunci yang menjawab seluruh pertanyaan: `D-46` dan `D-47` (state machine dan penambalannya), `D-37` (satu mesin approval), `D-48` (pembatalan, revisi, approval, alasan wajib, pemohon tidak menyetujui dokumennya), `D-50` (format nomor), `D-51` (seed approval awal), `D-35` dan `D-43` (jurnal pembalik dan aturan jurnal). Sisa mekanisme diberi usulan `[USULAN-AGEN]`.

## Kenapa item ini

Dokumen (PR, PO, SO, faktur, WO, payroll) dan approval adalah bagian pola yang sama di empat siklus. Jika tiap modul menulis nomor dan status sendiri, nomor bisa ganda dan riwayat hilang. `ARCH-001` `ARCH-05` mewajibkan penomoran, status, dan riwayat lewat `core/dokumen`.

## Actor / consumer

- Pemilik modul (Pendapatan, Pengeluaran, Produksi, Penggajian): memanggil service dokumen; tidak menulis nomor atau riwayat sendiri.
- Pemroses dokumen (Purchasing, Accounting, Manajemen, Direksi, dll.): menyetujui atau menolak sesuai peran dan level (`D-51` c).
- Tech lead: pemilik item.

## Problem

Dua pengguna menyimpan dokumen bersamaan dapat menerima nomor yang sama. Persetujuan dua orang atas dokumen yang sama dapat menimpa satu sama lain. Perubahan status tanpa jejak tidak bisa dijawab "siapa yang menyetujui ini?" (analisis §7.1 prinsip 4).

## Desired outcome

Dokumen baru mendapat nomor unik dari sistem. Setiap transisi status tercatat dengan aktor dan waktu. Dokumen yang butuh persetujuan berjenjang tidak selesai sebelum semua level menyetujui. Dokumen tidak dihapus, hanya dibatalkan.

## Known constraints

- `D-08`: `riwayat_status` polimorfik, satu tabel.
- `D-37`: satu mesin approval berjenjang; `PG-003`, `PR-003`, `GJ-005` hanya mengisi aturan dan layar.
- `D-46` dan `D-47`: daftar status mengikuti state machine di `diagram-sia-lengkap.md` §5; penambalan (pesanan menunggu kredit, pengiriman `DIKIRIM`→`DITERIMA`, periode payroll `REKAP`→`TERBUKA`).
- `D-48`: pembatalan, revisi, approval, alasan wajib, pemohon tidak menyetujui dokumen miliknya.
- `D-50`: format nomor `{TIPE}/{TAHUN}/{BULAN}/{URUT}`, ditetapkan sekali di `FND-004`.
- `D-35`: dokumen batal setelah posting menghasilkan jurnal pembalik.
- `D-42`: pemohon PR tidak boleh menyetujui PR-nya sendiri.
- `ARCH-001` `ARCH-05`, `INV-04`, `INV-05`: nomor unik per jenis per periode; setiap transisi punya baris riwayat.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| OQ-04-01 | Format nomor, pemisah, dan periode penghitung. | Format dilihat pengguna dan dicetak di dokumen. | user / tech lead | Terjawab — D-50: `{TIPE}/{TAHUN}/{BULAN}/{URUT}` dengan pemisah `/`, periode bulan kalender, `URUT` empat digit yang dihitung ulang per tipe per bulan. |
| OQ-04-02 | Ambang nominal dan jumlah level approval (`aturan_approval`). | Tanpa ambang, AC approval tidak bisa ditulis. | user | Terjawab — D-51 (c): seed awal permintaan pembelian satu level Manajemen untuk semua nominal; payroll satu level Direksi; pembayaran pemasok tidak berjenjang. Ambang nominal kosong di seed dan ditandai belum final (`D-37`). |
| OQ-04-03 | Siapa yang menyetujui pada tiap level? | Menentukan isi aturan approval. | user | Terjawab — D-51 (c) dan D-33: PR oleh Manajemen; payroll oleh Direksi. |
| OQ-04-04 | Apakah pola §2.3 berlaku generik di `core/dokumen`, dan siapa mendaftarkan status per jenis? | Menentukan bentuk API dokumen. | tech lead / user | Terjawab — D-46 dan D-47: pola generik di 01; status per jenis sesuai state machine. Pendaftar: `[USULAN-AGEN]` pemilik modul mendaftarkan status dan penanda `diposting` di item pemiliknya. |
| OQ-04-05 | `REVISI`: dari status apa dan apakah approval sebelumnya gugur? | Mengubah riwayat dan jalur approval. | user | Terjawab — D-48: approval gugur dan diulang dari awal; `REVISI` kembali ke pengajuan ulang (D-46). |
| OQ-04-06 | `DIBATALKAN`: wajib alasan? Dokumen yang sudah diposting dibatalkan dengan jurnal pembalik? | Menyentuh `FND-006`. | user | Terjawab — D-48: alasan wajib saat batal; setelah diposting hanya lewat jurnal pembalik (`D-35`). |
| OQ-04-07 | Apakah pemohon boleh menyetujui dokumennya sendiri? | Pemisahan tugas. | user | Terjawab — D-48: tidak boleh untuk dokumen apa pun (memperluas `D-42`). |
| OQ-04-08 | Teks pesan konflik optimistic lock disetujui? | Syarat DoR butir 4. | user | Terjawab — [USULAN-AGEN]: "Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru." Alasan: sesuai pola pesan lain yang singkat dan menunjuk tindakan berikutnya. |
| OQ-04-09 | Koreksi dokumen yang sudah diposting: apakah dokumen sumber boleh diedit? | Menentukan apakah ada jalur edit setelah posting. | user | Terjawab — D-48 dan D-43: setelah diposting dokumen tidak diedit dan tidak mundur status; koreksi lewat jurnal pembalik. |
| OQ-04-10 | Tabel `lampiran` masuk item ini atau item modul? | Tabel tanpa pemilik. | tech lead | Terjawab — D-31: `lampiran` dibuat item pertama yang membutuhkannya; bukan `FND-004`. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `[USULAN-AGEN]` OQ-04-04 | Pemilik modul mendaftarkan status dan penanda `diposting` lewat item pemilik | 2026-11-22 | tech lead (kunci koordinator) | Mesin status generik; daftar status per jenis di item pemilik |
| `[USULAN-AGEN]` OQ-04-08 | Teks pesan konflik | 2026-11-22 | tech lead (kunci koordinator) | DoR butir 4 |
| `[USULAN-AGEN]` catatan approval | Persetujuan per level dicatat sebagai baris `riwayat_status` (aksi `SETUJUI`, nomor level); tidak ada tabel approval terpisah | 2026-11-22 | tech lead (kunci koordinator) | Sesuai `D-08` (satu tabel riwayat) |

## Assumptions (agent-proposed)

- A1: Nomor dibentuk dari `dokumen_counter` dengan `UPDATE ... RETURNING` (analisis §10.4 `[USULAN]`), bukan `COUNT(*) + 1`.
- A2: Pola status §2.3 adalah pola generik; daftar status per jenis mengikuti D-46 dan D-47.
- A3: Tipe item `feature`; ukuran `L` `[USULAN]` karena menyentuh nomor, status, approval, dan konkurensi sekaligus.

## Rejected alternatives

- Nomor dari `COUNT(*) + 1`: ditolak (dua pengguna dapat nomor sama; analisis §10.4).
- Riwayat per tabel dokumen: ditolak (`D-08`).
- Hapus dokumen: ditolak (analisis §7.1 prinsip 3; `D-48` pembatalan).
- Tabel approval terpisah: ditolak; approval memakai `riwayat_status` (lihat Decisions).

## Next step

Koordinator mengunci tiga `[USULAN-AGEN]` di atas. Setelah `FND-002` dan `FND-003` `done`, item ini dapat menjadi `Ready` sesuai 03.

## Status akhir — 2026-11-23

`FND-002` dan `FND-003` sudah `done`; implementasi selesai. Migrasi `0007`, service `core/dokumen`, seed approval versi `0004`, dan AC-01–AC-16 telah diverifikasi. Pemeriksaan periode sumber menunggu `FND-006` dan dicatat di `docs/tech-debt/fnd-004-periode-dokumen.md`.
