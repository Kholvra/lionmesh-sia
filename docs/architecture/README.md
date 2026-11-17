# Arsitektur

Kontrak batas sistem. Bukan panduan gaya — aturan di sini mengikat.

| ID | Kontrak | Cakupan | Status |
|---|---|---|---|
| `ARCH-001` | Batas core dan modul | dependensi, kepemilikan state, jurnal, stok, dokumen, migrasi | `Approved` |

## Aturan penempatan

- Kontrak untuk satu item backlog: `docs/product/items/<ID>-<slug>/04-design-contract.md`
- Kontrak lintas item: `docs/architecture/contracts/<ID>-<slug>/contract.md`
- Indeks ini diperbarui setiap kali kontrak baru ditambahkan.

## Status

| Status | Arti |
|---|---|
| `Proposed` | rancangan; belum mengikat |
| `Approved` | disetujui pemilik keputusan; mengikat |
| `Superseded` | diganti kontrak lain; arahkan ke pengganti |

`Unverified` pada tabel verifikasi berarti belum ada bukti dari pemeriksa. Kontrak yang belum dijalankan tidak boleh disebut "sudah aman".

## Penegakan

Penegakan otomatis:

| Aturan | Alat | Perintah | Status |
|---|---|---|---|
| `ARCH-01`, `ARCH-02` | dependency-cruiser (`.dependency-cruiser.cjs`) | `pnpm arch:check` | aktif |
| `ARCH-07` | `scripts/check-migrations.mjs` | `pnpm check:migrations` | aktif |
| `ARCH-08` | belum ada | — | menunggu checker |

Keduanya dijalankan di `pnpm verify` dan di CI. Review tetap wajib, tapi review bukan bukti mesin.
