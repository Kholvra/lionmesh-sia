# Figma Screenshots

Status: **Reference only** · replaced 2026-11-23 with v2 samples
Source: Figma **“SIA Liomesh (Copy)”** — key `VS9PagBMlKi2McPPfCdsRV`, page `01 · Prototipe SIA`
Set: 17 PNG, 1×, 1440px wide, **4.5 MB total** (`v2-samples/`)

These are a **sample** of the 371 screens in `../INVENTORY.md`, chosen so every
layout pattern appears once. They exist so a slicer can see the shape of a
screen without opening Figma. They are **not** the contract:

- composition → `../LAYOUTS.md`
- values (color, type, spacing, radius) → `../DESIGN_TOKENS.md`
- anatomy and states → `../COMPONENTS.md`
- which screen is which → `../INVENTORY.md`

Do not measure a PNG. The file draws 67 raw hex values and 21 raw font sizes on
nodes that carry no style; the tokens are the authority, the pixels are not.

![Contact sheet](contact-sheet.png)

## 1. The sample

| File | Figma screen | Node | Size | Pattern |
|---|---|---|---|---|
| `01-login.png` | Semua peran / login / Masuk | `173:31557` | 1440×960 | Auth, no shell |
| `02-beranda-penjualan.png` | Beranda / Penjualan | `173:11073` | 1440×960 | Dashboard per role |
| `03-data-pelanggan.png` | Penjualan / Data pelanggan | `173:13661` | 1440×960 | Master data, table + form |
| `04-tambah-pesanan.png` | Penjualan / Tambah pesanan | `173:14269` | 1440×976 | Form with line items |
| `05-verifikasi-pesanan.png` | Penjualan / Detail verifikasi SO-2611-014 | `173:15711` | 1440×1182 | Detail + decision actions |
| `06-ketersediaan-barang.png` | Gudang / Ketersediaan barang | `173:16568` | 1440×960 | Stock check, allocation |
| `07-faktur-penjualan.png` | Accounting / Faktur FJ-2611-014 | `173:18572` | 1440×1132 | Document after posting |
| `08-jurnal.png` | Accounting / Jurnal JU-2611-046 | `173:19401` | 1440×1132 | Journal / ledger detail |
| `09-laporan-pendapatan.png` | Penjualan / Laporan pendapatan | `173:16244` | 1440×1247 | Report with totals |
| `10-tutup-periode.png` | Accounting / Tutup periode November | `212:28846` | 1440×1132 | Period close, locked state |
| `11-purchase-order.png` | Purchasing / PO-2611-007 terbit | `173:23072` | 1440×969 | Issued document + summary |
| `12-qc-hasil-produksi.png` | QC / Hasil pemeriksaan tersimpan | `173:33434` | 1440×960 | Inspection result |
| `13-bom-produk.png` | Produksi / BOM produk | `173:26594` | 1440×960 | Bill of materials |
| `14-dashboard-penggajian.png` | HR / dashboard / Dashboard penggajian | `141:2473` | 1440×960 | Dashboard, payroll cycle |
| `15-draf-perhitungan-gaji.png` | HR / calculation / Draf perhitungan gaji | `141:4973` | 1440×1133 | Calculation table |
| `16-persetujuan-payroll.png` | Direksi / approval / Persetujuan pembayaran payroll | `141:9322` | 1440×960 | Approval gate |
| `17-error-state.png` | HR / error / Rekap gagal dimuat | `141:5239` | 1440×960 | Error state |

All 17 were verified against `../INVENTORY.md` on 2026-11-23: filename, width,
and height match the node they claim to be. Six screens are taller than 960
because their content overflows a page; the app page scrolls, the PNG does not.

## 2. The shell you will see

Every screen except the login uses the same frame: **220px sidebar**
(`#1B232E`), 32px page padding, content starting at x=252 and measuring 1156px
at 1440. The sidebar carries the brand, the primary menu (Dashboard + four
cycles + Laporan), the contextual group for the active cycle, and a footer with
user, role, and `Keluar dari SIA`.

## 3. Why only 17 and not 371

Measured on this set: **0.174 bytes per pixel**. Applied to the full file
(533 Mpx across 371 screens) a PNG dump would be **~90 MB** in a repository whose
`.git` is 10 MB. The images also go stale the moment the file changes, while
`INVENTORY.md` links never do.

If a teammate genuinely has no Figma access, export the full set to a folder
outside the repository and share it; keep the repo at one screen per pattern.

## 4. Adding or replacing a screen

Exporting one frame is cheap; exporting all 371 is not, and one hard constraint
applies: **the Figma window must be visible.** With the window hidden or on
another workspace, `exportAsync` hangs and the bridge times out after 30–60 s on
a 1440×960 frame. Measured: 65 ms when visible.

**Route A — native export (recommended, seconds per screen)**

1. Make the Figma window visible.
2. Select the frame. Do not include `Catatan / …` or `Ringkasan / …` frames.
3. Right-click → **Export selection** → **PNG**, **1x**.
4. Save into `v2-samples/`, then rename to the next number and add a row to
   section 1 above.

**Route B — through the MCP bridge**

`figma_capture_screenshot({ nodeId, format: "PNG", scale: 1 })` works but returns
the image as an attachment, not bytes on disk, so it is only useful for looking
at a screen, never for writing the folder. `figma_get_component_image` (REST)
returns a URL but is subject to the plan quota and currently returns HTTP 429.

**Route C — bulk (the whole file)**

Select every screen frame in a section, right-click → Export selection. Figma
creates one file per frame and mirrors `/` in the frame name into folders.
Rename with the **File** column in `../inventory/<cycle>.md`; the inventory wins
if the two disagree.

## 5. Contact sheet

```bash
cd docs/design/screenshots
magick montage v2-samples/*.png -label '%f' -thumbnail 300x -tile 4x \
  -geometry +8+14 -background '#F8FAFC' -fill '#172335' \
  -pointsize 11 -depth 8 contact-sheet.png
```

Regenerate after adding a screen. Keep it under ~500 KB; `-depth 8` matters, the
default 16-bit output is five times larger.

## 6. History

The 17 files that lived here before 2026-11-23 came from the retired file
**“DESAIN UI SIA (Copy)”** (`Np8oosi3jZuSuoaQGbf5sb`): 1280×760, a 200px module
shell and a 288px hub shell, six of them clipped 608px on the right. That file,
its shells, and its measurements are archived in `../FIGMA_AUDIT.md` §1–§6.
