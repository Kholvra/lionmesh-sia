# Design Contract: ARCH-001 — Batas Core dan Modul

- Source: `docs/product/decisions.md` (`D-04`, `D-05`, `D-06`, `D-07`, `D-09`, `D-18`); `docs/product/reference/analisis-sia.md` §2, §7.1, §7.5
- Status: `Approved` — 2026-11-17, setelah `ARCH-08` disetujui (`D-25`)
- Profile: product app — monolith modular Next.js + Supabase
- Scope: dependensi antar modul, kepemilikan state, jurnal, stok, dokumen, migrasi
- Owner: tech lead

## Intent and non-goals

**Intent.** Empat siklus dikerjakan orang berbeda secara paralel. Kontrak ini memastikan mereka tidak menghasilkan empat definisi "jurnal", empat definisi "stok", atau empat cara menomori dokumen.

**Non-goals.** Struktur folder di dalam satu modul, komposisi UI, pilihan library, gaya penamaan berkas.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `BOUNDARY-01` | Browser → server action | Data form, parameter URL, payload klien | Parse + validasi skema di server sebelum menyentuh service | Nilai tervalidasi bertipe | Tolak dengan pesan yang bisa dibaca pengguna; jangan teruskan ke core |
| `BOUNDARY-02` | Sesi → identitas aktor | Cookie sesi Supabase | Ambil pengguna dari sesi di server | `actor_id` + peran tepercaya | Tolak bila tidak ada sesi; **jangan** menerima `actor_id` dari klien |
| `BOUNDARY-03` | Server → database | Query dari kode server | RLS + constraint + trigger | Baris yang sudah lolos kebijakan | Tolak di database; jangan mengandalkan pemeriksaan peran di klien |

`BOUNDARY-02` adalah yang paling sering dilanggar: mengirim `user_id` dari form lalu mempercayainya. Identitas hanya boleh berasal dari sesi.

## Architecture boundaries

| ID | Rule | Sumber | Owner | Pelanggaran |
|---|---|---|---|---|
| `ARCH-01` | `src/modules/<x>/**` MUST NOT mengimpor `src/modules/<y>/**` untuk `x ≠ y` | `D-04` disetujui | Modul | Build gagal (bila checker aktif); review menolak |
| `ARCH-02` | `src/core/**` MUST NOT mengimpor `src/modules/**` | `D-04` disetujui | Core | Build gagal |
| `ARCH-03` | Penulisan jurnal MUST melalui `core/ledger`. Tidak ada `insert`/`update` ke tabel jurnal dari luar core | `D-07` disetujui | Core ledger | Review menolak; jurnal dianggap tidak sah |
| `ARCH-04` | Perubahan stok MUST melalui `core/inventory`. `saldo_stok` hanya ditulis di sana | `D-06` disetujui | Core inventory | Review menolak; saldo dianggap tidak dapat dipercaya |
| `ARCH-05` | Penomoran, status, dan `riwayat_status` dokumen MUST melalui `core/dokumen` | `D-08` disetujui | Core dokumen | Nomor ganda / riwayat hilang |
| `ARCH-06` | Tabel dan aturan pengadaan MUST berada di `core/pengadaan`. Modul Pengeluaran hanya memanggil service-nya | `D-05` disetujui | Core pengadaan | Produksi ikut menunggu siklus Pengeluaran |
| `ARCH-07` | Migrasi MUST dinomori dan di-merge hanya oleh tech lead. Kelompok mengirim DDL sebagai usulan | `D-09` disetujui | Tech lead | Tabrakan nomor; migrasi ditolak |
| `ARCH-08` | Modul MUST NOT membaca tabel milik modul lain secara langsung. Data lintas siklus diambil lewat service core atau read model core | `D-25` disetujui 2026-11-17 | Tech lead | Laporan lintas siklus tersebar dan tidak konsisten |
| `ARCH-09` | Peran MUST mengikuti 12 akun staf. Tidak ada peran baru tanpa keputusan | `D-18` disetujui | Tech lead | Wewenang melebar tanpa kendali |

`ARCH-08` sudah disetujui (`D-25`), tapi belum punya checker otomatis. Statusnya tetap `Unverified` sampai ada bukti — persetujuan bukan verifikasi.

## Invariants

| ID | Owner | Invariant | Kapan harus benar | Forbidden case |
|---|---|---|---|---|
| `INV-01` | Core ledger | Setiap posting jurnal memiliki total debit = total kredit | Setelah setiap `postJournal()` | Jurnal tidak balance tersimpan |
| `INV-02` | Core inventory | `saldo_stok.nilai = saldo_stok.qty × saldo_stok.harga_rata` | Setelah setiap mutasi | Nilai dan qty berasal dari sumber berbeda |
| `INV-03` | Core inventory | Qty pada `saldo_stok` = jumlah `mutasi_stok` untuk produk dan gudang yang sama | Setelah setiap mutasi dan saat rekonsiliasi | Saldo dihitung ulang dengan rumus lain |
| `INV-04` | Core dokumen | Nomor dokumen unik per jenis per periode | Setelah pembuatan dokumen | Dua dokumen memakai nomor sama |
| `INV-05` | Core dokumen | Setiap perubahan status punya baris `riwayat_status` dengan aktor dan waktu | Setelah setiap transisi | Status berubah tanpa jejak |
| `INV-06` | Tech lead | Migrasi yang sudah di-merge tidak berubah isinya | Selamanya | Menyunting migrasi lama |

