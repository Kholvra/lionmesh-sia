# PG-005 — Diskusi

## Konteks

Item backlog `PG-005` berjudul "Purchase order" (track PG-B pengadaan, level 4, depends on `PG-003` dan `PG-004`). Sumber fitur: `reference/analisis-sia.md` §5.3 fitur PG-5 "terbit, kirim, konfirmasi supplier" (P0).

Langkah 16 di §6.4 menggambarkan alurnya: PO `DITERBITKAN`. Catatan `[ANALISIS]` di sumber menegaskan: PO hanya janji, tidak menaikkan stok dan tidak menaikkan utang.

Koreksi (2026-11-22): `D-46` tidak memuat status "dikirim" atau "dikonfirmasi" untuk PO. Setelah `DITERBITKAN`, state machine langsung berlanjut ke penerimaan (`DITERIMA_SEBAGIAN` / `DITERIMA`).

## Kenapa ini item

PO adalah dokumen komitmen ke pemasok. Barang yang datang (`PG-006`) dan faktur pemasok (`PG-008`) perlu dasar PO yang bisa dicocokkan. Tanpa PO, tiga dokumen tidak bisa dicocokkan.

## Alternatif yang dipertimbangkan

| Alternatif | Kenapa tidak dipilih |
|---|---|
| PO langsung membuat jurnal atau menaikkan utang | `analisis-sia.md` §6.4: laporan keuangan membengkak sebelum barang ada. `D-07` dan `D-44` mengakui peristiwa hanya saat terjadi |
| Stok masuk saat PO diterbitkan | `D-36` dan `analisis-sia.md` §6.4: stok masuk hanya setelah QC lulus (`PG-007`) |
| Koreksi PO dengan revisi di tempat | `D-46` tidak memuat revisi setelah `DITERBITKAN`; `[USULAN]` G15 menyebut koreksi lewat dokumen baru |

## Keputusan yang diambil (dari sumber terkunci)

1. `D-07`: jurnal hanya ditulis lewat `postJournal()` di core ledger. PO tidak menulis jurnal.
2. `D-17`: harga net belum PPN; PPN dihitung di dokumen dengan tarif dari `konfigurasi_pajak` berversi.
3. `D-05`: tabel PO di core; layar dan alur PO milik track PG-B.
4. `D-08`: riwayat status lewat `riwayat_status`.
5. `D-09`: DDL dinomori tech lead.
6. `D-46`: daftar status mengikuti state machine §5.2: `DITERBITKAN → DITERIMA_SEBAGIAN / DITERIMA → QC_LULUS / QC_GAGAL → COCOK / SELISIH → TERCATAT → DIBAYAR_SEBAGIAN / LUNAS`. Tidak ada `DIKIRIM`, `DIKONFIRMASI`, atau `DIBATALKAN` di `D-46`.
7. `D-35` dan `D-41`: akun `ppn_masukan` dipanggil lewat peran. Nomornya ditetapkan saat `FND-006` ditulis.
8. `D-14`: termin ada di pemasok dan faktur, bukan di PO.
9. `D-33`: terbitkan PO → Purchasing. Konfigurasi (tarif pajak) di-seed tech lead; layar pengelolaan ditunda sampai ada item yang memintanya.
10. `D-38`: transaksi IDR.
11. `D-23`: pemasok tidak punya akun dan tidak berinteraksi dengan sistem.
12. `D-48`: dokumen yang belum diposting boleh dibatalkan pemohon dengan alasan wajib. Setelah diposting, koreksi lewat jurnal pembalik dan status tidak mundur.
13. `D-50`: format nomor dokumen `{TIPE}/{TAHUN}/{BULAN}/{URUT}`.
14. `D-43`: jurnal tidak bisa diubah atau dihapus; koreksi dengan jurnal pembalik.

## Pertanyaan terbuka

Ringkasan klasifikasi (diperbarui 2026-11-22 setelah `D-47` sampai `D-53`): 11 pertanyaan. Terjawab `D-xx`: 8 (termasuk Q-05 dan Q-06 yang juga punya detail `[USULAN-AGEN]`). Terjawab `[USULAN-AGEN]`: 3. Terbuka: 0.

- `Q-01` Pengiriman PO ke pemasok: lewat apa? Pemasok tidak punya akun (`D-23`).
  → **Terjawab — [USULAN-AGEN].** PO dikirim di luar sistem (email atau cetak) oleh Purchasing. Sistem tidak mengirim ke pemasok dan tidak punya status "dikirim" (`D-46`). Alasan: `D-23` mengeluarkan portal pemasok dan `D-52` mengeluarkan WhatsApp; `D-50` membatasi notifikasi ke pengguna internal.

- `Q-02` Konfirmasi pemasok dicatat oleh siapa, dan dengan bukti apa?
  → **Terjawab — [USULAN-AGEN].** Purchasing dapat mencatat konfirmasi sebagai catatan teks dengan tanggal pada PO. Konfirmasi tidak menjadi status (`D-46`). Berkas bukti tidak dibangun di item ini. Alasan: `diagram-sia-lengkap.md` PG06 menulis konfirmasi di luar sistem, dan `D-46` tidak memberi status untuknya.

