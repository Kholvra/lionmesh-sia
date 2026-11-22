# GJ-005 — Acceptance Criteria

Diuji lewat UI sebagai Akuntansi, Direksi, dan HR. Langkah awal: `pnpm db:reset` dan `pnpm db:seed`, lalu satu draft hasil GJ-004 pada periode `TERVALIDASI`, dengan periode akuntansi uji yang terbuka.

## AC-01 — Akuntansi memeriksa draft

- Given draft berstatus `DRAFT_TERHITUNG`
- When Akuntansi menandai draft sudah diperiksa
- Then status menjadi `DIPERIKSA` dan riwayat mencatat aktor dan waktu

## AC-02 — Direksi menyetujui, mengunci, dan membuat jurnal akrual

- Given draft berstatus `DIPERIKSA` dan periode akuntansi uji terbuka
- When Direksi menyetujui
- Then status menjadi `DISETUJUI`, draft dikunci, dan tepat satu jurnal akrual dibuat dalam transaksi yang sama (`D-49`; rincian di GJ-007 AC-01)

## AC-03 — Persetujuan sebelum pemeriksaan ditolak

- Given draft berstatus `DRAFT_TERHITUNG`
- When Direksi mencoba menyetujui
- Then aksi ditolak dengan pesan bahwa pemeriksaan belum dilakukan; tidak ada jurnal dibuat

## AC-04 — Draft terkunci tidak bisa diubah

- Given draft berstatus `DISETUJUI`
- When pengguna mencoba mengubah komponen, menghitung ulang, atau mengubah presensi dan gaji sumber untuk periode itu
- Then perubahan ditolak dengan pesan bahwa draft sudah dikunci dan angka tidak berubah

## AC-05 — Peran yang tidak berhak tidak bisa menyetujui

- Given draft berstatus `DIPERIKSA`
- When Akuntansi atau HR mencoba menyetujui
- Then aksi ditolak dan status tidak berubah

## AC-06 — Pengembalian draft dengan alasan

- Given draft berstatus `DIPERIKSA`
- When Akuntansi atau Direksi mengembalikan draft tanpa alasan
- Then aksi ditolak; dengan alasan, status menjadi `REVISI` lalu `DRAFT_TERHITUNG` setelah HR menghitung ulang (`D-46`) dan alasan tercatat

## AC-07 — Perubahan tarif tidak mengubah draft terkunci

- Given draft `DISETUJUI` dengan tarif V1
- When tabel tarif mendapat versi V2 yang berlaku untuk periode itu
- Then draft `DISETUJUI` tetap memakai V1

## AC-08 — Persetujuan ditolak bila periode akuntansi tertutup

- Given periode akuntansi tempat jurnal akrual akan dibuat sudah tertutup (C-010, bila sudah ada)
- When Direksi menyetujui draft periode payroll itu
- Then persetujuan ditolak dengan pesan yang menyebut periode akuntansi tertutup; status tetap `DIPERIKSA`

Catatan: kriteria ini dibuktikan penuh setelah `C-010` ada. Sebelum itu, perilaku diuji dengan periode uji yang ditandai tertutup lewat `FND-006`.

## AC-09 — Penghitung draft tidak memeriksa atau menyetujui hasilnya

- Given draft dihitung oleh pengguna X (HR)
- When pengguna X mencoba memeriksa atau menyetujui draft itu
- Then aksi ditolak dengan pesan bahwa pemohon tidak boleh menyetujui (`D-48`); status tidak berubah

## AC-10 — Pengembalian oleh Direksi dengan alasan

- Given draft berstatus `DIPERIKSA`
- When Direksi mengembalikan draft dengan alasan
- Then status menjadi `REVISI` dan alasan tampil bagi HR; tidak ada jurnal dibuat

## AC-11 — Setiap transisi tercatat dengan catatan

- Given draft berpindah dari `DRAFT_TERHITUNG` ke `DIPERIKSA`, `DISETUJUI`, atau `REVISI`
- When riwayat dibuka
- Then setiap baris mencatat aktor, waktu, status sebelum dan sesudah, dan catatan bila diisi

## AC-12 — Draft yang disetujui tidak bisa dibuka kunci

- Given draft berstatus `DISETUJUI`
- When pengguna mencari tombol atau aksi buka kunci
- Then aksi tidak tersedia; koreksi hanya lewat jurnal pembalik di GJ-007 (`D-35`, `D-43`)

## Edge cases

- Dua persetujuan bersamaan: hanya satu yang berhasil (menunggu keputusan optimistic lock `G16` di §9.2 bila dipakai; implementasi memakai constraint status).
- Pengembalian saat draft sedang dihitung ulang: ditolak sampai hitungan selesai.

## Verifiability

- AC-01 sampai AC-07 dan AC-09 sampai AC-12 → uji manual UI dengan peran yang berbeda; cek riwayat dan tampilan draft.
- AC-08 → setelah C-010 ada, uji dengan periode akuntansi tertutup; sebelum itu, uji dengan periode uji ditandai tertutup.
- AC-02 → cek jumlah jurnal akrual dan keseimbangan debit-kredit lewat query.
