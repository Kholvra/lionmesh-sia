# EPIC-PG — Siklus Pengeluaran

**Status:** `active`
**Track:** PG-A master · PG-B pengadaan · PG-C penerimaan · PG-D utang · PG-E bank
**Milestone:** M1

## Outcome

Kebutuhan barang berubah menjadi permintaan, PO, penerimaan, utang yang tervalidasi tiga dokumen, dan pembayaran — dengan jurnal dan saldo utang yang konsisten.

## Cakupan

| Track | Item |
|---|---|
| PG-A | `PG-001` pemasok, termin, toleransi match |
| PG-B | `PG-002` permintaan · `PG-003` approval · `PG-004` pemilihan pemasok · `PG-005` PO |
| PG-C | `PG-006` penerimaan · `PG-007` QC bahan & retur |
| PG-D | `PG-008` three-way match & utang · `PG-009` pembayaran |
| PG-E | `PG-010` rekonsiliasi bank |

## Aturan yang mengikat

- `D-05` tabel dan aturan pengadaan ada di `C-013`, bukan di modul ini. Epic ini membangun layar dan alurnya.
- `D-14` termin pemasok tidak punya default; wajib diisi per invoice.
- `D-15` toleransi match per pemasok, default 0, hanya untuk harga/total. Selisih qty selalu exception.
- Barang masuk stok hanya setelah QC lulus.
- Utang diakui saat tiga dokumen cocok, bukan saat PO terbit.

## Gate selesai

1. Satu permintaan mengalir sampai pembayaran.
2. `PG-008` menolak invoice yang qty-nya melebihi penerimaan.
3. `PG-010` bisa mencocokkan mutasi bank dengan pembayaran.
4. Saldo utang di laporan sama dengan jurnal.

## Catatan jalur kritis

Epic ini adalah jalur terpanjang (level 9). Menambah orang di sini mempercepat keseluruhan proyek; menambah orang di Pendapatan tidak.
