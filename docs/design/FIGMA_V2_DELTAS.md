# Figma v2 — Deltas Against The Locked Decisions

Date: 2026-11-23
Measured from: Figma **SIA Liomesh (Copy)** — `VS9PagBMlKi2McPPfCdsRV`
Method: Desktop Bridge plugin (`getLocalPaintStylesAsync`, `getLocalTextStylesAsync`,
node geometry over all 375 shell frames).

This file exists because the rebuilt file **contradicts** several values that
`README.md` lists as locked. Nothing here has been applied to
`DESIGN_TOKENS.md`, `LAYOUTS.md`, or `COMPONENTS.md`: a locked value is changed
by the tech lead, not by an audit.

```text
STOP: shell width and brand colors in the v2 file differ from the locked values
Need: one decision per row of sections 1 and 2 — adopt the v2 value, or keep the
      locked value and fix the Figma file
Affects: DESIGN_TOKENS.md (§3, §5, §11), LAYOUTS.md (shell geometry),
         COMPONENTS.md (sidebar item width), every screen built from FND-007
Options: A) Adopt v2 — the file is internally consistent (375/375 screens agree),
            so implementation can start immediately; tokens and layouts get
            rewritten once
         B) Keep locked values — Figma must be edited on 375 screens or the
            screens will never match the build
```

## 1. Shell geometry — contradiction

All 375 screens carry a frame with a child named `Sidebar`. Width distribution
is a single value: **220px, 375 of 375 frames.**

| Element | Locked (v0.1) | Measured in v2 | Delta |
|---|---|---|---|
| Sidebar width | 200px | **220px** | +20 |
| Page padding | 32px | 32px (content x=32 inside `Area kerja`) | none |
| Content left edge (absolute) | x=232 | **x=252** (220 + 32) | +20 |
| Content width @1440 | 1176 | **1156** (1220 − 64) | −20 |
| Content width @1280 | 1016 | 1020 (hypothetical, not drawn) | +4 |
| Screen frame | 1280×760 (v1 audit) | **1440×960** (Accounting: 1440×1132) | new |
| Sidebar fill | `#1C2530` (`ink-900`) | `#1B232E` (`SIA v2 / navy`) | see §2 |
| Work area | 12-column, gutter 24 | not encoded; layouts are drawn flat | unknown |

The 288px hub shell from the v1 file is **gone**; there is one shell again. That
part of the v1 audit is resolved.

## 2. Color — contradiction

The file now ships 17 paint styles named `SIA v2 / …`. Values below are the
style definitions, not sampled pixels.

| Role | Locked token | v2 style | v2 value | Delta |
|---|---|---|---|---|
| Primary accent | `brand-500` `#ED8B00` | `SIA v2 / orange` | `#E67E00` | −7 on red, −13 on green |
| Accent pressed | `brand-600` (derived) | `SIA v2 / orangeDark` | `#A64B00` | new explicit value |
| Primary text / sidebar | `ink-900` `#1C2530` | `SIA v2 / ink` · `SIA v2 / navy` | `#172335` · `#1B232E` | two values again |
| App background | `cloud` `#F7F9FC` | `SIA v2 / bg` | `#F8FAFC` | +1 on each channel |
| Surface | `white` `#FFFFFF` | `SIA v2 / white` | `#FFFFFF` | none |
| Muted text | `text-muted` | `SIA v2 / muted` | `#566579` | new explicit value |
| Border | `border` | `SIA v2 / line` | `#DCE3EB` | new explicit value |
| Subtle surface | — | `SIA v2 / soft` | `#EDF1F6` | new token |

Contrast, measured: `ink #172335` on `orange #E67E00` = **5.53:1** (AA pass;
the locked v0.1 pair was 6.11:1). White on `#E67E00` = **2.86:1** and stays
prohibited. `ink` on `orangeDark #A64B00` = **2.73:1** (fail); white on
`orangeDark` = **5.79:1** (pass), so pressed and dark-surface states must use
white text, not ink.

Adopted 2026-11-23: the values in this section and in §3 replaced the v0.1
tokens in `DESIGN_TOKENS.md` §2–§6.

## 3. Status colors — contradiction

| Status | Locked (fg / bg) | v2 style (fg / bg) |
|---|---|---|
| Success | `#08785F` / `#D1FAE5` | `#047857` / `#E8F6EF` |
| Warning | `#8A5A00` / `#FFF4D5` | `#92400E` / `#FFF4DB` |
| Danger | `#B42318` / `#FEE4E2` | `#B91C1C` / `#FDECEC` |
| Info | `#1D4ED8` / `#DBEAFE` | `#1D4ED8` / `#EBF2FF` |
| Neutral | `#475569` / `#F1F5F9` | `muted #566579` / `soft #EDF1F6` |

The v1 file had **zero** status styles and the tokens were derived from observed
values. v2 defines them as styles, which is an improvement in structure and a
change in values. The six v2 status components (`draft`, `waiting`, `approved`,
`rejected`, `done`, `info`) cover the same set plus a sixth state.

