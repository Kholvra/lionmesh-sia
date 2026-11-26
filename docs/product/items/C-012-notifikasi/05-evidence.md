# C-012 — Bukti Verifikasi

Implementasi 2026-11-24 pada branch `c-012-notifikasi` oleh core track (owner item: tech lead). Semua verifikasi dijalankan terhadap Supabase lokal (Docker) dan dev server Next.js 16. Putaran akhir 2026-11-26: rebase ke main (C-009/C-011/C-013/C-014), konsolidasi `formatWaktu` → `formatTanggalWaktu` bersama, dan verifikasi ulang penuh.

Status item: **SIAP REVIEW** — AC-01–AC-10 PASS. AC-10 terbukti pada batas notifikasi (rute dokumen tujuan belum ada, dicatat di bawah). Aturan hasil-tidak-pasti (`D-66`) terbukti lewat skrip worker + skrip bukti.

## Lingkungan verifikasi

- Node.js `v24.22.2`, pnpm `10.18.3`, Next.js `16.4.6`, React `19.3`
- Supabase lokal (Docker) di `127.0.0.1:54321`, database `127.0.0.1:54322`
- Migrasi `0001`–`0011` + `0014` dari `main`, `0012_c012_notifikasi.sql` + `0013_c012_email_uncertain.sql` dari branch ini (14 berkas, nomor unik)
- Dev server `APP_URL=http://127.0.0.1:3000 EMAIL_API_URL=http://127.0.0.1:4319/kirim NOTIFIKASI_KIRIM_TOKEN=uji-c012-lokal pnpm dev --port 3000`
- Akun seed: `purchasing@lionmesh.test`, `manajemen@lionmesh.test`, `hr@lionmesh.test`, `karyawan@lionmesh.test` (sandi `lionmesh-dev-2026`)
- Penyedia email uji: server HTTP lokal di `127.0.0.1:4319` (dibuat skrip bukti) dengan mode `ok`, `gagal`, dan `down` (koneksi diputus)

## Perubahan yang dibuat

| Bagian | Berkas |
|---|---|
| Migrasi | `supabase/migrations/0012_c012_notifikasi.sql`, `0013_c012_email_uncertain.sql` (status `perlu_pemeriksaan`, `D-66`) |
| Core service | `src/core/notifikasi/{types,kejadian,jadwal,isi,email,service,queries,server,index}.ts` |
| Uji unit (TDD) | `src/core/notifikasi/{jadwal,isi}.test.ts`, `src/lib/format/date.test.ts`, `scripts/verify-c012-worker.mjs` (dirantai di `pnpm test`, mock tanpa DB) |
| Route | `src/app/(app)/notifikasi/{page,loading,error}.tsx`, `actions.ts`, `data.ts`, `constants.ts`, `notifikasi.module.css` |
| Komponen | `src/app/(app)/notifikasi/components/daftar-notifikasi.tsx` |
| Pemroses antrean | `src/app/api/notifikasi/kirim/route.ts` |
| Shell | `src/components/shell/nav.ts`, `src/components/shell/sidebar.tsx` (satu item nav "Notifikasi") |
| Helper format | `src/lib/format/date.ts` (`formatTanggalWaktu` bersama; duplikat `formatWaktu` milik branch dihapus saat rebase 2026-11-26 karena output identik) |
| Skrip bukti | `scripts/verify-c012-notifikasi.mjs` |
| Konfigurasi | `.env.example` (`EMAIL_API_URL`, `EMAIL_API_KEY`, `EMAIL_FROM`, `APP_URL`, `NOTIFIKASI_KIRIM_TOKEN`) |

### Keputusan implementasi yang perlu dibaca reviewer