- `Q-03` Apakah satu permintaan bisa menjadi beberapa PO?
  → **Terjawab — [USULAN-AGEN].** Satu permintaan menghasilkan satu PO, sesuai satu pemasok per permintaan (`PG-004` Q-09). Alasan: `D-46` memuat satu jalur per permintaan, dan makalah menetapkan per permintaan.

- `Q-04` Daftar status PO setelah `DITERBITKAN`.
  → **Terjawab — D-46.** Status lanjutan: `DITERIMA_SEBAGIAN` / `DITERIMA`, lalu `QC_LULUS` / `QC_GAGAL`, `COCOK` / `SELISIH`, `TERCATAT`, `DIBAYAR_SEBAGIAN` / `LUNAS`. "Kirim" dan "konfirmasi" bukan status. `proses-bisnis.md` §12 (PO `terbuka → selesai`) dikalahkan `D-46`.

- `Q-05` Pembatalan PO setelah diterbitkan: boleh atau tidak, dan apa dampaknya ke permintaan?
  → **Terjawab — D-48** dengan detail `[USULAN-AGEN]`. Purchasing boleh membatalkan PO dengan alasan wajib selama belum ada penerimaan pertama. PO menjadi `DIBATALKAN` (final), dan permintaan ikut `DIBATALKAN`. Setelah ada penerimaan, pembatalan tidak diizinkan; koreksi lewat jurnal pembalik di `PG-006` dan `PG-007`. Alasan: `D-48` menetapkan "belum diposting" sebagai batas, dan PO belum menghasilkan jurnal atau stok; permintaan ikut dibatalkan supaya status tidak mundur dari `DITERBITKAN` ke `PEMASOK_DITETAPKAN`.

- `Q-06` Perubahan harga atau qty setelah PO diterbitkan.
  → **Terjawab — D-48** dengan detail `[USULAN-AGEN]`. PO yang sudah `DITERBITKAN` tidak bisa diedit. Koreksi dilakukan dengan membatalkan PO (selama belum ada penerimaan) lalu membuat permintaan baru. Setelah ada penerimaan, koreksi lewat jurnal pembalik (`D-43`). Alasan: `D-48` menolak perubahan setelah diposting dan `[USULAN]` G15 meminta koreksi lewat dokumen baru.

- `Q-07` Akun PPN masukan belum ditetapkan di sumber.
  → **Terjawab — D-35 dan D-41.** Peran `ppn_masukan` ada (`D-35`). Nomor akun ditetapkan saat `FND-006` ditulis (`D-41`). Nomor harus ada sebelum `PG-008` memposting; tidak memblokir item ini.

- `Q-08` Apakah PO menampilkan termin?
  → **Terjawab — D-14.** Termin tidak disimpan di PO. Pertentangan: `LAPORAN_PENGERJAAN_PROYEK.txt` langkah 3 dan `diagram-sia-lengkap.md` PG06 menulis PO memuat "ketentuan pembayaran". `D-14` menang. Informasi pembayaran diambil dari master pemasok dan faktur.

- `Q-09` Mata uang PO.
  → **Terjawab — D-38.** IDR sampai ada kebutuhan. Mata uang asing tidak dibahas.

- `Q-10` Format nomor PO.
  → **Terjawab — D-50.** Format `PO/{tahun}/{bulan}/{urut}` ditetapkan sekali di `FND-004`, contoh `PO/2026/11/0001`. Contoh `PO-202609-0001` di `proses-bisnis.md` dikalahkan `D-50`.

- `Q-11` Pemilik dan layar tabel `konfigurasi_pajak` (tarif PPN berversi), dan apakah AC-02 membutuhkan layar.
  → **Terjawab — D-33, D-51(a), dan D-31.** Tarif diisi tech lead lewat seed (`D-33`), layar ditunda sampai ada item yang memintanya. Nilai awal dari regulasi yang berlaku diverifikasi dan dikutip saat `PD-005` ditulis (`D-51`(a)). Tabel dimiliki `core/` (`D-31`). AC-02 memakai seed uji dengan dua versi tarif (nilai uji, bukan nilai regulasi). Tidak perlu layar baru.

## Assumptions (agent-proposed)

- `[ANALISIS]` PO tidak membuat jurnal, tidak menaikkan stok, dan tidak menaikkan utang (§6.4 langkah 16).
- `[USULAN]` Dokumen PO yang sudah diterbitkan tidak diedit diam-diam. Koreksinya lewat pembatalan dan permintaan baru, atau jurnal pembalik setelah penerimaan (G15, `D-48`).
- `[USULAN]` Dokumen tidak dihapus, hanya dibatalkan (§8.2 #9; `D-48`).

## Next step

Tidak ada pertanyaan terbuka. Semua `[USULAN-AGEN]` di atas menunggu kunci koordinator. Item tetap `specified` sampai dependensi `done`; lihat `03-readiness-review.md`.
