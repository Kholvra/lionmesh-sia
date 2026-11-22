# C-010 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Tidak ada kriteria yang menunggu pertanyaan terbuka; kriteria dengan tanda `[USULAN-AGEN]` menunggu kunci koordinator.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Setelah periode Oktober ditutup (periode bulanan, D-50), status periode menjadi `terkunci`. Periode lain tidak berubah. | Jalankan `pnpm db:reset` lalu `pnpm db:seed`. Tutup satu periode. Baca status semua periode dan bandingkan. |
| `AC-02` | Posting jurnal dengan tanggal di periode terkunci ditolak. Tidak ada baris `jurnal` atau `detail_jurnal` baru, dan pesan menyebut periode yang terkunci. | Dari data `AC-01`, coba posting satu jurnal bertanggal di periode terkunci. Hitung baris sebelum dan sesudah. Catat pesan. |
| `AC-03` | Setelah tutup buku tahunan (D-44 (5)), saldo akun pendapatan dan beban tahun itu (401, 501, 601, 602, 701; 702 dicadangkan) nol, dan laba bersih sama dengan kenaikan saldo 302 Laba ditahan. Sisa 601 dan 602 ikut ditutup (`[USULAN-AGEN]`, PT-12). | Dari data uji dengan nilai yang sudah dihitung tangan, jalankan tutup buku tahun itu. Baca saldo akun-akun itu dan 302, lalu bandingkan. |
| `AC-04` | Jurnal penutup memiliki total debit sama dengan total kredit. | Ambil jurnal penutup dari `AC-03`. Jumlahkan debit dan kredit. |
| `AC-05` | Menutup periode yang sudah terkunci ditolak dengan pesan yang menyatakan periode sudah ditutup. Status tidak berubah. | Tutup periode dua kali. Catat respons kedua dan status. |
| `AC-06` | Penutupan yang gagal di tengah tidak meninggalkan jurnal penutup sebagian. | Uji dengan akun laba ditahan yang tidak tersedia (mis. dengan COA uji yang sengaja tidak lengkap). Hitung jurnal penutup: harus nol. |
| `AC-07` | Tidak ada buka kembali. Percobaan membuka periode terkunci ditolak dan status tetap `terkunci`. Koreksi periode itu dibuat sebagai jurnal pembalik di periode berjalan (D-44 (5)). | Coba buka periode terkunci lewat layar dan lewat service. Catat respons dan status. |
| `AC-08` | Laporan `C-009` untuk periode yang sudah ditutup memberi angka yang sama sebelum dan sesudah penutupan, kecuali baris jurnal penutup tahunan itu sendiri. `[USULAN]` | Catat angka laporan sebelum penutupan. Tutup periode. Buka laporan lagi. Bandingkan. |
| `AC-09` | Tutup buku tidak mengubah status dokumen sumber, dan tidak mengubah status payroll (PT-02, `[USULAN-AGEN]`). | Catat status dokumen dan payroll sebelum penutupan. Tutup. Bandingkan. |
| `AC-10` | Koreksi atas periode yang sudah terkunci dibuat sebagai jurnal pembalik di periode berjalan. Tidak ada baris jurnal masuk ke periode terkunci. | Dari data AC-01, buat satu koreksi uji. Hitung baris `jurnal` per periode sebelum dan sesudah. Jurnal pembalik ada di periode berjalan. |
| `AC-11` | Periode hanya bisa ditutup berurutan. Penutupan periode yang melompati periode sebelumnya ditolak dengan pesan yang menyebut periode itu (PT-04, `[USULAN-AGEN]`). | Dari data AC-01 (Oktober terkunci, September terbuka), coba tutup Desember. Catat pesan dan status semua periode. |
| `AC-12` | Penutupan ditolak bila neraca saldo tidak balance atau ada dokumen setengah posting (D-50). Pesan menyebut prasyarat yang gagal; status tetap `terbuka`. | Uji dengan fixture neraca tidak balance: tutup ditolak. Uji dengan fixture dokumen berstatus berjurnal tetapi tanpa baris jurnal: tutup ditolak. Catat pesan dan status. |
| `AC-13` | Tutup buku tahunan mengubah status tahun buku menjadi `ditutup` hanya bila semua 12 periode bulanan `terkunci` (PT-12, `[USULAN-AGEN]`). Setelah ditutup, posting ke tahun itu ditolak. | Coba tutup tahun dengan satu periode terbuka: ditolak. Tutup setelah semua terkunci: status `ditutup`. Coba posting ke tahun itu: ditolak tanpa baris. |

## Edge cases (optional)

- Periode pertama yang belum punya jurnal: penutupan tetap berhasil dan jurnal penutupnya nol. `[USULAN]`
- Tutup buku tahunan pada tahun yang tidak punya jurnal: jurnal penutupnya nol, status tahun buku tetap berubah. `[USULAN-AGEN]`

## Verifiability

- AC-01 sampai AC-04, AC-06, dan AC-11 sampai AC-13 → uji fixture dari `db:reset` + `db:seed`, dengan nilai yang dihitung tangan.
- AC-02, AC-05, dan AC-07 → perintah hitung baris dan catatan respons.
- AC-08 dan AC-09 → pembanding angka dan status sebelum dan sesudah.
- AC-10 → hitung baris per periode.
- AC-12 → fixture yang sengaja gagal; catat pesan dan status.
