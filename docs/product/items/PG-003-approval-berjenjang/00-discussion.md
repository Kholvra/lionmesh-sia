# PG-003 — Diskusi

## Konteks

Item backlog `PG-003` berjudul "Approval berjenjang" (track PG-B pengadaan, level 3, depends on `PG-002` dan `FND-004`). Sumber fitur: `reference/analisis-sia.md` §5.3 fitur PG-3 "review dan approval PR: dua tahap, ambang nominal bertingkat, jejak keputusan" (P0).

Langkah 13 dan 14 di §6.4 menggambarkan alurnya: Purchasing memeriksa PR, lalu Manajemen menyetujui. Matriks hak di §3.3 memberi Purchasing "periksa PR" dan Manajemen "setujui PR", dan matriks itu disahkan sebagai v0 (`D-33`).

## Kenapa ini item

Tanpa approval, PR tidak punya dasar untuk menjadi PO. Prinsip pemisahan tugas di `analisis-sia.md` §3.2 menyebut bahwa yang mengeksekusi dan yang memverifikasi bukan orang yang sama.

## Alternatif yang dipertimbangkan

| Alternatif | Kenapa tidak dipilih |
|---|---|
| Approval satu tahap untuk semua nominal | sumber menyebut dua tahap (PG-3); `D-51`(c) menyebut satu jenjang untuk semua nominal sebagai seed, bukan desain tahap |
| Ambang nominal ditulis di kode | `analisis-sia.md` §8.2 #10: ambang ada di `aturan_approval` sehingga bisa diubah tanpa deploy |
| Mesin approval kedua khusus PG-003 | `D-37`: satu mesin di `FND-004`; PG-003 hanya mengisi aturan dan layar |

## Keputusan yang diambil (dari sumber terkunci)

1. `analisis-sia.md` §5.3 (PG-3): dua tahap, ambang nominal bertingkat, jejak keputusan.
2. `D-08` dan `ARCH-05`: riwayat dan status dokumen lewat `core/dokumen`.
3. `D-05`: aturan pengadaan di `C-013`; layar dan alur approval milik track PG-B.
4. `analisis-sia.md` §8.1 (`[SUMBER]`): PR yang ditolak berhenti dan tidak bisa menjadi PO.
5. `D-37`: satu mesin approval berjenjang di `FND-004`. Ambang dan jumlah level adalah data bisnis, diisi placeholder di seed dan ditandai belum final.
6. `D-46`: persetujuan hanya `MENUNGGU_PERSETUJUAN → DISETUJUI` atau `→ DITOLAK`. `REVISI` hanya keluar dari `DIAJUKAN`.
7. `D-42` dan `D-48`: pemohon tidak boleh menyetujui dokumen apa pun miliknya. Satu akun satu peran.
8. `D-33`: Setujui PR hanya Manajemen. Direksi tidak punya baris PR.
9. `D-38`: transaksi IDR; ambang dalam IDR.
10. `D-51`(c): seed awal permintaan pembelian = satu jenjang Manajemen untuk semua nominal. Approval pembelian bahan Produksi memakai mesin yang sama.
11. `D-50`: notifikasi hanya in-app dan email.

## Pertanyaan terbuka

Ringkasan klasifikasi (diperbarui 2026-11-22 setelah `D-47` sampai `D-53`): 13 pertanyaan (11 asli + 2 turunan dari `D-37`). Terjawab `D-xx`: 8. Terjawab `[USULAN-AGEN]`: 5 (Q-07, Q-10, Q-11, Q-12, Q-13). Terbuka: 0.

- `Q-01` Nilai ambang, jumlah jenjang, dan pemutus tiap jenjang belum ada di sumber.
  → **Terjawab — D-51(c).** Seed satu jenjang: pemutus Manajemen, berlaku untuk semua nominal. Tidak ada ambang yang perlu diisi untuk v0. Penambahan jenjang atau ambang adalah data bisnis yang ditandai belum final (`D-37`), diisi tanpa mengubah kode.

- `Q-02` Apakah Direksi ikut menyetujui PR di atas ambang tertentu?
  → **Terjawab — D-33.** Matriks v0: "Setujui PR" → Manajemen. Direksi tidak menyetujui PR.

- `Q-03` Apakah tahap review (Purchasing) wajib untuk semua nominal?
  → **Terjawab — D-46.** `DIAJUKAN → MENUNGGU_PERSETUJUAN` hanya lewat "diperiksa Purchasing". Tidak ada jalur yang melewati review. Sumber pendukung: `LAPORAN_PENGERJAAN_PROYEK.txt` ("diperiksa oleh bagian purchasing dan disetujui oleh manajemen", tanpa pengecualian nominal).

- `Q-04` Apakah pengaju boleh menyetujui PR miliknya sendiri?
  → **Terjawab — D-42.** Tidak boleh. Ditegakkan sistem, bukan hanya matriks.

