# INT-002 — Diskusi

## Konteks

`INT-002` adalah **rantai end-to-end dari `db:reset` + `db:seed`**: pesanan → pengadaan → produksi → payroll → laporan (`EPIC-INT`, `backlog.md` level 10). Backlog menaruhnya setelah `INT-001` (`depends on` `INT-001` dan `FND-008`).

Seed untuk item ini: `db:reset` + `db:seed` (`D-30`). Reset berakhir di skema `siap` (migrasi terpasang, tanpa data), dan seed berjalan dari kondisi itu. Perintah ini berasal dari `FND-001` dan `FND-008`.

Gate selesai `EPIC-INT` nomor 5: seluruh rantai bisa diulang dari `db:reset` + `db:seed` tanpa intervensi manual. `DoD` per siklus (`analisis §12.2`): satu siklus selesai kalau rantai dokumennya bisa dijalankan berurutan tanpa menyentuh database manual dan setiap perpindahan status menghasilkan jurnal balance.

## Raw request

Tidak ada permintaan pengguna langsung. Item diturunkan dari `backlog.md` (baris `INT-002`) dan `epics/EPIC-INT.md`.

## Context

- `EPIC-INT` cakupan: "Rantai end-to-end dari `db:reset` + `db:seed`: pesanan → pengadaan → produksi → payroll → laporan."
- Analisis §6 menelusuri satu skenario: 500 lembar wire mesh, stok 200, satu karyawan lembur. Analisis menyatakan semua angka di §6 "adalah karangan untuk ilustrasi, bukan data perusahaan". `D-51` (g) memakai skenario itu sebagai data ilustratif, dengan tiga jalur gagal.
- Analisis §12.1 DoD per fitur: "Bisa diulang dari seed data kosong. Poin 5 yang paling sering dilupakan."

## Actor / consumer

- Penguji: tech lead atau pihak yang ditunjuk (PT-07, `[USULAN-AGEN]`).
- Pemilik data uji: `FND-008` (seed).
- Pembaca hasil: `C-009` (laporan).

## Problem

Setiap siklus bisa lolos uji sendiri, tetapi tidak ada bukti bahwa dokumen dari satu siklus bisa dilanjutkan oleh siklus berikutnya dari data awal yang sama. Tanpa rantai ini, data sisa di database bisa menyembunyikan kegagalan.

## Desired outcome

Dari `db:reset` + `db:seed`, satu rantai dokumen dijalankan dari pesanan sampai laporan. Setiap langkah berhasil, setiap status tercatat, jurnal balance, dan laporan menampilkan angka yang sesuai dengan nilai yang diharapkan.

## Known constraints

| Sumber | Constraint |
|---|---|
| `D-30` | Reset berakhir di `siap`. Seed berjalan dari `siap`. |
| `D-27` | Basis data lokal memakai Supabase CLI. |
| `D-08`, `D-32` | Setiap transisi status masuk `riwayat_status`. |
| `D-07` | Jurnal hanya lewat `postJournal()`. |
| `D-16` | Batas kredit: blokir dan override. Jalur gagal batas kredit masuk rantai. |
| `D-28` | Gerbang PR di GitHub Actions berisi lima pemeriksaan. Rantai tidak ditambahkan sebagai gerbang PR (PT-06, `[USULAN-AGEN]`). |
| `D-42` | Pemisahan tugas ditegakkan sistem. Pembuat pesanan tidak mengirim barangnya. |
| `D-46` | Nama status mengikuti diagram §5.2. |
| `D-49` | Aturan transaksi keuangan untuk jalur sukses dan jalur gagal. |
| `D-51` (b), (g) | Parameter payroll berversi, nilai dari regulasi yang berlaku (tidak dari ingatan). Skenario uji memakai skenario kawat sebagai data ilustratif, plus tiga jalur gagal. |
| `EPIC-INT` gate 5 | Tanpa intervensi manual. |
| Analisis §12.1 | Tidak ada data sisa yang membuat fitur terlihat berjalan. |

## Open questions

Status per 2026-11-22 (setelah D-47 sampai D-53): 9 pertanyaan — 3 terjawab dari keputusan terkunci (PT-01, PT-04, PT-09), 6 terjawab `[USULAN-AGEN]` (PT-02, PT-03, PT-05, PT-06, PT-07, PT-08), 0 terbuka.

