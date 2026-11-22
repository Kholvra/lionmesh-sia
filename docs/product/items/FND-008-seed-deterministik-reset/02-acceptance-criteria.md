# FND-008 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah yang bisa diulang. Kriteria yang bergantung pada berkas seed item lain ditandai dan dibuktikan saat item pemilik selesai.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Dua putaran `pnpm db:reset` lalu `pnpm db:seed` menghasilkan jumlah baris dan nilai kunci yang identik untuk setiap tabel yang diisi. | Putaran 1: `db:reset`, `db:seed`, catat jumlah baris dan nilai kunci tiap tabel seed. Putaran 2: ulangi. Bandingkan. Identik. Daftar tabel: `satuan`, `gudang`, dan tabel yang diisi berkas seed item lain yang sudah `done`. |
| `AC-02` | Seed kedua tanpa reset ditolak; pesan menyebut `pnpm db:reset`. | Jalankan `pnpm db:seed` dua kali berturut-turut. Yang kedua exit non-nol; pesan memuat `pnpm db:reset`. Regresi `FND-001` AC-07. |
| `AC-03` | Berkas seed tidak memakai waktu sistem atau acak tanpa benih. | `grep -rE "now\(\)|current_date|current_timestamp|random\(\)|gen_random_uuid\(\)" supabase/seed*` dan berkas seed item lain: hasil 0 baris, atau setiap temuan dijelaskan di 05-evidence. |
| `AC-04` | Kunci data seed tetap dan sama di setiap putaran (UUID literal, `OQ-08-06`). | Bandingkan id yang dihasilkan dua putaran (AC-01). Sama. |
| `AC-05` | Setelah berkas seed `FND-003` terpasang, tabel akun berisi 13 akun uji dengan 13 peran berbeda (`D-53`). | `select count(distinct peran) from profiles;` pada database hasil seed. Hasil 13. *Dibuktikan saat `FND-003` selesai.* |
| `AC-06` | Seed tidak memuat transaksi: tidak ada baris mutasi, dokumen, atau jurnal setelah `db:seed` (`OQ-08-01`). | `select count(*)` pada tabel `mutasi_stok`, `riwayat_status`, `jurnal` (yang ada) setelah seed: hasil 0. |
| `AC-07` | Seed menolak bila penanda lingkungan bukan lokal (`OQ-08-07`). | Atur penanda ke non-lokal di uji. `db:seed` ditolak dengan "Seed hanya boleh dijalankan di lingkungan lokal."; tidak ada baris tersimpan. |
| `AC-08` | Versi seed dicatat di `_seed_meta`; versi dataset di `supabase/seed-version` yang berbeda dari versi terpasang ditolak sampai reset penuh (`OQ-08-05`). | Pasang versi uji 1, ubah `supabase/seed-version`: `db:seed` ditolak; pulihkan versi repo, jalankan `db:reset`, lalu seed berhasil dan versi tercatat. |
| `AC-09` | Tabel penanda `_seed_meta` tidak bisa dibaca atau ditulis role klien (`OQ-08-08`). | Dengan role klien, `select` dan `insert` ke `_seed_meta`: ditolak atau hasil kosong. |

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | `pnpm db:reset`, `pnpm db:seed`, skrip pembanding, `grep` AC-03 |
| Keluaran | jumlah baris dan nilai kunci dua putaran; pesan penolakan; hasil AC-05 dan AC-06 saat item pemilik selesai |
| Selisih | bila ada tabel yang belum diisi berkas seed, catat dan tunjuk item pemiliknya |

## Yang tidak diuji di sini

- Perilaku fitur yang memakai data seed (item masing-masing).
- Skenario `INT-002` (`D-51` g).
- Kinerja dengan data besar.
- Data produksi.
