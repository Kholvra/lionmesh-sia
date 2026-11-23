# Inventaris Figma v2

Sumber: Figma **SIA Liomesh (Copy)** — key `VS9PagBMlKi2McPPfCdsRV`
Terakhir diubah: 2026-11-23 · halaman `01 · Prototipe SIA` dan `02 · Komponen`.

File ini indeks. Daftar per layar ada di `inventory/`:

| Berkas | Blok | Layar |
|---|---|---|
| [`inventory/umum.md`](inventory/umum.md) | UMUM — masuk/keluar, laporan keuangan, tutup buku, master data, notifikasi | 24 |
| [`inventory/penggajian.md`](inventory/penggajian.md) | SIKLUS PENGGAJIAN — HR, Karyawan, Supervisor, Accounting, Direksi, Finance, keadaan kosong | 175 |
| [`inventory/pendapatan.md`](inventory/pendapatan.md) | SIKLUS PENDAPATAN — Penjualan, Gudang, Pengiriman, Accounting, Finance, Manajemen, retur, kredit | 63 |
| [`inventory/pengeluaran.md`](inventory/pengeluaran.md) | SIKLUS PENGELUARAN — Gudang, Purchasing, Manajemen, QC, Accounting, Finance, retur, rekonsiliasi bank | 61 |
| [`inventory/produksi.md`](inventory/produksi.md) | SIKLUS PRODUKSI — Produksi, Gudang, QC, Accounting, Manajemen, ubah/batal | 48 |
| | **Total** | **371** |

Setiap baris punya empat hal yang dibutuhkan untuk slicing:

- **Layar** — nama frame apa adanya di Figma, dan tautan langsung ke node.
- **Ukuran** — 1440×960 untuk layar normal; 1440×1132 untuk layar Accounting;
  beberapa layar lebih tinggi karena isinya lebih panjang.
- **Item** — ID backlog yang disebut pada catatan layar itu di Figma
  (`PD-03b`, `GJ-05a`, `FND-005`, dst.). Kolom ini pemetaan desain → backlog.
- **File** — nama berkas gambar yang dipakai bila PNG-nya diekspor
  (lihat `screenshots/README.md`).

## Struktur halaman `01 · Prototipe SIA`

| Section pembungkus | Isi |
|---|---|
| `UMUM · Masuk & keluar, laporan keuangan, master data` | 5 sub-section: `0`, `C1`–`C4` |
| `SIKLUS PENGGAJIAN` | 10 sub-section: `1`, `1b`, `1c`, `2`, `3`, `3.1`, `4`–`7` |
| `SIKLUS PENDAPATAN` | 8 sub-section: `8`, `8b`, `9`–`13`, `11b` |
| `SIKLUS PENGELUARAN` | 9 sub-section: `14`, `15`, `15b`, `16`–`19`, `17b`, `18b` |
| `SIKLUS PRODUKSI` | 6 sub-section: `20`, `20b`, `21`–`24` |
| `COMPARE · Gaya lama vs gaya baru` | 18 frame pembanding + contoh kartu ringkasan dan catatan |
| `Payroll v4 / Button / danger` | 5 varian tombol (seharusnya ada di halaman `02 · Komponen`) |

Di luar 371 layar, hampir tiap layar punya dua pelengkap di Figma yang **tidak** ikut diekspor:

- `Ringkasan / <section>` — 38 kartu, satu per sub-section: alur utama, status
  lifecycle, aturan.
- `Catatan / <ID>` — 174 kartu, satu per layar: peran, data yang ditampilkan,
  validasi, aksi, aturan. Inilah tempat ID backlog muncul. Dua layar tidak
  punya kartu: `login_fail` dan `logout`.

Catatan dan ringkasan tidak dijadikan berkas terpisah di repo ini; isinya tetap
di Figma dan dibaca langsung dari sana (tautan per layar ada di tabel).

## Halaman `02 · Komponen`

38 item: `Button / primary|secondary|danger`, `Status / draft|waiting|approved|rejected|done|info`,
`KPI / Ringkasan`, `Field / Read-only`, `Navigation / default|active`,
`Notice / Informasi` (angkatan v1); `SIA v3 / Button`, `SIA v3 / Input / states`,
`SIA v3 / Status`, `SIA v3 / Navigation / states`; `Payroll v4 / Komponen`;
`Sidebar`, `Sidebar / Item`, `Tautan`, `Tab`, `Chip status`, `Pemberitahuan`,
`Langkah stepper`, `Isian`, `Template / Kartu jurnal`; plus tiga frame dokumen:
`Pedoman desain`, `Arah & keputusan desain`, `Claude · Spesifikasi focus`.

Tiga angkatan komponen hidup berdampingan (v1 tanpa prefix, `SIA v3 /`,
`Payroll v4 /`). Penyatuan ada di `FND-007`.

## Cara memakai untuk slicing

1. Buka baris layar di `inventory/`, klik nama layar → Figma membuka node itu.
2. Ambil nilai warna, tipe, spasi dari `DESIGN_TOKENS.md`, bukan dari piksel gambar.
3. Cocokkan perilaku dengan item backlog di kolom **Item**; requirement tetap
   di `docs/product/items/<ID>/01-requirement.md`.
4. Kalau sebuah layar tidak punya pasangan backlog, itu layar prototipe: jangan
   diimplementasikan sebelum ada itemnya.
