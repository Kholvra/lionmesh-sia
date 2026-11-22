# FND-005 — Bukti Verifikasi

Tanggal: 2026-11-22
Lingkungan: PostgreSQL 17.12 on x86_64-pc-linux-gnu, Node.js v24.22.2, Next.js 16.4.6, pnpm 10.18.3
Perintah verifikasi: `node scripts/verify-fnd-005.mjs` && `pnpm verify`

---

## Ringkasan Hasil Uji Acceptance Criteria

| AC | Deskripsi | Status | Bukti Teramati |
|---|---|---|---|
| `AC-01` | Mutasi masuk menaikkan qty & nilai, hitung ulang harga rata bergerak | `PASS` | Saldo awal P di G: qty 10, nilai 100 (harga 10). Masuk qty 5 @ 16. Saldo akhir: qty 15, nilai 180, harga_rata 12,0000. |
| `AC-02` | Mutasi keluar mengurangi qty & nilai pada harga rata; harga rata tetap | `PASS` | Dari AC-01, keluar qty 4. Hasil saldo: qty 11, nilai 132, harga_rata 12,0000; nilai_keluar = 48. |
| `AC-03` | Qty saldo = sum(mutasi_stok.qty) (`ARCH-001` `INV-03`) | `PASS` | `select sum(qty) from mutasi_stok` = 11, `saldo_stok.qty` = 11. Identik. |
| `AC-04` | Nilai saldo sesuai qty × harga rata dalam toleransi (`0,01 + qty × 0,00005`, `INV-02`) | `PASS` | `saldo_stok.nilai` = 132; `qty * harga_rata` = 132; selisih = 0,000000 <= toleransi 0,010550. |
| `AC-05` | Mutasi & saldo dalam satu transaksi; rollback bila gagal | `PASS` | Mutasi ilegal yang memicu error digagalkan: jumlah baris `mutasi_stok` sebelum dan sesudah tetap sama. |
| `AC-06` | Role klien (`anon`, `authenticated`) ditolak DML langsung (`ARCH-04`) | `PARTIAL` | Penulisan langsung ditolak dan RPC terbatas ke `service_role`; RPC berhasil sebagai `service_role` pada DB uji terisolasi. Integrasi pemanggil `core/inventory` service-role belum tersedia; jalur session client akan ditolak. |
| `AC-07` | Mutasi backdate ditolak | `PASS` | Mutasi dengan tanggal lebih awal dari mutasi terakhir ditolak: `"Tanggal mutasi tidak boleh mendahului mutasi terakhir (2026-11-22 12:00:00+00)."`; baris tidak bertambah. |
| `AC-08` | Mutasi qty 0 ditolak | `PASS` | Ditolak dengan pesan: `"Qty harus bukan nol."`. |
| `AC-09` | Mutasi tidak bisa diubah atau dihapus | `PASS` | Trigger `trg_mutasi_stok_immutable` menolak `UPDATE` dan `DELETE` dengan pesan: `"Mutasi stok tidak bisa diubah atau dihapus. Koreksi dengan mutasi baru."`. |
| `AC-10` | Keluar melebihi saldo ditolak (`OQ-05-02`) | `PASS` | Coba keluar 12 dari saldo 11 ditolak dengan: `"Qty keluar 12 melebihi stok tersedia 11."`; saldo tidak berubah. |
| `AC-11` | Keluar seluruh saldo membuat nilai 0 & pertahankan `harga_rata` | `PASS` | Dari saldo qty 11 nilai 132, keluar 11: saldo akhir qty 0, nilai 0, harga_rata 12,0000 tetap dipertahankan. |
| `AC-12` | Transfer antar gudang memindahkan qty & nilai secara atomik (`D-52`) | `PASS` | Transfer 3 dari G1 (qty 11, nilai 132) ke G2 (kosong): G1 menjadi qty 8, nilai 96; G2 menjadi qty 3, nilai 36, harga_rata 12,0000. Mutasi `TRANSFER_KELUAR` dan `TRANSFER_MASUK` tersimpan. Transfer ke gudang sama ditolak: `"Gudang asal dan tujuan tidak boleh sama."`. |
| `AC-13` | Stock opname menghasilkan mutasi `PENYESUAIAN` (`D-52`) | `PASS` | Saldo G1 (8, 96): Fisik 10 -> mutasi masuk 2 @ 12 (nilai 24), saldo (10, 120); Fisik 7 -> mutasi keluar 3 @ 12 (nilai 36), saldo (7, 84). Opname tanpa alasan ditolak: `"Isi alasan penyesuaian stok."`. |
| `AC-14` | Produk atau gudang nonaktif tidak bisa dipakai (`D-50`) | `PASS` | Mutasi ke gudang nonaktif ditolak: `"Gudang G-TEST-NONAKTIF tidak ditemukan atau nonaktif."`; produk nonaktif ditolak: `"Produk PROD-TEST-NONAKTIF tidak ditemukan atau nonaktif."`. |
| `AC-15` | Harga satuan masuk nol atau negatif ditolak | `PASS` | Mutasi masuk harga 0 ditolak dengan: `"Harga satuan harus lebih dari nol."`. |