| Hal | Keputusan | Alasan |
|---|---|---|
| Nomor migrasi | Final: `0012` + `0013` — tidak bentrok dengan `0011` (C-011) dan `0014` (C-013); `check:migrations` 14 berkas unik | Dikonfirmasi tech lead saat merge (`D-09`) |
| Daftar kejadian | `public.jenis_notifikasi_sah` memegang `jenis`, `label`, dan `kanal_email`; RPC tidak menerima judul bebas | Satu pemilik label (SSOT); klien tidak bisa memalsukan isi notifikasi |
| Antrean email | Baris `pengiriman_email` dibuat di transaksi yang sama dengan notifikasi, pengiriman dilakukan terpisah | `INV-02`: kegagalan penyedia tidak membatalkan kejadian pemicu |
| Pemicu kirim | (a) pemroses berjalan saat layar notifikasi dimuat, dibatasi 5 baris; (b) `POST /api/notifikasi/kirim` dengan token untuk penjadwal | Belum ada penjadwal di lingkungan ini; dua jalur memakai service yang sama |
| Klaim baris | `diklaim_pada` + lease 5 menit sebelum kirim | Dua pemanggil tidak mengirim email yang sama |
| Status kirim milik penerima | Penerima melihat status email notifikasinya sendiri; tidak ada layar antrean global | `PT-05`: pengguna biasa tidak melihat antrean orang lain; matriks izin tidak punya peran pengelola sistem |
| Screen home | Layar tinggal di `src/app/(app)/notifikasi/**` karena `src/core/**` tidak boleh memuat React dan belum ada folder modul untuk item core | `ARCH-001`; `ISSUE-001` (komponen halaman bersama) masih `open` |

## Hasil perintah

| Perintah | Hasil |
|---|---|
| `pnpm lint` | lolos |
| `pnpm typecheck` | lolos |
| `pnpm arch:check` | lolos (tanpa pelanggaran `ARCH-01`/`ARCH-02`) |
| `pnpm test` | lolos — 105 tes unit + 4 skenario worker (`timeout`, `completion-fails`, `success`, `concurrent`), 0 gagal |
| `pnpm build` | lolos — route `/notifikasi` dan `/api/notifikasi/kirim` terdaftar |
| `pnpm check:migrations` | lolos — 14 berkas, nomor unik |
| `pnpm verify` | lolos — exit 0 |
| `node scripts/verify-c012-notifikasi.mjs` | lolos — 11 pemeriksaan (10 AC + 1 pemeriksaan tambahan) |

### TDD: sinyal merah sebelum implementasi

`jadwal.test.ts` dan `isi.test.ts` ditulis lebih dulu dan dijalankan sebelum modul ada:

```text
$ node --test --experimental-strip-types src/core/notifikasi/jadwal.test.ts
Error [ERR_MODULE_NOT_FOUND]: Cannot find module .../notifikasi/jadwal.ts
✖ src/core/notifikasi/jadwal.test.ts (76 ms)  'test failed'
```

Setelah `jadwal.ts`, `isi.ts`, dan `date.ts` ditulis, tes yang sama berubah hijau tanpa mengubah asersi.

## Acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | ✅ | `buat_notifikasi('DOKUMEN_MENUNGGU_PERSETUJUAN', [manajemen], 'UJI/2026/11/3382', …)` sebagai Purchasing → baris muncul di `select … from notifikasi` milik Manajemen; layar `/notifikasi` menampilkan judul "Dokumen menunggu persetujuan Anda — UJI/2026/11/3382" |
| `AC-02` | ✅ | `GET /rest/v1/notifikasi?id=eq.<id>` sebagai `hr@lionmesh.test` → `[]` (RLS `penerima_id = auth.uid()`) |
| `AC-03` | ✅ | Pemroses dengan penyedia uji mode `ok` → penyedia menerima 1 email ke `manajemen@lionmesh.test`; `pengiriman_email.status = 'terkirim'`, `terkirim_at` terisi |
| `AC-04` | ✅ | Aturan baru `D-66`: pemroses dijalankan dua kali dengan penyedia timeout → status `perlu_pemeriksaan`, penyedia hanya dipanggil 1 kali, tidak ada retry otomatis. Skrip worker membuktikan 4 skenario (timeout, completion-fails, success, concurrent) masing-masing 1 pengiriman. |
| `AC-05` | ✅ | Penerima tanpa alamat email → `pengiriman_email.status = 'gagal'`, `alasan = 'Alamat email penerima belum diisi.'`; baris `notifikasi` tetap ada dan terbaca penerima |
| `AC-06` | ✅ | Penyedia mode `down` (koneksi diputus): `buat_notifikasi` tetap sukses, baris notifikasi + antrean tersimpan, status `perlu_pemeriksaan` setelah percobaan pertama. Catatan: transaksi pemicu diwakili RPC `buat_notifikasi` karena modul dokumen pemakai (`PG-003`, `GJ-005`) belum ada |
| `AC-07` | ✅ | `rpc('tandai_notifikasi_dibaca')` sebagai penerima → `dibaca_at` terisi; layar menampilkan badge "Sudah dibaca" dan tombol hilang |
| `AC-08` | ✅ | `update pengiriman_email set status='menunggu' where status='gagal'` → ditolak trigger: "Pengiriman email yang gagal tidak bisa dikirim ulang di versi awal." Pencarian kode: satu-satunya penulisan status ada di `prosesAntreanEmail`, dan `bolehDicoba()` hanya mengizinkan `menunggu` |
| `AC-09` | ✅ | Payload email uji hanya memuat `subject`, `text`, `to`, `from`; teks berisi judul, nomor dokumen, dan tautan absolut — tanpa `Rp`, tanpa nominal. Fungsi `susunEmail()` hanya menerima tiga field tersebut |
| `AC-10` | ⚠️ | Batas notifikasi terbukti: pengguna lain tidak bisa membaca baris (`[]`) maupun menandainya (`Notifikasi tidak ditemukan untuk akun Anda.`). Tautan dokumen belum bisa diuji karena rute dokumen tujuan belum ada di repo |

