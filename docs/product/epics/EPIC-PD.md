# EPIC-PD — Siklus Pendapatan

**Status:** `active`
**Track:** PD-A master · PD-B transaksi · PD-C keuangan · PD-D pelaporan
**Milestone:** M1

## Outcome

Pesanan pelanggan berubah menjadi pengiriman, faktur, piutang, dan penerimaan kas — dengan stok berkurang dan jurnal terbentuk di setiap perpindahan status.

## Cakupan

| Track | Item | Boleh jalan bersamaan dengan |
|---|---|---|
| PD-A | `PD-001` pelanggan, termin, batas kredit | semua track lain |
| PD-B | `PD-002` pesanan · `PD-003` cek stok · `PD-004` pengiriman | PD-C master |
| PD-C | `PD-005` faktur · `PD-006` pembayaran · `PD-007` retur | PD-B setelah `PD-004` |
| PD-D | `PD-008` jurnal · `PD-009` laporan | PD-C setelah `PD-005` |

## Aturan yang mengikat

- `D-14` termin pelanggan: default 30 hari, bisa di-override per pesanan.
- `D-16` batas kredit: blokir + override Manajemen; exposure = piutang + pesanan terbuka.
- `D-15` selisih qty pada retur tidak pernah otomatis.
- Stok berkurang saat pengiriman, bukan saat pesanan.
- Jurnal hanya lewat `postJournal()`.

## Gate selesai

1. Satu pesanan bisa mengalir sampai pembayaran tanpa menyentuh database.
2. `PD-008` menghasilkan jurnal balance untuk penjualan, HPP, dan kas.
3. `PD-009` menunjukkan angka yang sama dengan jurnal.
4. Retur mengurangi piutang dan mengembalikan stok.

## Risiko

| Risiko | Mitigasi |
|---|---|
| Batas kredit memblokir demo | seed menyediakan pelanggan dengan limit cukup dan satu kasus terlampaui |
| HPP bergantung pada `FND-005` | uji dengan harga rata-rata yang sudah pasti dari seed |
