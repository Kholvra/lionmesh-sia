# EPIC-INT — Integrasi Lintas Siklus

**Status:** `active`
**Track:** join — tidak paralel dengan apa pun
**Milestone:** M2

## Outcome

Empat siklus berjalan di atas satu jurnal, satu saldo stok, dan satu set laporan yang angkanya saling cocok.

## Kenapa epic terpisah

Empat track bisa selesai sendiri-sendiri dan tetap menghasilkan sistem yang salah: jurnal benar per siklus, tapi total neraca tidak balance; stok benar di Gudang, tapi tidak cocok dengan jurnal persediaan.

Epic ini menguji **persimpangan**, bukan fitur.

## Cakupan

| ID | Outcome |
|---|---|
| `INT-001` | Jurnal gabungan konsisten: total debit = kredit, tidak ada akun menggantung |
| `INT-002` | Rantai end-to-end dari `db:reset` + `db:seed`: pesanan → pengadaan → produksi → payroll → laporan |
| `INT-003` | Rekonsiliasi stok fisik, mutasi, saldo, dan jurnal persediaan |

## Gate mulai

Tidak boleh mulai sebelum:

- `PD-008`, `PG-009`, `PR-007`, `GJ-007` `done`
- `C-009` dan `C-010` `done`

## Gate selesai

1. Neraca balance setelah seluruh siklus dijalankan berurutan.
2. Laba rugi bisa ditelusuri ke jurnal per siklus.
3. Nilai persediaan di neraca = `saldo_stok`.
4. Tidak ada dokumen yang bisa diposting ke periode tertutup.
5. Seluruh rantai bisa diulang dari `db:reset` + `db:seed` tanpa intervensi manual.

## Catatan

Kegagalan di epic ini biasanya bukan bug fitur, tapi **perbedaan asumsi antar modul**. Karena itu setiap temuan harus diselesaikan di `core/`, bukan ditambal di modul.
