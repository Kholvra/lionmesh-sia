# C-010 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Tidak ada kriteria yang menunggu pertanyaan terbuka; kriteria dengan tanda `[USULAN-AGEN]` disahkan D-58, dan rincian teknisnya D-68.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Setelah periode Oktober ditutup (periode bulanan, D-50), status periode menjadi `kunci`. Periode lain tidak berubah. | Jalankan `pnpm db:reset` lalu `pnpm db:seed`. Tutup satu periode. Baca status semua periode dan bandingkan. |
| `AC-02` | Posting jurnal dengan tanggal di periode `kunci` ditolak. Tidak ada baris `jurnal` atau `detail_jurnal` baru, dan pesan menyebut periode yang terkunci. | Dari data `AC-01`, coba posting satu jurnal bertanggal di periode `kunci`. Hitung baris sebelum dan sesudah. Catat pesan. |
| `AC-03` | Setelah tutup buku tahunan (D-44 (5)), saldo akun pendapatan dan beban tahun itu (401, 501, 601, 602, 701; 702 dicadangkan) nol, dan laba bersih sama dengan kenaikan saldo 302 Laba ditahan. Sisa 601 dan 602 ikut ditutup (`[USULAN-AGEN]`, PT-12). | Dari data uji dengan nilai yang sudah dihitung tangan, jalankan tutup buku tahun itu. Baca saldo akun-akun itu dan 302, lalu bandingkan. |
| `AC-04` | Jurnal penutup memiliki total debit sama dengan total kredit. | Ambil jurnal penutup dari `AC-03`. Jumlahkan debit dan kredit. |
| `AC-05` | Menutup periode yang sudah `kunci` ditolak dengan pesan yang menyatakan periode sudah ditutup. Status tidak berubah. | Tutup periode dua kali. Catat respons kedua dan status. |
| `AC-06` | Penutupan yang gagal di tengah tidak meninggalkan jurnal penutup sebagian. | Uji dengan akun laba ditahan yang tidak tersedia (mis. dengan COA uji yang sengaja tidak lengkap). Hitung jurnal penutup: harus nol. |
| `AC-07` | Tidak ada buka kembali. Percobaan membuka periode `kunci` ditolak dan status tetap `kunci`. Koreksi periode itu dibuat sebagai jurnal pembalik di periode berjalan (D-44 (5)). | Tidak ada route/aksi buka; coba update langsung ke `periode_akuntansi` dan pastikan ditolak RLS. Catat respons dan status. |
| `AC-08` | Laporan `C-009` untuk periode yang sudah ditutup memberi angka yang sama sebelum dan sesudah penutupan, kecuali baris jurnal penutup tahunan itu sendiri. `[USULAN]` | Catat angka laporan sebelum penutupan. Tutup periode. Buka laporan lagi. Bandingkan. |
| `AC-09` | Tutup buku tidak mengubah status dokumen sumber, dan tidak mengubah status payroll (PT-02, `[USULAN-AGEN]`; D-58, D-68). | Catat status dokumen dan payroll sebelum penutupan. Tutup. Bandingkan. |
| `AC-10` | Koreksi atas periode yang sudah `kunci` dibuat sebagai jurnal pembalik di periode berjalan. Tidak ada baris jurnal masuk ke periode `kunci`. | Dari data AC-01, buat satu koreksi uji. Hitung baris `jurnal` per periode sebelum dan sesudah. Jurnal pembalik ada di periode berjalan. |
| `AC-11` | Periode hanya bisa ditutup berurutan. Penutupan periode yang melompati periode sebelumnya ditolak dengan pesan yang menyebut periode itu (PT-04, `[USULAN-AGEN]`; D-68). Bulan sebelumnya yang belum punya baris dibuat `buka` lalu dikunci, bukan diabaikan. Desember tidak bisa ditutup lewat jalur bulanan. | Dari data AC-01 (Oktober `kunci`, September `buka`), coba tutup Desember: ditolak. Coba tutup Desember lewat jalur bulanan: ditolak. Coba tutup November saat Oktober `buka`: ditolak. Coba tutup Februari saat Januari belum punya baris: Januari dibuat + dikunci. Catat pesan dan status. |
| `AC-12` | Penutupan ditolak bila neraca saldo tidak balance atau ada dokumen setengah posting (D-50). Setengah posting = `diposting` tidak sama dengan ada-tidaknya jurnal `sumber_id` dokumen itu di bulan tersebut; dua arah diblokir (D-68). Pesan menyebut prasyarat yang gagal; status tetap `buka`. | Uji fixture neraca tidak balance: tutup ditolak. Uji fixture `diposting = true` tanpa jurnal: ditolak. Uji fixture `diposting = false` tetapi ada jurnal: ditolak. Catat pesan dan status. |
| `AC-13` | Tutup buku tahunan mengubah status tahun buku menjadi `ditutup` bila Jan–Nov `kunci` dan Desember `buka`/belum ada; prosedur memposting jurnal penutup di Desember lalu mengunci Desember (PT-12, `[USULAN-AGEN]`; D-68). Setelah ditutup, 12/12 bulan `kunci` dan posting ke tahun itu ditolak. | Coba tutup tahun dengan Jan–Nov ada yang `buka`: ditolak. Coba dengan Desember `buka`: diterima, Desember `kunci`, tahun `ditutup`. Coba dengan Desember sudah `kunci`: ditolak. Coba posting ke tahun itu: ditolak tanpa baris. |

## Edge cases (optional)

- Periode pertama yang belum punya jurnal: penutupan tetap berhasil; tidak ada baris jurnal penutup (bukan jurnal bernilai nol). `[USULAN]`
- Tutup buku tahunan pada tahun yang tidak punya jurnal: tidak ada jurnal penutup; 12 baris periode dibuat + dikunci; status tahun buku tetap `ditutup`. `[USULAN-AGEN]`
- Desember lewat tutup periode bulanan: ditolak; Desember hanya dikunci oleh tutup tahun (D-68).

## Verifiability

- AC-01 sampai AC-04, AC-06, dan AC-11 sampai AC-13 → uji fixture dari `db:reset` + `db:seed`, dengan nilai yang dihitung tangan.
- AC-02, AC-05, dan AC-07 → perintah hitung baris, percobaan update langsung, dan catatan respons.
- AC-08 dan AC-09 → pembanding angka dan status sebelum dan sesudah.
- AC-10 → hitung baris per periode.
- AC-12 → fixture yang sengaja gagal; catat pesan dan status.
