# Figma Audit: DESAIN UI SIA (Copy)

Date: 2026-11-17
File: **DESAIN UI SIA (Copy)** — key `Np8oosi3jZuSuoaQGbf5sb`
Last modified: 2026-11-17T12:31:04Z · version `2422811771704796616`
Method: Figma Console MCP (Desktop Bridge) — structural extraction, full-file
counts, WCAG lint, and screenshots. No design changes were made to the file;
the current page was switched during inspection and restored afterwards.

This audit is the evidence behind `DESIGN_TOKENS.md` and `DESIGN_DIRECTION.md`.
It records what exists, what drifts, and what is missing. It is not a wish list.

## 1. Page Inventory

| Page | Role | Contents | State |
|---|---|---|---|
| `pendapatan` | Revenue cycle | 10 UCs (`PD01`–`PD10`): Hub, Data Pelanggan, Pesanan, Verifikasi, Ketersediaan, Pengiriman, Faktur, Piutang, Pembayaran, Jurnal, Laporan. Plus dialogs (Tambah produk, Belum difakturkan) and a journal variant | Complete |
| `pengeluaran & produksi` | Expenditure + production | 8 expenditure sections (`PG01`–`PG06`, `PG11`, `PG12`) + hub. Production frame with 24 screens (`PR02`–`PR16`, hub, dialogs, previews, validation, login) | Expenditure incomplete |
| `keseluruhan` | Global + payroll + duplicate set | Login (3 copies), Lupa sandi, Konfirmasi Logout, Dashboard, Laporan. Payroll: Data Karyawan, Dashboard, Iframe, Presensi & Lembur, Rekap Absensi, Daftar Gaji, Pembayaran + 2 dialogs. Duplicate revenue screens (`94:*`) | Mixed; needs consolidation |

## 2. Coverage Matrix

| Cycle | Designed | Missing |
|---|---|---|
| Pendapatan | `PD01`–`PD10` + dialogs | — |
| Pengeluaran | `PG01`–`PG06`, `PG11`, `PG12` | `PG07`–`PG10` (likely receiving, supplier invoice, 3-way match, payable — confirm with the process owner) |
| Produksi | `PR02`–`PR16` + hub, dialogs, previews | `PR01` (confirm whether it is the hub or a planning screen) |
| Penggajian | Data Karyawan, Dashboard, Presensi & Lembur, Rekap Absensi, Daftar Gaji, Pembayaran | `Periode Gaji`, `Hitung Gaji`, `Laporan` (present in navigation, no screen) |
| Global | Login, Lupa sandi, Logout, Dashboard, Laporan | Print layouts for invoice/payslip; loading, empty, error states |

The payroll navigation lists eight destinations; six have screens. The
`Iframe Lionmesh Payroll` section suggests at least one surface may be embedded
from another app — confirm whether payroll is native or an iframe before
building it.

## 3. Shell Measurements

There are two shells in the file, and they do not agree.

| Shell | Used by | Frame | Sidebar | Work area | Content width | Right edge | Fits 1280? |
|---|---|---|---|---|---|---|---|
| Hub shell | Dashboard, cycle hubs, payroll | 1280×760 | 288px (`#1C2530`) | 992px | **1568px** at x=32 | 1600px | **No — 608px clipped** |
| Module shell | Pendapatan, pengeluaran, produksi | 1280×760 | 200px (`#1B242E`) | 1080px | 1016px at x=232 | 1248px | Yes (32px margin) |

Consequences of the hub shell:

- The third stat card and the right rail (`Tindak lanjut`, 372px) are outside
  the 1280 frame.
- The action column of tables is cut.
- The design only works at ~1888px total width, which is not the target device.

The chosen direction (see `README.md`) is the module shell: **200px sidebar,
32px page padding, fluid content up to 1440px**. The hub shell is retired.

### Login panel

The login frame is 1280×760. The left identity panel is **560×1080**, so 320px
is clipped below the frame. The fourth cycle card is not visible. The panel must
fit 760px (or scroll intentionally) before implementation.

## 4. Token Drift

### 4.1 Styles and variables

