# PG-005 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Titik awal pembuktian adalah skema `siap`:

```text
pnpm db:reset
```

Sampai test runner tersedia, pembuktian dilakukan lewat UI. Permintaan yang sudah disetujui dan pemasok yang sudah ditetapkan dibuat lewat `PG-002`, `PG-003`, dan `PG-004`.

Tarif PPN untuk uji memakai seed uji dengan dua versi berlaku (`D-51`(a)). Nilai uji di bawah adalah placeholder dan bukan tarif regulasi; nilai regulasi diverifikasi dan dikutip saat `PD-005` ditulis.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Purchasing menerbitkan PO dari permintaan yang sudah ditetapkan pemasoknya; PO tampil berstatus `DITERBITKAN` dengan nomor unik sesuai format `D-50` | Dari `pnpm db:reset`, siapkan permintaan sampai `PEMASOK_DITETAPKAN`. Login sebagai Purchasing, terbitkan PO. Catat nomor (`PO/{tahun}/{bulan}/{urut}`) dan status. Permintaan juga berstatus `DITERBITKAN` |
| `AC-02` | PO menampilkan PPN per baris dan total sesuai tarif berversi yang berlaku pada tanggal PO (`D-17`, `D-51`(a)) | Seed uji: dua versi tarif uji dengan tanggal berlaku berbeda (`tarif uji A` dan `tarif uji B`). Terbitkan PO dua baris pada tanggal yang jatuh di versi A, hitung manual, bandingkan dengan total yang tampil. Ulangi untuk tanggal di versi B |
| `AC-03` | Permintaan yang ditolak atau dibatalkan tidak bisa menjadi PO (`D-46`, `D-48`) | Tolak permintaan di `PG-003`, coba terbitkan PO. Catat pesan dan pastikan PO tidak terbentuk. Ulangi dengan permintaan yang dibatalkan pemohon |
| `AC-04` | PO tanpa pemasok ditetapkan ditolak | Dari permintaan belum ditetapkan, coba terbitkan PO. Catat pesan |
| `AC-05` | PO tanpa baris atau dengan qty nol ditolak | Simpan PO tanpa baris, lalu dengan qty 0. Catat pesan dan pastikan tidak ada PO baru |
| `AC-06` | Menerbitkan PO tidak mengubah stok | Catat saldo stok barang sebelum dan sesudah AC-01. Angka harus sama |
| `AC-07` | Menerbitkan PO tidak membuat jurnal atau mengubah saldo utang | Catat jumlah baris jurnal dan saldo utang sebelum dan sesudah AC-01. Angka harus sama |
| `AC-08` | PO yang sudah diterbitkan tidak bisa diubah (`D-48`, `[USULAN-AGEN]` Q-06) | Dari AC-01, tidak ada aksi ubah di layar PO `DITERBITKAN`. Kirim perubahan qty lewat alat pengembang untuk PO tersebut. Catat pesan penolakan dan pastikan qty dan harga tidak berubah |
| `AC-09` | Setiap perubahan status PO menambah satu baris riwayat dengan aktor dan waktu | Terbitkan PO. Baris riwayat pertama ditulis saat `DITERBITKAN`. Konfirmasi dicatat sebagai catatan teks (`[USULAN-AGEN]` Q-02) dan tidak menambah baris status. Perubahan berikutnya (`DITERIMA_SEBAGIAN`, `DITERIMA`) diuji di `PG-006` |
| `AC-10` | Pembatalan PO sebelum penerimaan dengan alasan menjadikan PO dan permintaan `DIBATALKAN` (`D-48`, `[USULAN-AGEN]` Q-05) | Dari AC-01, login sebagai Purchasing, batalkan PO dengan alasan "uji batal". Catat status PO `DIBATALKAN`, status permintaan `DIBATALKAN`, dan baris riwayat keduanya dengan alasan |
| `AC-11` | Hasil setelah reset dapat diulang | Jalankan `pnpm db:reset`, ulangi AC-01 dua kali. Daftar PO hanya berisi hasil langkah saat itu |
| `AC-12` | Pembatalan tanpa alasan ditolak (`D-48`) | Dari AC-01, pilih batalkan, kosongkan alasan, kirim. Catat pesan dan pastikan status tetap `DITERBITKAN` |
| `AC-13` | Permintaan `DIBATALKAN` tidak bisa diterbitkan PO lagi; pemesanan ulang lewat permintaan baru (`[USULAN-AGEN]` Q-05, Q-06) | Dari AC-10, coba terbitkan PO untuk permintaan yang sama. Catat pesan penolakan. Buat permintaan baru di `PG-002`, ajukan, dan pastikan permintaan baru bisa diproses sampai PO |
| `AC-14` | Pembatalan setelah penerimaan pertama ditolak (`[USULAN-AGEN]` Q-05) | Lintas item `PG-006`: setelah penerimaan pertama, coba batalkan PO. Catat pesan dan pastikan status tetap |
| `AC-15` | Pembatalan PO yang permintaannya sudah `PEMASOK_DITETAPKAN` menjadikan permintaan `DIBATALKAN`; pemasok tidak diganti (`D-46`) | Dari AC-01, pastikan tidak ada aksi ganti pemasok pada permintaan `DITERBITKAN`. Setelah AC-10, status permintaan `DIBATALKAN` (lihat AC-10) |

## Edge cases (optional)

- Permintaan dengan lebih dari satu pemasok: tidak mungkin (satu pemasok per permintaan, `[USULAN-AGEN]` `PG-004` Q-09).
- PO dalam mata uang asing: tidak berlaku. Transaksi IDR (`D-38`).
- Tarif PPN belum tersedia untuk tanggal PO: penerbitan ditolak (lihat `01-requirement.md` Validasi).

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | `pnpm db:reset` dan versi alat yang dipakai |
| Keluaran | ringkasan hasil tiap AC, bukan hanya "lulus" |
| Selisih | bila ada langkah yang menyimpang dari requirement, tulis alasannya |

## Yang tidak diuji di sini

- Penerimaan barang dan perubahan stok saat penerimaan: diuji di `PG-006`.
- Pembatalan setelah penerimaan lewat jurnal pembalik: diuji di `PG-006` dan `PG-007` (AC-14 lintas item).
- Pencocokan tiga dokumen dan jurnal utang: diuji di `PG-008`.
- Izin lintas peran secara menyeluruh: diuji di `FND-003`.
