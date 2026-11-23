# Design Tokens: Lionmesh SIA

All values are normative. If a screen needs a value that is not here, the value
is wrong or the token set is incomplete — do not hardcode it.

> **Snapshot.** The Figma source was rebuilt on 2026-11-23 as “SIA Liomesh
> (Copy)” (`VS9PagBMlKi2McPPfCdsRV`, 371 screens). The values below are still the
> locked v0.1 values and match the shipped UI kit. Every disagreement in the v2
> file is measured in `FIGMA_V2_DELTAS.md`; none of it is adopted until the tech
> lead decides.

Contrast ratios are calculated against the stated background. WCAG AA requires
4.5:1 for normal text and 3:1 for large text and UI boundaries.

## 1. Color Strategy

**Restrained.** Neutral surfaces carry the interface; one accent carries
action. The 60/30/10 split:

- 60% cloud background and white surfaces.
- 30% ink navy (sidebar, headings, table structure).
- 10% safety orange (primary action, active navigation, key figures).

Orange is never used for decoration, chart series, or body text. If everything
is orange, nothing is.

### Dark Mode

Not in scope for v1. The app runs in a daylight office; a dark theme would
require a second semantic layer (surface, border, status tints) and a new
contrast audit. If it is added later, keep the brand orange and switch only the
neutral ramp; do not invert the orange or the status colors.

## 2. Brand Scale

| Token | Hex | Use |
|---|---|---|
| `brand-50` | `#FFF4E0` | selected row, tinted callout |
| `brand-100` | `#FFE3B3` | hover tint on light surfaces |
| `brand-500` | `#ED8B00` | primary button, active nav, focus on dark |
| `brand-600` | `#D97D00` | primary button hover (ink text 5.07:1) |
| `brand-700` | `#B25A00` | text/links on white (4.82:1), pressed border |

Do not introduce another orange. `#E88900` is retired.

## 3. Ink And Neutral Scale

| Token | Hex | Use |
|---|---|---|
| `ink-950` | `#141B24` | overlay base, darkest frame |
| `ink-900` | `#1C2530` | sidebar, primary text on orange |
| `ink-800` | `#202938` | primary text on light |
| `ink-700` | `#2C3947` | secondary headings |
| `ink-600` | `#3E4C5E` | icons, strong secondary |
| `ink-500` | `#4B5563` | body secondary |
| `ink-400` | `#6B7385` | muted text, table headers (4.76:1 on white) |
| `ink-300` | `#8490A2` | input border only (3.23:1, not text) |
| `ink-200` | `#CBD5E1` | strong divider, table border |
| `ink-100` | `#E2E8F0` | subtle divider, card border |
| `ink-50` | `#F1F5F9` | table header, hover surface |
| `cloud` | `#F7F9FC` | app background |
| `white` | `#FFFFFF` | cards, inputs, modals |

## 4. Semantic Colors

### Text

| Token | Value | Contrast |
|---|---|---|
| `text-primary` | `ink-800` `#202938` | 14.63:1 on white |
| `text-secondary` | `ink-500` `#4B5563` | 7.56:1 on white |
| `text-muted` | `ink-400` `#6B7385` | 4.76:1 on white; 4.51:1 on cloud |
| `text-on-brand` | `ink-900` `#1C2530` | 6.11:1 on brand-500 |
| `text-inverse` | `white` `#FFFFFF` | on ink-900 |
| `text-link` | `brand-700` `#B25A00` | 4.82:1 on white |

### Surfaces

| Token | Value | Use |
|---|---|---|
| `bg-app` | `cloud` `#F7F9FC` | page background |
| `bg-surface` | `white` | cards, tables, forms |
| `bg-subtle` | `ink-50` `#F1F5F9` | table header, hover |
| `bg-selected` | `brand-50` `#FFF4E0` | selected row |
| `bg-sidebar` | `ink-900` `#1C2530` | navigation |
| `bg-overlay` | `rgba(20,27,36,0.55)` | dialog backdrop |

### Borders

