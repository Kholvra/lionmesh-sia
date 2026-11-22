# PG-001 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Titik awal pembuktian adalah skema `siap`:

```text
pnpm db:reset
```

Sampai test runner tersedia (`FND-001` menunda test sampai item perilaku pertama, lihat `04-design-contract.md` bagian Open decisions), pembuktian dilakukan lewat UI dengan langkah yang sama dari titik awal ini.

Kolom "Cara membuktikan" menyebut dasar keputusan. Kriteria yang bergantung pada item lain ditandai "lintas item" dan dibuktikan lengkap saat item itu ada.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Purchasing membuat pemasok dengan nama dan termin yang valid; pemasok muncul di daftar dengan status `aktif` | Dari `pnpm db:reset`, login sebagai Purchasing, buka Pemasok, pilih Tambah, isi nama dan termin, simpan. Catat nama dan status di daftar |
| `AC-02` | Pemasok baru tanpa toleransi tersimpan dengan `toleransi_persen` 0 dan `toleransi_nominal` 0 (`D-15`) | Lanjutan AC-01: buka detail pemasok dan catat nilai toleransi yang tampil. Nominal dalam IDR (`D-38`) |
| `AC-03` | Input dengan nama kosong ditolak dengan pesan yang bisa dibaca dan data tidak tersimpan | Dari `pnpm db:reset`, buka form Tambah, kosongkan nama, simpan. Catat pesan dan pastikan daftar tetap kosong |
| `AC-04` | Toleransi nominal negatif ditolak | Isi `toleransi_nominal` dengan -1, simpan. Catat pesan dan pastikan data tidak berubah. Teks pesan `[USULAN]` |
| `AC-05` | Termin kosong ditolak (`D-14`: pemasok tanpa default, wajib input) | Kosongkan termin pada form Tambah, simpan. Catat pesan dan pastikan daftar tidak berubah. Teks pesan `[USULAN]` |
| `AC-06` | Menonaktifkan pemasok menulis satu baris riwayat dengan aktor dan waktu (`D-08`, `D-32`) | Dari AC-01, nonaktifkan pemasok. Catat status `nonaktif` dan buka riwayat status: satu baris dengan aktor Purchasing dan waktu |
| `AC-07` | Pemasok nonaktif tidak bisa dipilih untuk dokumen baru (`D-50`) | Lintas item. Nonaktifkan pemasok di AC-06, lalu buka daftar pilihan pemasok pada form PR (`PG-002`), kandidat (`PG-004`), dan PO (`PG-005`). Pemasok tidak muncul sebagai pilihan. Di `PG-001` cukup memastikan daftar pilihan master memfilter status `aktif` |
| `AC-08` | Pengguna tanpa izin tidak bisa mengubah pemasok (`D-33`: hanya Purchasing) | Login sebagai Manajemen, buka detail pemasok, coba ubah. Catat pesan izin |
| `AC-09` | Perubahan termin atau toleransi tidak mengubah dokumen yang sudah dibuat (`[USULAN-AGEN]` Q-08) | Lintas item. Di `PG-001`: ubah termin pemasok, catat nilai baru. Lalu buka dokumen yang dibuat sebelum perubahan (PO di `PG-005`, faktur di `PG-008`) dan pastikan nilai termin dan toleransi yang tersimpan di dokumen tetap nilai lama |
| `AC-10` | Hasil setelah reset dapat diulang | Jalankan `pnpm db:reset`, ulangi AC-01 dua kali. Daftar pemasok hanya berisi hasil langkah saat itu, tanpa sisa data |
| `AC-11` | Dua toleransi disimpan terpisah dan keduanya dibaca apa adanya (`D-15`, `[USULAN-AGEN]` Q-06) | Buat pemasok dengan `toleransi_persen` 5 dan `toleransi_nominal` 100000 (nilai uji, bukan nilai bisnis), simpan. Buka detail: kedua nilai tampil sebagai dua field terpisah, tidak digabung |
| `AC-12` | Pemasok nonaktif bisa diaktifkan kembali oleh Purchasing dan kembali bisa dipilih (`D-50`, `[USULAN-AGEN]` Q-07) | Dari AC-06, buka detail pemasok nonaktif, pilih Aktifkan. Catat status `aktif`, riwayat bertambah satu baris dengan aktor dan waktu (total dua baris: nonaktif, aktif), dan pemasok muncul kembali di daftar pilihan (lintas item seperti AC-07) |
| `AC-13` | Field kontak PIC hanya terbaca Purchasing dan Accounting (`[USULAN-AGEN]` Q-03) | Isi nama PIC dan telepon PIC pada pemasok, simpan. Login sebagai Purchasing: field tampil. Login sebagai Accounting: field tampil. Login sebagai Manajemen (jika peran ini dapat membuka detail pemasok): field kontak PIC tidak tampil |

## Edge cases (optional)

- Nama pemasok sama dengan pemasok yang sudah ada: usulan ditolak dengan pesan "Nama pemasok sudah terdaftar" (`diagram-sia-lengkap.md` PG01, `[USULAN]`).
- Toleransi persen tepat 0 dan 100: diterima sebagai batas `[USULAN]`.
- Menonaktifkan pemasok yang punya dokumen terbuka: diizinkan, dokumen tetap berjalan (`D-50`). Tidak ada perubahan pada dokumen itu.

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | `pnpm db:reset` dan versi alat yang dipakai |
| Keluaran | ringkasan hasil tiap AC, bukan hanya "lulus" |
| Selisih | bila ada langkah yang menyimpang dari requirement, tulis alasannya |

## Yang tidak diuji di sini

- Penerapan toleransi pada harga dan total dokumen: diuji di `PG-008`.
- Pemilihan pemasok: diuji di `PG-004`.
- Pembuktian lintas item (AC-07 penuh, AC-09): diuji di `PG-002`, `PG-004`, `PG-005`, `PG-008` saat dokumennya ada.
- Perilaku izin lintas peran secara menyeluruh: diuji di `FND-003`.
