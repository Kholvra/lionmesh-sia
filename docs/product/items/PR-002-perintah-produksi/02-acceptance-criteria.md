# PR-002 — Acceptance Criteria

Setiap kriteria bisa dibuktikan dengan langkah atau perintah yang bisa diulang orang lain. Transisi status mengikuti `D-46`; batas batal mengikuti `D-48` dan `00-discussion.md` Q-04. Semua pertanyaan sudah terjawab; tidak ada kriteria yang menunggu keputusan.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Produksi dapat membuat WO dengan produk, target qty, tanggal target, gudang sumber, dan versi BOM yang berlaku; WO muncul di daftar dengan status `DIRENCANAKAN` dan nomor dokumen | Dari UI, login sebagai Produksi; isi form; simpan; cek daftar |
| `AC-02` | Nomor WO unik, dibuat oleh `core/dokumen`, dan mengikuti format `WO/{TAHUN}/{BULAN}/{URUT}` | Buat tiga WO. Nomor berbeda dan berurutan. Review kode: pembuatan nomor hanya lewat service dokumen |
| `AC-03` | Target qty nol atau negatif ditolak dengan pesan "Target jumlah harus lebih dari nol." | Dari UI, isi `0`, lalu `-1`. Form menampilkan pesan. Tidak ada WO baru |
| `AC-04` | Setiap perubahan status tercatat di riwayat dengan aktor dan waktu | Ubah status dua kali (lewat langkah `PR-003` atau `PR-005`). Buka riwayat: dua baris baru dengan aktor dan waktu. Baris lama tidak berubah |
| `AC-05` | WO tidak bisa dihapus dari UI dan tidak ada baris yang hilang dari database | Dari UI, cari tombol hapus pada WO: tidak ada. Pembatalan dari `DIRENCANAKAN` mengubah status menjadi `DIBATALKAN` dan baris tetap ada |
| `AC-06` | WO menyimpan versi BOM yang dipilih, dan versi itu tidak berubah ketika BOM baru dibuat | Buat WO dengan versi 1. Buat versi 2 pada BOM yang sama. Buka WO: masih versi 1 |
| `AC-07` | Produk tanpa versi BOM berlaku tidak bisa dipakai untuk WO | Dari UI, pilih produk tanpa BOM. Form menolak dengan pesan yang menyebut BOM |
| `AC-08` | Hanya Produksi yang dapat membuat WO; peran lain ditolak | Login sebagai peran selain Produksi; coba buat WO. Ditolak dengan pesan. Data tidak berubah |
| `AC-09` | Batal wajib disertai alasan; tanpa alasan ditolak dengan pesan "Alasan pembatalan wajib diisi." | Dari UI, batalkan tanpa alasan. Ditolak. Status tidak berubah |
| `AC-10` | Batal dari `BERJALAN` atau status setelahnya ditolak | Dari UI, batalkan WO berstatus `BERJALAN`. Ditolak dengan pesan dari `01-requirement.md`. Status tidak berubah |
| `AC-11` | Transisi di luar tabel `01-requirement.md` ditolak; status tidak berubah | Uji service: coba `DIRENCANAKAN` ke `BERJALAN` dan `SELESAI` ke `BERJALAN`. Ditolak dengan pesan. Riwayat tidak bertambah |
| `AC-12` | `tgl_target_selesai` sebelum tanggal perintah ditolak | Dari UI, isi tanggal mundur. Form menolak dengan pesan sesuai tabel validasi |
| `AC-13` | Ubah target, tanggal, atau gudang hanya saat `DIRENCANAKAN` | Dari UI, buka WO `BAHAN_KURANG`. Tidak ada tombol ubah, atau ditolak dengan pesan |

## Verifiability

- `AC-01`, `AC-03`–`AC-07`, `AC-09`–`AC-10`, `AC-12`–`AC-13` → uji manual dari UI, dicatat dengan salinan isi tabel riwayat.
- `AC-02` → uji manual dan review kode.
- `AC-04`, `AC-11` → uji perilaku dan salinan riwayat.
- `AC-05` → review UI dan kode; cek jumlah baris sebelum dan sesudah.
- `AC-08` → uji manual per peran; hasilnya dicatat per peran.