| Item | Count |
|---|---|
| Color styles | **0** |
| Text styles | **0** |
| Effect styles | **0** |
| Variable collections | **0** |
| Variables | **0** |

Every value is hardcoded. There is nothing to export as a token set; the tokens
must be defined from the observed values (see `DESIGN_TOKENS.md`).

### 4.2 Color

Solid fill counts across all three pages (top values):

| Hex | Count | Observation |
|---|---|---|
| `#FFFFFF` | 1,862 | Surfaces |
| `#1B242E` | 1,448 | Module sidebar |
| `#4B5563` | 888 | Body secondary |
| `#202938` | 689 | Primary text |
| `#BDC5D0` | 498 | Border/divider drift |
| `#8490A2` | 355 | Muted text — fails contrast |
| `#1B232E` | 350 | Near-duplicate sidebar |
| `#E88900` | 255 | Second orange |
| `#475569` | 193 | Secondary text drift |
| `#4A3530` | 185 | Brown drift |
| `#FFFDF8` | 181 | Off-white drift |
| `#F8F9FB` | 155 | Module background |
| `#E5E7EB` | 142 | Border drift |
| `#ED8B00` | 112 | Primary orange on hubs |
| `#F8FAFC` | 98 | Background drift |
| `#A45B16` | 93 | Brown-orange drift |
| `#1C2530` | 90 | Hub sidebar |
| `#FFF4D5` | 83 | Warning background |
| `#D1FAE5` | 67 | Success background |
| `#B8C2CE` | 65 | Muted border drift |

Drift summary:

- **Three near-identical navies:** `#1B242E` (module), `#1B232E`, `#1C2530`
  (hub). Visually indistinguishable; consolidate to `#1C2530`.
- **Two oranges:** `#E88900` and `#ED8B00`. Consolidate to `#ED8B00`.
- **Four light backgrounds:** `#F7F9FC` (hubs), `#F8F9FB` (modules),
  `#F8FAFC`, `#FFFDF8`. Consolidate to `#F7F9FC`.
- **Multiple border grays:** `#E5E7EB`, `#BDC5D0`, `#B8C2CE`, plus others below
  the top-20 cutoff. Consolidate to `#E2E8F0` for dividers and `#8490A2` for
  input borders.

### 4.3 Typography

| Font | Count |
|---|---|
| Inter Regular | 3,251 |
| Inter Bold | 1,537 |
| Inter Semi Bold | 831 |
| Poppins Regular | 158 |
| Noto Sans Regular | 73 |
| JetBrains Mono Regular | 63 |
| Noto Sans SemiBold | 37 |
| Poppins SemiBold | 27 |
| Noto Sans Bold | 25 |
| Inter Medium | 9 |
| Unknown | 20 |

Inter is 5,628 of 6,031 text nodes (93%). Poppins, Noto Sans, and JetBrains Mono
are drift from imported sections. One family is enough; tabular numerals handle
money without a mono face.

**25 distinct font sizes** are in use:

| Size | Count | | Size | Count |
|---|---|---|---|---|
| 12 | 1,810 | | 18 | 60 |
| 13 | 1,706 | | 28 | 50 |
| 14 | 1,212 | | 10 | 35 |
| 11 | 362 | | 23 | 35 |
| 17 | 167 | | 20 | 32 |
| 15 | 119 | | 32 | 25 |
| 16 | 92 | | 22 | 17 |
| 24 | 89 | | 9 | 16 |
| 19 | 85 | | 36 | 15 |
| 21 | 66 | | 27 | 13 |
| 25 | 7 | | 38 | 5 |
| 40 | 5 | | 42 | 5 |
| 84 | 2 | | | |

The 12/13/14 cluster is 4,728 nodes — three sizes one pixel apart. The 84px
value is the brand wordmark, not UI. The token scale collapses the UI range to
seven sizes (12, 13, 14, 16, 20, 24, 28) plus the auth hero.

### 4.4 Radius

**16 distinct radius values:**

