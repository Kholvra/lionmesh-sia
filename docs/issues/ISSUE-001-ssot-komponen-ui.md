# ISSUE-001 — SSOT komponen UI: header, tombol, kartu, state halaman

**Status:** `open` · **Dicatat:** 2026-11-23 · **Pemilik keputusan:** tech lead
**Tidak dikerjakan sekarang.** Catatan ini hanya menginventarisasi agar tidak hilang.

## Istilah

**SSOT** (single source of truth) = satu fakta hanya punya satu tempat definisi. Untuk UI artinya: satu pola halaman hanya punya satu komponen. **Centralized** = komponen itu tinggal di satu folder bersama, bukan disalin per modul.

## Kenapa ini muncul

Layar pertama siklus (`PG-001`, `/pengeluaran/pemasok`) dibangun sebelum ada komponen halaman bersama. Sekarang tiga halaman menyimpan salinan yang mirip tapi tidak identik. Aturan repo menuntut "2x extract, 3x build abstraksi" dan "SSOT satu pemilik per fakta"; dengan tiga salinan, kondisi ini sudah lewat batas.

Tiga siklus lain akan membuat layar dalam hitungan hari. Kalau polanya tidak diputuskan sekarang, setiap siklus akan menyalin lagi.

## Temuan

| # | Yang terduplikasi | Lokasi | Bukti | Risiko |
|---|---|---|---|---|
| `F01` | **PageHeader** (breadcrumb + title + description) | `pemasok.module.css:17-36`, `(app)/page.module.css:13-33`, `pengaturan/page.module.css:15-33` | tiga blok CSS hampir sama; dashboard memakai `--font-size-display` (24) sedangkan dua lainnya `--font-size-title` (20) | judul halaman berbeda ukuran antar layar, padahal `LAYOUTS.md:76` menetapkan `PageHeader` dan `DESIGN_TOKENS.md:151` menetapkan `text-title` untuk judul halaman |
| `F02` | **Tombol** primer/sekunder/bahaya | `pemasok.module.css:92-145` (3 varian), `auth-form.tsx:99` (Tailwind), `auth.module.css:12` (`signOutLight`), `confirm-dialog.module.css:44` (`dialogClose`) | empat cara mendefinisikan tombol | tombol sama tampil beda; setiap layar baru memilih caranya sendiri |
| `F03` | **Kartu/panel** | `pemasok.module.css:57` (`.panelCard`), `pengaturan/page.module.css:35` (`.card`), `(app)/page.module.css:35` (`.empty`) | tiga kelas, isi mirip (border + radius + surface + shadow) | padding/border menyimpang diam-diam |
| `F04` | **Empty state** | dashboard `.empty`, pemasok `.emptyState`, dan teks "Belum ada ringkasan" | tiga bentuk empty state berbeda | `AGENTS.md` mewajibkan empty state di setiap layar; tanpa komponen, tiap layar mengarang |
| `F05` | **"Akses ditolak"** | `screen.tsx:29-41` (satu-satunya tempat) | masih JSX inline + CSS modul pemasok | belum duplikat hari ini, tapi wajib di setiap layar berikutnya → akan disalin |
| `F06` | **Aturan otorisasi layar** | `screen.tsx:25` (`canReadPic`) dan `:27` (`bolehBaca`) membandingkan literal `"Purchasing"`/`"Accounting"` | aturan peran ditulis ulang di layar, bukan dibaca dari `MATRIKS_IZIN` | sumber kebenaran izin jadi dua; perubahan matriks tidak otomatis berlaku di layar |
| `F07` | **Loading & error** | `(app)/loading.tsx`, `(app)/error.tsx` (inline style) vs `pengeluaran/pemasok/loading.tsx`, `pengeluaran/pemasok/error.tsx` (CSS modul) | dua implementasi untuk state yang sama | perbaikan di satu tempat tidak menular ke yang lain; inline style tidak memakai kelas token |
| `F08` | **Cara styling** | `login/page.tsx` + `auth-form.tsx` memakai utilitas Tailwind; sisanya CSS module | dua pendekatan dalam satu aplikasi | sulit menetapkan pola untuk tim; dua kali kerja untuk perubahan visual |
| `F09` | **Format uang/persen/tanggal** | `pemasok/format.ts:13,22,29` | helper format tinggal di modul, padahal struktur target `AGENTS.md` menaruhnya di `src/lib/format/`; `core/ledger/money.ts` juga punya helper uang | dua definisi format uang; pembulatan bisa berbeda antar layar |
| `F10` | **Sandi akun uji** | `scripts/db-seed-local.mjs:8`, `README.md:67`, `AGENTS.md:555`, dua `05-evidence.md` | literal `lionmesh-dev-2026` di lima tempat | ganti sandi = lima suntingan; satu terlewat = dokumen bohong |
| `F11` | **Wrapper tabel + paginasi** | `pemasok-table.tsx` + `DataTable` | layar baru akan menyalin card + header + tabel + paginasi | paginasi/limit server belum ada; tiap layar menambah sendiri |
| `F12` | **`export const instant = false`** | `(app)/layout.tsx:9`, `(app)/pengaturan/page.tsx:5`, `pemasok/page.tsx:7` | baris yang sama diulang | rendah; satu tempat salah = perilaku render beda |
| `F13` | **`numeric` melewati JSON sebagai number** | `0009_pg001_pemasok.sql:74` (view tanpa cast) vs `core/inventory/queries.ts:12,45,84` (`::text` di select) | `9007199254740993` tiba di klien sebagai `...992` | nilai benar di DB, salah di detail/form; simpan ulang menimpa nilai asli |

