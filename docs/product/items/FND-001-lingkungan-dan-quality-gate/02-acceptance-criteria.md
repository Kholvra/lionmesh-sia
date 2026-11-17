# FND-001 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Dari clone bersih, `pnpm install` ditambah satu perintah penyiapan menghasilkan aplikasi berjalan dengan seluruh migrasi terpasang | Jalankan di direktori sementara, catat perintah dan hasilnya |
| `AC-02` | Migrasi diterapkan berurutan dari database kosong; menjalankan ulang tidak mengubah skema dan tidak error | Jalankan dua kali, bandingkan daftar tabel dan kolom |
| `AC-03` | Dua migrasi dengan nomor sama ditolak sebelum menyentuh database, dengan pesan yang menyebut kedua nama file | Buat dua file bernomor sama di branch uji, jalankan, catat pesan |
| `AC-04` | `pnpm lint`, `pnpm typecheck`, dan `pnpm build` lolos pada clone bersih | Jalankan ketiganya, simpan keluaran |
| `AC-05` | CI menjalankan tiga pemeriksaan yang sama pada setiap pull request dan menggagalkan check bila salah satu gagal | Buka PR dengan kesalahan tipe yang disengaja, pastikan check merah; perbaiki, pastikan hijau |
| `AC-06` | Ada perintah reset yang mengembalikan ke skema kosong, dan perintah seed yang menghasilkan data dasar identik setiap kali dijalankan | Jalankan reset+seed dua kali, bandingkan jumlah baris dan nilai kunci |
| `AC-07` | Seed menolak berjalan di atas data yang sudah ada tanpa reset, dengan pesan yang menyebut perintah reset | Jalankan seed dua kali berturut-turut, catat pesan |
| `AC-08` | `README.md` memuat seluruh langkah lokal tanpa instruksi menempel SQL manual ke dashboard | Baca README dari awal; ikuti hanya isinya |

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | daftar perintah yang dijalankan, termasuk versi alat |
| Keluaran | ringkasan hasil tiap pemeriksaan, bukan hanya "lulus" |
| CI | tautan atau nomor run yang menunjukkan check merah dan hijau |
| Selisih | bila ada langkah yang menyimpang dari requirement, tulis alasannya |

## Yang tidak diuji di sini

- Kebenaran skema domain — diuji di `FND-002`.
- Perilaku otorisasi — diuji di `FND-003`.
- Kinerja dan beban — di luar cakupan.
