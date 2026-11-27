# PR-001..PR-007: bukti per item + rapihan UI menyusul

## Kondisi saat ini

Siklus produksi di-merge borongan (PR #39, satu squash, 46 file): layar BOM,
perintah produksi, pembelian bahan, kartu jam kerja, hasil produksi + QC,
laporan, dan biaya/HPP. Layar berjalan di atas store/tipe lokal modul;
tidak ada migrasi baru dan tidak ada bukti AC per item (`05-evidence.md`
ketujuh item belum diisi).

Keputusan merge yang diambil tech lead saat transplantasi:

- `src/lib/auth/server.ts` ikut versi `main` (hunk try/catch fail-soft dari
  branch dibuang).
- `next.config.ts` (redirect `/siklus-produksi`), `globals.css` (+67 utilitas),
  dan nav Produksi `tersedia: true` ikut masuk.
- Dua primitif UI baru (`arrow-icon`, `custom-select`) ikut masuk
  `src/components/ui/`; konsolidasi dengan `FND-007` menyusul.

## Pekerjaan yang dibutuhkan

1. Isi `05-evidence.md` + screenshot 1280px per item PR-001..PR-007 sesuai
   `02-acceptance-criteria.md` masing-masing.
2. Rapikan UI produksi ke token `docs/design/DESIGN_TOKENS.md` (jatah
   perbaikan akhir yang sudah disetujui tech lead).
3. Konsolidasi `arrow-icon`/`custom-select` dengan UI kit `FND-007`.
4. Hapus file ini setelah bukti ketujuh item lolos.

## Dampak

Sampai bukti ada, angka produksi (BOM, HPP, hasil QC) belum terbukti benar.
`INT-001`/`INT-003` yang memakai jurnal dan stok produksi mewarisi risiko ini.
