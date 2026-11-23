# Layouts: Lionmesh SIA

Status: **Draft v0.1** · 2026-11-17
Owner: Tech Lead
Companion to: `DESIGN_TOKENS.md`, `COMPONENTS.md`, `INFORMATION_ARCHITECTURE.md`
Raw reference: `screenshots/` (exported from Figma at 1×)

> **Snapshot.** The Figma source was rebuilt on 2026-11-23 as “SIA Liomesh
> (Copy)” (`VS9PagBMlKi2McPPfCdsRV`, 371 screens). The values below are still the
> locked v0.1 values and match the shipped UI kit. Every disagreement in the v2
> file is measured in `FIGMA_V2_DELTAS.md`; none of it is adopted until the tech
> lead decides.

This file is the composition contract. Tokens decide *what* a value is; this
file decides *where* the blocks sit, how wide they are, and which Figma habits
must not be copied. If a screen needs a layout that is not here, add the pattern
here first — do not invent it inside a module.

---

## 1. One Shell

Every authenticated screen uses the same shell. There is no second shell for
hubs, dashboards, payroll, or reports.

```
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Sidebar 220          │ Work area = viewport − 220                            │
│ fixed, full height   │                                                       │
│                      │ 32px page padding                                     │
│ Lionmesh             │ ┌───────────────────────────────────────────────────┐ │
│ SISTEM INFORMASI…    │ │ PageHeader 64–80                                  │ │
│                      │ └───────────────────────────────────────────────────┘ │
│ Dashboard Umum       │ 32px gap                                              │
│ Siklus Pendapatan    │ ┌───────────────────────────────────────────────────┐ │
│ Siklus Pengeluaran   │ │ Page content                                      │ │
│ Siklus Produksi      │ │                                                   │ │
│ Siklus Penggajian    │ │                                                   │ │
│ Laporan              │ └───────────────────────────────────────────────────┘ │
│                      │                                                       │
│ contextual group     │ optional sticky ActionBar 64 at the bottom            │
│                      │                                                       │
│ user / role / keluar │                                                       │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

### Width formula

```
work area = viewport − 220
content   = min(1440, work area − 64)
```

The 64 is 32px padding on both sides. The content is left-aligned at 1280–1599
and centred once the viewport is wide enough for the maximum.

| Viewport | Work area | Content | Side padding |
|---:|---:|---:|---:|
| 1280 (minimum) | 1060 | **996** | 32 |
| 1366 | 1166 | 1102 | 32 |
| 1440 (target) | 1220 | **1156** | 32 |
| 1536 | 1336 | 1272 | 32 |
| 1600 | 1400 | 1336 | 32 |
| 1704 | 1504 | **1440** | 32 |
| 1920 | 1720 | 1440 | 140 |

At 1280 the 12-column grid resolves to `62.67px` columns with `24px` gutters.
At 1440 it resolves to `76px` columns. Do not hardcode column widths; use
`grid-template-columns: repeat(12, minmax(0, 1fr))` and span cells.

### Vertical rhythm

| Block | Height | Gap after |
|---|---:|---:|
| Top padding | 32 | — |
| `PageHeader` (breadcrumb + title + actor line) | 80 | 32 |
| Page content | flex | 24 if an ActionBar follows |
| Sticky `ActionBar` | 64 | — |

At 760px viewport height, a form screen has `760 − 32 − 80 − 32 − 24 − 64 = 528px`
for the working area. The Figma module screens use 428–548px; this is the range
the content must fit.

The `PageHeader` is 80px of content, not a 100px band. Breadcrumb is 12/16,
title is 20/28/700, actor line is 13/20 muted. Actions sit on the right, aligned
with the title baseline. The Figma module screens draw a 100px header and a 24px
gap; the differences are drift. Implement 80 + 32.

### Sidebar

| Part | Height | Notes |
|---|---:|---|
| Brand block | ~72 | wordmark 24, caption 12 |
| Primary item | 40 | 6 items: Dashboard + 4 cycles + Laporan |
| Contextual item | 32 | only inside a cycle, max 8 |
| Footer | ~80 | user, role, company, `Keluar dari SIA` |

The sidebar never collapses in v1. The active cycle stays orange on every child
screen. Some module sidebars omit the footer (Data Pelanggan); the hub sidebar
is 288px. Both are replaced by this 220px shell with a footer.

---

## 2. Page Patterns

| Pattern | Grid | 1280 result | Use for |
|---|---|---|---|
| Dashboard | 12 | 2×2 cycle cards | `/` |
| Hub | 3 stats + 8/4 | main 669 + rail 323 | `/pendapatan`, `/pengeluaran`, `/produksi`, `/penggajian` |
| Master data | 6/6 or 5/7 | 496/496 or 409/583 | Data Pelanggan, Data Pemasok, Data Produksi |
| Transaction entry | 7/5 or 6/6 | 583/409 or 496/496 | Pesanan, PG02, PG06, Faktur |
| Detail / verification | 8/4 | 669 / 323 | Pesanan detail, verifikasi, PO detail |
| Report | 12 | full width | Laporan, Buku Besar, Daftar Gaji |
| Auth | 43.75/56.25 | 560 / 720 | Login, Lupa kata sandi |
| Dialog | 520 or 640 | centred | Confirm, form |

### Choosing a split

The Figma file uses 500/500 on most screens, 587/424 on Pesanan, and 424/576 on
Data Produksi. That is not random; it follows the side that needs more room.
Use this rule instead of a single default:

| Condition | Split | 1280 widths | Example |
|---|---|---|---|
| Both sides simple, list ≤5 columns | **6/6** | 496 / 496 | Data Pelanggan, PG02 |
| Form has line items, many fields, or a document preview | **7/5** | 583 / 409 | Pesanan, PG06 |
| List has 6+ columns or is the main working surface | **5/7** | 409 / 583 | Data Produksi |
| No side panel | **12** | 996 | Lists, reports, ledgers |

At 1440 the same spans resolve to 576/576, 676/476, and 476/676. Use
`grid-column: span 6`, `span 7`, etc. Do not write `width: 500px`.

---

## 3. Dashboard

```
┌ PageHeader: Dashboard Umum · period · Unduh Ringkasan ──────────────────────┐
├─────────────────────────────────────────────────────────────────────────────┤
│ Cycle card      │ Cycle card      │ Cycle card      │ Cycle card           │
│ 3 cols          │ 3 cols          │ 3 cols          │ 3 cols               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Keterkaitan Antar Siklus                                                    │
│ [Step 1: Pendapatan 4 cols] [Step 2: Produksi 4 cols] [Step 3: Pengeluaran 4 cols]
│ [General Ledger bar — 12 cols]                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Menunggu Tindakan Direksi & Manajemen                                       │
│ DataTable — 12 cols                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **1280:** cycle cards are 2×2 (`span 6` each, 496px). Four cards in one row
  would be 236px each and every card would wrap its figure; do not do it.
  At ≥1360, switch to 4×1 (`span 3`, 276px at 1440).
