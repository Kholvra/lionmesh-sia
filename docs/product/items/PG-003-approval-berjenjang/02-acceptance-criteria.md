# PG-003 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan perintah atau langkah yang bisa diulang orang lain. Titik awal pembuktian adalah skema `siap`:

```text
pnpm db:reset
```

Sampai test runner tersedia, pembuktian dilakukan lewat UI. Seed v0 memberi satu jenjang Manajemen untuk semua nilai (`D-51`(c)). Uji jenjang tambahan memakai seed uji (data uji, bukan data produksi) yang ditandai belum final (`D-37`). Permintaan uji dibuat lewat `PG-002`.

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Permintaan dengan nilai apa pun menjalani review lalu disetujui Manajemen pada seed satu jenjang (`D-46`, `D-51`(c)) | Ajukan permintaan sebagai Gudang. Login sebagai Purchasing, isi estimasi nilai, periksa (`→ MENUNGGU_PERSETUJUAN`). Login sebagai Manajemen, setujui. Catat status per langkah (`DIAJUKAN`, `MENUNGGU_PERSETUJUAN`, `DISETUJUI`) dan riwayat |
| `AC-02` | Engine dua jenjang: status tetap `MENUNGGU_PERSETUJUAN` sampai jenjang terakhir lulus (`[USULAN-AGEN]` Q-12) | Seed uji: jenjang 1 `min 0`, `max 1000000`; jenjang 2 `min 1000000`, tanpa `max`; keduanya Manajemen (dua akun Manajemen uji). Ajukan permintaan bernilai 2000000 (nilai uji). Setujui jenjang 1 oleh akun uji pertama: status tetap `MENUNGGU_PERSETUJUAN`, riwayat mencatat "jenjang 1 disetujui". Setujui jenjang 2 oleh akun uji kedua: status `DISETUJUI` |
| `AC-03` | Penolakan tanpa alasan ditolak dan status tidak berubah (`D-48`) | Tolak permintaan tanpa mengisi alasan. Catat pesan dan pastikan status tetap `MENUNGGU_PERSETUJUAN` |
| `AC-04` | Permintaan yang ditolak tidak bisa diubah menjadi disetujui dan tidak bisa menjadi PO (`D-46`) | Tolak permintaan dengan alasan, coba setujui, coba terbitkan PO (`PG-005`). Catat pesan penolakan dan status `DITOLAK` tetap |
| `AC-05` | Setiap keputusan (periksa, setujui per jenjang, tolak) menambah satu baris riwayat dengan aktor, waktu, dan jenjang | Periksa, setujui, dan tolak tiga permintaan berbeda. Buka riwayat dan catat baris per keputusan |
| `AC-06` | Pemohon tidak bisa menyetujui permintaannya sendiri (`D-42`, `D-48`) | Uji langsung ke service core dengan `actor_id` sama dengan pengaju dan peran Manajemen. Tidak lewat UI karena satu akun satu peran (`D-48`). Catat penolakan dengan pesan pemisahan tugas |
| `AC-07` | Pengguna tanpa peran tahap ini tidak bisa memproses | Login sebagai Gudang, coba periksa atau setujui. Catat pesan izin dan pastikan status tidak berubah |
| `AC-08` | Nilai tanpa aturan jenjang tidak bisa diproses diam-diam | Seed uji tanpa aturan jenjang (aturan dihapus di data uji). Ajukan permintaan, periksa, coba setujui. Catat pesan "Aturan approval untuk nilai ini belum ada" |
| `AC-09` | Dua approver tidak bisa memproses permintaan yang sama secara bersamaan (`[USULAN-AGEN]` Q-10) | Buka permintaan `MENUNGGU_PERSETUJUAN` di dua sesi Manajemen (akun uji berbeda). Setujui di sesi pertama, lalu di sesi kedua. Catat bahwa sesi kedua ditolak dengan pesan "Permintaan sudah diproses oleh pengguna lain" dan riwayat hanya bertambah satu |
| `AC-10` | Hasil setelah reset dapat diulang | Jalankan `pnpm db:reset`, ulangi AC-05 dua kali. Riwayat hanya berisi hasil langkah saat itu |
| `AC-11` | Revisi sukarela dari `DISETUJUI` menggugurkan approval; approval diulang dari awal (`D-48`) | Dari AC-01 sampai `DISETUJUI`, login sebagai pemohon, revisi (`PG-002` AC-13 untuk jalur `MENUNGGU_PERSETUJUAN`; di sini jalur `DISETUJUI`). Catat status `DIAJUKAN`, baris riwayat "approval gugur", lalu ulangi review dan approval sampai `DISETUJUI` lagi |
| `AC-12` | Permintaan yang dibatalkan pemohon saat menunggu approval tidak bisa disetujui (`D-48`) | Dari AC-01 sampai `MENUNGGU_PERSETUJUAN`, login sebagai pemohon, batalkan dengan alasan. Login sebagai Manajemen, coba setujui. Catat pesan dan pastikan status `DIBATALKAN` tetap |

## Edge cases (optional)

- Nilai tepat sama dengan batas `max` jenjang: masuk jenjang berikutnya (`max` eksklusif, `[USULAN-AGEN]` Q-12). Diuji dengan seed uji AC-02.
- Aturan jenjang diubah saat permintaan sedang menunggu approval: keputusan berjalan memakai aturan saat permintaan diteruskan (`INV-04`). Uji di seed uji.
- Estimasi nilai kosong: diperlakukan sebagai 0 dan masuk jenjang tunggal (`[USULAN-AGEN]` Q-07).

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | `pnpm db:reset` dan versi alat yang dipakai |
| Keluaran | ringkasan hasil tiap AC, bukan hanya "lulus" |
| Selisih | bila ada langkah yang menyimpang dari requirement, tulis alasannya |

## Yang tidak diuji di sini

- Mesin approval generik dan penomoran: diuji di `FND-004`.
- Pembuatan PO: diuji di `PG-005`.
- Izin lintas peran secara menyeluruh: diuji di `FND-003`.
