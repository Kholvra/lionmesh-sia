---
id: FND-007
slug: ui-kit-bersama
title: UI kit bersama: tabel, form, status badge, dan dialog konfirmasi
epic: EPIC-FND
milestone: M0
lane: active
sequence: 7
type: chore
req_status: specified
delivery_status: not_started
priority: unset
size: unset
depends_on:
  - FND-002
blocks: []
owner_role: tech lead
package: docs/product/items/FND-007-ui-kit-bersama
---

# FND-007 — UI kit bersama: tabel, form, status badge, dan dialog konfirmasi

## Masalah

Setiap layar modul membutuhkan tabel, form, badge status, dan dialog konfirmasi. Tanpa komponen bersama, setiap siklus menciptakan versinya sendiri, dan pengguna menghadapi perilaku yang berbeda untuk aksi yang sama.

## Outcome

Empat primitive tersedia untuk semua modul dan berperilaku sama: tabel menampilkan data dan keadaan kosong; form menampilkan pesan validasi di dekat field; badge menampilkan status dari daftar status yang disahkan; dialog konfirmasi menahan aksi penting sampai pengguna menyetujui.

## Aktor

| Aktor | Peran |
|---|---|
| Pengembang modul | memakai primitive; tidak membuat versi sendiri |
| Staf dan Karyawan | melihat dan berinteraksi dengan pola yang sama |
| Tech lead | pemilik item |

## Cakupan

### Termasuk

- Komponen tabel dengan keadaan memuat, kosong, dan berisi; pengurutan per kolom; halaman 25 baris (`OQ-07-02`).
- Komponen form dengan pesan validasi per field (`OQ-07-05`).
- Komponen status badge yang menerima daftar status dari pemilik jenis dokumen, dengan label dan kategori warna. Hanya status dari daftar `D-46`/`D-47` yang tampil (`OQ-07-03`).
- Komponen dialog konfirmasi dengan aksi setuju dan batal (`OQ-07-04`).
- Keterbacaan minimum: bahasa Indonesia; tabel dapat digulir di layar sempit; label terhubung ke field; dialog dapat dinavigasi keyboard (`OQ-07-06`).

### Tidak termasuk

- Layar fitur apa pun (milik modul).
- Dashboard (`C8` = `C-014`, `D-38`), bukan item ini.
- Detail visual dan tata letak (diputuskan implementasi).
- Logika domain di dalam komponen.
- Penghapusan dokumen: tidak ada (`D-48`).

## Status dan transisi

| Keadaan dialog | Arti | Transisi |
|---|---|---|
| `terbuka` | menunggu keputusan pengguna | → `setuju` (jalankan aksi) atau `batal` (tidak ada perubahan) |
| `setuju` | aksi dijalankan oleh pemanggil | → tertutup |
| `batal` | tidak ada aksi | → tertutup |

Keadaan tabel: `memuat` → `berisi` atau `kosong`. Keadaan badge: mengikuti status dokumen yang diberikan pemanggil dan hanya menampilkan nilai di daftar status.

Aksi yang wajib dialog konfirmasi (`OQ-07-04`): setujui, tolak, batalkan, proses, selesai, dan posting. Simpan draft tidak perlu konfirmasi.

## Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan | Teks |
|---|---|---|
| Field wajib kosong | pesan muncul di bawah field; form tidak dikirim; fokus ke field pertama yang salah | "{Label} wajib diisi." |
| Nilai status tidak ada di daftar | badge tidak menampilkan label palsu | (tidak ada label; nilai disembunyikan dan dilaporkan ke pengembang) |
| Aksi konfirmasi dibatalkan | tidak ada perubahan data | (dialog tertutup) |
| Tabel kosong | pesan kosong | "Belum ada data." |

## Batasan

- Komponen tidak mengimpor layanan domain atau tabel.
- Modul tidak mengimpor komponen dari modul lain.
- Komponen tidak berisi aturan domain (mis. ambang approval).

## Menyentuh data pribadi, uang, stok, atau status

Tidak ada. Komponen tidak menyimpan data. Status dokumen yang ditampilkan berasal dari `FND-004`.

## Dependensi

- `FND-002`: lingkungan skema; tidak ada dependensi data langsung.
- Aturan gate di `backlog.md` (Aturan gate 1): item modul yang menambah primitive UI menunggu `FND-007` (`OQ-07-01`).

## Yang membuka jalan

- Item modul yang menambah layar. Kolom `depends on` belum mencatatnya (`OQ-07-01`).

## Catatan serah terima

- Daftar status untuk badge mengikuti `D-46` dan `D-47`; label Indonesia dicatat pemilik jenis dokumen.
- Bukti perilaku UI manual sampai runner ada (`OQ-07-07`).
