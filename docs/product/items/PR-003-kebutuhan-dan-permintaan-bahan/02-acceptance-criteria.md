# PR-003 — Acceptance Criteria

Setiap kriteria bisa dibuktikan dengan langkah atau perintah yang bisa diulang orang lain. Rumus dan status mengikuti `01-requirement.md`; semua pertanyaan sudah terjawab, tidak ada kriteria yang menunggu keputusan. Angka toleransi adalah placeholder (`D-51`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Untuk WO dengan versi BOM, sistem menampilkan kebutuhan per komponen sesuai rumus (qty WO × `qty_per_unit` × (1 + toleransi scrap), dibulatkan ke atas) | Dari UI, buka WO. Bandingkan dengan hitung manual dari BOM dan qty WO. Hasil sama |
| `AC-02` | Cek bahan dengan kebutuhan lebih besar dari stok tersedia mengubah WO ke `BAHAN_KURANG` dan mencatat riwayat | Siapkan stok lebih kecil dari kebutuhan (data uji). Jalankan cek. Status `BAHAN_KURANG`. Riwayat bertambah satu baris |
| `AC-03` | Cek ketersediaan tidak mengubah stok | Catat `saldo_stok` dan jumlah baris `mutasi_stok` sebelum dan sesudah cek. Keduanya sama |
| `AC-04` | Permintaan dibuat lewat `pengadaan.ajukanPR()` dan membawa `wo_id` | Buat permintaan dari WO. Buka dokumen permintaan di pengadaan: `wo_id` terisi. Review kode: tidak ada insert langsung ke tabel permintaan dari modul Produksi |
| `AC-05` | Permintaan `DITOLAK` membawa WO ke `DIBATALKAN`; PO tidak bisa dibuat dari permintaan itu | Tolak permintaan di pengadaan. Cek WO: `DIBATALKAN`. Coba buat PO dari permintaan: ditolak dengan pesan yang menyebut status permintaan |
| `AC-06` | Permintaan hanya dapat dibuat dari WO berstatus `BAHAN_KURANG` | Dari UI, buka WO `DIRENCANAKAN` dan `BERJALAN`. Tombol buat permintaan tidak ada atau ditolak dengan pesan dari `01-requirement.md` |
| `AC-07` | Produk tanpa versi BOM berlaku tidak bisa diajukan | Dari UI, buka WO produk tanpa BOM (jika bisa dibuat menurut `PR-002` AC-07). Ajukan: ditolak dengan pesan yang menyebut BOM |
| `AC-08` | Hanya peran Produksi dan Gudang yang dapat mengajukan permintaan | Login sebagai peran selain keduanya; coba ajukan. Ditolak. Data tidak berubah |
| `AC-09` | Permintaan hanya untuk selisih kebutuhan dikurangi tersedia; komponen tanpa selisih tidak masuk permintaan | Siapkan stok sebagian. Ajukan. Jumlah pada permintaan = selisih per komponen |
| `AC-10` | Gudang sumber WO dipakai untuk cek dan permintaan; layar memilih gudang hanya tampil bila ada lebih dari satu gudang | Uji dengan satu gudang (seed): tidak ada pilihan. Uji dengan dua gudang: pilihan tampil dan cek memakai gudang terpilih |
| `AC-11` | Hanya satu permintaan aktif per WO | Ajukan permintaan. Coba ajukan kedua untuk WO sama: ditolak dengan pesan "Perintah ini sudah punya permintaan bahan yang masih aktif" |
| `AC-12` | Permintaan `DISETUJUI` mengubah WO ke `MENUNGGU_PEMBELIAN`; permintaan dikembalikan (`REVISI`) membuat WO tetap `BAHAN_KURANG` dan approval gugur | Uji alur: setujui permintaan, cek WO. Kembalikan permintaan lain, cek WO tetap `BAHAN_KURANG` dan approval diulang |

## Verifiability

- `AC-01`, `AC-02`, `AC-05`–`AC-07`, `AC-09`–`AC-12` → uji manual dari UI, dicatat dengan salinan isi.
- `AC-03` → perbandingan `saldo_stok` dan `mutasi_stok` sebelum dan sesudah.
- `AC-04` → uji manual dan review kode pada pull request.
- `AC-08` → uji manual per peran.
