# PG-008 — Bukti Verifikasi

Status: **usulan `done` dengan utang bukti database dan dua akun COA placeholder**. Pencatatan invoice, pencocokan tiga dokumen, pengesahan utang, koreksi, dan pembatalan selesai; seluruh AC yang butuh database belum dijalankan. Pelacakan: `docs/tech-debt/pg-008-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`, pnpm `10.18.3`, Next.js `16.4.6`
- Branch ditumpuk di atas `pg-007-qc-bahan-dan-retur-pemasok`
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan.
- Repo berada di `C:\dev\lionmesh-sia` (di luar OneDrive) setelah pemulihan 2026-11-27.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0028_pg008_invoice_pemasok.sql` |
| Seed akun | `supabase/seeds/0014_pg008_akun_ppn_selisih.sql` |
| Core pengadaan | `src/core/pengadaan/{types,queries,service}.ts` |
| Modul | `src/modules/pengeluaran/invoice/{screen,actions,schema,queries,format,constants,form-state}.ts(x)` |
| Komponen | `src/modules/pengeluaran/invoice/components/*` |
| Route | `src/app/(app)/pengeluaran/invoice-pemasok/{page,loading,error}.tsx` |
| Test | `src/modules/pengeluaran/invoice/schema.test.ts` |

Rancangan singkat:

- Dokumen `INVOICE_PEMASOK` berstatus `COCOK`, `SELISIH`, `TERCATAT`, `DIBAYAR_SEBAGIAN`, `LUNAS`, `DIBATALKAN`.
- `catat_invoice_pemasok` (Accounting) menolak termin kosong, nomor ganda per pemasok, penerimaan yang belum QC final, invoice aktif kedua untuk satu penerimaan, dan qty di atas qty lulus. Pencocokan langsung dijalankan saat simpan.
- Pencocokan (`invoice_hitung_cocok`): qty harus sama dengan qty lulus (kurang tagih = `SELISIH`), harga per baris dan total DPP dibandingkan dengan harga PO memakai toleransi pemasok (persen **dan** nominal harus terpenuhi bersama, default 0), PPN invoice dibandingkan dengan PPN hitung `round(DPP × tarif)`.
- Tarif PPN diambil dari `konfigurasi_pajak` berversi pada tanggal invoice (`tarif_ppn_untuk`, PG-005); tanpa tarif, invoice ditolak.
- `sahkan_invoice_pemasok` (Accounting, bukan pencatat) menulis jurnal dalam satu transaksi: Dr `gr_ir` sebesar qty × harga PO, Dr `ppn_masukan`, Dr/Cr `selisih_harga_pembelian` bila ada, Cr `utang_usaha` sebesar total invoice. Periode terkunci ditolak `post_journal`.
- `cocokkan_ulang_invoice` mengoreksi baris/PPN lalu mencocokkan ulang; `SELISIH → COCOK` lewat riwayat `COCOK_ULANG`, dan revisi yang masih selisih menaikkan versi + menulis riwayat `REVISI`.
- `batalkan_invoice_pemasok` (Accounting) mewajibkan alasan; untuk invoice `TERCATAT` ia memposting jurnal pembalik lebih dulu.
- Invoice tidak menyentuh stok: tidak ada panggilan `core/inventory` di jalur ini.

## Akun COA placeholder (butuh keputusan tech lead)

Seed FND-006 tidak memuat `ppn_masukan` dan `selisih_harga_pembelian`. Atas persetujuan pemilik track, seed `0013` menambahkan:

| Peran | Nomor | Nama |
|---|---|---|
| `ppn_masukan` | `113` | PPN masukan |
| `selisih_harga_pembelian` | `603` | Selisih harga pembelian |

Angka itu **placeholder belum final** dan harus dikonfirmasi tech lead sebelum produksi.

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos |
| `pnpm test` | lolos — 149 test (143 sebelumnya + 6 test PG-008) |
| `pnpm arch:check` | lolos — 387 modul, 1278 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/invoice-pemasok` terdaftar |
| `pnpm check:migrations` | lolos — 21 berkas, nomor unik (`0016` dicadangkan GJ-001) |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ⚠️ belum | Pengesahan + jurnal + utang ada di RPC; butuh uji DB |
| `AC-02` | ⚠️ belum | Jurnal Dr 202/PPN/selisih, Cr 201 dihitung dari nilai invoice; butuh uji jurnal |
| `AC-03` | ✅ sebagian terbukti | Zod menolak qty 0 (unit test); RPC menolak qty > qty lulus dengan pesan baris |
| `AC-04` | ✅ sebagian terbukti | Zod menolak termin kosong (unit test); RPC juga menolak `null` |
| `AC-05` | ⚠️ belum | Qty < qty lulus → `SELISIH`; butuh uji DB |
| `AC-06` | ⚠️ belum | Toleransi persen+nominal per baris dan total; butuh uji DB dengan dua nilai toleransi |
| `AC-07` | ⚠️ belum | `SELISIH` tidak memanggil `post_journal`; butuh uji jumlah jurnal |
| `AC-08` | ⚠️ belum | Unique index `(pemasok, lower(nomor_invoice))`; butuh uji DB |
| `AC-09` | ⚠️ belum | Tidak ada panggilan inventory di jalur invoice; butuh uji saldo |
| `AC-10` | ⚠️ belum | Tarif dari `tarif_ppn_untuk(tanggal invoice)`; butuh uji dua tarif |
| `AC-11` | ⚠️ belum | `post_journal` menolak periode terkunci; butuh uji |
| `AC-12` | ⚠️ belum | Riwayat ditulis core untuk setiap transisi + `REVISI`; butuh uji DB |
| `AC-13` | ⚠️ belum | Alur ada di layar; butuh uji UI |
| `AC-14` | ⚠️ belum | Baris `selisih_harga_pembelian` hanya muncul bila selisih ≠ 0; butuh uji jurnal |
| `AC-15` | ⚠️ belum | PPN beda → `SELISIH` dengan pesan PPN hitung; butuh uji DB |
| `AC-16` | ⚠️ belum | RPC menolak `pembuat_id = aktor`; butuh uji DB |
| `AC-17` | ⚠️ belum | Koreksi → `COCOK` + riwayat `COCOK_ULANG`; butuh uji DB |
| `AC-18` | ✅ sebagian terbukti | Zod mewajibkan alasan batal (unit test); RPC membalik jurnal bila `TERCATAT` |
| `AC-19` | ⚠️ belum | `jatuh_tempo = tanggal + termin`; butuh uji DB |
| `AC-20` | ⚠️ belum | RPC menolak bila ada `qty_lulus` null; butuh uji DB |
| `AC-21` | ⚠️ belum | Cek invoice aktif per penerimaan (selain `DIBATALKAN`); butuh uji DB |

## Penyimpangan

- **Akun placeholder 113/603** — lihat tabel di atas; perlu konfirmasi.
- **Migrasi `0028`** dan tepi transisi baru untuk `INVOICE_PEMASOK` (menyentuh state machine terkunci `D-46`); mohon dikonfirmasi (`D-09`).
- **Semua baris penerimaan wajib ditagihkan.** Requirement menyebut "kurang tagih = SELISIH", bukan invoice sebagian baris; saya menafsirkan satu invoice per penerimaan menutup semua baris (D-49) dan menyatakan kurang tagih lewat qty per baris.
- **Pembatalan invoice `TERCATAT`** langsung memposting jurnal pembalik. Pemeriksaan "belum ada pembayaran teralokasi" belum ada karena tabel pembayaran baru dibuat di `PG-009`; saat itu ditambahkan.
- **Pencocokan ulang** tidak menambah/menghapus baris invoice, hanya mengoreksi qty/harga/PPN yang ada.
- **Tanggal jurnal pengesahan** memakai tanggal posting saat disahkan (`now()`), bukan tanggal invoice, supaya periode terkunci dinilai pada saat pengakuan.

## Yang belum / risiko

- Belum ada bukti UI 1280px (butuh database + seed).
- Tarif PPN belum diisi, jadi invoice belum bisa dicatat sama sekali.
- Belum ada seed PO/penerimaan/invoice untuk menjalankan AC.
