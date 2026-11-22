# PD-004 — Diskusi

## Konteks

Saat barang keluar gudang, stok fisik berkurang, surat jalan terbit, dan pelanggan menerima barang (`analisis-sia.md` §6.6). Ini momen stok berkurang (`EPIC-PD`) dan momen HPP (`D-44` (3)). Item ini adalah track PD-B, level 3, dengan dependensi `PD-002` dan `PD-003`.

## Actor / consumer

Gudang dan Pengiriman (`D-33`, "Buat pengiriman"). Accounting menerbitkan faktur dari pengiriman di `PD-005`.

## Problem

Tanpa pengiriman terdokumentasi, stok keluar tidak punya jejak dan faktur tidak punya dasar nilai (`analisis-sia.md` §6.6).

## Desired outcome

Gudang membuat pengiriman dari pesanan yang dialokasikan. Saat pengiriman dikirim (`DIKIRIM`), stok berkurang, alokasi dilepas, surat jalan terbit, dan status pesanan berubah. Pengiriman diterima pelanggan (`DITERIMA`) dengan bukti terima.

## Known constraints

- `EPIC-PD`: stok berkurang saat pengiriman.
- `D-06`: qty dari mutasi; nilai dari `saldo_stok`.
- `D-08`: setiap perubahan status masuk `riwayat_status`.
- `D-10`: nilai keluar = qty × harga rata saat pengiriman.
- `D-42`: pembuat pesanan tidak boleh mengirim barangnya.
- `D-46`: status pesanan `SIAP_KIRIM → TERKIRIM_SEBAGIAN / TERKIRIM`.
- `D-47(b)`: pengiriman punya status sendiri `DIKIRIM → DITERIMA`; `TERKIRIM_SEBAGIAN` dan `TERKIRIM` adalah status pesanan.
- `D-50`: format nomor dokumen.
- `D-48`: sebelum diposting boleh dibatalkan; setelah diposting hanya lewat jurnal pembalik.

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka.

| ID | Pertanyaan | Status |
|---|---|---|
| `PQ-01` | Role yang boleh membuat pengiriman? | Terjawab — D-33 (Gudang, Pengiriman) dan D-42 (pembuat pesanan tidak boleh mengirim). |
| `PQ-02` | Pengiriman parsial didukung? | Terjawab — D-46: `TERKIRIM_SEBAGIAN` ada. Jumlah pengiriman per pesanan: [USULAN-AGEN] tidak dibatasi jumlahnya, selama qty kirim kumulatif per baris ≤ qty pesanan. Alasan: makalah melarang pengiriman parsial, tetapi `D-46` menang; batas jumlah tidak punya sumber. |
| `PQ-03` | Bukti terima: status saja atau berkas? | Terjawab — [USULAN-AGEN]: bukti terima = tanggal terima dan nama penerima yang diisi saat `DIKIRIM → DITERIMA`; tidak ada unggahan berkas di versi awal. Alasan: makalah tidak memuat tabel lampiran untuk pengiriman; `bukti_pembayaran` hanya ada di pembayaran. |
| `PQ-04` | Format surat jalan dan nomor? | Terjawab — D-50: nomor mengikuti `{TIPE}/{TAHUN}/{BULAN}/{URUT}` dari `FND-004`, satu nomor per pengiriman (makalah: `no_surat_jalan` unik). Kode `{TIPE}` ditetapkan di `FND-004`. |
| `PQ-05` | Boleh pengiriman melebihi stok tersedia atau alokasi? | Terjawab — [USULAN-AGEN]: qty kirim per baris ≤ alokasi aktif baris (bukan stok tersedia). Saldo fisik yang kurang dari qty kirim ditolak sebagai exception. Alasan: alokasi (`PD-003`) sudah mengunci stok. |
| `PQ-06` | Pembatalan setelah stok keluar? | Terjawab — [USULAN-AGEN]: pengiriman `DIKIRIM` tidak dibatalkan. Koreksi barang yang kembali dilakukan lewat retur penjualan (`PD-007`), yang memasukkan stok lagi setelah QC. Alasan: `D-48` hanya membolehkan pembatalan sebelum posting. |
| `PQ-07` | Akun HPP? | Terjawab — D-41 dan D-44 (3): HPP `hpp` / persediaan `persediaan_barang_jadi` saat pengiriman dikirim (nomor akun di `FND-006`). |

## Decisions

| ID | Decision | Sumber | Consequence |
|---|---|---|---|
| `D-06`, `D-10` | qty dari mutasi, nilai harga rata | decisions.md | mutasi keluar wajib lewat core |
| `D-42` | pembuat pesanan tidak mengirim | decisions.md | aturan konfirmasi di server |
| `D-46` | status pesanan | decisions.md | `TERKIRIM_SEBAGIAN`, `TERKIRIM` |
| `D-47(b)` | status pengiriman `DIKIRIM → DITERIMA` | decisions.md | dua status pengiriman |

## Assumptions (agent-proposed)

- `[USULAN]` Pengiriman mengacu ke satu pesanan; baris pengiriman menunjuk baris pesanan.
- `[USULAN]` Pengiriman `DIKIRIM` tidak dihapus; pembatalan hanya dari `DRAFT`.

## Rejected alternatives

- Stok keluar saat pesanan dibuat: ditolak (`EPIC-PD`).
- Faktur dari pesanan: ditolak (`analisis-sia.md` §6.6).
- Status pengiriman `TERKONFIRMASI_PELANGGAN`: tidak dipakai (`D-47(b)`).

## Catatan pertentangan

- Makalah menyatakan "Pengiriman parsial belum ditampung" dan "satu pesanan paling banyak satu pengiriman"; `D-46` memuat `TERKIRIM_SEBAGIAN`. `D-46` menang.

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item menunggu `PD-002`, `PD-003`, dan gate fondasi (lihat `03-readiness-review.md`).