## 4. Typography — contradiction

v2 defines five text styles. All are Inter, line-height **150%**,
letter-spacing **0**.

| v2 style | Font | Size | Locked token with the same size | Note |
|---|---|---|---|---|
| `SIA v2 / Display` | Inter Bold | 30 | — | `text-display` is 24; `text-auth-hero` is 28. **30 is a new size** |
| `SIA v2 / Heading` | Inter Semi Bold | 20 | `text-title` 20/28 w700 | weight 600, line 30, letter 0 |
| `SIA v2 / Body` | Inter Regular | 14 | `text-body` 14/20 | line 21 vs 20 |
| `SIA v2 / Label` | Inter Semi Bold | 13 | `text-body-sm` 13/20 w400 | weight differs; `text-label` is 12/600 |
| `SIA v2 / Caption` | Inter Regular | 12 | `text-caption` 12/16 w500 uppercase | v2 is neither uppercase nor letter-spaced |

Sizes 16 (`text-section`) and 24 (`text-display`) have **no** v2 style: the
screens use them as raw values, or do not use them at all. This has not been
verified per node.

## 5. Effects — gap

Locked `DESIGN_TOKENS.md` defines `shadow-sm`, `shadow-md`, `shadow-lg`.
The v2 file has **0 effect styles**: every shadow, if present, is a raw value on
a layer. There is nothing to adopt; shadows must be re-derived or the locked
three accepted as-is.

## 6. Styles exist but are applied to nothing

0 variable collections, 0 variables. 17 paint styles and 5 text styles are
**defined**. Measured usage across the 371 screens:

| Item | Measured |
|---|---|
| Solid fills | 33,035 |
| …with a paint style | **0** |
| …with a variable binding | **0** |
| Text nodes | 23,811 |
| …with a text style | **0** |
| Distinct raw hex values | 67 |
| Distinct raw font sizes | 21 |

So the file is not tokenised at the node level any more than v1 was. What changed
is that the *intended* palette and type scale now exist as styles, which gives
`FND-007` something exact to bind. Spacing, radius, and shadow are not defined as
styles at all.

Two consequences for the "adopt v2" decision: adopting the colours is safe
because the 17 styles are internally consistent and their values dominate the
file, whereas adopting the five text styles would contradict the sizes actually
drawn on screen (13px and 11px dominate; see `DESIGN_TOKENS.md` §7).

## 7. Structure — resolved from v1

| v1 problem | v2 state |
|---|---|
| Two shells (288 hub, 200 module), hub clipped 608px | One shell, 220px; clipping gone |
| Login panel 560×1080 clipped inside a 760 frame | Login frame is 1440×960, nothing clipped |
| Payroll possibly an iframe (`Iframe Lionmesh Payroll`) | Native screens, no iframe section |
| 0 components used consistently | 38 components on page `02`, three generations |
| Missing `PG07`–`PG10` | Present as `14. Gudang` (penerimaan), `17. QC`, `18. Accounting`, `19. Finance` |
| Missing `Periode Gaji`, `Hitung Gaji`, payroll report | `1c. HR · Presensi, periode, laporan, slip` covers them |
| Missing empty/loading/error states | 24 screens in `7. Keadaan kosong, memuat, dan gagal` (payroll only) |
| Missing print layouts | Still missing: no invoice, PO, or payslip print frame |

## 8. Additions that are not in the design docs

These exist in the file and have no counterpart in `COMPONENTS.md` or
`INFORMATION_ARCHITECTURE.md`:

- Components: `Tabs` (`Tab`), `Chip status`, `Langkah stepper`, `Pemberitahuan`,
  `Tautan`, `Isian`, `Sidebar` / `Sidebar / Item`, `Template / Kartu jurnal`.
- Screens: retur penjualan (`11b`), retur pemasok (`17b`), rekonsiliasi bank
  (`18b`), kredit & pembatalan (`8b`, `15b`, `20b`), notifikasi (`C4`),
  impor presensi mesin (`1b`), stock opname, transfer antar gudang, tarif
  overhead.
- Documentation frames inside Figma: `Pedoman desain`, `Arah & keputusan desain`,
  `Claude · Spesifikasi focus`, and the `COMPARE · Gaya lama vs gaya baru`
  section (18 frames with before/after form, table, and status label).

## 9. Coverage by cycle

| Cycle | Screens | Notes |
|---|---|---|
| UMUM + core (C1–C4) | 24 | Keuangan, tutup buku, master data, notifikasi |
| Penggajian | 175 | Includes 24 empty/loading/error screens; the deepest cycle |
| Pendapatan | 63 | |
| Pengeluaran | 61 | |
| Produksi | 48 | |
| **Total** | **371** | Two screens carry no `Catatan` card: `login_fail` and `logout` |

Empty/loading/error states exist **only** for payroll. The other three cycles
have error variants inside their flows (e.g. `Pembelian bahan – permintaan
melebihi kekurangan`) but no dedicated state screens. `AGENTS.md` requires all
four states per screen; that gap is design-side, not implementation-side.
