# PD-008 — Acceptance Criteria

Setiap kriteria dapat dibuktikan dengan pemeriksaan jurnal dan saldo buku besar. Nilai contoh bersifat ilustrasi; PPN dinyatakan sebagai T (`D-51(a)`) dan akun dinyatakan sebagai peran (`D-35`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Pengiriman `DIKIRIM` menghasilkan satu jurnal HPP: Dr `hpp`, Cr `persediaan_barang_jadi`, nilai = qty × harga rata. | Kirim 200 lembar dengan harga rata 5.000: jurnal 1.000.000 dengan Dr `hpp` dan Cr `persediaan_barang_jadi`; debit = kredit. |
| `AC-02` | Faktur `DITERBITKAN` menghasilkan jurnal penjualan: Dr `piutang_usaha` total, Cr `penjualan` DPP, Cr `ppn_keluaran` PPN. | Faktur DPP 1.000.000 dan PPN = 1.000.000 × T: Dr piutang = 1.000.000 + PPN; Cr penjualan = 1.000.000; Cr PPN keluaran = PPN; balance. |
| `AC-03` | Penerimaan `TERVERIFIKASI` menghasilkan jurnal kas: Dr `kas_bank`, Cr `piutang_usaha`. | Penerimaan 500.000 terverifikasi: Dr kas_bank 500.000; Cr piutang 500.000. |
| `AC-04` | Retur `SELESAI` menghasilkan jurnal kredit memo dan jurnal pembalik HPP sesuai `PD-007`. | Retur dengan DPP 100.000 dan PPN = 100.000 × T, nilai masuk 60.000: jurnal kredit memo balance (Dr `penjualan`, Dr `ppn_keluaran`, Cr `piutang_usaha`); jurnal HPP Dr `persediaan_barang_jadi` 60.000, Cr `hpp` 60.000. |
| `AC-05` | Setiap jurnal balance; jurnal yang tidak balance tidak tersimpan. | Uji `postJournal()` dengan debit 100 dan kredit 90: ditolak "Jurnal tidak seimbang..."; tidak ada baris jurnal. |
| `AC-06` | Setiap jurnal menyimpan jenis transaksi asal, nomor transaksi asal, dan pemicu. | Periksa jurnal faktur: `jenis_transaksi` = faktur, `nomor_transaksi_asal` menunjuk faktur, `pemicu` = terbit. |
| `AC-07` | Jurnal di periode terkunci ditolak dengan pesan. | Kunci periode. Terbitkan faktur: "Periode ... sudah ditutup..." muncul; tidak ada jurnal atau faktur. |
| `AC-08` | Pembatalan dokumen berjurnal membentuk jurnal pembalik dengan arah berlawanan; jurnal asal tetap. | Batalkan faktur tanpa pembayaran (`PD-005` `AC-12`): jurnal asal tetap; jurnal pembalik nilai sama, Dr dan Cr dibalik; saldo akun kembali ke nilai sebelum faktur. |
| `AC-09` | Jumlah jurnal penjualan per periode konsisten dengan laporan `PD-009`. | Bandingkan total penjualan (neto retur) di `PD-009` dengan jumlah kredit akun `penjualan` dikurangi debit untuk periode yang sama. Selisih nol. |
| `AC-10` | Pengiriman tanpa harga rata tersedia ditolak tanpa mutasi dan tanpa jurnal. | Simulasi harga rata kosong (data uji): konfirmasi pengiriman ditolak "Harga rata belum tersedia..."; saldo dan jurnal tidak berubah. |
| `AC-11` | Tidak ada jurnal manual. | Tidak ada jalur UI atau API untuk membuat jurnal langsung; pencarian kode menemukan `postJournal()` dipanggil hanya dari modul penjualan dan core. |

## Edge cases (optional)

- Harga rata belum tersedia: `AC-10`.
- Dokumen di periode terkunci: `AC-07`; koreksi lewat jurnal pembalik di periode berjalan (`D-44` (5)).

## Verifiability

- `AC-01`..`AC-04`, `AC-06` → pemeriksaan jurnal setelah `FND-006` dan uji fixture data seed deterministik (`FND-008`).
- `AC-05` → uji unit `postJournal()`.
- `AC-07`, `AC-08`, `AC-10` → uji manual dengan periode uji dan data uji.
- `AC-09` → uji lintas `PD-009` setelah tersedia.
- `AC-11` → pencarian kode dan review.
