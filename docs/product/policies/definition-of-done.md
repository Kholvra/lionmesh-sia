# Definition of Done

Berlaku untuk **setiap** item, termasuk fondasi.

## Perilaku

| # | Kriteria |
|---|---|
| 1 | Bisa dilakukan dari UI, bukan hanya API atau skrip |
| 2 | Input tidak valid ditolak dengan pesan yang bisa dibaca pengguna |
| 3 | Setiap perubahan status meninggalkan jejak di `riwayat_status` |
| 4 | Efek angkanya muncul di laporan terkait |
| 5 | Bisa diulang dari database kosong lewat seed — tanpa data sisa |

## Uang dan stok

| # | Kriteria |
|---|---|
| 6 | Jurnal ditulis lewat `postJournal()`; total debit = total kredit |
| 7 | Mutasi stok mengubah `saldo_stok` dalam transaksi yang sama |
| 8 | Dokumen yang sudah diposting tidak bisa diedit diam-diam |
| 9 | Periode yang terkunci menolak transaksi baru dengan pesan jelas |

## Mutu teknis

| # | Kriteria |
|---|---|
| 10 | `lint`, `typecheck`, dan `build` lolos |
| 11 | Tidak ada `any` baru tanpa alasan tertulis |
| 12 | Tidak ada `console.log` atau data dummy yang tertinggal |
| 13 | Migrasi bernomor dan tidak mengubah migrasi yang sudah di-merge |

## Bukti dan serah terima

| # | Kriteria |
|---|---|
| 14 | Acceptance criteria dijalankan, hasilnya dicatat |
| 15 | PR direview tech lead dan di-merge |
| 16 | `backlog.md` diperbarui: status `done` dan tanggal |
| 17 | Dokumentasi item diperbarui bila perilakunya menyimpang dari rencana |

## Per siklus

Satu siklus dianggap selesai kalau **seluruh rantai dokumennya** bisa dijalankan berurutan dari `db:reset` + `db:seed` tanpa menyentuh database manual, dan setiap perpindahan status menghasilkan jurnal yang balance.

## Yang tidak termasuk

- Menunggu fitur siklus lain. Kalau item bergantung pada siklus lain, dependensinya harus berupa **service core**, bukan pekerjaan yang belum ada.
- "Sudah jalan di laptop saya". Bukti harus bisa diulang.
