# C-014 — Bukti Verifikasi

## Review pagination (2026-11-24)

Query dokumen dan riwayat persetujuan dibaca per halaman, dengan urutan stabil; ID riwayat dibagi menjadi kelompok untuk membatasi panjang permintaan. Jika satu halaman gagal, hasil parsial ditolak. `node --test --experimental-strip-types src/core/dashboard/pagination.test.ts` menghasilkan 2 lulus, 0 gagal (2.001 baris dan kegagalan halaman kedua). `pnpm verify` menghasilkan 27 tes lulus, lint, typecheck, arch:check, dan build lulus pada Node 24 / pnpm 10.18.3. Ini belum menguji perubahan data bersamaan selama pagination atau database dengan lebih dari 1.000 dokumen.

Tanggal: 2026-11-24
Lingkungan: Node 24.22.2, pnpm 10.18.3, Next.js 16.4.6, Supabase lokal terisolasi
(`127.0.0.1:55321`, database `127.0.0.1:55322`, seed versi `0004`).
Akun uji: `manajemen@lionmesh.test`, `direksi@lionmesh.test`,
`karyawan@lionmesh.test` (sandi lokal `lionmesh-dev-2026`, hanya untuk database lokal).

## Perintah gerbang

| Perintah | Hasil |
|---|---|
| `pnpm test` | 25 tes lulus, 0 gagal; 11 tes baru di `src/core/dashboard/antrean.test.ts` |
| `pnpm verify` | Lulus: lint, typecheck, `arch:check` (105 modul, 0 pelanggaran), test, build |
| `pnpm check:migrations` | `ok — 10 berkas, nomor unik` |
| `git diff --check` | Lulus, tanpa whitespace error |

## Fixture pembuktian

Lima dokumen disisipkan langsung ke database lokal (bukan seed produksi) untuk
membuktikan otorisasi, pemisahan tugas, dua siklus, dua level, dan urutan:

| Dokumen | Tipe | Status | Pembuat | Snapshot | `updated_at` |
|---|---|---|---|---|---|
| `PR/2026/11/0901` | PERMINTAAN_PEMBELIAN | MENUNGGU_PERSETUJUAN | Gudang | Manajemen level 1 | 2026-11-20 |
| `PR/2026/11/0902` | PERMINTAAN_PEMBELIAN | MENUNGGU_PERSETUJUAN | Manajemen | Manajemen level 1 | 2026-11-19 |
| `PR/2026/11/0903` | PERMINTAAN_PEMBELIAN | MENUNGGU_PERSETUJUAN | Gudang | Manajemen level 1 → Direksi level 2 | 2026-11-18 |
| `PERIODE_GAJI/2026/11/0901` | PERIODE_GAJI | DIPERIKSA | HR | Direksi level 1 | 2026-11-21 |
| `PERIODE_GAJI/2026/11/0902` | PERIODE_GAJI | DIPERIKSA | HR | Direksi level 1 | 2026-11-22 |

`PR/2026/11/0903` memiliki satu baris `riwayat_status` `SETUJUI` level 1 oleh
Manajemen, sehingga level berikutnya adalah Direksi.

## Hasil per AC

| AC | Status | Bukti |
|---|---|---|
| AC-01 | ✅ | Manajemen melihat `PR/2026/11/0901` saja; `PR/2026/11/0902` (dokumennya sendiri) tidak muncul; dokumen payroll tidak muncul. Direksi melihat payroll dan `PR/2026/11/0903` level 2, bukan PR level 1. `bolehMenindaklanjuti()` diuji untuk peran, pembuat, dan approver sebelumnya. |
| AC-02 | ✅ | Direksi: kartu Pengeluaran = 1 dan Penggajian = 2; antrean berisi tepat 3 baris dengan nomor, jenis, siklus, tahap, dan waktu. Urutan: `PR/2026/11/0903` (18 Nov), `PERIODE_GAJI/2026/11/0901` (21 Nov), `PERIODE_GAJI/2026/11/0902` (22 Nov). |
| AC-03 | ✅ | Pendapatan dan Produksi menampilkan “Belum tersedia”, bukan 0. Karyawan (tanpa tindakan) melihat “Tidak ada tindakan yang menunggu”; jumlah Pengeluaran/Penggajian = 0 karena sumbernya tersedia. |
| AC-04 | ✅ | `REVOKE SELECT ON public.jenis_dokumen FROM service_role` membuat kartu Pengeluaran/Penggajian “Gagal dimuat”, banner error, dan baris tabel error dengan tombol “Coba lagi”; tidak ada klaim “Tidak ada tindakan yang menunggu”. Setelah `GRANT` dipulihkan, klik “Coba lagi” memuat kembali `PR/2026/11/0901`. |
| AC-05 | ✅ | Semua halaman siklus belum tersedia (`NAV_PRIMARY`), jadi `tautan` selalu `null`. HTML hasil render tidak membungkus nomor dengan `<a>`; tidak ada tautan mati. |
| AC-06 | ✅ | Konteks browser tanpa sesi membuka `/` lalu berakhir di `/login`; tidak ada data dokumen yang tampil. Karyawan hanya melihat antrean kosong dan kartu 0, tanpa data pengguna lain. |
| AC-07 | ✅ | Screenshot 1280px: `c014-manajemen-1280.png` (2×2 cards, tabel, alur), `c014-direksi-1280.png` (3 baris dua siklus), `c014-karyawan-1280.png` (kosong), `c014-error-1280.png` (gagal), `c014-recovered-1280.png` (pulih). Tidak ada data contoh atau ekspor. |
| AC-08 | ✅ | `src/core/dashboard/queries.ts` hanya membaca `jenis_dokumen`, `dokumen`, dan `riwayat_status` (tabel core FND-004). `pnpm arch:check` lulus; tidak ada impor modul siklus dan tidak ada tabel modul lain. |

## Catatan dan batas

- Antrean saat ini mencakup **langkah persetujuan** dari `approval_snapshot` dan
  `riwayat_status`, karena peran langkah “periksa” per jenis dokumen belum
  disimpan di data core. Tindakan non-approval tidak ditebak.
- Pemetaan jenis dokumen ke siklus berada di `SIKLUS_PER_TIPE`
  (`src/core/dashboard/antrean.ts`). Tipe tanpa pemetaan tidak dihitung diam-diam;
  jumlahnya dilaporkan sebagai peringatan “belum dapat dipetakan”.
- `tautan` dokumen sengaja `null` sampai halaman siklus tersedia; mengaktifkannya
  adalah pekerjaan item pemilik rute.
- Database verifikasi adalah stack Supabase lokal terpisah agar tidak mengganggu
  database bersama worktree lain.
- `Date.now()` dari pustaka Supabase Auth masih memicu insight Cache Components di
  log server (juga terjadi pada `/pengaturan`); build tetap lulus dan tidak
  memengaruhi perilaku dashboard. Periode dashboard sendiri dibungkus
  `connection()` + `Suspense`.
