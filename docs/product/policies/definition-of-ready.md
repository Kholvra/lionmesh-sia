# Definition of Ready

Sebuah item boleh masuk `ready` hanya kalau **semua** baris bertanda wajib terpenuhi.

## Wajib

| # | Kriteria | Bukti yang dicek |
|---|---|---|
| 1 | Outcome ditulis sebagai perilaku yang terlihat, bukan daftar file | `01-requirement.md` bagian Outcome |
| 2 | Aktor dan izinnya jelas | bagian Actors & permissions |
| 3 | Status dan transisinya eksplisit; jalur gagal juga | bagian States |
| 4 | Validasi punya pesan yang bisa dibaca pengguna | bagian Validations |
| 5 | Acceptance criteria bisa dibuktikan dengan langkah atau perintah | `02-acceptance-criteria.md` |
| 6 | Semua `depends on` berstatus `done` | `backlog.md` |
| 7 | Tidak ada pertanyaan pemblokir yang masih terbuka | `03-readiness-review.md` |
| 8 | Gate fondasi terpenuhi (`FND-001`–`FND-006` selesai; `FND-007` bila item menambah primitive UI) | gate di `backlog.md` |
| 9 | Ukuran masuk akal untuk satu orang dalam satu track | bagian Size |

## Bersyarat

| Kondisi | Kriteria tambahan |
|---|---|
| Menyentuh uang | akun debit/kredit dan sumber angkanya disebut |
| Mengubah stok | arah mutasi dan efek ke `saldo_stok` disebut |
| Menyentuh status dokumen | siapa yang boleh mengubah, dan jejak apa yang ditinggalkan |
| Melintasi modul | menyebut **service core** yang dipakai, bukan modul lain |
| Menyentuh data pribadi | field mana, siapa yang boleh melihat |

## Boleh belum selesai

- Detail visual (warna, ikon, tata letak) — diputuskan saat implementasi.
- Nama variabel, struktur file, library tambahan — domain implementasi.
- Angka tuning yang tidak mengubah perilaku.

## Verdict

`Ready` · `Needs decision` · `Blocked` · `Not ready`

Alasan wajib ditulis. `Ready` tanpa alasan dianggap tidak sah.
