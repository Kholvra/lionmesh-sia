# C-011 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Tidak ada kriteria yang menunggu pertanyaan terbuka; kriteria dengan tanda `[USULAN-AGEN]` menunggu kunci koordinator.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Pengelola menambah produk dengan kode unik, nama, tipe (bahan, barang dalam proses, atau barang jadi, `D-41`), dan satuan dasar. Produk muncul di daftar dan bisa dipilih di dokumen baru. | Jalankan `pnpm db:reset` lalu `pnpm db:seed`. Tambah satu produk dari layar. Buka daftar dan pilihan produk di dokumen uji. Catat hasilnya. |
| `AC-02` | Kode produk, gudang, atau satuan yang sudah dipakai ditolak. Pesan menyebut kode yang sama. Tidak ada baris baru. | Tambah entri dengan kode yang sudah ada. Hitung baris tabel sebelum dan sesudah. Catat pesan. |
| `AC-03` | Produk tanpa satuan dasar ditolak dengan pesan yang menyebut field yang kurang. | Kirim permintaan tambah produk tanpa satuan dasar dari layar. Catat pesan. |
| `AC-04` | Entri nonaktif tidak muncul sebagai pilihan di dokumen baru, tetapi tetap tampil di dokumen lama yang memakainya. Entri nonaktif tidak dihapus (`D-50`). | Nonaktifkan satu gudang. Buka pilihan gudang di dokumen baru: tidak ada. Buka dokumen lama yang memakai gudang itu: masih terbaca. Hitung baris gudang: tidak berkurang. |
| `AC-05` | Modul lain mendapat daftar produk, gudang, dan satuan hanya dari core. Tabel dasar produk, gudang, dan satuan hanya dibuat di `FND-002` (`[USULAN-AGEN]`, PT-08); tidak ada tabel master produk atau gudang di luar core. | Cari definisi tabel produk, gudang, dan satuan di seluruh `supabase/migrations/` dan `src/modules/`. Hasilnya hanya di core. |
| `AC-06` | Pengguna tanpa hak mengubah master ditolak dengan pesan yang bisa dibaca. Hak per PT-06 (`[USULAN-AGEN]`). | Login sebagai peran tanpa hak, coba ubah master, catat pesan. |
| `AC-07` | Dua kali pembacaan daftar yang sama dengan data yang sama memberi hasil yang sama. | Baca daftar dua kali setelah `db:reset` + `db:seed`. Bandingkan. |
| `AC-08` | Pengelola membuat kategori produk dan memasangnya ke produk. Produk dengan kategori itu tampil bersama di daftar. `[USULAN]` | Tambah kategori dari layar, pasang ke satu produk uji, lalu buka daftar produk. Catat hasilnya. |
| `AC-09` | Konversi satuan dicatat antara dua satuan aktif. Konversi yang memakai satuan tidak aktif atau tidak ada ditolak dengan pesan yang menyebut satuan. `[USULAN]` | Tambah konversi dari layar. Coba konversi dengan satuan nonaktif. Catat pesan dan hitung baris tabel konversi. |
| `AC-10` | Mata uang dan kurs tersimpan sebagai master. Dokumen dan jurnal baru tetap dalam IDR (D-38). `[USULAN]` | Tambah mata uang dan kurs dari layar. Buat satu dokumen uji. Periksa mata uang dokumen dan jurnal: IDR. |
| `AC-11` | Entri nonaktif yang diaktifkan kembali oleh pengelolanya muncul lagi sebagai pilihan dokumen baru. `[USULAN-AGEN]` (PT-07) | Nonaktifkan satu satuan, aktifkan kembali, buka pilihan satuan di dokumen baru: muncul. |

## Edge cases (optional)

- Kode yang sama dengan entri yang sudah nonaktif: ditolak, karena kode unik (`[USULAN]`, berlaku juga untuk entri nonaktif).
- Pengaktifan kembali entri nonaktif: AC-11.

## Verifiability

- AC-01 sampai AC-04, AC-06, dan AC-11 → langkah uji dari layar, dengan catatan perintah reset dan seed.
- AC-02 dan AC-03 → perintah hitung baris dan catatan pesan.
- AC-05 → pencarian kode yang bisa diulang (perintah `grep` dicatat di `05-evidence.md`).
- AC-07 → pembanding hasil.
- AC-08 sampai AC-10 → langkah uji dari layar dengan catatan reset dan seed.