| Radius | Count | | Radius | Count |
|---|---|---|---|---|
| 8 | 561 | | 5 | 59 |
| 6 | 450 | | 999 | 44 |
| 10 | 437 | | 100 | 27 |
| 7 | 342 | | 24 | 15 |
| 12 | 242 | | 11 | 13 |
| 40 | 116 | | 99 | 10 |
| 20 | 109 | | 16 | 6 |
| 4 | 3 | | 13 | 2 |

The four most common values (8, 6, 10, 7) are all controls/cards but differ by
1–4px. The token set uses 4 (badge), 8 (control), 12 (card/modal), 999 (pill).

### 4.5 Spacing

**20 distinct item-spacing values:**

| Value | Count | | Value | Count |
|---|---|---|---|---|
| 6 | 311 | | 2 | 39 |
| 10 | 256 | | 20 | 29 |
| 14 | 126 | | 1 | 27 |
| 12 | 109 | | 28 | 23 |
| 4 | 97 | | 16 | 22 |
| 8 | 74 | | 24 | 14 |
| 18 | 40 | | 34 | 13 |
| 3 | 12 | | 32 | 5 |
| 26 | 2 | | 0 | 1 |
| 11 | 1 | | 44 | 1 |

The three most common values — 6, 10, 14 — are not on a 4/8 grid. This is the
clearest evidence that spacing was set by eye, not by system.

### 4.6 Components

| Item | Count |
|---|---|
| Components | 113 |
| Component sets | 49 |
| Instances | 595 |
| Frames | 4,822 |
| Text nodes | 6,031 |

The library is not usable yet: 49 component sets carry default names
(`Property 1=Default`, `Property 1=Variant2`). A designer cannot find
`Button/Primary/MD`; they find a variant number. Renaming and consolidation is a
prerequisite for FND-007.

## 5. Lint Results

The lint cap is 100 findings per node, so the numbers below are minimums.

| Screen | Nodes | Critical | Warnings | Info | Contrast | Hardcoded colors | No text style | Default names |
|---|---|---|---|---|---|---|---|---|
| Dashboard `86:1974` | 91 | 9 | 88 | 3 | 9 | 49 | 31 | 8 |
| Modul Pendapatan `2:7` | 46 | 17 | 82 | 1 | 1 text + 16 non-text | 44 | 26 | — |
| Produksi `206:635` | 48 | 12 | 87 | 1 | 12 non-text | 46 | 33 | — |
| Penggajian `86:509` | 87 | 10 | 89 | 1 | 10 | 49 | 32 | 8 |

Additional warnings on module/production screens: reflow (2), reading order (1),
no auto-layout (9 module / 5 production).

## 6. Contrast Failures And Fixes

| Current pair | Ratio | Fix | New ratio |
|---|---|---|---|
| White on `#ED8B00` (primary button) | 2.53:1 | `#1C2530` on `#ED8B00` | 6.11:1 |
| White on `#E88900` | 2.62:1 | `#1C2530` on `#ED8B00` | 6.11:1 |
| `#8490A2` on white (muted text) | 3.23:1 | `#6B7385` on white | 4.76:1 |
| `#1B9D80` on `#E7F7F1` (success) | 3.07:1 | `#08785F` on `#D1FAE5` | 4.79:1 |
| `#A8740D` on `#FFF4D5` (warning) | 3.71:1 | `#8A5A00` on `#FFF4D5` | 5.41:1 |

The primary button is the most serious: the brand orange is kept, but the text
must be ink, not white. Input borders also need 3:1 against the surrounding
surface; `#8490A2` on white is 3.23:1, so it is acceptable as a border even
though it fails as text.

## 7. Duplicates And Ambiguities

| Item | Copies | Recommendation |
|---|---|---|
| Login | `86:1894`, `86:3530`, `229:527` | Keep `86:1894`; archive the other two |
| Revenue screens | `2:*` set and `94:*` set | Keep `2:*`; archive `94:*` |
| Revenue hub on production page | `252:325` | Move to `pendapatan` or archive |
| Payroll iframe | `86:3843` (“Iframe Lionmesh Payroll”) | Confirm whether payroll is native or embedded before building |

Duplicate screens make “which one is the source of truth?” unanswerable. The
rule after cleanup: one screen per use case; variants live as component props,
not as copied frames.

