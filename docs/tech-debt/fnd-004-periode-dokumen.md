# FND-004: integrasi periode sumber

## Kondisi saat ini

`core/dokumen` membuat nomor, status, dan riwayat untuk dokumen sumber. Pemeriksaan apakah periode sumber terkunci belum tersedia karena tabel `periode_akuntansi` dimiliki `FND-006`.

## Pekerjaan yang dibutuhkan

Saat `FND-006` selesai, tambahkan pemeriksaan periode terkunci pada alur pembuatan atau posting dokumen yang memengaruhi jurnal. Dokumen sumber tetap boleh dibuat, tetapi perubahan yang memposting jurnal harus memakai `postJournal()` dan mengikuti kontrak periode ledger.

## Dampak

`PRE-01` FND-004 berstatus parsial untuk bagian periode. Jangan menganggap dokumen yang dibuat sebelum integrasi ini sudah membuktikan penolakan periode tertutup.
