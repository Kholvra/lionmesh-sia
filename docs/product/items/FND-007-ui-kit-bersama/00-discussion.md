# FND-007 — Diskusi

## Konteks

`backlog.md` mendefinisikan `FND-007` sebagai "UI kit bersama: tabel, form, status badge, dialog", sequence 7, `depends on` `FND-002` (status `specified`, belum `done`). Analisis §5.1 C7 memberi prioritas P0.

`docs/product/README.md` (aturan gate) dan `backlog.md` (Aturan gate 1) menyatakan: item yang menambah primitive UI menunggu `FND-007`. Namun kolom `depends on` di `backlog.md` tidak mencantumkan `FND-007` pada item modul mana pun. Ketidakcocokan ini dicatat sebagai OQ-07-01.

## Pembaruan 2026-11-22

Keputusan terkunci: `D-46` (badge mengikuti daftar status state machine), `D-47` (penambalan status), `D-48` (tidak ada penghapusan dokumen; alasan wajib saat batal dan tolak), `D-50` (master nonaktif, bukan dihapus). Pertanyaan yang belum ada di keputusan terkunci diberi usulan `[USULAN-AGEN]`.

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
| OQ-07-01 | `README.md` menyebut item modul yang menambah primitive UI menunggu `FND-007`, tetapi `depends on` `backlog.md` tidak memuatnya. Gate tertulis atau pengingat? | Menentukan dependensi resmi item modul yang memakai UI. | tech lead | Terjawab — [USULAN-AGEN]: aturan gate berlaku sebagai syarat DoR butir 6 untuk item modul yang menambah primitive UI baru; kolom `depends on` di `backlog.md` diisi koordinator. Alasan: `backlog.md` Aturan gate 1 sudah menulisnya sebagai aturan. |
| OQ-07-02 | Perilaku tabel: pengurutan, paging, dan tampilan saat kosong. | AC-01 tidak bisa ditulis. | user | Terjawab — [USULAN-AGEN]: klik judul kolom mengurutkan naik atau turun; halaman 25 baris; saat kosong "Belum ada data."; saat memuat "Memuat data…". Alasan: batas kecil menjaga tabel tetap cepat di data operasional. |
| OQ-07-03 | Daftar label dan urutan status untuk badge per jenis dokumen. | Badge tanpa daftar status tidak bisa diuji. | user / tech lead | Terjawab — D-46 dan D-47: badge mengikuti daftar status yang sah. `[USULAN-AGEN]`: komponen menerima daftar status dari pemilik jenis (kode, label Indonesia, kategori warna); label dicatat pemilik. |
| OQ-07-04 | Aksi mana yang wajib dialog konfirmasi? | Menentukan AC-04. | user | Terjawab — [USULAN-AGEN]: wajib konfirmasi untuk setujui, tolak, batalkan, proses, selesai, dan posting (aksi yang mengubah status atau memposting). Penghapusan dokumen tidak ada (`D-48`). Simpan draft tidak perlu konfirmasi. Alasan: aksi yang tidak bisa dibalik dari layar. |
| OQ-07-05 | Standar pesan validasi form: teks dan posisi. | DoR butir 4. | user | Terjawab — [USULAN-AGEN]: pesan "{Label} wajib diisi." di bawah field terkait; fokus pindah ke field pertama yang salah. Alasan: pola singkat dan konsisten dengan pesan di 01 item pemakai. |
| OQ-07-06 | Persyaratan responsif, aksesibilitas, atau bahasa tampilan? | Mengubah AC layar. | user | Terjawab — [USULAN-AGEN]: bahasa Indonesia; tabel bisa digulir horizontal di layar sempit; form satu kolom; label terhubung ke field; dialog bisa ditutup dengan Esc dan dinavigasi keyboard. Alasan: makalah berbahasa Indonesia; perangkat lapangan memakai layar kecil. |
| OQ-07-07 | Cara membuktikan perilaku UI: test runner belum ada. | Menentukan bentuk AC-01 sampai AC-04. | tech lead | Terjawab — [USULAN-AGEN]: AC-01 sampai AC-04 dibuktikan lewat langkah manual terekam (catatan dan tangkapan layar di `05-evidence.md`) sampai runner ada (`FND-003`); AC-05 dan AC-06 lewat `pnpm arch:check` dan `grep`. Alasan: sejalan `OQ-02-11`. |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `[USULAN-AGEN]` OQ-07-01 | Aturan gate berlaku sebagai DoR butir 6 untuk item modul yang menambah UI | 2026-11-22 | tech lead (kunci koordinator) | Koordinator memutuskan kolom `depends_on` di `backlog.md` |
| `[USULAN-AGEN]` OQ-07-02..07 | Perilaku tabel, konfirmasi, pesan, aksesibilitas, bukti manual | 2026-11-22 | tech lead (kunci koordinator) | AC-01 sampai AC-04 |

## Assumptions (agent-proposed)

- A1: Lokasi komponen berada di bawah `src/core/` (`EPIC-FND`), sehingga modul bisa memakainya tanpa melanggar `ARCH-01`. Lokasi konkret ditetapkan implementasi.
- A2: Tipe item `chore`; ukuran `S` atau `M` `[USULAN]`.
- A3: Pustaka komponen dipilih implementasi; bukan keputusan requirement.

## Rejected alternatives

- Setiap modul membuat tabel sendiri: ditolak (`EPIC-FND` risiko).
- Komponen yang berisi logika domain (mis. memanggil layanan): ditolak; komponen hanya primitive.

## Next step

Koordinator mengunci keputusan `[USULAN-AGEN]` di atas, termasuk keputusan kolom `depends_on` untuk OQ-07-01. Setelah `FND-002` `done`, item ini dapat menjadi `Ready` sesuai 03.