## 8. Missing Screens And States

- `PG07`–`PG10`: receiving, supplier invoice, 3-way match, payable.
- Payroll `Periode Gaji`, `Hitung Gaji`, `Laporan`.
- `PR01`: confirm whether it is the hub or a planning screen.
- Print layout for invoice, delivery note, purchase order, and payslip. Preview
  frames exist, but no A4 specification or page-break behavior.
- Loading, empty, error, and no-permission states. One “Data tidak tersedia”
  line exists; the rest is undesigned.
- Responsive behavior below 1280. The current decision is desktop-only, so this
  is a documented non-goal, not a gap to fill.
- Dark mode: out of scope.

## 9. Remediation Plan (Figma)

Do these in order; each step makes the next cheaper.

1. **Create variables and text styles.** Collections: brand, ink, status,
   surface, border; text styles for the seven sizes. Apply to all frames and
   delete local overrides. Target: 0 hardcoded colors, 0 no-text-style hits.
2. **Rebuild the shell.** 200px sidebar, 32px page padding, content max 1440,
   12-column grid. Apply to Dashboard, all four hubs, and payroll. Fix the login
   panel to 760px height.
3. **Fix contrast.** Ink on orange; muted text `#6B7385`; success/warning pairs
   from `DESIGN_TOKENS.md`. Re-run lint until 0 critical.
4. **Rename and consolidate components.** `Button/Primary/MD`, `Input/Text`,
   `Badge/Status/Success`, `Table/Default`, `Dialog/Confirm`, and so on. Merge
   the 49 default-named sets into the component inventory in `COMPONENTS.md`.
5. **Fill the gaps.** `PG07`–`PG10`, payroll `Periode Gaji`/`Hitung Gaji`/
   `Laporan`, `PR01`, print layouts, and the state set.
6. **Archive duplicates.** Move `86:3530`, `229:527`, `94:*`, and `252:325` to a
   page named `arsip`; never delete without the owner’s confirmation.
7. **Re-audit.** Run the lint on the four representative screens again; the
   exit criterion is 0 critical, 0 hardcoded colors, 0 no-text-style.

## 10. Method And Limits

- Structural data came from `figma_get_file_data` and targeted `figma_execute`
  queries (page tree, shell measurements, fills, fonts, radii, spacing).
- Lint data came from `figma_lint_design` on four representative screens.
- Five screenshots were captured through the Figma REST path before rate limit
  (HTTP 429). The desktop-bridge capture timed out on large frames. The payroll
  screen was inspected structurally and by text extraction, not visually.
- Color, font, radius, and spacing counts are node counts, not unique-style
  counts; a single text node with the same fill contributes once per node.
- The file was read-only during the audit. The current page was switched to
  `keseluruhan` for inspection and restored to `pengeluaran & produksi`.

---

# Audit v2 — “SIA Liomesh (Copy)”

Date: 2026-11-23
File: **SIA Liomesh (Copy)** — key `VS9PagBMlKi2McPPfCdsRV`
Last modified: 2026-11-23T02:34:17Z · version `2424873986294529564`
Method: Desktop Bridge plugin — node tree, style definitions
(`getLocalPaintStylesAsync`, `getLocalTextStylesAsync`), geometry over all 375
shell frames. Read-only; nothing in the file was changed.

Sections 1–6 above describe the retired file **“DESAIN UI SIA (Copy)”**
(`Np8oosi3jZuSuoaQGbf5sb`). They are kept as history. The numbers below replace
them. Where v2 contradicts a locked decision, the delta is listed in
`FIGMA_V2_DELTAS.md`; it is not resolved here.

## 7. Structure

| Page | Contents |
|---|---|
| `01 · Prototipe SIA` | 6 sections wrapping 38 sub-sections, 583 frames total: 371 screens, 174 `Catatan / <ID>`, 38 `Ringkasan / <section>` |
| `02 · Komponen` | 38 components and 3 documentation frames |

Labels on the prototype page are role-first: `<Role> / <flow> / <Judul>`, e.g.
`Penjualan / Verifikasi pesanan`, `QC / SPK-2611-013 lolos`,
`HR / hr_fix / Perbaiki rekap milik HR`. The `flow` token is the URL-safe prestate
name, which makes the naming stable enough to map onto routes.

