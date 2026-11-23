# Peta Menuju `ready`

Dokumen ini menjawab satu pertanyaan: **apa yang harus terjadi supaya sebuah item boleh dikerjakan?** Sumber kebenaran status tetap `backlog.md` dan `03-readiness-review.md` tiap item; dokumen ini hanya urutannya.

## Kenapa hari ini belum ada item modul yang `ready`

Tiga sebab, dan hanya satu yang berlaku untuk semua item:

1. **Gate fondasi.** Sebelum `FND-009` (AppShell) selesai, item modul tidak punya tempat render. `D-54` + `D-62` menetapkan gate `FND-001`–`FND-009`.
2. **Readiness review basi.** 42 dari 50 paket masih berverdict `Blocked` dengan alasan "`FND-00x` masih `specified`". Alasan itu sudah tidak benar sejak fondasi `done`, tetapi dokumennya belum disegarkan. Review yang basi bukan izin untuk mulai — ia hanya berarti verdict-nya harus diperbarui lebih dulu.
3. **Dependensi yang memang belum selesai.** `DoR` butir 6: semua `depends on` harus `done`. Ini bukan hambatan administratif; `PD-002` tidak bisa dikerjakan sebelum `PD-001` ada, dan `PR-001` tidak bisa sebelum `C-011`.

Karena itu "membuat semua siklus ready" bukan satu sakelar. Yang bisa `ready` sekarang hanya **gelombang 1**; sisanya menjadi `ready` saat pendahulunya selesai. Itu memang desain `D-03`.

## Gelombang 1 — yang bisa `ready` begitu gate lewat

| Siklus | Item | Prasyarat | Catatan sebelum `ready` |
|---|---|---|---|
| Pendapatan | `PD-001` pelanggan | `FND-003` | proposal DDL `pelanggan` (tabel core, `D-31`) + nomor dari tech lead |
| Pengeluaran | `PG-001` pemasok | `FND-003` | proposal DDL `pemasok` (tabel core, `D-31`) + nomor dari tech lead |
| Pengeluaran | `PG-010` rekonsiliasi bank | `FND-006` | tidak membuat tabel sendiri |
| Penggajian | `GJ-001` karyawan | `FND-003` | proposal DDL `karyawan` + master gaji |
| Core | `C-011` master data | `FND-002` | menambah kolom master, migrasi baru |
| Core | `C-013` domain pengadaan | `FND-002`, `FND-004`, `FND-005` | proposal DDL `permintaan_pembelian`, `po`, `penerimaan`, QC |
| Core | `C-009` laporan keuangan | `FND-006` | membaca buku besar, tidak menulis |
| Core | `C-012` notifikasi | `FND-004` | tidak memblokir siklus |
| Core | `C-014` dashboard | `FND-003`, `FND-004` | masih `idea`; butuh paket dulu |
| Produksi | — | `C-011` | **Produksi belum punya item gelombang 1.** `PR-001` menunggu `C-011` |

Yang memblokir dua siklus sekaligus adalah `C-011` dan `C-013` (`D-34`, `D-59`).

## Gelombang 2 dan seterusnya

| Gelombang | Item yang terbuka |
|---|---|
| 2 | `PD-002`, `PG-002`, `PR-001`, `GJ-002`, `C-010` |
| 3 | `PD-003`, `PG-003`, `PR-002`, `GJ-003`, `GJ-008` |
| 4 | `PD-004`, `PG-004`, `PR-003`, `GJ-004` |
| 5 | `PD-005`, `PG-005`, `PR-004`, `GJ-005` |
| 6 | `PD-006`, `PD-007`, `PG-006`, `PR-005`, `GJ-006` |
| 7 | `PD-008`, `PD-009`, `PG-007`, `PR-006`, `GJ-007` |
| 8 | `PG-008`, `PR-007` |
| 9 | `PG-009` |
| 10 | `PG-011`, `INT-001` |
| 11 | `INT-002`, `INT-003` |

Angka gelombang di sini adalah `level` di `backlog.md`; kolom `level` hanya turunan dependensi, bukan target tanggal (`D-59`).

## Langkah konkret per item

Untuk setiap item yang akan dinaikkan ke `ready`:

1. **Segarkan `03-readiness-review.md`.** Ganti alasan yang menyebut `FND-00x` `specified` dengan status sebenarnya; tulis verdict baru beserta alasannya. Jangan hapus pemblokir yang masih nyata.
2. **Pastikan `depends on` `done`.** Kalau belum, item itu belum boleh `ready` — tidak ada pengecualian selain aturan gate.
3. **Kalau item membuat tabel:** tulis `06-ddl-proposal.sql` di paket item, lalu minta tech lead menomori dan me-merge migrasinya (`D-09`). Tanpa itu implementasi tidak bisa dimulai.
4. **Kalau item memakai layar:** cari layarnya di `docs/design/inventory/<siklus>.md`, catat node id dan nama file di `05-evidence.md` nanti.
5. **Baru** ubah baris `backlog.md` menjadi `ready`, dengan tanggal.

## Yang tidak boleh dilakukan untuk mempercepat

- Menandai `ready` tanpa menyegarkan review.
- Melewati `depends on` karena "hampir selesai".
- Membuat tabel sendiri tanpa nomor migrasi.
- Membangun sidebar atau shell kedua karena gate belum lewat.

## Tabel pemasok ada di mana

Tabel `pemasok` **dibuat oleh `PG-001`**, bukan oleh `FND-*`:

- `D-31`: tabel domain bersama dimiliki `core/`, modul hanya punya layar.
- `D-09`: DDL dikirim sebagai usulan (`docs/product/items/PG-001-pemasok-termin-toleransi/06-ddl-proposal.sql`), tech lead menomori dan me-merge.
- `FND-002` sengaja hanya membuat `satuan`, `produk`, `gudang` (`D-55`).

Pola yang sama berlaku untuk `pelanggan` (`PD-001`), `karyawan` (`GJ-001`), dan tabel pengadaan (`C-013`).
