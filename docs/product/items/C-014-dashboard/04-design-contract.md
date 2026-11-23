# C-014 — Design Contract

Status: Proposed; seluruh aturan belum diverifikasi. Sumber: 01–02, D-53, D-59, D-64 dan ARCH-001.

| Kontrak | Perilaku |
|---|---|
| Identitas | Ambil sesi di server; pengguna tanpa sesi diarahkan ke login. |
| Otorisasi | Core/read model hanya mengembalikan tindakan yang boleh dilihat dan dilakukan aktor saat ini, termasuk pemisahan tugas; tidak percaya peran dari klien. |
| Konsistensi | Hitungan per siklus dan baris berasal dari himpunan terotorisasi yang sama; satu dokumen dihitung sekali per siklus. |
| Urutan | Waktu mulai menunggu tertua dahulu; nomor, jenis, siklus, tahap, waktu, dan tautan sesuai 01. |
| Kegagalan | Sumber belum ada, sumber gagal, dan daftar kosong adalah keadaan berbeda; kegagalan tidak menjadi nol. |
| Batas | Dashboard tidak menulis status atau membaca tabel modul lain; sumber yang belum ada tidak disimulasikan. |

Verifikasi AC-01–AC-08 di `05-evidence.md`; tidak ada klaim implementasi sebelum bukti tersedia.