### Keluaran skrip bukti

```text
=== C-012 verification === (2026-11-26, putaran akhir)
[PASS] AC-01: kejadian pemicu membuat notifikasi in-app untuk penerima
[PASS] AC-02: pengguna lain tidak melihat notifikasi itu
[PASS] AC-03: email terkirim lewat adaptor tunggal dan antrean berstatus terkirim
[PASS] AC-09: isi email tanpa angka keuangan
[PASS] AC-04: hasil tidak pasti tidak dicoba ulang otomatis — status perlu_pemeriksaan; satu panggilan penyedia meskipun pemroses dijalankan dua kali
[PASS] AC-05: penerima tanpa alamat email membuat kiriman gagal, in-app tetap ada
[PASS] AC-06: penyedia email mati tidak menggagalkan kejadian pemicu — status perlu_pemeriksaan setelah percobaan pertama
[PASS] AC-07: notifikasi yang dibuka ditandai sudah dibaca
[PASS] AC-08: tidak ada transisi gagal ke menunggu di database
[PASS] AC-10: pengguna lain tidak bisa membuka notifikasi lewat id
[PASS] EXTRA: Karyawan tidak bisa mengirim notifikasi

11 pemeriksaan lulus.
```

Cara menjalankan ulang:

```bash
pnpm db:reset && pnpm db:seed:local
APP_URL=http://127.0.0.1:3000 EMAIL_API_URL=http://127.0.0.1:4319/kirim NOTIFIKASI_KIRIM_TOKEN=uji-c012-lokal pnpm dev --port 3000
node scripts/verify-c012-notifikasi.mjs
```

### Uji unit baru

```text
$ pnpm test   (2026-11-26, putaran akhir)
… tes notifikasi (jadwal, isi) + format tanggal + seluruh repo …
[PASS] timeout: perlu_pemeriksaan, 1 pengiriman
[PASS] completion-fails: perlu_pemeriksaan, 1 pengiriman
[PASS] success: terkirim, 1 pengiriman
[PASS] concurrent: satu pengiriman selama worker lain berjalan
ℹ tests 105  ℹ pass 105  ℹ fail 0
```

## Screenshot 1280

- [`c012-notifikasi-1280.png`](c012-notifikasi-1280.png) — diambil ulang 2026-11-26, sesi `manajemen@lionmesh.test`: 4 notifikasi riil berstatus `Terkirim` dan `Perlu pemeriksaan` (aturan `D-66`), badge baca, tombol "Tandai dibaca", stempel WIB, tanpa scroll horizontal di 1280.
- [`c012-notifikasi-kosong-1280.png`](c012-notifikasi-kosong-1280.png) — sesi `qc@lionmesh.test`: empty state "Belum ada notifikasi…".

State lain: `loading.tsx` (memuat notifikasi) dan `error.tsx` (notifikasi gagal dimuat, tombol "Coba lagi") tersedia di route yang sama; sesi tanpa login dialihkan ke `/login` oleh `requireSesi()`.

