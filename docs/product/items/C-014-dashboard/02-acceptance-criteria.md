# C-014 — Acceptance Criteria

| ID | Kriteria dan pembuktian |
|---|---|
| AC-01 | Masuk dengan dua peran dan fixture dokumen lintas peran: setiap pengguna hanya melihat dan menghitung dokumen yang dapat dilihat dan ditindaklanjuti; pemohon tidak melihat approval miliknya sendiri. Bandingkan daftar dengan hak dan status fixture. |
| AC-02 | Dengan beberapa dokumen pada dua siklus, hitung dokumen berbeda pada tiap kartu dan bandingkan dengan antrean siklus tersebut; urutan berdasarkan awal menunggu tertua, dengan nomor, jenis, siklus, tahap, dan waktu. |
| AC-03 | Dengan sumber belum tersedia, kartu menunjukkan “Belum tersedia”, bukan 0; tanpa tindakan pada sumber tersedia, antrean menunjukkan “Tidak ada tindakan yang menunggu”. |
| AC-04 | Simulasikan satu sumber gagal: tampilkan error dan tindakan mencoba lagi, tanpa angka nol palsu atau klaim total lengkap; setelah sumber pulih, muat ulang dan periksa hasil. |
| AC-05 | Dokumen yang halamannya tersedia dan dapat diakses memiliki tautan tujuan; yang tidak memenuhi kedua syarat tidak memiliki tautan. Periksa akses tujuan sebagai pengguna tersebut. |
| AC-06 | Tanpa sesi, buka `/`: diarahkan ke login. Uji akun Karyawan terhadap D-53 dan pastikan data pengguna lain tidak tampil. |
| AC-07 | Periksa loading, kosong, error, unauthorized dan tampilan 1280px; bandingkan dengan `docs/design/`. Tidak ada nilai contoh atau ekspor. |
| AC-08 | Tinjau akses data: tidak ada pembacaan tabel modul lain langsung; data diberikan lewat core/read model yang memeriksa otorisasi di server. |
