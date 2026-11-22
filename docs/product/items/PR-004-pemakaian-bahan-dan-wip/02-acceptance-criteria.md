# PR-004 — Acceptance Criteria

Setiap kriteria bisa dibuktikan dengan langkah atau perintah yang bisa diulang orang lain. Semua pertanyaan sudah terjawab; tidak ada kriteria yang menunggu keputusan. Nilai toleransi adalah placeholder (`D-51`). Angka contoh memakai placeholder `x`, `y`, `h`.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Bahan keluar `x` unit untuk WO mengurangi `saldo_stok` bahan sebesar `x` dan menambah tepat satu baris mutasi keluar, dalam satu transaksi | Catat saldo bahan. Keluarkan `x` unit. Saldo turun `x`. Mutasi bertambah satu. Uji database: kegagalan di tengah tidak menyisakan salah satunya |
| `AC-02` | Nilai bahan keluar = `x` × harga rata-rata saat keluar, dan nilai WIP WO naik sebesar angka itu | Catat `harga_rata`. Keluarkan `x` unit. Jurnal `barang_dalam_proses` = `x` × `h`. Cocok dengan hitung manual |
| `AC-03` | Pengeluaran yang melebihi stok tersedia ditolak dengan pesan dari `01-requirement.md` | Dari UI, keluarkan lebih dari saldo. Pesan menyebut bahan, tersedia, dan diminta. Saldo dan mutasi tidak berubah |
| `AC-04` | Qty nol atau negatif ditolak | Dari UI, isi `0`, lalu `-1`. Pesan "Jumlah keluar harus lebih dari nol." Tidak ada mutasi baru |
| `AC-05` | Tanggal yang mendahului mutasi terakhir ditolak | Uji service atau UI: isi tanggal sebelum mutasi terakhir. Ditolak dengan pesan yang menyebut tanggal |
| `AC-06` | Selisih per komponen tampil di detail WO dengan angka benar, dan penanda muncul bila di luar toleransi | Catat konfirmasi yang berbeda dari BOM. Buka detail WO. Selisih dan penanda sesuai perhitungan |
| `AC-07` | Pemakaian pertama mengubah WO dari `BAHAN_CUKUP` atau `BAHAN_SIAP` menjadi `BERJALAN` dan menambah satu riwayat | Catat pemakaian pertama. Status `BERJALAN`. Riwayat bertambah satu baris dengan aktor dan waktu |
| `AC-08` | Tidak ada perubahan stok dari modul Produksi selain lewat `core/inventory` | Review kode dan pencarian tulis ke `saldo_stok` atau `mutasi_stok`: hanya di `core/inventory` |
| `AC-09` | Konfirmasi dengan terpakai + sisa + scrap ≠ qty keluar ditolak dengan pesan dari `01-requirement.md` | Dari UI, isi jumlah yang tidak cocok. Ditolak. Tidak ada mutasi masuk |
| `AC-10` | Sisa yang dikonfirmasi menambah stok bahan sebesar qty sisa dan mengurangi WIP sebesar nilai sisa pada harga keluar | Keluarkan `x`, konfirmasi sisa `s`. Saldo naik `s`. Jurnal `persediaan_bahan` = `s` × harga keluar. WIP turun sama besarnya |
| `AC-11` | Scrap tidak membuat mutasi tambahan dan tidak ada jurnal scrap | Konfirmasi scrap `c`. Jumlah mutasi dan jurnal sama seperti sebelum konfirmasi scrap (kecuali baris konfirmasi) |
| `AC-12` | WO tidak bisa berpindah ke `HASIL_DICATAT` sebelum konfirmasi pemakaian lengkap | Dari UI, catat hasil saat konfirmasi belum lengkap. Ditolak dengan pesan dari `PR-005` |
| `AC-13` | Pemakaian dari status `REWORK` diizinkan dan tidak mengubah status WO | Uji: WO `REWORK`, keluarkan bahan tambahan. Mutasi tercatat. Status tetap `REWORK` |
| `AC-14` | Jurnal bahan keluar dan sisa diposting lewat `postJournal()`, debit = kredit, dengan jenis transaksi asal dan nomor transaksi | Buka jurnal: debit sama dengan kredit. Review kode: tidak ada insert jurnal dari modul Produksi |

## Verifiability

- `AC-01`, `AC-03`, `AC-04`, `AC-05`, `AC-07`, `AC-09`, `AC-10`, `AC-12`, `AC-13` → uji dari UI dan uji database; salinan saldo dan mutasi dicatat sebelum dan sesudah.
- `AC-02`, `AC-14` → uji database dan hitung manual.
- `AC-06`, `AC-11` → uji manual dari UI.
- `AC-08` → review kode dan pencarian tulis.