---

## Log Output Skrip Verifikasi Sebelum Hardening

Log berikut berasal dari verifikasi sebelum RPC dibatasi ke `service_role`; khususnya tidak membuktikan jalur integrasi `core/inventory` setelah pembatasan. AC-06 saat ini parsial.

```text
$ node scripts/verify-fnd-005.mjs
=== Memulai Verifikasi FND-005 ===
Database: PostgreSQL 17.12 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit

[PASS] AC-01: Mutasi masuk menaikkan qty dan nilai, dan menghitung ulang harga rata-rata bergerak
[PASS] AC-02: Mutasi keluar mengurangi qty dan nilai pada harga rata; harga rata tetap; nilai_keluar 48
[PASS] AC-03: Qty saldo sama dengan sum(mutasi_stok.qty) (INV-03)
[PASS] AC-04: Nilai saldo sesuai qty × harga rata dalam toleransi (INV-02)
[PASS] AC-05: Mutasi dan saldo dalam satu transaksi; rollback jika gagal
[PASS] AC-06: Role klien (anon, authenticated) ditolak saat insert/update/delete langsung
[PASS] AC-07: Mutasi backdate ditolak dengan pesan yang menyebut tanggal terakhir
[PASS] AC-08: Mutasi dengan qty nol ditolak dengan pesan 'Qty harus bukan nol.'
[PASS] AC-09: Mutasi tidak bisa diubah atau dihapus (trigger immutability)
[PASS] AC-10: Keluar yang melebihi saldo ditolak dengan 'Qty keluar {x} melebihi stok tersedia {y}.'
[PASS] AC-11: Keluar seluruh saldo membuat nilai 0 dan mempertahankan harga_rata
[PASS] AC-12: Transfer antar gudang memindahkan qty dan nilai dalam satu transaksi (D-52)
[PASS] AC-13: Stock opname penyesuaian selisih fisik dan saldo (D-52)
[PASS] AC-14: Produk atau gudang nonaktif tidak bisa dipakai di mutasi baru (D-50)
[PASS] AC-15: Harga satuan masuk nol atau negatif ditolak dengan 'Harga satuan harus lebih dari nol.'

=== Log lama: semua 15 pemeriksaan skrip lulus sebelum hardening ===
```

---

## Verifikasi Mutu (`pnpm verify`)

```text
$ pnpm verify
> pnpm lint && pnpm typecheck && pnpm arch:check && pnpm build

> eslint
> tsc --noEmit
> depcruise src --config .dependency-cruiser.cjs
✔ no dependency violations found (27 modules, 39 dependencies cruised)
> next build
▲ Next.js 16.4.6 (Turbopack)
✓ Compiled successfully
✓ Finished TypeScript in 1932ms
✓ Generating static pages using 7 workers (6/6)
```
Semua gerbang verifikasi lulus tanpa pelanggaran.

