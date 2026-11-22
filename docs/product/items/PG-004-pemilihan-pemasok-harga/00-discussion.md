# PG-004 — Diskusi

## Konteks

Item backlog `PG-004` berjudul "Pemilihan pemasok & perbandingan harga" (track PG-B pengadaan, level 3, depends on `PG-002` dan `PG-001`). Sumber fitur: `reference/analisis-sia.md` §5.3 fitur PG-4 "pilih pemasok: kandidat, riwayat harga" (P1).

Langkah 15 di §6.4 menggambarkan alurnya: setelah PR disetujui, Purchasing memilih pemasok dan status menjadi `PEMASOK_DITETAPKAN`. Matriks §3.3 memberi "pilih pemasok" kepada Purchasing (`D-33`). Nama status `PEMASOK_DITETAPKAN` ada di state machine `D-46`.

## Kenapa ini item

PO (`PG-005`) membutuhkan satu pemasok yang sudah ditetapkan dan harga yang sudah dibandingkan. Tanpa langkah ini, PO tidak punya dasar pemilihan yang bisa ditelusuri.

## Alternatif yang dipertimbangkan

| Alternatif | Kenapa tidak dipilih |
|---|---|
| Pemasok dipilih sebelum approval | `D-46` dan `D-33`: pemilihan hanya dari `DISETUJUI` |
| Riwayat harga dibaca dari PO dan faktur | membuat `PG-004` bergantung pada `PG-005` dan `PG-008` yang belum ada |

## Keputusan yang diambil (dari sumber terkunci)

1. `D-17`: harga master net belum PPN. Perbandingan memakai harga net.
2. `D-14`: termin pemasok tanpa default dan wajib diisi. Termin tidak dipakai di langkah ini.
3. `D-15`: toleransi hanya berlaku untuk harga dan total saat pencocokan (`PG-008`), bukan saat pemilihan.
4. `D-25`: data pemasok dan produk lewat service core, bukan tabel modul lain.
5. `D-46`: `DISETUJUI → PEMASOK_DITETAPKAN` (pilih pemasok) → `DITERBITKAN` (PO terbit). Tidak ada transisi ganti pemasok.
6. `D-33`: pilih pemasok → Purchasing.
7. `D-38`: transaksi IDR; harga pembanding dalam IDR.
8. `D-50`: master nonaktif tidak bisa dipilih untuk dokumen baru.

## Pertanyaan terbuka

Ringkasan klasifikasi (diperbarui 2026-11-22 setelah `D-47` sampai `D-53`): 10 pertanyaan (9 asli + 1 baru). Terjawab `D-xx`: 4. Terjawab `[USULAN-AGEN]`: 6. Terbuka: 0.

- `Q-01` Sumber harga pembanding: input manual, daftar harga, atau dokumen penawaran?
  → **Terjawab — [USULAN-AGEN].** Harga pembanding diinput manual oleh Purchasing per barang per pemasok, bertanggal, dalam IDR dan net sebelum PPN (`D-17`, `D-38`). Harga master produk di `C-011` ditampilkan sebagai referensi, tidak dihitung sebagai pembanding. Alasan: `D-23` mengeluarkan portal pemasok, sehingga penawaran tidak datang dari pemasok lewat sistem; sumber tidak menyebut daftar harga pemasok.

- `Q-02` "Riwayat harga" berasal dari mana?
  → **Terjawab — [USULAN-AGEN].** Riwayat adalah kumpulan harga pembanding yang pernah disimpan per barang per pemasok, dengan tanggal. Tidak dibentuk dari PO atau faktur. Alasan: menghindari dependensi ke `PG-005` dan `PG-008`; riwayat dari PO dapat ditambahkan sebagai pengembangan setelah keduanya ada.

- `Q-03` Kriteria pemilihan: pemasok termurah wajib, atau bebas?
  → **Terjawab — [USULAN-AGEN].** Tidak wajib termurah. Sistem menampilkan harga terendah pada perbandingan, dan Purchasing boleh memilih pemasok lain dengan alasan tertulis (`Q-04`). Alasan: sumber menyebut kriteria "data pemasok, harga, dan ketentuan pengadaan" tanpa mewajibkan termurah, dan `diagram-sia-lengkap.md` PG05 menyebut harga, lead time, dan kualitas.

- `Q-04` Apakah alasan pemilihan wajib diisi?
  → **Terjawab — [USULAN-AGEN].** Wajib bila pemasok yang dipilih bukan harga terendah pada perbandingan. Bila pemasok yang dipilih adalah harga terendah, alasan tidak wajib. Alasan: memberi jejak untuk keputusan yang menyimpang dari harga terendah, tanpa menambah beban pada keputusan yang wajar.

- `Q-05` Nama dan aturan status `PEMASOK_DITETAPKAN`.
  → **Terjawab — D-46.** Status tercantum di state machine §5.2 setelah `DISETUJUI` ("pilih pemasok"). Nama akhir tetap spec.

- `Q-06` Apakah pemasok boleh diganti setelah ditetapkan?
  → **Terjawab — D-46.** State machine tidak memuat transisi ganti pemasok. Bila kelak dibutuhkan, itu keputusan baru (`D-46`, "Cara mengubah keputusan").

- `Q-07` Apakah pemasok kandidat harus aktif dan sudah bertermin?
  → **Terjawab — D-50 dan D-14.** Master nonaktif tidak bisa dipilih untuk dokumen baru (`D-50`), sehingga kandidat harus aktif. Termin wajib terisi saat pemasok disimpan (`D-14`), sehingga kandidat selalu bertermin.

- `Q-08` Apakah harga pembanding bisa dalam mata uang asing?
  → **Terjawab — D-38.** Transaksi IDR sampai ada kebutuhan. Mata uang dan kurs hanya master.

- `Q-09` Granularitas penetapan: satu pemasok per permintaan, atau per item?
  → **Terjawab — [USULAN-AGEN].** Satu pemasok per permintaan. Alasan: makalah menyebut "memilih pemasok yang sesuai" per permintaan; diagram PG05 `[USULAN]` per item sengaja tidak dipilih agar satu permintaan menghasilkan satu PO (lihat `PG-005` Q-03).

- `Q-10` (baru) Apakah item ini bergantung pada `PG-003`? Status `DISETUJUI` yang menjadi syarat berasal dari `PG-003`, tetapi `backlog.md` hanya mencantumkan `PG-001` dan `PG-002`.
  → **Terjawab — [USULAN-AGEN].** Ya, secara logis `PG-003` diperlukan, karena pemilihan hanya dari `DISETUJUI` (`D-46`). `backlog.md` tidak diubah di paket ini; front-matter tetap sesuai backlog. Koordinator perlu menambahkan `PG-003` ke `depends on` bila setuju. Dependensi ini ikut disebut sebagai dependensi di `03-readiness-review.md`.

## Assumptions (agent-proposed)

- `[USULAN]` Harga pembanding disimpan per barang per pemasok dengan tanggal.
- `[USULAN]` Pemilihan tidak membuat jurnal atau mutasi stok. Akun debit dan kredit tidak berlaku.
- `[ANALISIS]` Riwayat harga bukan dokumen transaksi baru; ia dibaca dari data harga pembanding yang tersimpan.

## Next step

Tidak ada pertanyaan terbuka. Semua `[USULAN-AGEN]` di atas menunggu kunci koordinator. Item tetap `specified` sampai dependensi `done`; lihat `03-readiness-review.md`.