- The Figma dashboard is 1568px wide inside a 992px work area, so the third and
  fourth cards are clipped. The fix is the grid above, not a smaller font.
- `Keterkaitan` is a 3-step row at 1440; at 1280 it becomes 3 stacked rows or a
  horizontal scroll. The General Ledger bar is full width and uses the dark
  surface; it is the only dark block on the page.
- "Menunggu Tindakan" is a full-width table. It is not a right rail: the
  dashboard has no rail.

---

## 4. Cycle Hub

```
┌ PageHeader: Siklus Pendapatan · purpose ────────────────────────────────────┐
├─────────────────────────────────────────────────────────────────────────────┤
│ StatCard 4 cols   │ StatCard 4 cols   │ StatCard 4 cols                     │
│ 376 at 1440       │ 376               │ 376                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ProcessStepper — 12 cols, 52px, 3–5 steps                                   │
├───────────────────────────────────────────────┬─────────────────────────────┤
│ Main panel — 8 cols (776 at 1440)             │ Tindak lanjut — 4 cols      │
│ tabs · search · DataTable · pagination        │ 376 at 1440                 │
│                                               │ approvals · overdue         │
└───────────────────────────────────────────────┴─────────────────────────────┘
```

- Three stat cards, one per `span 4`. Do not use four; the fourth figure belongs
  in the rail or the table.