Screen frames are **1440×960**; Accounting screens are **1440×1132**
(`Accounting / Daftar jurnal November`, `Accounting / Laporan keuangan · neraca`,
…). Taller frames appear where a screen overflows: `1440×1480`
(`Accounting / HPP final SPK-2611-013`), `1440×1425`
(`QC / Rework tetap tidak lolos`).

Bullets per cycle:

- UMUM: 24 screens, 5 sub-sections (`0`, `C1`–`C4`).
- Penggajian: 175 screens, 10 sub-sections (`1`, `1b`, `1c`, `2`, `3`, `3.1`,
  `4`–`7`).
- Pendapatan: 63 screens, 8 sub-sections (`8`, `8b`, `9`–`13`, `11b`).
- Pengeluaran: 61 screens, 9 sub-sections (`14`, `15`, `15b`, `16`–`19`, `17b`,
  `18b`).
- Produksi: 48 screens, 6 sub-sections (`20`, `20b`, `21`–`24`).

## 8. Styles

| Item | Count | Detail |
|---|---|---|
| Color styles | **17** | `SIA v2 / navy`, `orange`, `orangeDark`, `bg`, `white`, `ink`, `muted`, `line`, `green`, `greenBg`, `amber`, `amberBg`, `red`, `redBg`, `blue`, `blueBg`, `soft` |
| Text styles | **5** | `SIA v2 / Display` (30/150% Bold), `Heading` (20/150% Semi Bold), `Body` (14/150% Regular), `Label` (13/150% Semi Bold), `Caption` (12/150% Regular) |
| Effect styles | **0** | no shadow token exists in the file |
| Variable collections | **0** | tokens are styles, not variables |
| Variables | **0** | no modes, no aliases |

The styles exist but are **not used**. Measured on page `01`: 33,035 solid fills,
**0** of them bound to a paint style or a variable; 23,811 text nodes, **0** of
them carrying a text style. The file therefore has 67 distinct raw hex values and
21 distinct font sizes; the `SIA v2 / …` styles describe the intended palette and
type scale, and assigning them is `FND-007` work. Spacing, radius, and shadow were
never tokenised in either file.

## 9. Shell

| Element | Measured | Consistency |
|---|---|---|
| Sidebar | 220px | 375 of 375 shell frames — a single value |
| Page padding | 32px | content starts at x=32 inside `Area kerja` |
| Work area | x=220, width 1220 at 1440 | — |
| Content width | 1156 at 1440 | = 1220 − 64 |
| Screen height | 960 / 1132 | two values by cycle |

The v1 hub shell (288px sidebar, 1568px content, 608px clipped) no longer
exists. The login panel clipping is gone as well: the login frame is 1440×960
and its identity panel fits.

## 10. Gaps in v2

- Print layouts: no invoice, purchase order, or payslip print frame.
- Empty/loading/error screens exist only for payroll (`7. Keadaan kosong,
  memuat, dan gagal`, 24 screens). The other three cycles have inline error
  variants but no dedicated state screens.
- Responsive behavior below 1280: still a documented non-goal.
- `Payroll v4 / Button / danger` sits on the prototype page instead of
  `02 · Komponen`.
- Three component generations coexist (v1 unprefixed, `SIA v3 /`, `Payroll v4 /`);
  consolidation is `FND-007` work.
- Two screens carry no `Catatan` card at all: `Semua peran / login_fail` and
  `Semua peran / logout`.

## 11. Method And Limits

- Structure and geometry came from `figma_execute` scripts that walked the page
  tree; counts are node counts, not style counts.
- Style values came from the style definitions themselves, so the hex and type
  numbers above are exact.
- Screenshots could not be exported in bulk: the Figma REST image endpoint
  returned HTTP 429 (plan quota), and the plugin sandbox cannot reach
  `localhost` to push bytes. Screens were inspected structurally and via the
  `Catatan` / `Ringkasan` text. See `screenshots/README.md`.
- The file was read-only during the audit.
