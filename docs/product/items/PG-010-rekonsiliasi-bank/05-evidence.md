# PG-010 — Bukti Verifikasi

Status: **usulan `done` dengan utang bukti database**. Impor CSV, pencocokan 1:1, pasangan manual, penandaan selisih, dan riwayat selesai; seluruh AC yang butuh database belum dijalankan. Pelacakan: `docs/tech-debt/pg-010-bukti-db.md`.

## Lingkungan

- Node.js `v26.13.1`, pnpm `10.18.3`, Next.js `16.4.6`
- Branch ditumpuk di atas `pg-009-pembayaran-utang` (memakai `rekening_bank`)
- Tidak ada Docker/Supabase lokal; `pnpm db:reset` belum dijalankan.

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0035_pg010_rekonsiliasi_bank.sql` |
| Seed | `supabase/seeds/0018_pg010_konfigurasi_rekonsiliasi.sql` |
| Core pengadaan | `src/core/pengadaan/{types,queries,service}.ts` |
| Modul | `src/modules/pengeluaran/rekonsiliasi/{screen,actions,schema,queries,csv,constants,form-state}.ts(x)` |
| Komponen | `src/modules/pengeluaran/rekonsiliasi/components/*` |
| Route + nav | `src/app/(app)/pengeluaran/rekonsiliasi-bank/*`, entri sidebar "Rekonsiliasi bank" |
| Test | `src/modules/pengeluaran/rekonsiliasi/csv.test.ts` + `schema.ts` |

Rancangan singkat:

- CSV generik (D-52): pemisah `,` atau `;`, dukungan kutip, header dipetakan ke kolom tanggal, nominal, referensi (opsional), dan arah (opsional). Profil pemetaan dapat disimpan dan dipakai ulang.
- Nominal dibaca sebagai rupiah bulat: `1.234`, `1.234,00`, `1234.56`, `(750)`; pecahan bersen ditolak. Tanggal menerima `YYYY-MM-DD`, `DD/MM/YYYY`, dan `DD-MM-YYYY`.
- Impor menolak berkas dengan hash isi yang sama untuk rekening itu (impor ulang), baris rusak (pesan menyebut nomor baris), dan baris di luar periode.
- Pencocokan otomatis 1:1 dengan baris jurnal akun `kas_bank`: nominal sama persis, arah cocok dengan sisi debit/kredit, tanggal dalam jendela `konfigurasi_rekonsiliasi`, dan referensi sama bila keduanya terisi. Kandidat lebih dari satu tidak dipasangkan otomatis.
- Pasangan manual menolak mutasi atau baris jurnal yang sudah berpasangan; penandaan `SELISIH` wajib alasan; `lepas_pasangan` mengembalikan ke `BELUM_COCOK`.
- Setiap perubahan status menulis `mutasi_bank_riwayat` (aktor + waktu).
- Rekonsiliasi tidak menulis jurnal dan tidak mengubah saldo: tidak ada panggilan `post_journal`/inventory di jalur ini.

## Keputusan yang diambil (2026-11-28)

Pertanyaan konfirmasi terputus karena server restart dua kali; default berikut dipakai dan **wajib dikonfirmasi tech lead**:

| Hal | Keputusan |
|---|---|
| Master rekening | Memakai `rekening_bank` dari PG-009; PG-010 di-stack di atas branch itu |
| Dimensi rekening pada jurnal | Tidak ada; pencocokan memakai semua baris akun `kas_bank` (penyimpangan R-04) |
| Jendela tanggal | Tabel `konfigurasi_rekonsiliasi`, seed **3 hari** sebagai placeholder |
| Format awal/akhir baris CSV | Nominal tanda + / − menentukan arah bila kolom arah tidak dipetakan |

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm typecheck` | lolos |
| `pnpm lint` | lolos (hanya warning lama di `scripts/`) |
| `pnpm test` | lolos — 220 test (212 sebelumnya + 8 test CSV/pemetaan) |
| `pnpm arch:check` | lolos — 556 modul, 2190 dependensi |
| `pnpm build` | lolos; route `/pengeluaran/rekonsiliasi-bank` terdaftar |
| `pnpm check:migrations` | lolos — 35 berkas, nomor unik |
| `pnpm db:reset` | belum dijalankan — tidak ada Docker/Supabase lokal |

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ⚠️ belum | RPC menyimpan semua baris dalam satu transaksi; butuh uji DB |
| `AC-02` | ⚠️ belum | Unique `(rekening_bank_id, hash)` + pesan impor sebelumnya |
| `AC-03` | ✅ sebagian terbukti | Berkas tanpa baris/kolom wajib ditolak zod + parser; unit test baris rusak |
| `AC-04` | ✅ sebagian terbukti | Unit test `baris rusak menolak seluruh berkas dengan nomor baris` |
| `AC-05` | ⚠️ belum | Aturan nominal/arah/jendela/referensi ada di RPC; butuh uji DB |
| `AC-06` | ⚠️ belum | Status default `BELUM_COCOK`; butuh uji DB |
| `AC-07` | ⚠️ belum | Layar menampilkan jurnal kas tanpa pasangan; butuh uji DB |
| `AC-08` | ⚠️ belum | Kandidat > 1 tidak dipasangkan; butuh uji DB |
| `AC-09` | ⚠️ belum | Tidak ada penulisan saldo/jurnal di jalur ini; butuh uji |
| `AC-10` | ⚠️ belum | Tidak ada `post_journal` di jalur ini; butuh uji jumlah jurnal |
| `AC-11` | ⚠️ belum | `mutasi_bank_riwayat` ditulis setiap aksi |
| `AC-12` | ⚠️ belum | Alur ada di layar; butuh uji UI |
| `AC-13` | ⚠️ belum | RPC menolak tanggal di luar periode dengan nomor baris |
| `AC-14` | ✅ sebagian terbukti | Zod mewajibkan alasan selisih; `lepas_pasangan` + cocokkan ulang mengembalikan `COCOK` |
| `AC-15` | ⚠️ belum | RPC menolak mutasi/jurnal yang sudah berpasangan |
| `AC-16` | ⚠️ belum | Hanya Accounting yang lolos cek izin dan query layar; butuh uji peran |
| `AC-17` | ✅ sebagian terbukti | Profil bisa disimpan dan diterapkan di form; kolom wajib divalidasi |

## Penyimpangan

- **Tanpa dimensi rekening** (R-04): jurnal hanya punya akun 102, jadi pencocokan tidak membedakan rekening. Bila ada lebih dari satu rekening dengan mutasi bernilai sama, pencocokan bisa salah; dicatat sebagai risiko.
- **Pasangan manual 1:1** membutuhkan nominal dan sisi yang sama; kasus gabungan (satu mutasi untuk beberapa jurnal) belum didukung, hanya ditandai lewat `SELISIH`.
- **Migrasi `0035`** (menyusul `0034` PG-009) dan **seed `0018`**; nomor menunggu konfirmasi.
- **IA tidak memuat layar rekonsiliasi**; route `/pengeluaran/rekonsiliasi-bank` ditambahkan ke sidebar dan perlu dimasukkan ke `INFORMATION_ARCHITECTURE.md` oleh tech lead.
- **Jendela 3 hari** adalah placeholder.

## Yang belum / risiko

- Belum ada bukti UI 1280px.
- Rantai uji end-to-end masih tertahan tarif PPN dan database lokal.
- `AC-08` ambiguity belum punya tampilan khusus selain status `BELUM_COCOK`.