## Uji Fokus Keamanan dan Konkurensi (2026-11-22)

Migrasi `0004_inventory_mutasi_saldo.sql` dijalankan pada PostgreSQL 17 terisolasi (container sementara, schema prasyarat minimal; database bersama tidak disentuh).

- Grant katalog: `anon` dan `authenticated` tidak memiliki `EXECUTE` pada RPC; `service_role` memilikinya. `anon` tidak memiliki `SELECT` pada `saldo_stok` maupun `mutasi_stok`; RLS `SELECT` authenticated memakai `public.is_active_staff()` dari migrasi FND-003 `0003`.
- Policy baca: sesi staff aktif melihat 1 baris saldo uji; sesi tanpa profile melihat 0 baris; grant SELECT `anon=false`.
- Pemanggilan RPC sebagai `authenticated` ditolak oleh PostgreSQL dengan `permission denied for function catat_mutasi_stok`.
- Pemanggilan mutasi masuk sebagai `service_role` berhasil.
- 40 mutasi masuk paralel pada saldo awal yang belum memiliki baris menghasilkan `sum(mutasi_stok.qty) = 40.0000` dan `saldo_stok.qty = 40.0000`.
- Pemeriksaan menjalankan `pnpm check:migrations` (`ok — 3 berkas, nomor unik`) dan `git diff --check` (tanpa keluaran/error).

Efek compatibility: caller aplikasi yang memakai JWT pengguna tidak dapat lagi menjalankan RPC ini. Pemanggil harus berupa kode server tepercaya dengan `service_role`; grant pengguna menunggu matriks izin FND-003.

## Integrasi server internal (2026-11-22)

- `src/core/inventory/server.ts` menyediakan jalur server internal untuk transfer, opname, dan penyesuaian manual, diekspor dari `src/core/inventory/index.ts`. Sesi aktif dan izin Gudang diperiksa sebelum client `service_role` dibuat; `actorId` diambil dari sesi. Input menolak properti sumber dokumen dan identitas dari caller.
- `src/lib/auth/permissions.ts` memetakan izin `opname_stok` dan `penyesuaian_stok` ke Gudang sesuai `D-58` dan `docs/product/policies/matriks-izin.md`.
- Pemanggil harus mencegah retry otomatis. Idempotency key belum tersedia di skema; jalur ini bukan Server Action publik dan belum dipasang ke UI atau aksi dokumen.
- AC-06 tetap `PARTIAL`: entry point core tersedia, tetapi belum ada caller aplikasi dan integrasi sesi pengguna belum diuji. Worktree ini tidak memiliki `.env.local`, sehingga pengujian sesi runtime belum dijalankan. Jangan menganggap pemeriksaan statik sebagai bukti runtime.
- `pnpm verify` pada 2026-11-22, Node.js v24.22.2, pnpm 10.18.3: `lint`, `typecheck`, `arch:check` (48 modul, 83 dependensi), dan `next build` lulus. `git diff --check` juga lulus. Ini membuktikan mutu build, bukan perilaku runtime jalur sesi.

Urutan migrasi wajib: FND-003 `0003_autentikasi_peran_rls.sql` lebih dulu mendefinisikan `public.is_active_staff()`, kemudian FND-005 `0004_inventory_mutasi_saldo.sql` membuat policy baca inventory yang memakainya.

## Pemeriksaan setelah integrasi skema FND-003

- `node scripts/verify-fnd-005.mjs` pada database lokal sementara `fnd005_test_*` dengan migrasi 0001–0004: 15 pemeriksaan database lulus. Database uji dibuat terpisah dan dihapus setelah pengujian.
- Skrip sekarang menolak dijalankan tanpa URL database uji lokal yang namanya diawali `fnd005_test_`; pembersihan mutasi terbatas pada produk uji.
- AC-06 tetap parsial: jalur pemanggil aplikasi, otorisasi dan identitas sesi belum diintegrasikan. Pemeriksaan RPC service-role bukan bukti integrasi itu.