- PT-01 — Skenario acuan: skenario analisis §6, skenario baru, atau yang diputuskan pengguna? Owner: pengguna. **Status: Terjawab — D-51 (g).** Skenario kawat dari analisis §6 (500 lembar wire mesh, stok 200, satu karyawan lembur) dipakai sebagai data ilustratif. Angkanya tidak dianggap fakta perusahaan.
- PT-02 — Nilai yang diharapkan: di mana ditulis, dan siapa yang menghitung? Owner: tech lead dengan pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: tech lead menghitung nilai yang diharapkan tangan, dari aturan `D-41`, `D-44`, `D-49`, dan parameter `D-51`, lalu mencatatnya di tabel `05-evidence.md` sebelum rantai dijalankan. Nilai tidak diambil dari hasil run. Alasan: `[USULAN]` sudah menyebut nilai ditulis sebelum run.
- PT-03 — Seed lintas siklus: apakah `FND-008` menyeed semua master yang dibutuhkan rantai, atau tiap siklus menyeed datanya sendiri? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: `FND-008` menyeed seluruh master rantai (pelanggan, pemasok, karyawan, produk, BOM, tarif, akun, gudang). Item siklus tidak menyeed sendiri. Alasan: `D-30` memusatkan seed pada `db:seed`; mencegah seed ganda antar item.
- PT-04 — Cakupan jalur gagal: batas kredit, PR ditolak, QC gagal, pembatalan? Owner: pengguna. **Status: Terjawab — D-51 (g).** Tiga jalur gagal: batas kredit (`D-16`), permintaan ditolak, dan QC gagal. Pembatalan dokumen tidak termasuk rantai ini.
- PT-05 — Cara menjalankan: lewat layar, skrip, atau keduanya? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: skrip (`pnpm` yang memanggil service siklus). Layar tidak dipakai sebagai bukti rantai. Alasan: gate `EPIC-INT` 5 menuntut tanpa intervensi manual.
- PT-06 — Tempat menjalankan: lokal, CI, atau keduanya? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: lokal dengan Supabase CLI (`D-27`) sebagai bukti. Tidak masuk gerbang PR `D-28`; dijalankan terjadwal atau manual sebelum item `done`. Alasan: rantai penuh terlalu berat untuk setiap PR; sama dengan `INT-001` PT-07.
- PT-07 — Pemilik item dan penguji. Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: `owner_role` tech lead; penguji tech lead atau yang ditunjuk tech lead. Alasan: `EPIC-INT` tidak menetapkan pemilik.
- PT-08 — Prioritas dan ukuran. Owner: pengguna dan tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: prioritas P0 (gate join; satu-satunya bukti rantai end-to-end). Ukuran L. Analisis tidak punya prioritas untuk `INT-*` (`D-50`).
- PT-09 — Konflik urutan `D-20` untuk item core, dan urutan `C-009`/`C-010`. Owner: pengguna. **Status: Terjawab — D-34.** Item ini tidak core. `C-009` dan `C-010` selesai sebelum join.

## Decisions

| ID | Keputusan | Tanggal | Owner | Konsekuensi |
|---|---|---|---|---|
| `D-30` | Reset ke `siap`, seed dari `siap` | 2026-11-22 | pengguna | Titik awal rantai |
| `D-27` | Supabase CLI lokal | 2026-11-17 | pengguna | Basis data uji sama dengan production (auth, RLS) |
| `D-28` | Gerbang mutu di GitHub Actions | 2026-11-17 | pengguna | Rantai tidak masuk lima gerbang PR (PT-06) |

Keputusan lintas item yang berlaku (ditambahkan 2026-11-22):

| ID | Keputusan | Konsekuensi untuk INT-002 |
|---|---|---|
| `D-16` | Batas kredit: blokir dan override | jalur gagal batas kredit (PT-04) |
| `D-27` | Basis data lokal Supabase CLI | tempat menjalankan (PT-06) |
| `D-30` | Reset ke `siap`, seed dari `siap` | titik awal rantai |
| `D-34` | Urutan core dua gelombang | PT-09 |
| `D-41` | Akun dan peran akun | nilai yang diharapkan (PT-02) |
| `D-42` | Pemisahan tugas ditegakkan sistem | jalur sukses dan gagal |
| `D-44` | Saat pengakuan per kejadian | nilai yang diharapkan (PT-02) |
| `D-46` | Nama status mengikuti diagram | status akhir |
| `D-49` | Aturan transaksi keuangan | nilai dan jalur gagal |
| `D-51` (b), (g) | Parameter payroll; skenario uji INT-002 | PT-01, PT-04 |

## Assumptions (agent-proposed)

Ini daftar `[USULAN-AGEN]` yang dibuat di item ini. Semua menunggu kunci koordinator.

- PT-02: nilai yang diharapkan dihitung tangan dan dicatat sebelum run.
- PT-03: `FND-008` menyeed seluruh master rantai.
- PT-05: rantai dijalankan lewat skrip, bukan layar.
- PT-06: rantai lokal; bukan gerbang PR.
- PT-07: owner dan penguji tech lead.
- PT-08: prioritas P0, ukuran L.
- `[USULAN]` Rantai dijalankan setelah `db:reset` + `db:seed` dan tidak mengubah database dengan cara lain.

## Rejected alternatives (optional)

- Menggunakan data dari seed `FND-008` saja tanpa rantai. Ditolak: `EPIC-INT` meminta rantai, bukan data.
- Menjalankan rantai dengan data sisa dari run sebelumnya. Ditolak: `D-30` dan analisis §12.1.
- Mengangkat angka analisis §6 sebagai fakta. Ditolak: `D-51` (g) hanya memakainya sebagai data ilustratif.

## Next step

Tidak ada pertanyaan terbuka. Item ini menunggu dependensi `INT-001` dan `FND-008` berstatus `done` (serta seluruh siklus yang dilalui rantai), lalu siap menjadi `Ready` (lihat `03`). Usulan `PT-02`, `PT-03`, `PT-05`, `PT-06`, `PT-07`, dan `PT-08` perlu dikunci koordinator.
