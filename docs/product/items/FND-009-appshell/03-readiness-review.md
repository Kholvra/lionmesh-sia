# FND-009 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: shell tampil, sesi dijaga, item belum tersedia tidak menaut |
| 2 | Aktor dan izin jelas | lolos | 13 peran memakai shell yang sama; tanpa sesi diarahkan ke `/login` (`FND-003`) |
| 3 | Status dan transisi eksplisit | lolos | tiga keadaan: tanpa sesi, sesi aktif, item belum tersedia |
| 4 | Validasi punya pesan | lolos | item ini tidak menerima input; tidak ada pesan baru yang perlu ditulis |
| 5 | Acceptance criteria bisa dibuktikan | lolos | AC-01–AC-12 memakai perintah atau langkah UI |
| 6 | Semua `depends on` `done` | lolos | `FND-003` dan `FND-007` `done` |
| 7 | Tidak ada pertanyaan pemblokir | lolos | lebar diputuskan di `D-62`; palet tetap v0.1 |
| 8 | Gate fondasi | n/a | item ini bagian dari fondasi (`D-54`) |
| 9 | Ukuran masuk akal | lolos | satu layout, satu komponen sidebar, empat berkas kecil |

## Verdict

`Ready` — dikerjakan langsung oleh tech lead sebagai penutup fondasi.

## Catatan desain

- Lebar 220px berasal dari `D-62`; `DESIGN_TOKENS.md`, `LAYOUTS.md`, `COMPONENTS.md`, dan `README.md` sudah diselaraskan di PR yang sama.
- Palet v2 **tidak** dipakai; `FIGMA_V2_DELTAS.md` §2 tetap terbuka.
- Grup navigasi kontekstual ditunda sampai layar pertama tiap siklus ada.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Shell diubah per siklus | empat tampilan berbeda | satu komponen, dilarang membuat sidebar kedua |
| Item navigasi menaut ke rute yang belum ada | pengguna melihat 404 | item `tersedia: false` sampai rutenya ada |
| Lebar 220px dibalik lagi nanti | semua perhitungan konten berubah | angka berasal dari satu token `--layout-sidebar-width` |