## Rincian `F13` — angka besar di batas JSON

PostgREST mengirim kolom `numeric` sebagai **JSON number**. `JSON.parse` lalu membulatkan apa pun di atas `Number.MAX_SAFE_INTEGER` (9.007.199.254.740.991). Pada `PG-001`:

```text
RAW JSON : {"toleransi_nominal":9007199254740993.00}
typeof   : number
nilai JS : 9007199254740992
```

Konsekuensinya bukan hanya tampilan: form edit membawa angka yang sudah dibulatkan, dan menyimpannya menimpa nilai benar di database. Diperbaiki di `0010_pg001_nominal_as_text.sql` (view mengembalikan `::text`) dan dibuktikan `scripts/verify-pg001-nominal.mjs`.

Repo ini sudah punya dua cara, dan keduanya sah — masalahnya belum ada aturan tertulis:

| Cara | Dipakai di | Catatan |
|---|---|---|
| cast di select | `core/inventory/queries.ts:12,45,84` (`qty::text,nilai::text,harga_rata::text`) | tidak perlu migrasi; setiap query baru harus ingat menambahkan cast |
| cast di view | `0010_pg001_nominal_as_text.sql` | semua pemakai view aman; butuh migrasi dan skala perlu dirapikan |

Usulan aturan (belum diputuskan): **setiap nilai `numeric` yang menyeberang ke klien harus berupa teks**, dan mekanismenya dipilih per jalur — view kalau nilainya dibaca banyak layar, cast di select kalau hanya satu query. Larangan: jangan pernah mengandalkan `number` JavaScript untuk uang.

Cakupan audit yang sudah dilakukan: hanya `pemasok_aman`. `pemasok_riwayat` tidak punya kolom `numeric`. Inventory memakai cast di select. Ledger belum diaudit menyeluruh.

## Yang sudah SSOT — jangan diutak-atik

- Token warna/tipe/jarak: satu sumber di `src/app/globals.css`.
- Primitive tabel, form, status badge, dialog: `src/components/ui/` (`FND-007`).
- Aksi per peran: `MATRIKS_IZIN` di `src/lib/auth/permissions.ts` — `F06` adalah pengecualian yang melanggar aturan ini.
- Jurnal, stok, nomor dokumen, status: hanya lewat `src/core/*`.

## Usulan urutan

| Prioritas | Temuan | Alasan |
|---|---|---|
| P1 | `F06`, `F05`, `F01`, `F13` | `F06` salah sumber kebenaran; `F13` sudah terbukti mengubah nilai uang; `F05` dan `F01` akan segera dipakai layar berikutnya |
| P2 | `F02`, `F03`, `F04`, `F07` | komponen bersama yang paling sering disalin |
| P3 | `F08`, `F09`, `F10`, `F11`, `F12` | penting, tapi tidak memblokir layar baru |

## Bentuk penyelesaian yang diusulkan

1. **`F06` dulu, tanpa komponen baru.** Tambah aksi baca ke `MATRIKS_IZIN` (mis. `lihat_pemasok`, `lihat_kontak_pemasok`) lalu layar memakai `cekIzin`. Ini keputusan matriks izin (`D-33`), jadi butuh persetujuan tech lead, bukan refactor diam-diam.
2. **Komponen halaman bersama** di `src/components/shell/`: `PageHeader`, `AksesDitolak`, `EmptyState`, `Panel`. Alasan: ini state/kerangka halaman, bukan kontrol — sehingga tidak membuka ulang `FND-007`.
3. **Tombol** masuk `src/components/ui/` sebagai primitive, karena tombol adalah kontrol. Ini pekerjaan `FND-007` lanjutan atau item baru.
4. Setiap temuan dianggap tutup kalau komponennya dipakai **minimal dua layar** dan nilai visualnya diambil dari token, bukan angka baru.

## Di luar cakupan

- Tidak ada perubahan desain atau nilai token.
- Tidak menyentuh migrasi, `core/`, atau perilaku bisnis.
- Belum ada item backlog; nomor `FND-*`/`C-*` ditentukan tech lead kalau disetujui.
