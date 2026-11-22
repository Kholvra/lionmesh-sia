# FND-007 — Acceptance Criteria

Setiap kriteria harus bisa dibuktikan dengan langkah atau perintah yang bisa diulang. Bukti AC-01 sampai AC-04 dan AC-07 sampai AC-08 berupa langkah manual terekam sampai runner ada (`OQ-07-07`).

| ID | Kriteria | Cara membuktikan |
|---|---|---|
| `AC-01` | Tabel menampilkan keadaan memuat, kosong ("Belum ada data."), dan berisi; klik judul kolom mengurutkan; lebih dari 25 baris berpindah halaman (`OQ-07-02`). | Buka halaman uji dengan dataset kosong, lalu dengan 3 baris, lalu 30 baris. Catat tampilan tiap kondisi; uji urut naik dan turun pada satu kolom. |
| `AC-02` | Form menolak field wajib kosong dengan pesan "{Label} wajib diisi." di bawah field, dan tidak mengirim data (`OQ-07-05`). | Kosongkan field wajib, kirim. Catat pesan, posisi, fokus, dan jumlah permintaan jaringan (nol). |
| `AC-03` | Status badge hanya menampilkan label dari daftar status yang diberikan pemanggil (`D-46`, `D-47`). | Render badge untuk setiap status di daftar. Label cocok. Render nilai di luar daftar: tidak ada label, nilai dilaporkan ke pengembang. |
| `AC-04` | Aksi yang memerlukan konfirmasi tidak dijalankan sebelum disetujui; "batal" tidak mengubah data (`OQ-07-04`). | Klik setujui, pilih batal. Data tidak berubah. Ulangi dan setujui; aksi dijalankan sekali. Ulangi untuk tolak dan batalkan dokumen. |
| `AC-05` | Modul dapat memakai komponen bersama tanpa melanggar batas impor. | Tambahkan impor dari modul uji ke komponen bersama: `pnpm arch:check` lulus. Tambahkan impor antar-modul: `pnpm arch:check` gagal (`ARCH-01`). |
| `AC-06` | Komponen tidak memanggil layanan domain atau tabel. | `grep` pada folder komponen untuk impor klien Supabase atau modul domain: hasil 0 baris. |
| `AC-07` | Dialog dapat dinavigasi keyboard dan ditutup dengan Esc (`OQ-07-06`). | Buka dialog, tekan Tab untuk pindah fokus ke tombol, Enter untuk setuju, Esc untuk batal. Catat hasil. |
| `AC-08` | Tabel dapat digulir horizontal di layar sempit dan label form terhubung ke field (`OQ-07-06`). | Buka halaman uji dengan lebar layar telepon. Tabel tidak memotong isi tanpa cara menggulir; label terbaca oleh pembaca layar sebagai nama field. |

## Bukti yang harus dicatat saat item selesai

| Jenis | Isi |
|---|---|
| Perintah | `pnpm arch:check`, hasil `grep` AC-06 |
| Keluaran | tangkapan layar atau catatan tampilan AC-01 sampai AC-04 dan AC-07 sampai AC-08 di `05-evidence.md` |
| Selisih | bila ada perilaku yang berbeda dari keputusan, catat keputusannya |

## Yang tidak diuji di sini

- Tampilan visual, warna, dan ikon (diputuskan implementasi).
- Kinerja tabel dengan data besar.
- Layar fitur apa pun.
