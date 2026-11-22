# FND-001 — Diskusi

## Konteks

Repo `lionmesh-sia` baru berisi scaffold: Next.js 16, Supabase client, login, dan satu migrasi (`0001_initial.sql` berisi `profiles` + RLS). Belum ada skema domain, peran, test, CI, atau seed.

Empat kelompok akan bekerja paralel. Sebelum itu, lingkungannya harus bisa diulang oleh orang yang tidak pernah menyentuh repo ini.

## Kenapa ini item pertama

Tanpa lingkungan yang dapat diulang:

| Gejala | Akar masalah |
|---|---|
| "Di laptop saya jalan" | tidak ada cara membuktikan ulang |
| Empat kelompok punya database berbeda | migrasi ditempel manual |
| Bug ditemukan setelah merge | tidak ada pemeriksaan otomatis |
| Data uji bercampur data sisa | tidak ada reset |

`README.md` saat ini menyuruh menempel SQL ke Supabase Dashboard. Itu tidak bisa diulang, tidak bisa direview, dan tidak bisa dijalankan di CI.

## Alternatif yang dipertimbangkan

| Alternatif | Kenapa tidak dipilih |
|---|---|
| Tetap tempel SQL manual | tidak dapat diulang; mustahil di CI |
| Satu file migrasi besar | konflik merge tinggi di empat branch |
| Tidak ada CI, cek manual | empat track paralel butuh gerbang objektif |
| Docker Compose Postgres terpisah dari Supabase | dua sumber kebenaran untuk auth & RLS |

## Keputusan yang diambil

1. Migrasi bernomor, dijalankan berurutan, hanya tech lead yang menomori.
2. Pemeriksaan minimum: lint, tipe, build. Test ditambahkan saat item pertama yang punya perilaku.
3. Seed harus deterministik — ID dan jumlah baris sama setiap kali.
4. Reset harus mengembalikan ke skema kosong, bukan "hapus sebagian". *(Digantikan `D-30`: reset berakhir di skema `siap`, `kosong` hanya state sesaat.)*

## Pertanyaan terbuka

Tidak ada yang memblokir. Mekanisme konkret (Supabase CLI vs container lain, provider CI) diserahkan ke domain implementasi — requirement ini hanya menetapkan outcome yang bisa diamati.

## Catatan

Item ini **tidak** membuat skema domain. Itu `FND-002`. Item ini hanya memastikan perubahan skema apa pun nanti bisa diterapkan dan diperiksa dengan cara yang sama.