- The stepper is directly under the header. The main table sits under it.
- **At 1280**, the 8/4 split gives 669px for the table. If the table has more
  than six columns, stack the rail below the table and give the table 12 cols.
  Do not shrink the table to 11px text.
- The rail is for decisions, not data volume: approvals, overdue items, a short
  activity list. It has no nested cards; use sections separated by 1px lines.
- The Figma hub content is 1568px wide inside 992px. The raw screenshots show
  the clipped result; the pattern above is the target.

---

## 5. Master Data (form + list)

```
┌ PageHeader: Data Pelanggan · actor line ────────────────────────────────────┐
├─────────────────────────────────────────────────────────────────────────────┤
│ Form panel — 6 cols (496)          │ List panel — 6 cols (496)              │
│                                    │                                        │
│ Kode pelanggan   Lama kredit       │ DataTable                              │
│ Nama pelanggan (full width)        │ Kode · Nama · Kredit · Status          │
│ Alamat (full width)                │                                        │
│ Telepon          Email             │ 48px rows                              │
│                                    │                                        │
│                  [Batal] [Simpan]  │ Pagination                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ← Kembali ke Hub                              Lanjut: Pesanan Pelanggan →  │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Two columns for short fields, one for long text, notes, and addresses.
- The form panel is a surface; the list is a second surface. They are siblings,
  not a card inside a card.
- Form padding 20–24; field gap 16; section gap 24. The submit row is right
  aligned inside the panel.
- The list uses 4–5 columns. Status is a badge with text; money and quantities
  are right aligned and tabular.
- `Data Produksi` uses 5/7 (409/583): its list has more columns and the BOM
  panel sits under it. Do not force 6/6 there.

---

## 6. Transaction Entry (form + summary)

```
┌ PageHeader: Pesanan Pelanggan · actor line ─────────────────────────────────┐
├─────────────────────────────────────────────────────────────────────────────┤
│ Form — 7 cols (583)                          │ Summary / validation 5 cols  │
│                                              │ (409)                        │
│ Pelanggan            No. Customer PO         │ Total                        │
│ Tanggal              Termin                  │ Rp 18.450.000                │
│                                              │                              │
│ Line-item table (full width of panel)        │ Status checks                │
│ Produk · Satuan · Jumlah · Harga · Subtotal  │ ✓ Barang                     │
│ [+ Tambah baris]                             │ ✓ Jumlah                     │
│                                              │ ! Tanggal dibutuhkan         │
│                                              │                              │
├──────────────────────────────────────────────┴──────────────────────────────┤
│ ← Data Pelanggan                                      [Batal] [Simpan]      │
└─────────────────────────────────────────────────────────────────────────────┘
```

- The left panel owns the input; the right panel is read-only or a validation
  summary. It never holds a second editable form.
- The line-item table is full width inside the form panel. Totals go below the
  table, right aligned. The primary action is at the bottom right.
- The Figma screens put the process bar at the bottom with a 48px height. The
  implemented `ActionBar` is 64px and sticky; it holds the back link on the left
  and one primary action on the right.
- `Faktur Penjualan` and `PG06` use 6/6 when the right side is a document
  preview or a short summary. `Pesanan` uses 7/5 because the line-item table
  needs the width. Both are allowed; choose by content, not by habit.

---

## 7. Detail / Verification

```
┌ PageHeader: Pesanan SO-1026-0186 · [Status] · primary action ───────────────┐
├─────────────────────────────────────────────────────────────────────────────┤
│ Summary strip: Pelanggan · Tanggal · Total · Termin — 4 × 3 cols            │
├───────────────────────────────────────────────────────────────┬─────────────┤
│ Tabs: Rincian · Riwayat · Jurnal                              │ Timeline    │
│                                                               │ 4 cols      │
│ Content — 8 cols (776 at 1440)                                │ 376         │
│ line items · totals · notes                                   │ status      │
│                                                               │ actor/time  │
├───────────────────────────────────────────────────────────────┴─────────────┤
│ ← Kembali                                              [Aksi utama]         │
└─────────────────────────────────────────────────────────────────────────────┘
```

- 8/4 split. At 1280: 669/323; at 1440: 776/376.
- The summary strip is four equal cards, one figure each; it is not a second
  table.
- The right rail is the audit trail, not a place for more fields. Newest first;
  every entry names actor and time.
- One primary action, determined by state. A rejected document shows the reason
  in the timeline and a danger badge in the header.

---

## 8. Report

```
┌ PageHeader: Laporan · period selector · Ekspor / Cetak ─────────────────────┐
├─────────────────────────────────────────────────────────────────────────────┤
│ Filter bar — 12 cols, 64px: period · branch · status · search                │
├─────────────────────────────────────────────────────────────────────────────┤
│ StatCard ×4 (3 cols each) or ×3 (4 cols each)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ DataTable — 12 cols, full width                                             │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Source · period · generated at · page x / y                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Reports have no right rail. The filter bar is a single row; on 1280 it may
  wrap to two rows, but it never becomes a sidebar.
