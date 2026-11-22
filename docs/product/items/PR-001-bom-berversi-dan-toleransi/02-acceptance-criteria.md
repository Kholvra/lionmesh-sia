# PR-001 — Acceptance Criteria

Setiap kriteria bisa dibuktikan dengan langkah atau perintah yang bisa diulang orang lain. Semua pertanyaan sudah terjawab (`00-discussion.md`), jadi tidak ada kriteria yang menunggu keputusan. Angka persentase di sini adalah placeholder; nilai toleransi diverifikasi saat implementasi (`D-51`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Produksi dapat membuat BOM untuk produk aktif di master `C-011` dengan minimal satu komponen berqty positif dan tipe bahan; BOM langsung muncul di daftar | Dari UI, login sebagai Produksi; pilih produk; tambah komponen; simpan; cek daftar BOM |
| `AC-02` | Membuat versi baru tidak mengubah versi lama | Buat versi 1 berisi komponen A dan B, catat isinya. Buat versi 2 hanya berisi A. Buka versi 1: isinya tetap A dan B, tanggal berlaku tidak berubah |
| `AC-03` | Toleransi scrap dan reject tersimpan per versi | Isi toleransi scrap `s%` dan reject `r%`. Simpan. Muat ulang: nilai sama. Buat versi baru dengan nilai lain: versi lama tetap `s%` dan `r%` |
| `AC-04` | Qty komponen nol atau negatif ditolak dengan pesan "Jumlah komponen harus lebih dari nol." | Dari UI, isi `0`, lalu `-1`. Form menampilkan pesan. Cek tabel: tidak ada baris baru |
| `AC-05` | Produk tidak ada atau nonaktif di `C-011` tidak bisa dipasangi BOM | Dari UI, pilih produk nonaktif. Form menolak dengan pesan "Produk ... tidak ditemukan di master produk atau sudah nonaktif." |
| `AC-06` | Daftar versi menampilkan semua versi dengan `berlaku_dari` dan status `TERJADWAL`, `BERLAKU`, atau `DIGANTIKAN` sesuai tanggal | Buat versi dengan tanggal besok dan versi dengan tanggal hari ini. Buka daftar: status sesuai tanggal |
| `AC-07` | Nomor migrasi BOM tidak bertabrakan dengan migrasi lain | `pnpm check:migrations` exit 0. Dengan dua file bernomor sama: exit 1 dan pesan menyebut kedua nama file |
| `AC-08` | BOM tidak menyimpan kolom stok atau harga | Review DDL: tidak ada kolom `stok`, `harga`, atau `harga_rata` di tabel BOM maupun versi |
| `AC-09` | Modul Produksi tidak mengimpor modul lain dan tidak membaca tabel produk secara langsung | `pnpm arch:check` exit 0. Review pencarian query: akses master produk hanya lewat service `C-011` |
| `AC-10` | Komponen duplikat, versi tanpa komponen, dan komponen bukan bahan ditolak dengan pesan dari `01-requirement.md` | Dari UI: coba tiap kasus. Pesan sesuai tabel validasi. Tidak ada baris tersimpan |
| `AC-11` | `berlaku_dari` yang lebih kecil dari versi terakhir, atau sama dengan versi yang ada, ditolak | Dari UI: buat versi dengan tanggal lebih awal dari versi terakhir. Ditolak dengan pesan sesuai tabel |
| `AC-12` | Toleransi di luar 0 sampai kurang dari 100 persen ditolak | Dari UI: isi `-1`, lalu `100`. Form menolak dengan pesan yang menyebut toleransi |
| `AC-13` | `versiBerlakuPada(produk, tanggal)` mengembalikan versi dengan `berlaku_dari` terbesar yang tidak melewati tanggal | Uji service: dua versi dengan tanggal berbeda; cek tanggal sebelum, sama, dan sesudah keduanya. Produk tanpa versi: hasil kosong |

## Verifiability

- `AC-01`–`AC-06`, `AC-10`–`AC-12` → uji manual dari UI, dicatat dengan salinan isi tabel.
- `AC-07` → `pnpm check:migrations`.
- `AC-08` → review DDL pada pull request.
- `AC-09` → `pnpm arch:check` dan review pencarian query.
- `AC-13` → uji service (unit test pada fungsi `versiBerlakuPada`).
