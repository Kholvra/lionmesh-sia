# PG-003: bukti database menunggu Supabase lokal

## Kondisi saat ini

PG-003 sudah diimplementasikan: estimasi nilai saat review, approve/tolak per
jenjang, dan migrasi `0017` (`periksa_pr_dengan_nilai`). Mesin status, riwayat,
dan pemisahan tugas tetap milik `FND-004`.

Seluruh AC yang butuh database belum dijalankan karena mesin penulis tidak
punya Docker/Supabase lokal. Yang terbukti baru `pnpm typecheck`, `pnpm lint`,
`pnpm test`, `pnpm arch:check`, `pnpm build`, `pnpm check:migrations`, dan unit
test schema penolakan.

## Pekerjaan yang dibutuhkan

1. Nyalakan Supabase lokal, jalankan `pnpm db:reset` lalu `pnpm db:seed:local`.
2. Jalankan AC-01 sampai AC-12 dari `02-acceptance-criteria.md` lewat UI
   (`/pengeluaran/permintaan`) memakai akun Gudang, Purchasing, dan Manajemen.
3. Untuk AC-02 dan AC-08 pakai seed uji dua jenjang / tanpa aturan; jangan
   mengubah seed produksi.
4. Ambil screenshot 1280px dan perbarui `05-evidence.md`.
5. Konfirmasi nomor migrasi `0017` ke tech lead (`D-09`; `0016` milik GJ-001).

## Dampak

Review Purchasing tidak bisa dibuktikan menyimpan estimasi nilai, dan jenjang
approval tidak bisa dibuktikan berhenti atau lanjut sesuai `aturan_approval`.
Kode dan migrasi sudah ada; risikonya pada kebenaran transisi, bukan pada
tampilan.
