# FND-004 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang. Angka ambang dan level pada AC dengan "jenis uji" adalah data uji, bukan keputusan bisnis; seed nyata tetap `D-51` (c).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Dokumen baru mendapat nomor `{TIPE}/{TAHUN}/{BULAN}/{URUT}` (`D-50`), unik per tipe per bulan. | Buat satu dokumen jenis uji `UJI` pada November 2026. Nomor `UJI/2026/11/0001`. |
| `AC-02` | Dua pembuatan dokumen bersamaan menghasilkan nomor berbeda. | Jalankan dua panggilan pembuatan dokumen jenis sama secara paralel (dua proses skrip). Keduanya berhasil dan nomornya berbeda. `dokumen_counter` naik dua. |
| `AC-03` | Pembuatan dokumen menulis baris riwayat pertama dengan aktor dan waktu. | Buat dokumen. Query `riwayat_status` untuk id dokumen. Tepat satu baris (`BUAT`), dengan `actor_id` dari sesi dan waktu server. |
| `AC-04` | Transisi yang tidak ada di tabel ditolak dengan pesan. | Coba `DRAFT` → `SELESAI`. Ditolak dengan "Status DRAFT tidak bisa diubah menjadi SELESAI."; status tetap `DRAFT`. |
| `AC-05` | Setiap transisi sah menambah tepat satu baris riwayat; baris lama tidak berubah. | Jalankan tiga transisi sah. Hitung baris riwayat (bertambah tiga) dan bandingkan isi baris lama sebelum dan sesudah (sama). |
| `AC-06` | Dua pemroses yang memproses dokumen sama: yang kedua ditolak tanpa perubahan ganda. | Dua proses skrip menyetujui dokumen yang sama. Satu berhasil; yang kedua mendapat "Dokumen ini sudah diproses oleh pengguna lain. Muat ulang untuk melihat status terbaru." dan `riwayat_status` hanya bertambah satu. |
| `AC-07` | Dokumen dengan aturan dua level tidak selesai sebelum level kedua menyetujui. Jenis uji, bukan seed. | Buat dokumen jenis uji dengan aturan dua level. Setujui level 1: status tetap `DIPERIKSA`. Coba `DISETUJUI` sebelum level 2: ditolak dengan "Persetujuan level 2 belum lengkap." Setujui level 2: status `DISETUJUI`. |
| `AC-08` | Pemohon tidak bisa menyetujui dokumen apa pun miliknya (`D-48`, memperluas `D-42`). | Masuk sebagai pembuat dokumen jenis PR dan jenis uji; coba setujui keduanya. Ditolak dengan "Anda tidak bisa menyetujui dokumen yang Anda ajukan sendiri." |
| `AC-09` | Dokumen tidak bisa dihapus. | Jalankan `DELETE` pada baris dokumen dengan peran pengguna biasa. Ditolak; baris tetap ada. |
| `AC-10` | Dokumen dibatalkan sebelum posting dengan alasan tetap terlihat dengan status `DIBATALKAN` dan riwayatnya. Tanpa alasan ditolak. | Batalkan dokumen dengan alasan: ada, status `DIBATALKAN`, riwayat bertambah satu (`BATAL`). Batalkan tanpa alasan: ditolak dengan "Isi alasan untuk membatalkan dokumen." |
| `AC-11` | Revisi menggugurkan approval yang sudah ada (`D-48`). | Dokumen dua level: setujui level 1, lalu `REVISI`, `DRAFT`, ajukan ulang, periksa. Level 1 harus disetujui lagi; `riwayat_status` lama tetap utuh. |
| `AC-12` | Penolakan wajib alasan dan final (`D-48`). | Tolak tanpa alasan: ditolak. Tolak dengan alasan: status `DITOLAK`. Coba ubah dari `DITOLAK`: ditolak. |
| `AC-13` | Pembatalan setelah posting ditolak (`D-48`, `D-35`). | Dengan penanda diposting di modul uji, coba `DIBATALKAN`: ditolak dengan "Dokumen sudah diposting. Batalkan lewat jurnal pembalik." Status tidak berubah. |
| `AC-14` | Status di luar daftar `D-46`/`D-47` ditolak. | Daftarkan modul uji dengan status `TERKONFIRMASI_PELANGGAN`: ditolak; status itu tidak tersedia (`D-47` b). |
| `AC-15` | Nomor `URUT` mulai dari `0001` lagi pada bulan berikutnya untuk tipe yang sama. | Buat dokumen jenis uji pada 30 November, lalu 1 Desember. Nomor kedua `UJI/2026/12/0001`. |
| `AC-16` | Jenis tanpa aturan approval (pembayaran pemasok, `D-51` c) tidak punya level: `PERIKSA` langsung ke `DISETUJUI`. | Buat dokumen jenis uji tanpa aturan. Periksa, lalu setujui: status `DISETUJUI` tanpa baris `SETUJUI` per level. |

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | skrip paralel yang dipakai (AC-02, AC-06) dan versi PostgreSQL; tanggal sistem uji untuk AC-15 |
| Keluaran | nomor yang dihasilkan, jumlah baris riwayat sebelum dan sesudah, pesan error |
| Selisih | bila ada aturan yang berubah dari keputusan, catat keputusannya |

## Yang tidak diuji di sini

- Isi daftar status per jenis dokumen modul (item pemilik).
- Jurnal pembalik (`FND-006`).
- Notifikasi approval (`C-012`).
- Ambang nominal seed final (`D-51` c; belum final).
