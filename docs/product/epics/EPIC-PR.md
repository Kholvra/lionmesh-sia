# EPIC-PR — Siklus Produksi

**Status:** `active`
**Track:** PR-A master · PR-B eksekusi · PR-C mutu · PR-D biaya
**Milestone:** M1

## Outcome

Perintah produksi mengubah bahan menjadi barang jadi, melewati QC, dan menghasilkan HPP per WO yang bisa dipertanggungjawabkan.

## Cakupan

| Track | Item |
|---|---|
| PR-A | `PR-001` BOM berversi, toleransi (master produk: `C-011`) |
| PR-B | `PR-002` perintah produksi · `PR-003` kebutuhan bahan · `PR-004` pemakaian & WIP |
| PR-C | `PR-005` hasil produksi & QC (rework/reject) |
| PR-D | `PR-006` biaya produksi & HPP · `PR-007` laporan |

## Rumus yang mengikat

```text
HPP unit = (bahan × harga_rata)
         + TKL
         + (DLH × tarif_overhead)
         + biaya rework
         − reject abnormal
```

- `D-10` bahan dinilai rata-rata bergerak.
- `D-11` BOM satu level, berversi, menyimpan `toleransi_scrap` dan `toleransi_reject`.
- `D-12` overhead dari tarif predeterminasi; selisih disesuaikan akhir periode.
- `D-13` reject dalam toleransi diserap; di atas toleransi menjadi kerugian produksi.

## Gate selesai

1. Satu WO mengalir dari permintaan bahan sampai barang jadi.
2. `PR-006` menghasilkan HPP yang komponennya bisa ditelusuri ke dokumen sumber.
3. Reject melebihi toleransi muncul sebagai kerugian, bukan menghilang di HPP.
4. Perubahan BOM tidak mengubah HPP WO lama.

## Dependensi lintas siklus

`PR-003` memakai `C-013` dari core, bukan modul Pengeluaran. Ini yang membuat Produksi tidak menunggu `PG-005`.

`PR-001` memakai `C-011` untuk master produk. Produksi tidak membuat tabel produk sendiri; yang dimiliki track ini hanya BOM, versi, dan toleransi.
