# INT-002 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Tidak ada kriteria yang menunggu pertanyaan terbuka; kriteria dengan tanda `[USULAN-AGEN]` menunggu kunci koordinator.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Dari `db:reset` lalu `db:seed`, rantai dijalankan berurutan dari pesanan sampai laporan tanpa perubahan database manual. | Jalankan `pnpm db:reset`, `pnpm db:seed`, lalu rantai (skrip, PT-05 `[USULAN-AGEN]`). Catat setiap perintah dan langkah. Periksa tidak ada perintah SQL di luar rantai. |
| `AC-02` | Setiap dokumen dalam rantai mencapai status akhir yang diharapkan. Nilai yang diharapkan dihitung tangan dan dicatat di `05-evidence.md` sebelum run (PT-02, `[USULAN-AGEN]`), dari skenario kawat (`D-51` (g)). | Bandingkan status akhir setiap dokumen dengan tabel nilai yang diharapkan (dicatat sebelum rantai). |
| `AC-03` | Setiap perpindahan status dokumen dalam rantai menambah tepat satu baris `riwayat_status` dengan aktor dan waktu. | Hitung `riwayat_status` per dokumen sebelum dan sesudah setiap langkah. Periksa kolom aktor dan waktu. |
| `AC-04` | Setiap perpindahan status yang memposting jurnal menghasilkan jurnal yang balance. | Setelah setiap langkah, jumlahkan debit dan kredit jurnal yang baru. Harus sama. |
| `AC-05` | Angka laporan keuangan setelah rantai sesuai nilai yang diharapkan (PT-02, `[USULAN-AGEN]`). | Buka laporan dari `C-009`. Bandingkan setiap angka dengan tabel nilai yang diharapkan. |
| `AC-06` | Nilai persediaan di neraca sama dengan total `saldo_stok` setelah rantai. | Jumlahkan `saldo_stok.nilai`. Bandingkan dengan akun persediaan di neraca (peran `persediaan_bahan`, `persediaan_wip`, `persediaan_barang_jadi`). |
| `AC-07` | Dua kali rantai dari `db:reset` + `db:seed` menghasilkan jumlah dokumen, jurnal, dan total yang sama. | Jalankan dua kali. Bandingkan snapshot jumlah baris dan nilai kunci. |
| `AC-08` | Tiga jalur gagal menghasilkan penolakan yang sesuai dan tidak menyisakan dokumen setengah jadi (`D-51` (g)): (a) batas kredit: pesanan berhenti di `MENUNGGU_PERSETUJUAN_KREDIT` dan tidak lanjut (`D-16`, `D-47` (a)); (b) permintaan ditolak: PR `DITOLAK` tidak menjadi PO (`D-46`); (c) QC gagal: penerimaan `QC_GAGAL` tidak memicu stok masuk (`D-36`). | Jalankan tiga skenario gagal satu per satu dari `db:reset` + `db:seed`. Hitung dokumen dan jurnal sebelum dan sesudah. |
| `AC-09` | Rantai menolak jalan bila data uji belum diseed, dengan pesan yang menyebut `pnpm db:seed`. | Jalankan rantai dari `db:reset` tanpa seed. Catat pesan. |
| `AC-10` | Pada setiap jalur gagal, tidak ada mutasi stok atau jurnal baru selain yang sudah tercatat sebelum kegagalan. | Bandingkan `mutasi_stok`, `saldo_stok`, dan `jurnal` sebelum dan sesudah kegagalan. Tidak boleh berubah. |

## Edge cases (optional)

- Rantai dijalankan di tengah periode yang sudah ditutup: ditolak oleh posting ke periode terkunci (`C-010`, AC-02 `INT-001`).
- Dokumen dibatalkan di tengah rantai: tidak termasuk cakupan (`D-51` (g) hanya tiga jalur gagal).

## Verifiability

- AC-01, AC-03, AC-04, AC-06, AC-07, AC-09, AC-10 → perintah dan pembanding yang bisa diulang.
- AC-02 dan AC-05 → tabel nilai yang diharapkan dicatat sebelum rantai dijalankan.
- AC-08 → tiga skenario gagal yang didaftar di `D-51` (g).
