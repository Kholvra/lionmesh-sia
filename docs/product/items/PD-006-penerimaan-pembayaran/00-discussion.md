# PD-006 — Diskusi

## Konteks

Pelanggan membayar, Finance mencatat penerimaan, Accounting memverifikasi, dan sistem mengalokasikan nominal ke faktur terbuka (`analisis-sia.md` §6.8). Pembayaran bisa lunas atau parsial, dan satu pembayaran bisa menutup beberapa faktur. Item ini adalah track PD-C, level 5, dengan dependensi `PD-005` dan `FND-006`.

## Actor / consumer

Finance mencatat penerimaan (`D-33`: "Catat pembayaran"). Accounting memverifikasi (`D-33`: "Verifikasi pembayaran"). Manajemen melihat piutang. Pelanggan membayar di luar sistem.

## Problem

Tanpa pencatatan pembayaran, piutang tidak berkurang, laporan kas tidak punya sumber, dan pelanggan bisa ditagih dua kali.

## Desired outcome

Finance mencatat penerimaan. Accounting memverifikasi, lalu sistem mengalokasikan nominal ke faktur tertua dulu, mengurangi piutang, memperbarui status faktur, dan membentuk jurnal kas lewat `postJournal()`.

## Known constraints

- `D-07`: jurnal lewat `postJournal()`.
- `D-08`: riwayat status.
- `D-33`: Finance mencatat; Accounting memverifikasi.
- `D-35`, `D-41`: `kas_bank` (102) dan `piutang_usaha` (110) sebagai peran.
- `D-43`: jurnal langsung diposting; tidak bisa diubah.
- `D-48`: pembatalan sebelum posting; setelah posting hanya lewat jurnal pembalik.
- `D-49`: kelebihan bayar ditolak; pembayaran sebagian lewat cicilan; alokasi ke faktur tertua dulu.
- `D-46`: pesanan `DIFAKTURKAN → SELESAI` saat piutang lunas.

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka.

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-01` | Kelebihan bayar: saldo kredit atau ditolak? | Terjawab — D-49: kelebihan bayar ditolak di versi awal, tanpa saldo kredit. |
| `PQ-02` | Selisih pembulatan dan pembayaran gabungan yang tidak sesuai nominal faktur? | Terjawab — D-49 (kelebihan ditolak) dan [USULAN-AGEN]: total alokasi harus sama dengan nominal penerimaan; tidak ada selisih yang disimpan atau dihapus otomatis; nominal dan alokasi dibulatkan dua desimal. Alasan: tanpa selisih, tidak ada akun selisih yang perlu dipakai di versi awal. |
| `PQ-03` | Metode penerimaan dan bukti pembayaran? | Terjawab — [USULAN-AGEN]: metode Transfer dan Giro, keduanya ke `kas_bank`; metode Tunai tidak tersedia di versi awal karena `D-41` tidak memuat akun kas tunai; bukti pembayaran berupa nomor referensi teks, tanpa unggahan berkas. Alasan: makalah tidak mewajibkan lampiran untuk penerimaan pelanggan. |
| `PQ-04` | Akun kas atau bank penerima? | Terjawab — D-41: peran `kas_bank` (102 Bank); pasangan Dr `kas_bank` / Cr `piutang_usaha` (`D-35`). |
| `PQ-05` | Verifikasi sebelum atau sesudah jurnal? | Terjawab — D-33 dan D-43 dan [USULAN-AGEN]: penerimaan `DICATAT` belum berjurnal dan belum mengurangi piutang; verifikasi Accounting membentuk jurnal dan alokasi sekaligus. Alasan: `D-43` menyatakan jurnal langsung diposting; makalah menyebut pencocokan sebelum status piutang diperbarui. |
| `PQ-06` | Pembayaran ditolak bank (cek mundur, transfer gagal)? | Terjawab — [USULAN-AGEN]: penerimaan `TERVERIFIKASI` yang gagal dibatalkan dengan alasan wajib lewat jurnal pembalik (`D-35`, `D-48`), alokasi dilepas, dan sisa faktur dihitung ulang dengan riwayat. Penerimaan tidak mundur; yang berubah adalah status faktur turunan. Alasan: `D-48` membolehkan pembatalan hanya lewat jurnal pembalik. |

## Decisions

| ID | Decision | Sumber | Consequence |
|---|---|---|---|
| `D-07` | jurnal lewat `postJournal()` | decisions.md | modul memanggil service |
| `D-08` | riwayat untuk semua dokumen | decisions.md | penerimaan dan faktur berjejak |
| `D-33` | Finance mencatat, Accounting memverifikasi | matriks-izin.md | dua peran per penerimaan |
| `D-49` | kelebihan ditolak; FIFO faktur | decisions.md | alokasi otomatis tertua dulu |

## Assumptions (agent-proposed)

- `[USULAN]` Satu penerimaan dapat menutup beberapa faktur pelanggan yang sama (`analisis-sia.md` §8.2 #8).
- `[USULAN]` Alokasi ke satu faktur tidak melebihi sisa faktur (`analisis-sia.md` §7.5).

## Rejected alternatives

- Pembayaran harus pas satu faktur: ditolak. Pembayaran gabungan dan cicilan dicakup (`D-49`).
- Saldo kredit untuk kelebihan bayar: ditolak (`D-49`).

## Catatan

Makalah: "Jika pembayaran tidak sesuai dengan tagihan" menampilkan kesalahan, sedangkan "Jika pembayaran hanya sebagian" menyisakan piutang. Batasnya ditetapkan oleh `PQ-01` (kelebihan ditolak) dan `PQ-02` (total alokasi = nominal): kurang dari total tagihan adalah pembayaran sebagian; lebih dari total tagihan terbuka adalah kelebihan dan ditolak.

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item menunggu `PD-005`, `FND-006`, dan gate fondasi (lihat `03-readiness-review.md`).
