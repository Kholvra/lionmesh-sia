# FND-006 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang. Angka pada AC adalah data uji, bukan keputusan bisnis. Nomor akun yang diuji hanya akun dasar `D-41`.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Jurnal dengan total debit sama dengan total kredit tersimpan, dan total debit tersimpan sama dengan total kredit tersimpan (`ARCH-001` `INV-01`). | Panggil `postJournal()` dengan dua baris uji (debit 100 akun 102, kredit 100 akun 401) dan sumber uji. Hasil: id jurnal dikembalikan. Query `detail_jurnal` untuk id itu: jumlah debit = jumlah kredit. |
| `AC-02` | Jurnal yang tidak balance ditolak dan tidak ada baris tersimpan. | Panggil dengan debit 100 dan kredit 90. Ditolak dengan "Jurnal tidak seimbang: debit 100, kredit 90."; hitungan `jurnal` dan `detail_jurnal` sebelum dan sesudah sama. |
| `AC-03` | Akun tidak aktif atau tidak ada ditolak dengan pesan yang menyebut kode akun. | Panggil dengan akun tidak aktif (uji, akun dasar dinonaktifkan sementara). Ditolak; pesan memuat kode akun; tidak ada baris tersimpan. |
| `AC-04` | Posting ke periode terkunci ditolak dengan pesan yang menyebut periode. | Kunci periode uji (status diubah di data uji; mekanisme resmi di `C-010`). Panggil posting dengan tanggal di periode itu. Ditolak dengan "Periode {bulan} {tahun} sudah dikunci; posting ditolak." |
| `AC-05` | Jurnal yang sudah diposting tidak bisa diubah atau dihapus. | Jalankan `UPDATE` dan `DELETE` pada baris `detail_jurnal` atau `jurnal` yang sudah ada dengan peran pengguna biasa. Ditolak. |
| `AC-06` | Jurnal tanpa sumber, atau dengan jenis sumber yang tidak terdaftar, ditolak (`D-43`). | Panggil tanpa sumber: ditolak "Sumber jurnal wajib diisi dan harus jenis yang terdaftar."; panggil dengan jenis tidak terdaftar: ditolak dengan pesan yang sama. |
| `AC-07` | Tidak ada penulisan langsung ke tabel jurnal dari luar core (`ARCH-001` `ARCH-03`). | Dengan role klien, jalankan `insert` ke `jurnal` dan `detail_jurnal` langsung. Ditolak oleh hak akses database. Penulisan lewat `postJournal()` berhasil. |
| `AC-08` | Jurnal dengan satu baris atau tanpa baris ditolak. | Panggil dengan satu baris, lalu tanpa baris. Ditolak dengan "Jurnal minimal dua baris."; tidak ada baris tersimpan. |
| `AC-09` | Akun yang sudah dipakai di jurnal tidak dihapus; akun dinonaktifkan (`D-50`). | Coba hapus akun yang punya baris jurnal: ditolak; akun tetap. Nonaktifkan akun itu: status `tidak aktif`, baris jurnal lama tetap. |
| `AC-10` | Header dan baris jurnal ditulis dalam satu transaksi database (`D-43`). | Paksa kegagalan pada baris kedua. Tidak ada baris `jurnal` atau `detail_jurnal` tersimpan. |
| `AC-11` | Jurnal pembalik membalik jurnal asal tanpa mengubahnya (`D-35`). | Posting jurnal dokumen uji, lalu jurnal pembalik dengan sumber dokumen batal. Jurnal asal tidak berubah. Saldo akun setelah keduanya nol. |
| `AC-12` | Koreksi periode tertutup lewat jurnal pembalik di periode berjalan (`D-44` (5)). | Periode lama dikunci. Jurnal pembalik dengan tanggal periode berjalan tersimpan; periode lama tidak menerima baris baru. |
| `AC-13` | Akun tidak aktif tidak bisa dipakai di jurnal baru (`D-50`). | Akun dinonaktifkan. Posting memakainya: ditolak dengan pesan "Akun {kode} tidak ditemukan atau tidak aktif." |
| `AC-14` | Posting oleh aktor yang tidak berhak atas transaksi pemicu ditolak (`[USULAN-AGEN]`, OQ-06-09). | Masuk sebagai peran yang tidak berhak atas pemicu uji; panggil posting: ditolak "Anda tidak berwenang memposting transaksi ini.". |
| `AC-15` | Jurnal hanya dalam IDR (`D-38`). | Panggil dengan mata uang selain IDR: ditolak. |
| `AC-16` | Bagan akun dasar sesuai `D-41`: 14 akun dengan nomor dan peran di 01; akun 150, 159, dan 702 tidak punya baris. | `select nomor, nama from akun order by nomor;` dibandingkan dengan daftar di 01. Ketiga nomor cadangan tidak ada. |

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | skrip uji `postJournal()` dan versi PostgreSQL; query AC-16 |
| Keluaran | total debit dan kredit tiap uji; pesan error; hitungan baris sebelum dan sesudah |
| Selisih | bila periode atau akun uji berbeda dari keputusan, catat; nilai akun baru (`D-51`) dicatat setelah dikutip sumbernya |

## Yang tidak diuji di sini

- Isi laporan buku besar dan neraca (`C-009`).
- Tutup buku dan jurnal penutup (`C-010`).
- Jurnal dari siklus lain (item modul).
- Nilai akun baru (PPN, utang BPJS, utang PPh 21, dan lainnya) sampai sumbernya dikutip saat implementasi (`D-51`).