- Table first, chart optional. A chart never replaces the numbers.
- `PrintLayout` uses A4, 12mm margins, black on white; the on-screen filters are
  not printed.
- The Figma `Laporan` screen is a 1568px layout inside 992px; the raw screenshot
  shows only the left part. Rebuild it on the 12-column grid.

---

## 9. Auth

```
┌──────────────────────────────────┬──────────────────────────────────────────┐
│ Brand panel — 43.75%             │ Auth panel — 56.25%                      │
│ 560px at 1280                    │ 720px at 1280                            │
│                                  │                                          │
│ Lionmesh                         │ PORTAL DIREKSI                           │
│ PT Lionmesh Prima Tbk            │ Selamat datang kembali                   │
│                                  │ Masuk untuk memantau…                    │
│ Empat siklus.                    │                                          │
│ Satu kendali bisnis.             │ Email perusahaan      [____________]     │
│                                  │ Kata sandi            [____________]     │
│ [Pendapatan]                     │ [x] Ingat saya        Lupa kata sandi?   │
│ [Pengeluaran]                    │ [        Masuk ke Dashboard        ]     │
│ [Produksi]                       │                                          │
│                                  │ Security note                            │
│ legal                            │ Hubungi IT · © 2026                      │
└──────────────────────────────────┴──────────────────────────────────────────┘
```

- Full viewport height, no sidebar. Left 43.75%, right 56.25%; at 1280 that is
  exactly 560/720. The left panel content max is 400, padding 48; the right panel content
  max is 420, centred.
- The Figma left panel is 1080px high and the fourth cycle card is clipped at
  760. Fix: three cycle cards at 760, or a compact 2×2 grid; the panel scrolls
  only if the viewport is shorter than 640.
- The auth panel is a single column. Labels above fields, 36px controls, 40px
  primary, 16px gap. The primary button uses ink text on orange, not white.
- `Lupa kata sandi` and `Hubungi IT` are links, not buttons. The security note is
  informational; do not use a warning color.

---

## 10. Dialog

```
             ┌──────────────────────────────────────────┐
             │ Title                              [×]  │
             │                                          │
             │ Body — 14/20, one decision               │
             │ optional form fields                     │
             │                                          │
             │                    [Batal] [Primary]     │
             └──────────────────────────────────────────┘
                        overlay rgba(20,27,36,.55)
```

- Simple confirm: 480px. Simple form: 520px (the Figma `Tambah produk` dialog).
  Complex form: 640px, scrollable body, sticky footer.
