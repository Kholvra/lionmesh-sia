# FND-001 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome |
| 2 | Aktor dan izin jelas | lolos | tech lead, anggota, CI |
| 3 | Status dan transisi eksplisit | lolos | tiga kondisi lingkungan dibedakan |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | lima kondisi gagal |
| 5 | Acceptance criteria dapat dibuktikan | lolos | 8 AC dengan cara verifikasi |
| 6 | Dependensi selesai | lolos | tidak ada dependensi |
| 7 | Tidak ada pertanyaan pemblokir | lolos | mekanisme diserahkan ke implementasi |
| 8 | Gate fondasi | lolos | item ini adalah gate itu sendiri |
| 9 | Ukuran wajar | lolos | `M` — satu orang, satu track |

## Verdict

**`Ready`**

Alasan: outcome, batas, dan bukti sudah lengkap. Tidak ada keputusan bisnis yang menggantung. Satu-satunya hal yang belum ditetapkan adalah alat konkret, dan itu memang bukan wilayah requirement.

## Usulan agen menunggu persetujuan

| Hal | Usulan | Kenapa |
|---|---|---|
| Prioritas | `high` | memblokir delapan item fondasi dan seluruh track modul |
| Ukuran | `M` | satu perintah penyiapan, satu reset, satu seed, tiga pemeriksaan, satu CI |
| Nama perintah | `pnpm db:setup`, `pnpm db:reset`, `pnpm db:seed`, `pnpm typecheck` | konsisten dengan `pnpm` yang sudah dipakai |
| Provider CI | GitHub Actions | repo sudah di GitHub; tidak menambah akun baru |

Semua usulan di atas bisa diubah tanpa mengubah acceptance criteria, kecuali `AC-04` dan `AC-05` yang menyebut nama perintah.

## Kontrak desain

`04-design-contract.md` sudah ada, status `Proposed`.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Preconditions | ya | 4 aturan, termasuk pengaman reset |
| Postconditions | ya | 5 aturan, termasuk determinisme seed |
| Invariants | ya | 4 aturan, termasuk imutabilitas migrasi |
| Trust boundary | ya | 3 batas: berkas migrasi, seed, keluaran pemeriksaan |
| State transition | ya (ringkas) | `kosong → siap → terisi` |
| Loop/termination | tidak | tidak ada algoritma berulang |
| Architecture boundary | tidak | milik `ARCH-001` |

Yang masih menggantung: alat penyiapan database dan penyedia CI. Keduanya tidak memblokir `Ready` karena tidak mengubah perilaku yang dijanjikan.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Supabase lokal butuh Docker | anggota tanpa Docker tidak bisa menyiapkan DB | dokumentasikan prasyarat; sediakan jalur `db push` ke project bersama |
| CI terlalu ketat di awal | PR kecil gagal karena masalah lama | jalankan pemeriksaan pada kode yang ada dulu, perbaiki sebelum mengaktifkan gate |
| Nama perintah berubah | AC-04/AC-05 perlu disesuaikan | tetapkan nama sebelum implementasi dimulai |
