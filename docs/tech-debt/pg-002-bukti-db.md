# PG-002: bukti AC database menyusul

## Kondisi saat ini

PG-002 di-merge (PR #40) tanpa bukti database: author tidak punya
Docker/Supabase lokal saat implementasi, sehingga `pnpm db:reset`,
`check:migrations` ulang, dan seluruh AC-01–AC-15 belum dijalankan.
Kode memakai tabel riil (`C-013`/`C-011` sudah di `main`), jadi yang kurang
adalah pembuktian, bukan implementasi.

Rute `/pengeluaran/permintaan` juga belum ada di navigasi shell; akses lewat
URL langsung (dicatat di `05-evidence.md` item ini).

## Pekerjaan yang dibutuhkan

1. `pnpm db:reset && pnpm db:seed:local`, jalankan skenario AC-01–AC-15 dari
   `02-acceptance-criteria.md` dan catat hasilnya di `05-evidence.md`.
2. Tambahkan entri navigasi pengeluaran bila alur shell sudah diputuskan.
3. Hapus file ini setelah bukti lolos.

## Dampak

Sampai bukti ada, alur permintaan pembelian (submit, periksa, revisi, batal)
belum terbukti jalan di atas data nyata. Item `PG-003`+ yang bergantung pada
alur ini mewarisi risiko tersebut.
