# FND-007 — Bukti Verifikasi

## Lingkungan

- Tanggal: 2026-11-22
- Branch: `fnd-007-ui-kit-bersama`
- Node: `v24.22.2`
- pnpm: `10.18.3`
- Browser: Brave lokal, Next.js dev server di `localhost:3107`
- Screenshot keadaan default: [`fnd007-ui-kit-1280.png`](fnd007-ui-kit-1280.png), viewport CSS 1280 × 900.
- Route preview hanya dipakai untuk pemeriksaan manual dan sudah dihapus sebelum build final.

## Bukti acceptance criteria

| AC | Hasil | Bukti |
|---|---|---|
| `AC-01` | Lulus | Browser: 5 baris skeleton saat memuat; dataset kosong menampilkan `Belum ada data.`; dataset 30 baris menampilkan 25 baris dan rentang `1–25 dari 30`; sort kode naik menghasilkan `UJI-01`, sort turun menghasilkan `UJI-30`; halaman berikutnya menampilkan `26–30 dari 30` dan 5 baris. Dataset 3 baris menampilkan 3 baris dan pager `1 / 1`. Error dan aksi coba lagi juga diperiksa. |
| `AC-02` | Lulus | Submit dengan `Nama` dan `Kode` kosong menghasilkan `Nama wajib diisi.` dan `Kode wajib diisi.` di bawah field, fokus ke `Nama`, serta handler submit tetap 0. Setelah nilai valid dimasukkan, handler terpanggil sekali dan pesan validasi hilang. |
| `AC-03` | Lulus | Badge yang muncul hanya `Draft`, `Disetujui`, dan `Ditolak` dari daftar pemanggil. `STATUS_UJI_TIDAK_VALID` tidak tampil sebagai badge dan callback diagnostik pengembang menerima status tersebut. |
| `AC-04` | Lulus | Dialog diuji untuk aksi `Setujui`, `Tolak`, dan `Batalkan`. Pada setiap skenario, membatalkan (`Batal`/`Kembali`) menutup dialog tanpa menambah jumlah aksi; menekan konfirmasi menambah hitungan aksi yang sesuai tepat sekali. |
| `AC-05` | Lulus | Fixture sementara Pendapatan yang mengimpor `@/components/ui` lolos `pnpm arch:check` (39 modul, 71 dependensi). Fixture impor Pendapatan → Pengeluaran gagal dengan aturan `no-cross-module` (exit 1). Fixture dihapus; verifikasi final lulus dengan 35 modul dan 63 dependensi. |
| `AC-06` | Lulus | Pencarian impor di `src/components/ui` tidak menemukan impor domain, core, modul, Supabase, atau query tabel. Perintah lengkap di bawah. |
| `AC-07` | Lulus | Dialog dibuka dengan fokus pada `Batal`; Escape menutup dialog, menjalankan 0 aksi, dan mengembalikan fokus ke tombol pembuka. Tab memindahkan fokus ke tombol konfirmasi; Enter menjalankan aksi sekali. Batal tidak mengubah hitungan aksi. |
| `AC-08` | Lulus | Pada viewport CSS 375 × 812, pasangan label/input adalah `Nama` → `nama` dan `Kode` → `kode`. Lebar dokumen tetap 375px; viewport tabel 254px dengan konten 903px dan bisa digulir horizontal. Tab ke tombol sort di ujung tabel menggulir kontainer tabel (`scrollLeft` 522.7px). |

### Perintah AC-06

```sh
if rg -n 'from ["\x27][^"\x27]*(supabase|modules/|core/)[^"\x27]*["\x27]|\.from\([[:space:]]*["\x27]' src/components/ui --glob '*.{ts,tsx}'; then
  echo 'AC-06 failed'
  exit 1
else
  echo 'AC-06 passed: no module/core/Supabase/table imports in UI source'
fi
```

Keluaran: `AC-06 passed: no module/core/Supabase/table imports in UI source`.

## Verifikasi integrasi

Perintah: `pnpm verify` — exit code `0` pada 2026-11-22.

- `pnpm lint` / ESLint: lulus.
- `pnpm typecheck` / `tsc --noEmit`: lulus.
- `pnpm arch:check`: `no dependency violations found (35 modules, 63 dependencies cruised)`.
- `pnpm build`: kompilasi Next.js 16.4.6 lulus. Route hasil build: `/`, `/_not-found`, `/auth/callback`, `/login`; tidak ada route preview.