- Padding 24; title 16/24/600; body 14/20; footer 64. One primary action.
- Overlay is the only dimmed surface; never stack dialogs. Esc closes
  non-destructive dialogs; focus returns to the trigger.

---

## 11. Responsive Rules

| Width | Behavior |
|---|---|
| < 1280 | Not supported. Keep a 1280 min-width and allow horizontal scroll. No mobile reflow. |
| 1280–1359 | 2×2 dashboard cards; hub 8/4 only if the table has ≤6 columns, otherwise stack the rail; 6/6 or 5/7 splits; content 996. |
| 1360–1439 | 4×1 dashboard cards; hub 8/4; content 1082–1156. |
| 1440–1599 | Design target. 4×1 cards, 8/4 hub, 6/6 or 7/5 splits; content 1156. |
| ≥1600 | Content max 1440, centred in the work area. |

The sidebar never collapses. Tables never become cards on narrow screens. If a
table does not fit, reduce the column count or move secondary columns into the
detail view; do not add horizontal scroll to the primary table at 1280.

---

## 12. Slicing Checklist

Start from the clean module screenshots, not the clipped hubs:

- `04-data-pelanggan.png` — 6/6 master data, 200 sidebar, 1016 content.
- `05-pesanan-pelanggan.png` — 7/5 transaction entry with line items.
- `06-faktur-penjualan.png` — 6/6 document preview.
- `07-jurnal-penjualan-kas.png` — 6/6 ledger entry.
- `09-permintaan-pembelian-pg02.png` — 6/6 form + validation.
- `10-purchase-order-pg06.png` — 6/6 form + summary.
- `12-data-produksi.png` — 5/7 form + list + BOM.
- `16-dialog-tambah-produk.png` — 520px dialog.
- `14-dashboard-penggajian.png` and `17-pembayaran-gaji.png` — 200 sidebar,
  1016 content, 1280×720 payroll prototype.

### Copy these values

| Element | Value |
|---|---|
| Sidebar | 200px; content starts at x=232 |
| Page padding | 32px |
| Grid | 12 columns, 24px gutter |
| Page header | 80px content + 32px gap |
| Card | white, 1px `border-subtle`, 12px radius, 20px padding |
| Control | 36px high, 8px radius |
| Table header / row | 40px / 48px |
| Icon button | 44×44 |
| Page title | `text-title` 20/28/700 |
| Section title | `text-section` 16/24/600 |
| Body / label | 14/20 · 12/16 |
| Money | right aligned, tabular, `Rp 12.850.000` |
| Primary button | `brand-500` background, `ink-900` text |
| Status | text + badge, never color alone |

### Do not copy

| Figma habit | Use instead |
|---|---|
| 288px hub sidebar | 200px shell |
| 1568px content inside 992px | 12-column grid, content 1016/1176/max 1440 |
| 560×1080 login panel | 43.75% panel, 100vh, 3 cycle cards |
| 1119px payroll content that overflows 1280 | 1016 content, 32px padding |
| 48px bottom process bar | 64px sticky `ActionBar` |
| 500/500 on every split | split chooser (6/6, 7/5, 5/7) |
| White text on orange | `ink-900` on `brand-500` |
| Page titles 24–28px | `text-title` 20/28 |
| Left-aligned numbers | right aligned, tabular |
| Status by color only | text + badge |
| Nested cards | one surface + dividers |
| 25 font sizes, 16 radii, 20 spacings | the token scales |

### Component boundaries

| Layout block | Component |
|---|---|
| `AppShell` | `Sidebar`, `PageHeader`, `PageBody`, `ActionBar` |
| Dashboard | `CycleCard` (StatCard variant), `DataTable`, `Section` |
| Hub | `StatCard` ×3, `ProcessStepper`, `DataTable`, `FollowUpRail` |
| Master data | `FormSection`, `FormField`, `DataTable` |
| Transaction | `FormSection`, `LineItemTable`, `SummaryPanel`, `ActionBar` |
| Detail | `SummaryStrip`, `Tabs`, `StatusTimeline`, `ActionBar` |
| Report | `FilterBar`, `StatCard`, `DataTable`, `PrintLayout` |
| Auth | `BrandPanel`, `AuthCard` |
| Dialog | `Dialog` with `Confirm` or `Form` variant |

