# PD-007 — Acceptance Criteria

Setiap kriteria dapat dibuktikan lewat UI dan pemeriksaan stok serta jurnal. Angka contoh bersifat ilustrasi; PPN dinyatakan sebagai T (`D-51(a)`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Retur hanya bisa dibuat dari faktur pelanggan yang dirujuknya. | Buat retur dari faktur pelanggan A, pilih baris dari faktur B: ditolak "Retur harus merujuk faktur penjualan.". Tidak ada retur tersimpan. |
| `AC-02` | Retur tanpa persetujuan Accounting tidak memasukkan stok. | Buat retur qty 5, tidak disetujui. Saldo tidak berubah; tidak ada `mutasi_stok` masuk; tidak ada jurnal. |
| `AC-03` | Retur disetujui dan lulus QC menambah saldo sebesar qty lulus dan menerbitkan kredit memo. | Retur qty 5 disetujui Accounting; QC lulus 5. Saldo bertambah 5; satu baris `mutasi_stok` masuk; kredit memo terbit. |
| `AC-04` | Retur yang gagal QC tidak menambah saldo dan tidak menerbitkan kredit memo. | QC gagal (lulus 0) dengan alasan: status `DITOLAK`; saldo tidak berubah; piutang tidak berubah. |
| `AC-05` | Kredit memo mengurangi sisa faktur asal sesuai total retur. | Faktur total 1.000.000 belum dibayar. Retur dengan DPP 500.000 dan PPN = 500.000 × T lulus QC: sisa faktur = 1.000.000 − (500.000 + PPN). Nilai retur melebihi sisa ditolak. |
| `AC-06` | Jurnal retur balance lewat `postJournal()`: kredit memo dan pembalik HPP masing-masing debit = kredit. | Setelah `AC-03`: jurnal kredit memo dengan Dr `penjualan`, Dr `ppn_keluaran`, Cr `piutang_usaha`; jurnal HPP dengan Dr `persediaan_barang_jadi`, Cr `hpp`; keduanya balance. |
| `AC-07` | Selisih qty tidak pernah otomatis. | Disetujui 5, QC lulus 3: stok bertambah 3; kredit memo untuk 3 saja; sisa 2 tidak masuk stok dan tidak dikreditkan; alasan selisih tercatat. Tidak ada penyesuaian lain. |
| `AC-08` | Setiap transisi status menulis riwayat dengan aktor. | Ajukan, setujui, QC lulus: tiga baris riwayat dengan aktor yang benar. |
| `AC-09` | Pemohon tidak dapat menyetujui retur miliknya. | Login sebagai pengaju, setujui: ditolak "Pemohon retur tidak dapat menyetujui returnya sendiri."; status tetap `DIAJUKAN`. |
| `AC-10` | Stok masuk memakai harga rata saat retur. | Harga rata 5.000 saat retur, qty lulus 200: nilai masuk 1.000.000; `saldo_stok` nilai bertambah 1.000.000. |
| `AC-11` | Qty kumulatif retur tidak melebihi qty yang dikirim. | Dikirim 200 untuk baris; retur 150 selesai; retur baru 60: ditolak "Jumlah retur melebihi jumlah yang pernah dikirim..."; retur 50 diterima. |
| `AC-12` | Pembatalan retur sebelum QC membentuk status `DIBATALKAN` tanpa efek stok atau jurnal. | Batalkan retur `DISETUJUI` dengan alasan: status `DIBATALKAN`; saldo dan jurnal tidak berubah. Tanpa alasan: ditolak. |
| `AC-13` | QC tidak dapat mencatat hasil untuk retur yang belum disetujui. | Catat QC untuk retur `DIAJUKAN`: ditolak "Retur harus disetujui sebelum QC."; saldo tidak berubah. |
| `AC-14` | Retur pada periode terkunci ditolak dengan pesan. | Kunci periode, catat QC lulus: ditolak "Periode ... sudah ditutup..."; tidak ada mutasi atau jurnal. |

## Edge cases (optional)

- Retur dengan nilai melebihi sisa faktur asal: ditolak (`AC-05`).
- Retur setelah periode terkunci: ditolak (`AC-14`); koreksi lewat periode berjalan (`D-44` (5)).

## Verifiability

- `AC-01`, `AC-02`, `AC-08`, `AC-09`, `AC-11`..`AC-13` → uji manual UI.
- `AC-03`, `AC-04`, `AC-07`, `AC-10` → pemeriksaan `mutasi_stok` dan `saldo_stok`.
- `AC-05`, `AC-06`, `AC-14` → pemeriksaan jurnal dan piutang setelah `FND-005` dan `PD-005`.
