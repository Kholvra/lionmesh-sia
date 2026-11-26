# C-013 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Karena item ini core tanpa layar sendiri, pembuktian dilakukan lewat uji service yang memanggil core (PT-09, disahkan D-58), dan lewat layar Pengeluaran saat sudah ada. Keputusan konsisten disahkan melalui D-58 dan D-64.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | PR yang diajukan Gudang (tanpa `wo_id`) dan PR yang diajukan Produksi (dengan `wo_id`) tersimpan di tabel yang sama. `wo_id` nullable tanpa foreign key di item ini (PT-05, D-58 dan D-64). | Jalankan `pnpm db:reset` lalu `pnpm db:seed`. Ajukan satu PR dari Gudang dan satu dari Produksi lewat `pengadaan.ajukanPR()`. Hitung baris di tabel PR. Catat kolom `wo_id` masing-masing. |
| `AC-02` | PR yang ditolak tidak bisa dijadikan PO. Pesan menyebut status PR. Tidak ada PO baru. | Tolak satu PR. Coba buat PO darinya. Catat pesan dan hitung baris PO. |
| `AC-03` | PO hanya dapat dibuat dari PR berstatus `DISETUJUI` (atau `PEMASOK_DITETAPKAN` setelah pemasok dipilih, sesuai diagram §5.2). | Buat PO dari PR `DISETUJUI` (berhasil). Buat PO dari PR `MENUNGGU_PERSETUJUAN` (ditolak). Catat hasil. |
| `AC-04` | Penerimaan dengan qty kurang dari qty PO tercatat sebagai exception dengan selisih. Selisih qty tidak pernah lolos toleransi. | Catat penerimaan dengan qty 8 dari PO qty 10. Periksa baris exception. Pastikan selisih 2 tercatat dan tidak ada toleransi yang diterapkan. |
| `AC-05` | Penerimaan dengan qty lebih besar dari qty PO ditolak sebagai exception dan tidak menghasilkan stok masuk (`D-49`). | Catat penerimaan dengan qty 12 dari PO qty 10. Pastikan penerimaan ditolak, catat exception, dan baca `saldo_stok`: tidak berubah. |
| `AC-06` | Penerimaan saja tidak mengubah `saldo_stok`. Stok bertambah hanya setelah QC lulus, sebesar qty lolos (`D-36`). | Catat penerimaan. Baca `saldo_stok` sebelum dan sesudah; harus sama. Catat QC lulus untuk qty uji. Baca lagi; harus bertambah sebesar qty lolos. |
| `AC-07` | Setiap transisi status PR dan PO menambah tepat satu baris `riwayat_status` dengan aktor dan waktu. | Hitung baris `riwayat_status` untuk dokumen uji sebelum dan sesudah setiap transisi. Periksa kolom aktor dan waktu. |
| `AC-08` | Dokumen yang dibatalkan tetap ada di tabel dengan status `DIBATALKAN` dan alasan wajib. Tidak ada `DELETE`. Pembatalan hanya sebelum batas D-57 dan D-64. | Batalkan satu PR yang belum punya PO. Hitung baris. Baca status dan alasan. Periksa tidak ada perintah hapus di kode pengadaan. |
| `AC-09` | Tidak ada modul yang menulis tabel pengadaan langsung. Tabel dan aturan hanya di `core/pengadaan`. | Cari `insert`, `update`, dan `delete` ke tabel PR, PO, dan penerimaan di `src/modules/` dan `src/core/`. Hasilnya hanya di `core/pengadaan`. |
| `AC-10` | Dua kali penerimaan untuk PO yang sama dan data yang sama menghasilkan hasil identik setelah reset dan seed. | Jalankan skenario dua kali dari `db:reset` + `db:seed`. Bandingkan jumlah baris dan nilai kunci. |
| `AC-11` | PR `DITOLAK` tidak punya transisi keluar. Pemohon membuat PR baru bila perlu (`D-46`). | Tolak satu PR. Coba ubah status ke `REVISI` atau `DISETUJUI`: ditolak. Ajukan PR baru: berhasil. |
| `AC-12` | Penerimaan parsial: total qty penerimaan untuk satu PO sampai sama dengan qty PO, lalu PO berstatus `DITERIMA`. Penerimaan berikutnya yang melewati sisa ditolak (`D-49`, `D-46`). | Terima 4 dari PO 10, lalu 6, lalu coba 1 lagi. Catat status PO dan hasil penerimaan ke-3. |
| `AC-13` | Setiap QC lulus menghasilkan jurnal Dr `persediaan_bahan` / Cr `gr_ir` senilai qty lolos × harga PO (`D-44` (1), `D-35`). Penerimaan yang belum QC tidak menghasilkan jurnal. | Catat penerimaan lalu QC lulus untuk qty uji. Hitung baris jurnal sebelum dan sesudah. Periksa akun dan nilai. |
| `AC-14` | Pemohon PR tidak bisa menyetujui PR miliknya sendiri (`D-42`, `D-48`). | Login sebagai pemohon, coba setujui PR-nya. Ditolak dengan pesan. |
| `AC-15` | Pembatalan PR `DISETUJUI` oleh pemohon atau PO `DITERBITKAN` tanpa penerimaan oleh Purchasing pembuat dengan alasan berhasil. Setelah penerimaan pertama, PO tidak bisa dibatalkan (D-64). | Batalkan PO tanpa penerimaan: berhasil dengan alasan. Catat satu PO yang sudah punya penerimaan, coba batalkan: ditolak. |
| `AC-16` | QC lulus bersifat atomik untuk status, riwayat, mutasi, saldo dan jurnal. | Paksa kegagalan stok, jurnal, dan riwayat masing-masing; bandingkan seluruh data sebelum dan sesudah, tidak ada perubahan parsial. Ulangi tanpa kegagalan dan periksa semuanya tersimpan. |
| `AC-17` | Posting QC pada periode `kunci` ditolak tanpa perubahan status, stok, riwayat atau jurnal. | Kunci periode pada fixture terisolasi; coba QC lulus dan bandingkan seluruh data sebelum dan sesudah. |
| `AC-18` | PR Produksi tanpa `wo_id` ditolak; validasi keberadaan dilakukan bila domain PR-002 tersedia. | Uji PR Produksi tanpa referensi dan PR Gudang tanpa referensi; uji referensi tidak ada setelah integrasi PR-002 tersedia. |
| `AC-19` | QC lulus dengan nilai jurnal setelah pembulatan nol ditolak tanpa mengubah stok, jurnal atau status. | Buat penerimaan qty 1 dengan harga 0,0001, coba QC lulus, lalu bandingkan saldo, jurnal dan status sebelum dan sesudah. |

## Edge cases (optional)

- Pembatalan PO yang sudah ada penerimaan: ditolak (AC-15).
- Penerimaan parsial dalam beberapa dokumen: AC-12.

## Verifiability

- AC-01 sampai AC-03, AC-05, AC-07, AC-11, AC-12, AC-14, dan AC-15 → uji service yang memanggil core (PT-09), dengan catatan perintah reset dan seed. Layar Pengeluaran menjadi bukti akhir saat sudah ada.
- AC-04, AC-06, AC-13 → pembanding baris dan saldo sebelum dan sesudah.
- AC-08 → hitung baris dan pencarian kode.
- AC-09 → pencarian kode yang bisa diulang; hasilnya dicatat di `05-evidence.md`.
- AC-10 → pembanding snapshot, bukan pemeriksaan manual.

- AC-16 sampai AC-19 → uji kegagalan atomik, periode terkunci, referensi Produksi, dan nilai jurnal nol pada database uji terisolasi.