| Token | Value | Use |
|---|---|---|
| `border-subtle` | `ink-100` `#E2E8F0` | card and section dividers |
| `border-strong` | `ink-200` `#CBD5E1` | table outer border |
| `border-input` | `ink-300` `#8490A2` | input, select, checkbox outline (3.23:1) |
| `border-focus` | `ink-900` `#1C2530` | focus ring on light |
| `border-focus-dark` | `brand-500` `#ED8B00` | focus ring on sidebar/dark |

### Sidebar

| Token | Value | Contrast |
|---|---|---|
| `sidebar-bg` | `#1C2530` | — |
| `sidebar-text` | `#C3CCD8` | 9.54:1 |
| `sidebar-muted` | `#9BA8BA` | 6.42:1 |
| `sidebar-hover` | `#263241` | — |
| `sidebar-active-bg` | `#ED8B00` | — |
| `sidebar-active-text` | `#1C2530` | 6.11:1 |

## 5. Status Colors

Each status is a foreground/background pair. Text is mandatory; color is
reinforcement, never the only signal.

| Status | Foreground | Background | Contrast |
|---|---|---|---|
| Success | `#08785F` | `#D1FAE5` | 4.79:1 |
| Warning | `#8A5A00` | `#FFF4D5` | 5.41:1 |
| Danger | `#B42318` | `#FEE4E2` | 5.45:1 |
| Info | `#1D4ED8` | `#DBEAFE` | 5.49:1 |
| Neutral | `#475569` | `#F1F5F9` | 7.0:1 |

Status mapping:

| Domain state | Status |
|---|---|
| Menunggu verifikasi, Diajukan, Draft | Neutral or Warning |
| Disetujui, Siap produksi, Lunas | Success |
| Ditolak, Batal, Overdue | Danger |
| Dalam proses, Dikirim, Dalam produksi | Info |

## 6. Focus

- Light surfaces: 2px solid `#1C2530`, 2px offset.
- Dark surfaces (sidebar): 2px solid `#ED8B00`, 2px offset.
- Never remove the outline without an equally visible replacement.
- Focus is always visible for keyboard users; `:focus-visible` is the default.

## 7. Typography

**Family:** Inter (variable), fallback `system-ui, -apple-system, "Segoe UI", sans-serif`.
**Mono:** none. Use `font-variant-numeric: tabular-nums` for money, quantities,
and document numbers.

| Token | Size | Line | Weight | Letter | Use |
|---|---|---|---|---|---|
| `text-caption` | 12 | 16 | 500 | 0.04em uppercase | table headers, small labels |
| `text-label` | 12 | 16 | 600 | 0 | form labels, badges, meta |
| `text-body-sm` | 13 | 20 | 400 | 0 | dense table cells, secondary copy |
| `text-body` | 14 | 20 | 400 | 0 | default body, inputs, buttons |
| `text-section` | 16 | 24 | 600 | -0.005em | card and section titles |
| `text-title` | 20 | 28 | 700 | -0.01em | page titles |
| `text-display` | 24 | 32 | 700 | -0.01em | stat values, dashboard figures |
| `text-auth-hero` | 28 | 36 | 700 | -0.02em | login screen only |

Rules:

- Only these eight sizes. No 11, 15, 17, 18, 19, 21, 22, 23, 27, 32, or 36.
- Two weights per screen are usually enough; three is the maximum.
- Body measure 50–75 characters; forms max 640px wide.
- Numbers in tables: right-aligned, tabular, no letter-spacing.
- Uppercase only for `text-caption`; never uppercase a sentence.

## 8. Spacing

Base grid: **4px**. Allowed values are multiples of 4.

| Token | Value | Use |
|---|---|---|
| `space-1` | 4 | icon gap, badge vertical padding |
| `space-2` | 8 | label → input, icon → text |
| `space-3` | 12 | table cell vertical padding, button gap |
| `space-4` | 16 | compact card padding, form row gap |
| `space-5` | 20 | default card padding |
| `space-6` | 24 | grid gutter, section gap |
| `space-8` | 32 | page padding, header → content |
| `space-10` | 40 | major section separation |
| `space-12` | 48 | empty state, auth block |
| `space-16` | 64 | auth page vertical rhythm |

Do not use 6, 10, 14, 18, 28, or 34. If a gap looks wrong, change the grouping,
not the grid.