## Kepatuhan aturan

- `D-04`: notifikasi hidup di `src/core/notifikasi`, layar tidak menulis tabel langsung.
- `D-25`/`ARCH-08`: modul tidak memanggil kanal email; satu pintu `buat_notifikasi` + satu adaptor `buatPengirimEmail`.
- `D-50`/`D-52`: hanya kanal in-app dan email; tidak ada WhatsApp, tidak ada preferensi pengguna.
- `D-53`: `Karyawan` ditolak sebagai pengirim dan penerima (`is_active_staff()`), sesuai "karyawan tidak menerima email slip".
- `D-09`: migrasi bernomor dan akan dinomori ulang tech lead bila `0011`/`0012` bentrok saat merge.
- `D-65`: C-012 dikerjakan paralel dengan track core lain; koordinasi nomor migrasi tetap milik tech lead.
- Token dan alamat email tidak pernah dikirim ke klien: `pengiriman_email` hanya terbaca oleh penerima barisnya sendiri; pengiriman memakai kunci service role di server.
- Token pemroses (`NOTIFIKASI_KIRIM_TOKEN`) tidak di-commit; `.env.local` diabaikan git.

## Penyimpangan dan risiko

1. **Nomor migrasi final.** `0012` + `0013` dikonfirmasi tidak bentrok saat merge 2026-11-26. Tertutup.
2. **Pemicu kirim belum penjadwal.** Antrean diproses saat layar dimuat atau lewat `POST /api/notifikasi/kirim`. Bila tidak ada yang membuka layar dan penjadwal belum dipasang, email tertunda; statusnya tetap `menunggu` dan terlihat penerima.
3. **Kejadian belum terpasang ke dokumen.** `PG-003`, `PR-002`, `GJ-005`, `GJ-006` belum ada, jadi pemicu nyata belum memanggil `kirimNotifikasi()`. Service dan RPC-nya sudah siap; pemasangan berada di item pemilik kejadian.
4. **`AC-10`** menunggu rute dokumen; yang diuji adalah batas data notifikasi.
5. **Duplikasi CSS halaman** (`F01`/`F07` pada `ISSUE-001`) — layar ini menyalin pola header/kartu sampai komponen halaman bersama diputuskan.
6. **Antrean tidak punya layar admin.** `PT-05` menyebut "pengelola sistem", tetapi matriks izin tidak punya peran itu; keputusan yang diambil: penerima melihat status kirimannya sendiri.
7. **RPC `buat_notifikasi` terbuka untuk semua staf aktif.** Isi dibatasi ke jenis terdaftar (tanpa pesan bebas), tetapi `nomor_dokumen` dan `tautan` masih diisi pemanggil. Pengetatan menunggu peran atau kejadian pemilik di `MATRIKS_IZIN` (`D-33`).
8. **Supabase lokal dipakai bersama beberapa worktree.** Selama verifikasi, `db:reset` dari worktree lain sempat menghapus skema di tengah jalan; skrip bukti dijalankan ulang setelah stack stabil.

## Yang belum selesai

1. Pemasangan kejadian pada modul pemilik (`PG-003`, `PR-002`, `GJ-005`, `GJ-006`).
2. Penjadwal (cron) yang memanggil `POST /api/notifikasi/kirim`; pemilihan vendor SMTP (`PT-03`) saat adaptor disambungkan ke penyedia nyata.
3. Layar antrean untuk pengelola sistem, bila `PT-05` dikunci dengan peran baru.
4. Tautan notifikasi baru bisa diuji setelah rute dokumen tujuan ada (`AC-10`).

## Review pengiriman tidak pasti — 2026-11-24, tertutup 2026-11-26

Keputusan tech lead (`D-66`, locked) mengganti retry otomatis atas hasil yang tidak pasti: klaim menandai `perlu_pemeriksaan` sebelum menghubungi penyedia; tidak ada pengambilan ulang otomatis. Putaran 2026-11-26: skrip worker 4/4 PASS, skrip bukti 11/11 PASS, tabel AC-04/AC-06 di atas sudah bukti baru. Sisa batas: AC-10 tautan dokumen menunggu rute tujuan; pemicu nyata menunggu modul pemilik.