- `Q-05` Apakah ada pengembalian untuk revisi di tengah approval?
  → **Terjawab — D-46.** Dari `MENUNGGU_PERSETUJUAN` hanya `DISETUJUI` atau `DITOLAK`. Revisi sukarela oleh pemohon setelah diajukan tetap berlaku sesuai `D-48` (lihat `PG-002`); revisi itu menggugurkan approval.

- `Q-06` Engine approval berjenjang sudah dijanjikan di `FND-004`. Apakah PG-003 punya logika approval sendiri?
  → **Terjawab — D-37.** Satu mesin di `FND-004`. PG-003 hanya mengisi aturan dan layar. Tidak ada logika approval kedua.

- `Q-07` Nominal apa yang dipakai untuk ambang: total estimasi PR atau sumber lain?
  → **Terjawab — [USULAN-AGEN].** Dasar nilai adalah estimasi nilai PR dalam IDR, yang diisi Purchasing saat pemeriksaan (lihat `PG-002` Q-05). Seed satu jenjang untuk semua nilai (`D-51`(c)) berarti dasar ini belum memengaruhi jalur v0; nilai tanpa isi diperlakukan sebagai 0 dan tetap masuk jenjang tunggal. Alasan: approval terjadi sebelum pemilihan pemasok, sehingga dasar hanya bisa dari PR; sumber berbeda pendapat tentang keberadaan nilai di PR.

- `Q-08` Mata uang ambang: IDR atau mata uang master?
  → **Terjawab — D-38.** Transaksi IDR sampai ada kebutuhan. Ambang dalam IDR.

- `Q-09` Apakah approval pembelian bahan Produksi memakai mesin ini?
  → **Terjawab — D-37.** `PR-003` memakai mesin yang sama dan mengisi aturan serta layarnya sendiri. Nama status permintaan bahan di `diagram-sia-lengkap.md` PR03/PR05 (`MENUNGGU_VERIFIKASI`, `TERVERIFIKASI`) belum masuk `D-46` dan menjadi catatan spec `PR-003`.

- `Q-10` Konkurensi: dua approver memproses PR yang sama.
  → **Terjawab — [USULAN-AGEN].** Keputusan pertama yang sah berlaku; keputusan kedua ditolak dengan pesan "Permintaan sudah diproses oleh pengguna lain" dan status tidak berubah. Mekanisme (kondisi status pada saat tulis, mis. optimistic lock `G16` di `analisis-sia.md`) adalah keputusan spec. Alasan: `D-46` tidak memberi jalur kedua untuk status yang sudah berubah.

- `Q-11` Apakah approver perlu notifikasi?
  → **Terjawab — D-50 dan [USULAN-AGEN].** Notifikasi hanya in-app dan email (`D-50`). Antrean approval adalah jalur utama; notifikasi ke approver melalui `C-012` bukan syarat item ini dan tidak ditambahkan ke `depends on`. Alasan: `D-50` menunda preferensi notifikasi, dan backlog tidak mencantumkan `C-012` sebagai dependensi PG-003.

- `Q-12` (turunan `D-37`) Bagaimana rentang nilai per jenjang dan apakah jenjang antara mengubah status?
  → **Terjawab — [USULAN-AGEN].** Setiap aturan punya `min` (inklusif) dan `max` (eksklusif); `max` kosong berarti tanpa batas. Jenjang antara tidak menambah status: persetujuan jenjang yang belum terakhir dicatat di riwayat keputusan, status tetap `MENUNGGU_PERSETUJUAN`, dan status menjadi `DISETUJUI` hanya setelah jenjang terakhir lulus (`D-46`, tidak ada status baru tanpa keputusan baru). Alasan: `D-47` melarang status di luar daftar tanpa keputusan baru.

- `Q-13` (turunan `D-48`) Bolehkah satu orang menyetujui dua jenjang berurutan dari dokumen yang sama?
  → **Terjawab — [USULAN-AGEN].** Tidak boleh. Approver jenjang berikutnya harus berbeda dari approver jenjang sebelumnya untuk dokumen yang sama. Alasan: sejalan dengan prinsip pemisahan tugas `D-42` dan `D-48`.

## Assumptions (agent-proposed)

- `[USULAN]` Keputusan tolak wajib menyertakan alasan (`D-48`). `LAPORAN_PENGERJAAN_PROYEK.txt` UC-PG04 menyebut "disertai alasan penolakan".
- `[USULAN]` Ambang disimpan sebagai data dan bisa diubah tanpa deploy (§8.2 #10).
- `[ANALISIS]` Approval tidak membuat jurnal. Daftar pemicu jurnal di §6.7 tidak memuat approval.

## Next step

Tidak ada pertanyaan terbuka. Semua `[USULAN-AGEN]` di atas menunggu kunci koordinator. Item tetap `specified` sampai dependensi `done`; lihat `03-readiness-review.md`.