`INV-01` dan `INV-02` adalah alasan core ini ada. Kalau keduanya tidak dijaga, empat siklus hanya berbagi database, bukan berbagi kebenaran.

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Modul memanggil service core | Aktor terautentikasi dan berperan sesuai | Pemanggil | Tolak sebelum menyentuh data |
| `PRE-02` | `postJournal()` dipanggil | Periode akuntansi tidak terkunci; total debit = kredit; akun aktif | Core ledger | Tolak; tidak ada baris tersimpan |
| `PRE-03` | Mutasi stok dibuat | Produk dan gudang ada; qty bukan nol; tanggal tidak mendahului mutasi terakhir | Core inventory | Tolak dengan alasan yang menyebut aturan mana yang gagal |
| `PRE-04` | Dokumen baru dibuat | Jenis dokumen terdaftar; periode sumber tidak terkunci | Core dokumen | Tolak |

`PRE-03` menegakkan larangan backdate yang muncul dari pilihan rata-rata bergerak (`D-10`). Tanpa itu, HPP bisa dihitung mundur dan hasilnya berubah diam-diam.

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | `postJournal()` menyimpan jurnal balance dan mengembalikan identitasnya | Saldo akun konsisten | Baris jurnal + entri buku besar |
| `POST-02` | Mutasi stok memperbarui `saldo_stok` dalam transaksi yang sama | `INV-02`, `INV-03` | Baris mutasi + saldo baru |
| `POST-03` | Dokumen baru mendapat nomor unik dan baris riwayat pertama | `INV-04`, `INV-05` | Nomor terpakai |
| `POST-04` | Perubahan status menambah riwayat dan tidak mengubah riwayat lama | `INV-05` | Baris riwayat baru |

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Modul mengimpor modul lain | Build gagal bila checker aktif; review menolak | Pindahkan dependensi ke `core/` |
| Jurnal tidak balance | Transaksi dibatalkan seluruhnya | Perbaiki pemanggil |
| Mutasi stok backdate | Ditolak dengan alasan | Gunakan tanggal yang sah atau koreksi lewat dokumen penyesuaian |
| Periode terkunci | Ditolak; tidak ada baris tersimpan | Buka periode lewat prosedur `C-010` |
| Dua modul menulis `saldo_stok` | Saldo tidak dapat dipercaya | Hentikan track, perbaiki, rekonsiliasi |

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `ARCH-01` | Import lintas modul tidak ditemukan | dependency-cruiser — `forbidden` rule | `pnpm arch:check`; uji fixture: impor lintas modul tertangkap, impor sesama modul tidak | `PASS` |
| `ARCH-02` | `core` tidak mengimpor `modules` | dependency-cruiser — `forbidden` rule | `pnpm arch:check`; uji fixture: `core → modules` tertangkap | `PASS` |
| `ARCH-03` | Tidak ada penulisan tabel jurnal di luar core | Pencarian kode + review | — | `Unverified` |
| `ARCH-04` | `saldo_stok` hanya ditulis di `core/inventory` | Pencarian kode + review | — | `Unverified` |
| `ARCH-05` | Nomor dan riwayat hanya dibuat lewat core | Pencarian kode + review | — | `Unverified` |
| `ARCH-06` | Tabel pengadaan hanya didefinisikan di core | Review migrasi | — | `Unverified` |
| `ARCH-07` | Nomor migrasi unik di `main` | Pemeriksaan runner | `pnpm check:migrations` menolak `0001_duplikat.sql` dan menyebut kedua berkas; dijalankan di CI | `PASS` |
| `ARCH-08` | Tidak ada query ke tabel modul lain | Review + pencarian SQL | — | `Unverified` |
| `ARCH-09` | Daftar peran = 12 | Review migrasi + seed | — | `Unverified` |
| `BOUNDARY-01` | Server action menolak input tidak valid | Uji perilaku | — | `Unverified` |
| `BOUNDARY-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `BOUNDARY-03` | RLS menolak akses lintas peran | Uji database | — | `Unverified` |
| `INV-01` | Jurnal tidak balance ditolak | Uji `postJournal()` | — | `Unverified` |
| `INV-02` | `nilai = qty × harga_rata` setelah mutasi | Uji inventory | — | `Unverified` |
| `INV-03` | Qty saldo = jumlah mutasi | Uji inventory | — | `Unverified` |

Tiga aturan punya bukti mesin: `ARCH-01`, `ARCH-02`, `ARCH-07`. Sisanya `Unverified` — termasuk `ARCH-08`, yang belum punya checker otomatis.

## Open decisions and assumptions

| Hal | Status | Dampak |
|---|---|---|
| Alat pemeriksa batas impor | `Approved` — dependency-cruiser (`D-26`) | `ARCH-01`/`ARCH-02` bisa menjadi aturan `block` |
| `ARCH-08` disetujui atau tidak | `Approved` — `D-25` | Laporan lintas siklus wajib lewat core |
| Penegakan `INV-01` di database (trigger/constraint) atau hanya di service | `Proposed` | Menentukan tingkat jaminan |
| Apakah `harga_rata` disimpan atau dihitung saat dibaca | `Proposed` | `D-10` menyebut disimpan; kontrak mengikuti itu |

## Handoff

Kontrak ini belum boleh dipakai sebagai gerbang sampai:

1. `ARCH-08` diputuskan.
2. Alat pemeriksa impor dipilih dan dijalankan.
3. Bukti pertama dicatat untuk `INV-01` dan `INV-02` saat `FND-005` dan `FND-006` dibangun.

Penegakan otomatis diserahkan ke `architecture-guardrails` bila guardrail pack tersedia. Sampai itu terjadi, seluruh status tetap `Unverified`.
