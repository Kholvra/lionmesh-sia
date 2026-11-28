# PG-005 — Bukti Verifikasi

Status: **usulan `done` dengan utang bukti database dan satu data yang belum ada**. Penerbitan PO, pembatalan berantai, dan catatan konfirmasi selesai; PO belum bisa diterbitkan sampai `konfigurasi_pajak` diisi. Tidak ada Docker/Supabase lokal di mesin penulis. Pelacakan: `docs/tech-debt/pg-005-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`
- pnpm `10.18.3`
- Next.js `16.4.6`
- Branch ditumpuk di atas `pg-004-pemilihan-pemasok` (PR PG-003/PG-004 belum merge)
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan untuk item ini.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0025_pg005_purchase_order.sql` |
| Seed | `supabase/seeds/0013_pg005_jenis_po.sql` |
| Core pengadaan | `src/core/pengadaan/{types,queries,service}.ts` |
| Modul | `src/modules/pengeluaran/purchase-order/{actions,schema,queries,screen,baris,format,constants,form-state}.ts(x)` |
| Komponen | `src/modules/pengeluaran/purchase-order/components/*` |
| Gaya | `src/modules/pengeluaran/purchase-order/purchase-order.module.css` (memakai ulang gaya Pengeluaran) |
| Route | `src/app/(app)/pengeluaran/purchase-order/{page,loading,error}.tsx` |
| Test | `src/modules/pengeluaran/purchase-order/baris.test.ts` |

Rancangan singkat:

- Tabel baru `konfigurasi_pajak` (tarif PPN berversi, `D-17`, `D-51`(a)) dan fungsi `tarif_ppn_untuk(tanggal)`. **Tidak ada baris tarif di seed**: nilai regulasi harus diverifikasi dan dikutip saat `PD-005` ditulis.
- `terbitkan_po` memeriksa permintaan `PEMASOK_DITETAPKAN`, menolak PO ganda, mengambil tarif PPN untuk tanggal PO, lalu memanggil `buat_po` milik `C-013` (nomor, status, riwayat tetap di core). Setelah PO terbentuk, permintaan dipindah ke `DITERBITKAN`.
- Baris PO wajib menunjuk item permintaan dan harganya wajib sama dengan harga pembanding terbaru pemasok terpilih (`PG-004`), sehingga harga PO tidak bisa dikarang dari layar.
- `batalkan_po_dengan_permintaan` memakai `batalkan_po` (menolak bila sudah ada penerimaan, alasan wajib) lalu membatalkan permintaan induknya dengan alasan yang sama.
- `catat_konfirmasi_po` menyimpan catatan teks; tidak mengubah status (`Q-02`).
- Seed `0013` mendaftarkan jenis dokumen `PURCHASE_ORDER` supaya `buat_dokumen` bisa memberi nomor.
- PO tidak menyentuh stok dan tidak memposting jurnal: tidak ada panggilan ke `core/inventory` atau `core/ledger` di jalur ini.

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm test` | lolos — 130 test (122 sebelumnya + 8 test PG-005) |
| `pnpm arch:check` | lolos — 339 modul, 1098 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/purchase-order` terdaftar |
| `pnpm check:migrations` | lolos — 18 berkas, nomor unik (`0016` dicadangkan GJ-001) |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ⚠️ belum | RPC + form terbitkan ada; **tertahan** karena belum ada tarif PPN. Nomor mengikuti `PURCHASE_ORDER/YYYY/MM/NNNN` (lihat Penyimpangan) |
| `AC-02` | ⚠️ belum | PPN per baris dihitung `buat_po` dari tarif `konfigurasi_pajak`; unit test total net/PPN/total cocok dengan rumus itu. Butuh seed tarif uji |
| `AC-03` | ⚠️ belum | RPC menolak `DITOLAK`/`DIBATALKAN` dengan pesan tetap; permintaan berstatus lain ditolak dengan "Pilih pemasok sebelum menerbitkan PO". Butuh uji DB |
| `AC-04` | ✅ sebagian terbukti | Pesan "Pilih pemasok sebelum menerbitkan PO" dari RPC; tombol hanya muncul untuk permintaan `PEMASOK_DITETAPKAN` |
| `AC-05` | ✅ sebagian terbukti | zod menolak tanpa baris dan qty 0; unit test `penerbitan PO menolak qty nol dan tanpa baris`. RPC memeriksa ulang |
| `AC-06` | ⚠️ belum | Tidak ada panggilan stok di jalur PO; butuh uji saldo sebelum/sesudah |
| `AC-07` | ⚠️ belum | Tidak ada panggilan jurnal di jalur PO; butuh uji jumlah jurnal dan utang |
| `AC-08` | ⚠️ belum | Tidak ada aksi ubah PO setelah terbit; layar hanya menyediakan konfirmasi dan pembatalan. Butuh uji kirim perubahan langsung ke DB |
| `AC-09` | ⚠️ belum | Riwayat ditulis `pindah_status_dokumen`/`batalkan_po`; konfirmasi hanya catatan. Butuh uji DB |
| `AC-10` | ⚠️ belum | `batalkan_po_dengan_permintaan` membatalkan PO lalu permintaan. Butuh uji DB |
| `AC-11` | ⚠️ belum | `pnpm db:reset` belum bisa dijalankan |
| `AC-12` | ✅ sebagian terbukti | zod dan RPC menolak alasan kosong; unit test `pembatalan PO tanpa alasan ditolak` |
| `AC-13` | ⚠️ belum | Permintaan `DIBATALKAN` ditolak RPC; butuh uji DB |
| `AC-14` | ⚠️ belum | `batalkan_po` menolak bila sudah ada penerimaan; lintas item `PG-006` |
| `AC-15` | ⚠️ belum | Pembatalan PO ikut membatalkan permintaan; tidak ada aksi ganti pemasok. Butuh uji DB |

## Penyimpangan

- **Tarif PPN belum ada.** `konfigurasi_pajak` dibuat tanpa baris, sesuai `D-51`(a) yang melarang menulis angka tarif dari ingatan. Akibatnya penerbitan PO ditolak dengan pesan "Tarif PPN untuk tanggal ini belum tersedia" sampai tech lead mengisi data. Layar menampilkan peringatan yang sama.
- **Format nomor.** AC-01 mencontohkan `PO/{tahun}/{bulan}/{urut}`; core mencetak `{TIPE}/...` (`D-50`), dan `buat_po` memanggil tipe `PURCHASE_ORDER`, jadi nomornya `PURCHASE_ORDER/2026/11/0001`. Mengubah prefiks berarti mengubah migrasi `0014` yang sudah diterapkan, jadi tidak dilakukan.
- **Qty baris.** Requirement hanya menyebut qty harus > 0; layar memakai qty permintaan sebagai nilai awal dan mengizinkannya diubah selama masih > 0. Harga satuan tidak bisa diubah dan harus sama dengan harga pembanding.
- **Migrasi `0025`.** Nomor bebas berikutnya setelah track GJ memakai `0017`-`0022` di PR-nya; `0023` dan `0024` dipakai PG-003/PG-004. Mohon dikonfirmasi saat review (`D-09`).
- **Seed baru.** `supabase/seeds/0013_pg005_jenis_po.sql` mendaftarkan jenis dokumen `PURCHASE_ORDER`; tanpa ini `buat_dokumen` menolak dengan "Jenis dokumen PURCHASE_ORDER tidak terdaftar".

## Yang belum / risiko

- Belum ada bukti UI 1280px (butuh database + seed).
- Belum ada layar untuk mengisi `konfigurasi_pajak`; pengisian lewat seed/SQL oleh tech lead (sesuai `Q-11`).
- PO belum punya aksi "ubah qty setelah terbit" dan tidak akan punya; koreksi lewat pembatalan (`D-48`).
