# PG-002 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Titik awal pembuktian adalah skema `siap`:

```text
pnpm db:reset
```

Sampai test runner tersedia, pembuktian dilakukan lewat UI dengan langkah yang sama dari titik awal ini. Data produk untuk uji dibuat lewat UI `C-011`, bukan lewat SQL manual. Pemasok tidak diperlukan untuk membuat PR (lihat `01-requirement.md`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Gudang mengajukan permintaan dengan dua barang dan tanggal butuh; permintaan tersimpan dengan nomor dokumen dan status `DIAJUKAN` | Dari `pnpm db:reset`, login sebagai Gudang, buka Permintaan Pembelian, tambah dua baris produk dan qty, isi tanggal butuh, ajukan. Catat nomor, status, dan jumlah baris |
| `AC-02` | Permintaan tanpa baris barang ditolak | Dari form baru, simpan tanpa baris. Catat pesan dan pastikan daftar tidak bertambah |
| `AC-03` | Qty nol atau negatif ditolak | Isi qty 0, simpan. Catat pesan dan pastikan data tidak berubah |
| `AC-04` | Produksi mengajukan permintaan; Purchasing melihat permintaan itu di antrean | Login sebagai Produksi, ajukan permintaan. Login sebagai Purchasing, buka antrean, catat nomor dan asal pengaju |
| `AC-05` | Pengaju tidak bisa menimpa pengaju atau identitasnya lewat form | Kirim form dengan field pengaju yang diubah lewat alat pengembang. Catat bahwa pengaju yang tersimpan adalah pengguna sesi |
| `AC-06` | Setiap perubahan status menambah satu baris riwayat dengan aktor dan waktu | Ajukan permintaan, kembalikan oleh Purchasing (`DIAJUKAN → REVISI`), ajukan ulang (`REVISI → DIAJUKAN`), periksa (`→ MENUNGGU_PERSETUJUAN`). Buka riwayat dan catat baris per transisi (sesuai `D-46`) |
| `AC-07` | Permintaan yang dibatalkan pemohon tidak dihapus dan tampil dengan status `DIBATALKAN` (`D-48`) | Dari AC-01, login sebagai Gudang (pemohon), batalkan dengan alasan "uji batal". Catat status `DIBATALKAN`, baris riwayat dengan alasan, dan bahwa permintaan tetap tampil di daftar |
| `AC-08` | Pengguna tanpa izin tidak bisa mengajukan (`D-33`: Gudang dan Produksi) | Login sebagai peran yang tidak diizinkan (mis. Accounting), coba ajukan, catat pesan izin |
| `AC-09` | Nomor permintaan unik dengan format `D-50` | Ajukan tiga permintaan berurutan, catat nomor. Nomor tidak boleh sama dan mengikuti format `PR/{tahun}/{bulan}/{urut}` |
| `AC-10` | Hasil setelah reset dapat diulang | Jalankan `pnpm db:reset`, ulangi AC-01 dua kali. Daftar hanya berisi hasil langkah saat itu |
| `AC-11` | Pembatalan tanpa alasan ditolak (`D-48`) | Dari AC-01, pilih batalkan, kosongkan alasan, kirim. Catat pesan dan pastikan status tetap `DIAJUKAN` |
| `AC-12` | Pembatalan atau revisi oleh bukan pemohon ditolak (`D-48`) | Dari AC-01, login sebagai Gudang lain atau Purchasing, coba batalkan atau revisi. Catat pesan dan pastikan status tidak berubah |
| `AC-13` | Revisi sukarela dari `MENUNGGU_PERSETUJUAN` mengembalikan status ke `DIAJUKAN` (`[USULAN-AGEN]` Q-08, `D-48`) | Ajukan permintaan, periksa oleh Purchasing (`→ MENUNGGU_PERSETUJUAN`), lalu login sebagai pemohon dan revisi. Catat status `DIAJUKAN` dan baris riwayat. Gugurnya approval dibuktikan di `PG-003` AC-11 |
| `AC-14` | Permintaan `DIBATALKAN` atau `DITOLAK` tidak bisa diubah statusnya lagi (`D-48`, `D-46`) | Dari AC-07, coba ajukan ulang atau periksa permintaan yang sudah `DIBATALKAN`. Catat pesan dan pastikan status tetap |
| `AC-15` | Pembatalan setelah PO terbit ditolak (`[USULAN-AGEN]`) | Lintas item `PG-005`: setelah PO terbit untuk permintaan, coba batalkan permintaan dari PG-002. Catat pesan dan pastikan status tetap `DITERBITKAN` |

## Edge cases (optional)

- Permintaan dari Produksi dengan referensi produksi: kolom opsional, tanpa validasi keberadaan sampai `PR-002` (`[USULAN-AGEN]` Q-04).
- Produk nonaktif di `C-011`: produk tidak bisa dipilih untuk baris baru (`D-50`, master nonaktif tidak bisa dipilih untuk dokumen baru).
- Hanya satu gudang di seed: pilihan gudang tidak tampil dan gudang terisi otomatis (`D-52`).

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | `pnpm db:reset` dan versi alat yang dipakai |
| Keluaran | ringkasan hasil tiap AC, bukan hanya "lulus" |
| Selisih | bila ada langkah yang menyimpang dari requirement, tulis alasannya |

## Yang tidak diuji di sini

- Review dan approval: diuji di `PG-003`.
- Pemilihan pemasok: diuji di `PG-004`.
- Pembatalan PO dan efek ke permintaan (AC-15): diuji lengkap di `PG-005`.
- Kebenaran tabel dan aturan status di `C-013`: diuji di item `C-013`.
- Perilaku izin lintas peran secara menyeluruh: diuji di `FND-003`.
