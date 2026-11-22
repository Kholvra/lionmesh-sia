# FND-005 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang. Contoh angka pada AC-01 sampai AC-03 dan AC-08 sampai AC-10 adalah data uji, bukan keputusan bisnis.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Mutasi masuk menaikkan qty dan nilai, dan menghitung ulang harga rata-rata bergerak. | Saldo P di gudang G: qty 10, nilai 100 (harga 10). Catat mutasi masuk qty 5 harga 16. Hasil saldo: qty 15, nilai 180, harga rata 12,0000. |
| `AC-02` | Mutasi keluar mengurangi qty dan nilai pada harga rata yang berlaku; harga rata tidak berubah. | Dari saldo hasil AC-01, catat keluar qty 4. Hasil: qty 11, nilai 132, harga rata 12,0000; `nilai_keluar` 48. |
| `AC-03` | Qty saldo sama dengan jumlah `mutasi_stok` untuk produk dan gudang yang sama (`ARCH-001` `INV-03`). | Setelah setiap mutasi AC-01 dan AC-02: `select sum(qty) from mutasi_stok where produk_id=… and gudang_id=…` dibandingkan dengan `saldo_stok.qty`. Sama. |
| `AC-04` | Nilai saldo sesuai qty × harga rata dengan toleransi `0,01 + qty × 0,00005` (`ARCH-001` `INV-02`). | Setelah setiap mutasi, bandingkan `saldo_stok.nilai` dengan `qty * harga_rata`. Selisih di dalam toleransi. |
| `AC-05` | Mutasi dan saldo tersimpan dalam satu transaksi; jika salah satu gagal, keduanya tidak tersimpan. | Paksa kegagalan penulisan saldo (mis. constraint sementara). Hitung baris `mutasi_stok` sebelum dan sesudah: sama. |
| `AC-06` | Role klien tidak bisa menulis `saldo_stok` atau `mutasi_stok` langsung (`ARCH-001` `ARCH-04`, `OQ-05-07`). | Dengan role klien (`anon` dan `authenticated`), jalankan `update saldo_stok`, `insert` ke `mutasi_stok`, dan `delete` pada keduanya langsung. Ditolak oleh hak akses database. Penulisan lewat fungsi `core/inventory` berhasil. |
| `AC-07` | Mutasi dengan tanggal mendahului mutasi terakhir ditolak dengan alasan yang menyebut aturan tanggal. | Buat mutasi dengan tanggal lebih awal dari mutasi terakhir. Ditolak; pesan "Tanggal mutasi tidak boleh mendahului mutasi terakhir ({tanggal})."; baris tidak bertambah. |
| `AC-08` | Mutasi dengan qty nol ditolak. | Coba qty 0. Ditolak dengan "Qty harus bukan nol.". |
| `AC-09` | Mutasi tidak bisa diubah atau dihapus. | Jalankan `UPDATE` dan `DELETE` pada `mutasi_stok` dengan peran biasa. Ditolak dengan "Mutasi stok tidak bisa diubah atau dihapus. Koreksi dengan mutasi baru." |
| `AC-10` | Keluar yang melebihi qty saldo ditolak (`OQ-05-02`). | Saldo qty 10. Coba keluar 11. Ditolak dengan "Qty keluar 11 melebihi stok tersedia 10."; saldo tidak berubah. |
| `AC-11` | Keluar seluruh saldo membuat nilai nol dan mempertahankan `harga_rata` (`OQ-05-03`). | Dari saldo qty 11 nilai 132, keluar 11. Hasil: qty 0, nilai 0, harga rata 12,0000. |
| `AC-12` | Transfer antar gudang memindahkan qty dan nilai dalam satu transaksi (`D-52`). | Saldo P di G1: qty 11 nilai 132. Transfer 3 ke G2 (kosong). Hasil: G1 qty 8 nilai 96; G2 qty 3 nilai 36, harga rata 12,0000. Dua mutasi (`TRANSFER_KELUAR`, `TRANSFER_MASUK`) tersimpan. Gagal di tengah: keduanya batal. Gudang asal sama dengan tujuan: ditolak "Gudang asal dan tujuan tidak boleh sama.". |
| `AC-13` | Stock opname menghasilkan mutasi penyesuaian sebesar selisih fisik dan saldo (`D-52`). | Saldo G1 qty 8 nilai 96. Fisik 10: mutasi `PENYESUAIAN` masuk 2, nilai 120, harga rata 12. Fisik 7: `PENYESUAIAN` keluar 3, nilai 84. Tanpa alasan: ditolak "Isi alasan penyesuaian stok.". |
| `AC-14` | Produk atau gudang nonaktif tidak bisa dipakai di mutasi baru (`D-50`). | Nonaktifkan gudang uji; coba mutasi masuk ke sana: ditolak "Gudang {kode} tidak ditemukan atau nonaktif.". Saldo dan mutasi lama tetap. |
| `AC-15` | Harga satuan masuk nol atau negatif ditolak. | Coba masuk dengan harga 0. Ditolak "Harga satuan harus lebih dari nol.". |

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | skrip uji dan versi PostgreSQL |
| Keluaran | saldo sebelum dan sesudah tiap mutasi uji; hasil `INV-02` dan `INV-03`; hasil AC-06 per role |
| Selisih | bila pembulatan atau aturan berbeda dari `OQ-05-03`, catat |

## Yang tidak diuji di sini

- Reservasi stok (`PD-003`).
- Jurnal persediaan (`FND-006`).
- Pemilihan gudang di layar (modul pemakai).
- Pembatasan peran per aksi (`FND-003`, AC-03 di sana).
