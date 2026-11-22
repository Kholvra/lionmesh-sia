# FND-007 — Diskusi

## Konteks

`backlog.md` mendefinisikan `FND-007` sebagai "UI kit bersama: tabel, form, status badge, dialog", sequence 7, `depends on` `FND-002`. Pada branch `fnd-007-ui-kit-bersama`, `FND-002` berstatus `done`. Analisis §5.1 C7 memberi prioritas P0.

`docs/product/README.md` (aturan gate) dan `backlog.md` (Aturan gate 1) menyatakan: item yang menambah primitive UI menunggu `FND-007`. Namun kolom `depends on` di `backlog.md` tidak mencantumkan `FND-007` pada item modul mana pun. Ketidakcocokan ini dicatat sebagai OQ-07-01.

## Pembaruan 2026-11-22

Keputusan terkunci yang relevan: `D-46` (badge mengikuti daftar status state machine), `D-47` (transisi status), `D-48` (tidak ada penghapusan dokumen; alasan wajib saat batal dan tolak), dan `D-58` (jawaban `[USULAN-AGEN]` disahkan di tingkat item selama konsisten dengan D-01–D-57). Usulan dalam paket ini berlaku sebagai keputusan tingkat-item berdasarkan D-58.

## Kenapa item ini

Setiap layar modul membutuhkan tabel, form, badge status, dan dialog konfirmasi. Tanpa komponen bersama, setiap siklus membuat versinya sendiri, dan pengguna melihat tiga gaya interaksi berbeda untuk aksi yang sama. `EPIC-FND` menyebut "tiap kelompok mengarang helper sendiri" sebagai risiko.

## Actor / consumer

- Pengembang modul: memakai komponen; tidak membuat komponen sendiri untuk primitive yang sama.
- Staf dan Karyawan: melihat dan berinteraksi dengan pola yang sama di semua siklus.
- Tech lead: pemilik item.

## Problem

Tanpa komponen bersama, form menampilkan pesan validasi yang berbeda, status dokumen memakai warna dan label yang berbeda, dan aksi penting (setujui, batal, posting) tidak selalu meminta konfirmasi.

## Desired outcome

Empat primitive tersedia untuk semua modul: tabel, form, status badge, dan dialog konfirmasi, dengan perilaku yang sama. Modul tidak bisa mengimpor dari modul lain untuk mendapatkannya.

## Known constraints

- `EPIC-FND` cakupan: "komponen bersama: tabel, form, status badge, dialog konfirmasi".
- `EPIC-FND` Risiko: "helper hanya boleh lahir di `core/`, usulan lewat PR ke `main`".
- `ARCH-001` `ARCH-01`, `ARCH-02`: modul tidak mengimpor modul lain; core tidak mengimpor modul.
- Detail visual (warna, ikon, tata letak) diputuskan saat implementasi (DoR, "Boleh belum selesai").
- `D-46`/`D-47`: badge menampilkan status sesuai daftar state machine dokumen.
- `D-48`: penghapusan dokumen tidak ada; batal dan tolak wajib alasan.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| OQ-07-01 | `README.md` menyebut item modul yang menambah primitive UI menunggu `FND-007`, tetapi `depends on` `backlog.md` tidak memuatnya. Gate tertulis atau pengingat? | Menentukan dependensi resmi item modul yang memakai UI. | tech lead | Terjawab — D-58 mengesahkan aturan gate sebagai DoR butir 6 untuk item modul yang menambah primitive UI; kolom `depends on` tetap diisi koordinator sesuai Aturan gate 1. |
| OQ-07-02 | Perilaku tabel: pengurutan, paging, dan tampilan saat kosong. | AC-01 tidak bisa ditulis. | user | Terjawab — D-58 mengesahkan usulan: klik judul kolom mengurutkan naik/turun, 25 baris per halaman, pesan "Belum ada data." dan keadaan memuat. |
| OQ-07-03 | Daftar label dan urutan status untuk badge per jenis dokumen. | Badge tanpa daftar status tidak bisa diuji. | user / tech lead | Terjawab — D-46 dan D-47 menetapkan daftar status sah; D-58 mengesahkan komponen menerima daftar kode, label Indonesia, dan kategori warna dari pemanggil. |
| OQ-07-04 | Aksi mana yang wajib dialog konfirmasi? | Menentukan AC-04. | user | Terjawab — D-58 mengesahkan konfirmasi untuk setujui, tolak, batalkan, proses, selesai, dan posting; simpan draft tidak perlu konfirmasi. Penghapusan dokumen tidak ada (`D-48`). |
| OQ-07-05 | Standar pesan validasi form: teks dan posisi. | DoR butir 4. | user | Terjawab — D-58 mengesahkan pesan "{Label} wajib diisi." di bawah field terkait dan fokus ke field pertama yang salah. |
| OQ-07-06 | Persyaratan responsif, aksesibilitas, atau bahasa tampilan? | Mengubah AC layar. | user | Terjawab — D-58 mengesahkan bahasa Indonesia, gulir horizontal tabel di layar sempit, form satu kolom, label terhubung ke field, dan navigasi dialog dengan keyboard/Esc. |
| OQ-07-07 | Cara membuktikan perilaku UI: test runner belum ada. | Menentukan bentuk AC-01 sampai AC-04. | tech lead | Terjawab — D-58 mengesahkan bukti manual AC-01–AC-04 dan AC-07–AC-08 sampai runner tersedia; AC-05 memakai `pnpm arch:check` dan AC-06 memakai pencarian impor. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| OQ-07-01 | Aturan gate berlaku sebagai DoR butir 6 untuk item modul yang menambah UI | 2026-11-22 | D-58 | Gate tetap tercatat di `backlog.md`; dependensi tiap item diisi koordinator |
| OQ-07-02..07 | Perilaku tabel, konfirmasi, pesan, aksesibilitas, dan bukti manual | 2026-11-22 | D-58 | AC-01 sampai AC-08 memakai perilaku yang disahkan pada tingkat item |

## Keputusan implementasi

- Komponen ditempatkan di `src/components/ui/` sesuai batas presentasional FND-007; tidak ada aturan domain atau akses data.
- Komponen memakai React dan CSS Modules yang sudah tersedia; tidak menambah dependensi.

## Rejected alternatives

- Setiap modul membuat tabel sendiri: ditolak (`EPIC-FND` risiko).
- Komponen yang berisi logika domain (mis. memanggil layanan): ditolak; komponen hanya primitive.

## Next step

Semua OQ disahkan D-58 dan AC-01 sampai AC-08 telah dibuktikan. Implementasi FND-007 selesai pada branch `fnd-007-ui-kit-bersama`; bukti final ada di `05-evidence.md`.
