# GJ-001 — Acceptance Criteria

Setiap kriteria diuji lewat UI sebagai peran HR, kecuali dinyatakan lain. Langkah awal selalu sama: `pnpm db:reset` lalu `pnpm db:seed`. Bila test runner belum ada (P-08), bukti dicatat sebagai langkah manual dengan tangkapan layar atau keluaran query.

## AC-01 — HR menambah karyawan baru

- Given HR sudah masuk dan NIK `NIK-UJI-001` (16 digit numerik) belum dipakai
- When HR mengisi NIK, nama, jabatan, departemen, tipe, status PTKP, rekening lengkap, lalu menyimpan
- Then karyawan muncul di daftar dengan data yang sama seperti yang diisi

## AC-02 — NIK duplikat ditolak

- Given karyawan dengan NIK `NIK-UJI-001` sudah ada
- When HR menyimpan karyawan baru dengan NIK yang sama
- Then penyimpanan ditolak, pesan menyebut NIK `NIK-UJI-001`, dan jumlah baris karyawan tidak bertambah

## AC-03 — Gaji pokok baru tidak menimpa histori

- Given karyawan punya gaji pokok berlaku sejak tanggal T1
- When HR menambah gaji pokok dengan tanggal berlaku T2 yang lebih baru
- Then riwayat menampilkan dua entri; entri T1 tetap dengan nominal lamanya dan berstatus `digantikan` (diturunkan dari tanggal)

## AC-04 — Koreksi gaji pokok lewat entri baru

- Given entri gaji pokok sudah tersimpan dengan nominal salah
- When HR ingin mengoreksi nominal
- Then sistem membuat entri baru dengan tanggal berlaku yang sama atau sesudahnya, bukan mengubah entri lama; jejak mencatat aktor dan waktu

## AC-05 — Kategori PTKP hanya dari daftar aktif

- Given daftar kategori PTKP aktif dari tabel berversi (`D-19`)
- When HR membuka form karyawan
- Then pilihan PTKP hanya berisi kategori dari daftar aktif, dan tidak ada nilai tetap di kode

## AC-06 — Kategori PTKP tidak dikenal ditolak

- Given form karyawan terbuka
- When HR memasukkan nilai PTKP yang tidak ada di daftar (lewat permintaan langsung)
- Then penyimpanan ditolak dengan pesan yang menyebut kategori yang dikenal

## AC-07 — Peran tanpa izin tidak bisa mengubah data karyawan

- Given pengguna dengan peran selain HR
- When pengguna mencoba menambah atau mengubah karyawan atau gaji pokok lewat UI atau permintaan langsung
- Then aksi ditolak dan data tidak berubah

## AC-08 — Data pribadi hanya tampil untuk peran yang diizinkan

- Given pengguna dengan peran Direksi, Supervisor Lapangan, atau Produksi
- When pengguna membuka daftar atau detail karyawan
- Then NIK, rekening, gaji pokok, dan PTKP tidak tampil

Catatan: baris pembaca di `01` "Siapa boleh melihat" adalah `[USULAN-AGEN]`. Kriteria ini juga dibuktikan untuk HR, Accounting, dan Finance (rekening) sesuai baris itu.

## AC-09 — Perubahan tercatat dengan aktor dan waktu

- Given HR sudah menyimpan data karyawan atau gaji pokok
- When data itu dibuka kembali
- Then aktor dan waktu perubahan tercatat untuk setiap entri

## AC-10 — Gaji pokok periode yang sudah disetujui tidak ikut berubah (ditunda)

- Given payroll periode tertentu sudah disetujui dan dikunci (GJ-005)
- When gaji pokok karyawan tersebut diubah setelah itu
- Then payroll periode tersebut tidak berubah

Kriteria ini hanya bisa dibuktikan setelah GJ-005 ada. Dicatat di sini agar tidak hilang.

## AC-11 — Dua entri gaji pokok pada tanggal berlaku yang sama ditolak

- Given karyawan punya entri gaji pokok berlaku pada tanggal T
- When HR menyimpan entri kedua dengan tanggal berlaku T
- Then penyimpanan ditolak, pesan menyebut tanggal T, dan jumlah entri tidak bertambah

## AC-12 — Karyawan nonaktif tidak bisa dipilih untuk dokumen baru

- Given karyawan `NIK-UJI-001` sudah dinonaktifkan dengan tanggal keluar
- When HR membuka pilihan karyawan untuk dokumen baru (mis. presensi di GJ-002)
- Then karyawan tersebut tidak muncul sebagai pilihan; data dan riwayat gajinya tetap tampil di detail

## AC-13 — Akun karyawan tidak melihat data karyawan mana pun

- Given akun dengan peran Karyawan milik `NIK-UJI-001` (`D-53`)
- When pengguna membuka menu data karyawan atau mencoba membaca baris karyawan lain atau dirinya lewat permintaan langsung
- Then menu tidak tampil dan permintaan ditolak oleh database (RLS); tidak ada baris yang kembali

## AC-14 — NIK bukan 16 digit numerik ditolak

- Given HR membuka form karyawan
- When HR mengisi NIK dengan karakter non-digit atau panjang tidak 16
- Then penyimpanan ditolak dengan pesan yang menyebut format 16 digit numerik; tidak ada baris baru

## AC-15 — Rekening tanpa bagian lengkap ditolak

- Given HR membuka form karyawan
- When HR menyimpan rekening tanpa nama bank, atau tanpa nomor, atau tanpa nama pemilik
- Then penyimpanan ditolak dengan pesan yang menyebut bagian yang kosong; panjang nomor rekening tidak diperiksa ketat (`D-51(d)`)

## Edge cases

- Karyawan keluar di tengah periode: perhitungan prorata ada di `GJ-004` (`D-51(b)`); item ini hanya menyimpan tanggal keluar.
- Nonaktif lalu aktif kembali: tidak diatur di sumber; ditolak sampai ada keputusan baru (di luar cakupan).

## Verifiability

- AC-01 sampai AC-09 dan AC-11 sampai AC-15 → uji manual UI dengan peran HR dan peran lain (`FND-003`); catat keluaran query baris karyawan bila perlu.
- AC-02, AC-06, AC-11, AC-14, dan AC-15 → coba simpan data tidak valid dua kali; hitung baris sebelum dan sesudah.
- AC-08 dan AC-13 → login sebagai tiap peran dan buka halaman serta permintaan langsung.
- AC-10 → ditunda ke GJ-005.