## 9. Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 4 | badge, chip, checkbox |
| `radius-md` | 8 | input, button, small card |
| `radius-lg` | 12 | card, modal, panel |
| `radius-full` | 999 | pill, avatar, count bubble |

Nested rule: inner radius = outer radius − padding. A card with 12px radius and
12px padding contains controls with 4–8px radius, never another 12px card.

## 10. Shadows

| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(16,24,40,0.05)` | card, input |
| `shadow-md` | `0 4px 12px rgba(16,24,40,0.08)` | dropdown, popover |
| `shadow-lg` | `0 12px 32px rgba(16,24,40,0.12)` | modal |

No colored glows, no inner shadows, no gradient shadows.

## 11. Layout And Grid

| Token | Value |
|---|---|
| `sidebar-width` | 200px |
| `page-padding` | 32px |
| `content-max` | 1440px |
| `grid-columns` | 12 |
| `grid-gutter` | 24px |

Breakpoints:

| Range | Behavior |
|---|---|
| 1280–1439 | Minimum supported; content fills; 12 columns |
| 1440–1599 | Design target; content fills up to 1440 |
| ≥1600 | Content max 1440, centred in the work area |

Component sizes:

| Element | Height |
|---|---|
| Control (input, select, button md) | 36px |
| Button sm | 32px |
| Button lg | 40px |
| Table row | 48px |
| Table header | 40px |
| Icon button | 44×44px |
| Sidebar item | 40px |
| Page header | 64–80px content + 32px gap |

Common splits:

- Hub: 8 columns main + 4 columns right rail.
- Form: 5 columns form + 7 columns list.
- Detail: 8 columns content + 4 columns timeline.
- Stat cards: 3 × 4 columns.

## 12. Motion

| Token | Duration | Use |
|---|---|---|
| `motion-fast` | 120ms | hover, focus, color |
| `motion-base` | 180ms | dropdown, toast |
| `motion-slow` | 240ms | dialog, panel |

Easing: `ease-out`. Exit faster than entrance. No page-load choreography, no
parallax, no attention-seeking loops. `prefers-reduced-motion` sets all
durations to 0ms.

## 13. Data Display Rules

### Money

- Format with `Intl.NumberFormat('id-ID')`: dot thousands, comma decimals.
- Tables: `Rp 12.850.000`; no decimals unless the value has cents.
- Summary cards: `Rp 12,85 M` or `Rp 3,42 Miliar`, with the full value in a
  `title`/tooltip.
- Inputs: no `Rp` inside the field; the prefix is a fixed addon.
- Negative: parentheses in ledgers and financial reports
  (`(Rp 1.250.000)`); minus sign in inline diffs (`-Rp 250.000`).
- Zero: `Rp 0`, not `-`.

### Numbers And Percentages

- Quantities: right-aligned, tabular, unit in the header (`kg`, `ton`, `lembar`).
- Percentages: one decimal maximum (`+8,4%`); no color unless the direction is
  the message.
- Document numbers: left-aligned, tabular, never wrapped.

### Dates And Time

- Display: `02 Nov 2026`; with time: `02 Nov 2026, 14:30`.
- Input/API: `YYYY-MM-DD`; timestamp in ISO 8601.
- Timezone: `Asia/Jakarta`.
- Relative dates (“2 hari lalu”) only in activity feeds, with the absolute date
  in a tooltip.

### Tables

- Header: `text-caption`, uppercase, `bg-subtle`, sticky on scroll.
- Row: 48px, 1px `border-subtle`, hover `bg-subtle`, selected `bg-selected`.
- Cells: 12px vertical / 16px horizontal padding.
- Numbers right; text left; status and actions right.
- No zebra striping. No nested cards inside cells.
- Actions: one visible link (`Lihat`) plus a row menu for the rest.
- Empty: a dedicated empty state inside the table body, not a blank area.
- Loading: five skeleton rows, not a spinner.
- Error: one row with the message and a `Coba lagi` action.

### Forms

- Labels above fields, 12/600, with a required mark (`*`) and a legend.
- Help text below the field, 12/400 `text-muted`.
- Error replaces help; border becomes `danger`, message uses `danger` text.
- Two-column grid for short fields; one column for long text and line items.
- Submit button on the right; cancel on its left. One primary action.

### Empty, Loading, Error

| State | Treatment |
|---|---|
| First use | Title + what will appear + primary action |
| No results | “Tidak ada hasil untuk ‘query’” + clear filter |
| No permission | Explain the role needed; no action |
| Loading <1s | No indicator |
| Loading 1–3s | Skeleton matching the layout |
| Loading >3s | Spinner + operation name (“Menyimpan jurnal…”) |
| Error | Name the problem and the recovery; inline where possible |

## 14. Anti-Patterns And Migration

| Prohibited | Use instead | Migration note |
|---|---|---|
| White text on `#ED8B00` (2.53:1) | `ink-900` on `brand-500` | Every primary button |
| `#8490A2` as text (3.23:1) | `ink-400` `#6B7385` | Muted labels, captions |
| `#1B9D80` on `#E7F7F1` | `#08785F` on `#D1FAE5` | Success badges |
| `#A8740D` on `#FFF4D5` | `#8A5A00` on `#FFF4D5` | Warning badges |
| Four navy values | `ink-900` `#1C2530` | Sidebar, headings |
| Two oranges | `brand-500` `#ED8B00` | All accents |
| 25 UI font sizes (9–42px; 84px is the wordmark) | Eight-size scale | Remap 9/10/11→12, 15→14 or 16, 17/18/19→16 or 20, 21/22/23/25/27→24, 32/36/38/40/42→28 |
| Poppins, Noto Sans, JetBrains Mono | Inter only | Remove from components |
| 16 radius values (5/6/7/10/11/13/16/20/24/40/99/100) | 4/8/12/999 | Cards 12, controls 8, badges 4 |
| 20 spacing values (1/2/3/6/10/11/14/18/26/28/34/44) | 4/8/12/16/20/24/32 | Round to nearest token |
| Nested cards | One surface + dividers | Remove inner card borders |
| Status by color only | Text + color badge | Add the label |
| Centered or left-aligned numbers | Right-aligned, tabular | Tables and summaries |
| Fixed 1568px content | Fluid, max 1440 | Hub/dashboard/payroll |
| Custom one-off buttons | `Button` component | Search and replace |

