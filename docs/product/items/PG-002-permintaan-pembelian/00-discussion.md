# PG-002 — Diskusi

## Konteks

Item backlog `PG-002` berjudul "Permintaan pembelian" (track PG-B pengadaan, level 2, depends on `PG-001`, `C-011`, dan `C-013`). Sumber fitur: `reference/analisis-sia.md` §5.3 fitur PG-2 (dari Gudang atau Produksi; P0).

`C-013` adalah domain pengadaan di core (`D-05`, `ARCH-06`). Tabel `permintaan_pembelian` dan `detail_pr` tercantum di core (`analisis-sia.md` §7.2). Item ini membangun layar dan alur pengajuan, bukan tabel baru. Daftar status permintaan mengikuti state machine di `diagram-sia-lengkap.md` §5.2 (`D-46`).

## Kenapa ini item

Kebutuhan barang dari Gudang dan Produksi perlu satu dokumen yang bisa ditelusuri ke pengaju dan statusnya. `analisis-sia.md` §4.1 mengunci satu PR untuk dua pemohon, dibedakan oleh referensi produksi (`wo_id`, usulan §8.2 #2). Produksi tidak membangun PO atau PR sendiri.

## Alternatif yang dipertimbangkan

| Alternatif | Kenapa tidak dipilih |
|---|---|
| Produksi membuat PR di modulnya sendiri | `D-05` dan `analisis-sia.md` §4.1: dua jalur pengadaan menghasilkan dua tabel utang dan laporan yang tidak utuh |
| Tabel PR dibuat di modul Pengeluaran | `ARCH-06` dan `D-05` menaruh tabel pengadaan di core (`D-31`) |

## Keputusan yang diambil (dari sumber terkunci)

1. `D-05`: tabel dan aturan pengadaan berada di `C-013`. Layar dan alur pengajuan milik track PG-B.
2. `D-08`: riwayat status polimorfik untuk semua dokumen, lewat `riwayat_status`.
3. `ARCH-05`: penomoran dan riwayat dokumen melalui `core/dokumen`.
4. `ARCH-08`: modul tidak membaca tabel modul lain. Data lintas siklus lewat service core.
5. `analisis-sia.md` §8.1 (`[SUMBER]`): PR yang ditolak berhenti dan tidak bisa menjadi PO.
6. `D-46`: daftar status mengikuti diagram §5.2. Diagram memulai permintaan dari `DIAJUKAN`; `DRAFT` dan `DIPERIKSA` tidak ada di diagram.
7. `D-33`: matriks v0. Pengajuan PR: Gudang dan Produksi. Pemeriksaan: Purchasing. Persetujuan: Manajemen.
8. `D-38`: `C-011` memuat kategori produk dan konversi satuan.
9. `D-48`: pembatalan oleh pemohon dengan alasan wajib sebelum diposting. Approval gugur dan diulang bila dokumen direvisi.
10. `D-50`: format nomor dokumen `{TIPE}/{TAHUN}/{BULAN}/{URUT}`, ditetapkan di `FND-004`.
11. `D-52`: pemilihan gudang di layar tampil hanya bila ada lebih dari satu gudang.

## Pertanyaan terbuka

Ringkasan klasifikasi (diperbarui 2026-11-22 setelah `D-47` sampai `D-53`): 10 pertanyaan. Terjawab `D-xx`: 6 (Q-01, Q-02, Q-07, Q-08, Q-09, Q-10; Q-07 dan Q-08 juga punya detail `[USULAN-AGEN]`). Terjawab `[USULAN-AGEN]`: 4 (Q-03, Q-04, Q-05, Q-06). Terbuka: 0.

- `Q-01` Status PR bertentangan antar sumber: `analisis-sia.md` §2.3 (`DIAJUKAN → DIPERIKSA → DISETUJUI`) dan §6.4 (`MENUNGGU_PERSETUJUAN`, `PEMASOK_DITETAPKAN`). Siapa pemilik daftar status final?
  → **Terjawab — D-46.** Daftar dan urutan status PR mengikuti §5.2: `DIAJUKAN`, `REVISI`, `MENUNGGU_PERSETUJUAN`, `DISETUJUI`, `DITOLAK`, `PEMASOK_DITETAPKAN`, lalu `DITERBITKAN` dan seterusnya. `DIPERIKSA` dan `DRAFT` tidak masuk daftar. Nama akhir tetap spec (`D-46`).

- `Q-02` Dependensi ke `C-011` tidak tercantum di `backlog.md`. Apakah `C-011` ditambahkan?
  → **Terjawab — D-38 dan backlog.** `C-011` sudah tercantum di `depends on` PG-002 (`backlog.md`). `C-011` memuat produk dan konversi satuan (`D-38`). Aturan satuan yang tidak cocok dengan produk menjadi bagian spec `C-011`.

- `Q-03` Backlog menulis `PG-002` bergantung pada `PG-001`, tetapi alasannya tidak tercatat. PR tidak memuat pemasok.
  → **Terjawab — [USULAN-AGEN].** Dependensi di `backlog.md` dipertahankan dan paket ini tidak mengubah backlog. Sumber (`LAPORAN_PENGERJAAN_PROYEK.txt` KF-PG02 dan langkah 3) mendukung bahwa PR tidak membutuhkan pemasok, jadi koordinator dapat menghapus dependensi tersebut bila setuju. Alasan: keputusan dependensi adalah wewenang tech lead, bukan paket item.

- `Q-04` PR dari Produksi membawa referensi perintah produksi (`wo_id`, usulan §8.2 #2). Perintah produksi (`PR-002`) belum ada. Apakah kolom referensi wajib, dan apakah divalidasi?
  → **Terjawab — [USULAN-AGEN].** Referensi perintah produksi wajib untuk permintaan Produksi dan opsional untuk Gudang; keberadaannya divalidasi saat domain `PR-002` tersedia (D-64). Alasan: `PR-002` belum ada, dan `Makalah_Siklus_Produksi.txt` KF-PR04 menyatakan permintaan bahan dibuat dari perintah produksi, bukan sebaliknya.

- `Q-05` Apakah PR membawa estimasi nilai (IDR)? Ambang approval di `PG-003` bergantung pada nilai.
  → **Terjawab — [USULAN-AGEN].** Estimasi nilai PR (IDR) tidak wajib saat pengajuan. Purchasing mengisinya saat pemeriksaan (`DIAJUKAN → MENUNGGU_PERSETUJUAN`), karena approval terjadi sebelum pemilihan pemasok (`PG-004`). Seed approval satu jenjang untuk semua nilai (`D-51`(c)) tidak memerlukan nilai ini. Alasan: sumber berbeda pendapat (makalah menyebut "nilai pembelian", `proses-bisnis.md` A1 menyebut PR tanpa harga) dan urutan proses membutuhkan nilai sebelum supplier dipilih.

- `Q-06` Apakah PR punya tanggal kebutuhan dan atau prioritas?
  → **Terjawab — [USULAN-AGEN].** Tanggal butuh wajib (`LAPORAN_PENGERJAAN_PROYEK.txt` KF-PG02 dan aturan validasi 1). Prioritas tidak ada di v0. Antrean Purchasing diurutkan menurut tanggal butuh. Alasan: sumber tidak menyebut prioritas, dan menambah field tanpa aturan memperbesar cakupan.

- `Q-07` Pembatalan PR: dari status apa, dan siapa yang boleh?
  → **Terjawab — D-48** (aturan) dengan detail `[USULAN-AGEN]`. Pembatalan dilakukan pemohon dengan alasan wajib, sebelum PO terbit. Dari `DIAJUKAN`, `REVISI`, `MENUNGGU_PERSETUJUAN`, `DISETUJUI`, dan `PEMASOK_DITETAPKAN` menuju `DIBATALKAN`. Dari `DITOLAK` dan `DIBATALKAN` tidak ada transisi. Nama `DIBATALKAN` mengikuti `analisis-sia.md` §2.3. Catatan pertentangan: `D-47`(d) menunda pembatalan sebagai pertanyaan bisnis, lalu `D-48` (lebih baru dan eksplisit) menetapkan aturan pembatalan. Paket mengikuti `D-48`.

- `Q-08` Apakah PR yang sudah diajukan boleh direvisi oleh pengaju?
  → **Terjawab — D-48** (revisi gugurkan approval) dengan detail `[USULAN-AGEN]`. Pengaju boleh mengubah baris dan keterangan saat status `DIAJUKAN` atau `REVISI` tanpa mengubah status. Dari `MENUNGGU_PERSETUJUAN` atau `DISETUJUI`, revisi sukarela mengembalikan status ke `DIAJUKAN` dan approval gugur, sehingga diulang dari awal (`D-48`). Alasan: `D-48` mengasumsikan dokumen dapat direvisi setelah approval; `D-46` tidak memuat transisi itu, sehingga transisi ini ditambahkan sebagai usulan.

- `Q-09` Apakah PR wajib menyebut gudang tujuan?
  → **Terjawab — D-52.** Pemilihan gudang tampil hanya bila ada lebih dari satu gudang. Dengan satu gudang, gudang terisi otomatis.

- `Q-10` Matriks hak pengajuan (Gudang dan Produksi mengajukan, Purchasing memeriksa) berstatus `[USULAN]`.
  → **Terjawab — D-33.** Ajukan PR: Gudang, Produksi. Periksa PR: Purchasing. Setujui PR: Manajemen.

## Assumptions (agent-proposed)

- `[ANALISIS]` Pengajuan PR tidak menghasilkan mutasi stok atau baris jurnal. Daftar pemicu jurnal di `analisis-sia.md` §6.7 tidak memuat PR.
- `[USULAN]` Dokumen PR tidak dihapus, hanya dibatalkan (§8.2 #9; `D-48`).
- `[USULAN]` Nomor PR dari `core/dokumen` dengan format `PR/{tahun}/{bulan}/{urut}` sesuai `D-50`, contoh `PR/2026/11/0001`. Contoh `PR-202609-0002` di `proses-bisnis.md` dikalahkan `D-50`.

## Next step

Tidak ada pertanyaan terbuka. Semua `[USULAN-AGEN]` di atas menunggu kunci koordinator. Item tetap `specified` sampai dependensi `done`; lihat `03-readiness-review.md`.
