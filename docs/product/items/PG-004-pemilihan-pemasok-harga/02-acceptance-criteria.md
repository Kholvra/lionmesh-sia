# PG-004 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Titik awal pembuktian adalah skema `siap`:

```text
pnpm db:reset
```

Sampai test runner tersedia, pembuktian dilakukan lewat UI dengan langkah yang sama. Permintaan yang sudah disetujui dibuat lewat `PG-002` dan `PG-003`, pemasok dibuat lewat `PG-001`.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Purchasing menetapkan satu pemasok untuk seluruh permintaan yang disetujui; status berpindah ke `PEMASOK_DITETAPKAN` (`D-46`, `[USULAN-AGEN]` Q-09) | Dari `pnpm db:reset`, siapkan permintaan `DISETUJUI` dan dua pemasok aktif. Login sebagai Purchasing, pilih satu pemasok, simpan. Catat status dan nama pemasok, dan bahwa pemasok tidak bisa diganti dari layar yang sama |
| `AC-02` | Harga pembanding dari dua kandidat tampil berdampingan untuk barang yang sama (`[USULAN-AGEN]` Q-01) | Input harga untuk barang yang sama pada dua pemasok, buka perbandingan. Catat dua baris berdampingan dan tanda harga terendah |
| `AC-03` | Permintaan yang belum disetujui tidak bisa dipilih pemasoknya (`D-46`) | Dari permintaan berstatus `DIAJUKAN`, coba pilih pemasok. Catat pesan dan pastikan status tidak berubah |
| `AC-04` | Harga nol atau negatif ditolak | Isi harga 0, simpan. Catat pesan dan pastikan data tidak tersimpan |
| `AC-05` | Tanpa kandidat, penetapan ditolak | Simpan tanpa memilih pemasok. Catat pesan |
| `AC-06` | Riwayat harga per barang per pemasok tampil dengan tanggal (`[USULAN-AGEN]` Q-02) | Input harga pada dua tanggal berbeda untuk barang dan pemasok yang sama, buka riwayat. Catat dua baris dengan tanggal masing-masing |
| `AC-07` | Pemasok yang bukan harga terendah tanpa alasan ditolak; dengan alasan diterima (`[USULAN-AGEN]` Q-03, Q-04) | Pada perbandingan dengan harga terendah milik pemasok A, pilih pemasok B tanpa alasan: catat pesan dan status tetap. Isi alasan lalu simpan: penetapan berhasil dan alasan tersimpan. Pilih pemasok A (harga terendah) tanpa alasan: penetapan berhasil |
| `AC-08` | Pemasok nonaktif tidak bisa dipilih (`D-50`) | Nonaktifkan pemasok di `PG-001` (AC-06 `PG-001`), buka daftar kandidat di sini, catat bahwa pemasok tidak muncul sebagai pilihan. Bila dipaksa lewat data uji, server menolak dengan pesan |
| `AC-09` | Pemasok yang sudah ditetapkan tidak bisa diganti dari layar penetapan (`D-46`) | Tetapkan pemasok, buka layar penetapan lagi. Catat bahwa tidak ada aksi ganti dan status tetap `PEMASOK_DITETAPKAN` |
| `AC-10` | Hasil setelah reset dapat diulang | Jalankan `pnpm db:reset`, ulangi AC-01 dua kali. Daftar hanya berisi hasil langkah saat itu |
| `AC-11` | Harga pembanding disimpan dan ditampilkan sebagai nilai net tanpa PPN (`D-17`) | Input harga 100 (nilai uji), simpan, buka perbandingan dan riwayat. Catat bahwa nilai yang tampil sama dengan nilai input; tidak ada penambahan PPN di layar ini |

## Edge cases (optional)

- Dua kandidat dengan harga sama: keduanya ditandai harga terendah. Pemilihan salah satunya tidak memerlukan alasan.
- Harga dalam mata uang asing: tidak berlaku. Transaksi IDR (`D-38`).
- Permintaan dibatalkan pemohon setelah pemasok ditetapkan: pembatalan diuji di `PG-002` (`PEMASOK_DITETAPKAN → DIBATALKAN`).

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | `pnpm db:reset` dan versi alat yang dipakai |
| Keluaran | ringkasan hasil tiap AC, bukan hanya "lulus" |
| Selisih | bila ada langkah yang menyimpang dari requirement, tulis alasannya |

## Yang tidak diuji di sini

- Penerbitan PO: diuji di `PG-005`.
- Pencocokan harga dengan faktur: diuji di `PG-008`.
- Izin lintas peran secara menyeluruh: diuji di `FND-003`.