## 15. Figma → Token Mapping

This is the migration table for the source file. Values not listed are retired.

| Figma value | Token |
|---|---|
| `#1C2530` | `ink-900` |
| `#1B242E`, `#1B232E` | `ink-900` (merge; `#1B242E` is the module sidebar, `#1C2530` the hub) |
| `#202938` | `ink-800` |
| `#4B5563`, `#475569`, `#334155` | `ink-500` |
| `#6B7385` | `ink-400` |
| `#8490A2` | `ink-300` for borders; `ink-400` for text |
| `#ED8B00` | `brand-500` |
| `#E88900` | retired → `brand-500` |
| `#B25A00` | `brand-700` |
| `#F7F9FC`, `#F8F9FB`, `#F8FAFC` | `cloud` |
| `#FFFFFF` | `white` |
| `#F1F5F9` | `ink-50` |
| `#E5E7EB`, `#BDC5D0`, `#B8C2CE` | `ink-100`/`ink-200` (border drift; verify per node) |
| `#FFFDF8` | `white` (off-white drift) |
| `#1B9D80` | success foreground `#08785F` |
| `#E7F7F1`, `#D1FAE5` | success background `#D1FAE5` |
| `#A8740D` | warning foreground `#8A5A00` |
| `#FFF4D5`, `#FEF3C7` | warning background `#FFF4D5` |

## 16. Implementation Notes For FND-007

- Tokens become CSS custom properties and the Tailwind theme. Components use
  semantic tokens (`text-muted`, `border-input`), not raw hex.
- One `Button`, one `Input`, one `Select`, one `Table`, one `Badge`, one
  `Dialog`. Variants are props; no copies.
- Use `Intl.NumberFormat('id-ID')` and `Intl.DateTimeFormat('id-ID')`; do not
  hand-format money or dates.
- Print uses a dedicated A4 stylesheet: 12mm margins, black on white, no
  background fills, page numbers.
- The `DataTable` owns loading, empty, error, and pagination states; pages do
  not reimplement them.
- A new token requires a documented decision in this file, not a one-off hex in
  a component.