---

## 13. Measured In Figma

These are the raw measurements behind the rules. They are evidence, not
instructions; where a row says “fix”, the pattern above wins.

| Node | Screen | Measurement | Verdict |
|---|---|---|---|
| `2:7` | Data Pelanggan | sidebar 200; content x=232 w=1016; header h=100; main y=124 h=428; form 500 + gap 16 + list 500; footer y=577 h=48 | Good shell; migrate footer to 64 |
| `287:211` | Pesanan Pelanggan | form 587 at x=231; recent list 424 at x=826; gap 8; main h=440; footer y=589 h=48 | Good 7/5; 3px overflow, use grid |
| `206:635` | Data Produksi | header y=26 h=82; main y=128 h=548; form 424 + gap 16 + list 576; BOM 576 below list; footer y=704 h=38 | Good 5/7; footer too shallow |
| `147:3984` | PG02 Permintaan Pembelian | sidebar 200; main 1080; inner x=32 w=1016; breadcrumb 19 + title 40 + actor 24; content h=455; footer h=40; form 500 + validation 500 | Good; footer 40 is a prototype |
| `147:4421` | PG06 Purchase Order | same shell as PG02; form 500 + summary 500 | Good 6/6 |
| `86:1550` | Hub Pendapatan | sidebar 288; work area 992; inner content 1568; main 1176 + rail 372 | **Clipped 608px; fix** |
| `86:1974` | Dashboard Umum | sidebar 288; work area 992; inner content 1568; four cycle cards | **Clipped; fix** |
| `86:291` | Laporan | sidebar 288; work area 992; inner content 1568; cards 1568 | **Clipped; fix** |
| `86:1894` | Login | left panel 560×1080; right panel 720×760 | **Left panel clipped at 760; fix** |
| `86:3840` | Payroll Data Karyawan | sidebar at x=10 w=200; topbar x=210 w=1119; table x=210 w=1119 | **49px overflow; do not copy** |
| `86:3843` | Payroll dashboard iframe | 1280×720; sidebar 200; content 1016 | Good prototype; use the 200px shell and 760px page in the app |
| `86:4174` | Payroll payment iframe | 1280×720; sidebar 200; content 1016 | Good prototype |

---

## 14. Open Items

- The Figma file still contains the 288px hub shell and 1568px content. Do not
  clean it until the Tech Lead confirms a write operation; this document is the
  target in the meantime.
- Missing screens: `PG07`–`PG10`, payroll `Periode Gaji` / `Hitung Gaji` /
  `Laporan`, `PR01`, print layouts, and empty/loading/error states.
- The payroll screenshots are 1280×720 iframe prototypes, not 760px pages; the
  final app uses the same shell as every other cycle.
- The `DataTable` must own loading, empty, error, and pagination states. A page
  must not reimplement them.
- If a new pattern is needed, add it here with a wireframe and a measured
  example. A one-off layout in a module is a bug.

---

## 15. Next Implementation Order

1. `AppShell` + `Sidebar` + `PageHeader` (FND-007).
2. `DataTable` with the 40/48/12/16 dimensions and all four states.
3. `FormSection` + `FormField` + `Input` + `Select` + `Button`.
4. `StatCard`, `ProcessStepper`, `Badge`, `Dialog`, `ActionBar`.
5. Build `Data Pelanggan` as the reference screen; it exercises the shell,
   6/6 split, table, form, and footer.
6. Build `Pesanan` as the transaction reference; it exercises the 7/5 split,
   line items, totals, and validation panel.

The first screen that ships becomes the code reference. This document stays the
rationale.
