# Design Brief: Lionmesh SIA

## Visitor Mode

**Medium:** web — desktop browser (Next.js 16), 1280–1440.

**Operate.** Every screen is a work surface, not a landing page. Success is a
completed task with correct data: a verified order, a posted journal, a
received delivery, a paid payroll. Attention goes to scanability, consistency,
and the next action — not to novelty.

Secondary mode inside the product: **Read** for reports and ledgers, where
comprehension and comparison matter more than action.

## Problem

PT Lionmesh Prima Tbk runs four interlocking cycles — revenue, expenditure,
production, and payroll — on spreadsheets and disconnected documents. The
consequences are concrete:

- Stock quantity and stock value can diverge because receipts, issues, and
  journals are maintained separately.
- Order status, delivery status, invoice status, and payment status live in
  different files, so follow-up depends on memory.
- Approval chains are informal; there is no record of who approved what, when.
- Payroll rates and tax tables are copied by hand each period.
- Reports are assembled after the fact, not produced by the system that owns
  the transaction.

## Solution

One internal SIA with a shared shell and four cycle modules. Every document has
a number, a status, a history, and one obvious next action. Stock moves through
`mutasi_stok`; value lives in `saldo_stok`; journals are posted only through the
ledger. The UI exposes those rules instead of hiding them.

The design system exists so four student groups can build in parallel without
inventing four different tables, four date formats, or four orange buttons.

## Experience Principles

Three tensions, resolved deliberately:

1. **Ledger first, decoration last.**
   Numbers, status, and the next action lead. Visual treatment earns its place
   only when it improves scanning. *Tension:* brand expression vs. reading
   speed. *Resolution:* the brand lives in the frame (navy, orange, steel-grid
   rhythm); the data surface stays quiet.

2. **One obvious next step.**
   Each document shows its state and a single primary action — verify, approve,
   receive, post, pay. Secondary actions recede into a row menu or a ghost
   button. *Tension:* completeness vs. clarity. *Resolution:* completeness is
   available, but never competing for the same visual weight.

3. **Density with air.**
   The app is used for hours; tables must be dense. Density is achieved with a
   4/8 spacing grid, consistent row heights, and grouping — not by shrinking
   type below 12px or removing labels. *Tension:* information per screen vs.
   error rate. *Resolution:* compress spacing, never legibility.

## Aesthetic Direction

**Industrial Ledger.** A steel ledger: a calm ink-navy frame, a single safety-
orange signal, white paper surfaces, and numbers aligned like a ledger book.

- **Palette:** ink navy `#1C2530`, safety orange `#ED8B00`, cloud background
  `#F7F9FC`, white surfaces, hairline borders, muted status tints.
- **Type:** Inter, seven sizes, tabular numerals for all money and quantities.
- **Materials:** flat surfaces, 1px hairlines, subtle shadows only for overlays.
  No gradients, no glass, no colored glows.
- **References:** steel-mesh grids, factory control panels, ledger columns,
  shipping manifests, stamped approval blocks.
- **Anti-references:** generic SaaS blue, gradient text, glassmorphism, emoji
  as icons, nested cards, kicker/eyebrow labels above headings, hero-metric
  templates.

The shell is deliberately conventional (sidebar + page header + table) because
Operate mode rewards familiarity. Differentiation comes from the industrial
palette, ledger-grade typography, and the document/status model — not from
novel navigation.

Full rationale and alternatives: `DESIGN_DIRECTION.md`.

## Existing Patterns

The codebase is a fresh Next.js 16 + Tailwind starter with no design tokens
yet. The Figma file is the de-facto pattern source; the token values in this
system are extracted from it, not invented. The Figma file already establishes
these patterns; the design system keeps them and removes the drift:

| Pattern | Current form | Design-system treatment |
|---|---|---|
| App shell | Sidebar 200 on module screens; 288 on hubs/dashboard/payroll | Unify at **200**, content fluid to 1440 |
| Page header | Breadcrumb + title + actor/subtitle + actions | Keep; standardise spacing and type |
| Stat cards | 3-up summary cards with a status pill | Keep; 4-col grid, 12-col page grid |
| Process stepper | 3–4 numbered steps above the table | Keep; one component, horizontal |
| Data table | Tabs, search, status badges, row actions | Keep; one `DataTable` with defined states |
| Split form + list | Form left, list right (customer, production) | Keep; 5/7 column split |
| Right rail | “Tindak lanjut” panel on hubs | Keep; 8/4 split, stacks below 1280 |
| Confirmation dialog | Logout, delete, reject | Keep; one `Dialog` with destructive variant |
| Document preview | Invoice/report/GRN preview | Keep; add a print specification |

## Component Inventory

Status values: **Exists** (present and usable), **Modify** (present but
inconsistent), **New** (not in the file).

| Component | Status | Evidence in Figma | Notes |
|---|---|---|---|
| App shell | Modify | Two shells: 200/1016 and 288/1568 | One shell at 200, max content 1440 |
| Sidebar | Modify | 200px module nav, 288px hub nav | Same width everywhere; module group inside |
| Page header | Exists | Breadcrumb, title, actor line | Standardise 20/28 title |
| Breadcrumb | Exists | `Siklus / UC-xx` | Keep one separator style |
| Stat card | Exists | 3-up summary cards | 24/32 tabular value |
| Process stepper | Exists | 3–4 numbered steps | Active/completed/disabled states |
| Data table | Exists | Orders, PO, SPK, customers | Add loading/empty/error and sticky header |
| Status badge | Exists | 6+ colour pairs, 4 fail AA | One badge with 5 status tokens |
| Tabs | Exists | “Semua / Perlu Verifikasi” | Keep; underline variant only |
| Search input | Exists | Table search | Debounce 300ms, clear button |
| Button | Exists | Orange primary, white secondary | One primary per screen; ink text on orange |
| Input / Select | Modify | 49 default-named component sets | One `FormField` wrapper; native select ≤15 options |
| Form field | Modify | Labels above, inline errors | Required mark, help text, error link |
| Dialog | Exists | Logout, reject, add employee | 480 confirm / 640 form; focus trap |
| Right rail | Exists | “Tindak lanjut” | Collapses below main at <1280 |
| Toast | New | Not designed | For saved/posted/payment feedback |
| Empty state | New | One text line only | Title + body + action verb |
| Pagination | Exists | “Menampilkan 1–3 dari 3” | Add page size and range |
| Status timeline | New | History exists in data, not in UI | Document history with actor + time |
| Print layout | New | Preview frames only | A4, 12mm margin, black on white |
| Money | New | Raw numbers in tables | `Intl.NumberFormat('id-ID')`, tabular |

## Key Interactions

- **Create/edit:** split view; save returns to the list with a toast and a
  brief highlight on the saved row. Long forms validate on blur and on submit;
  the first error receives focus.
- **Approve/reject:** dialog with an optional note (required for rejection);
  the status badge updates immediately and a timeline entry is written.
- **Post journal:** explicit, irreversible action with a confirmation that
  names the amount and period. Never auto-post from a list row.
- **Row actions:** `Lihat` is the default click; `Ubah` and destructive actions
  live in a row menu. Destructive actions require a dialog that names the
  consequence.
- **Search/filter:** 300ms debounce; filters persist in the URL so a shared link
  reproduces the view.
- **Print:** opens a print preview in a new tab; the A4 layout is part of the
  component, not a browser afterthought.
- **Keyboard:** visual order equals tab order; `Enter` submits the focused form;
  `Esc` closes non-destructive dialogs; dialogs trap focus and return it to the
  trigger.
- **Motion:** state transitions only (hover, focus, open/close). No page-load
  choreography.

## Responsive Behavior

| Range | Behavior |
|---|---|
| ≥1600px | Content max 1440, centred inside the work area; sidebar fixed |
| 1440–1599px | Content fills, max 1440; 32px page padding |
| 1280–1439px | Content fills; 12-col grid; stat cards stay 3-up; right rail stays 4 cols |
| <1280px | Unsupported for v1; layout keeps a 1280 min-width and scrolls horizontally. No mobile redesign |

No hamburger, no bottom tabs, no mobile tables. A future mobile surface (e.g.
warehouse receiving) would be a separate design effort.

## Accessibility Requirements

WCAG 2.2 AA is the floor, not a stretch goal.

- Body text ≥ 4.5:1; large text ≥ 3:1; UI component boundaries ≥ 3:1.
- The primary button uses ink text on orange (6.11:1), not white (2.53:1).
- Muted text is `#6B7385` (4.76:1 on white), not `#8490A2` (3.23:1).
- Status badges use the AA-safe pairs in `DESIGN_TOKENS.md`.
- Visible focus: 2px ring, 2px offset; never `outline: none` without a replacement.
- All table actions reachable by keyboard; row menus are buttons, not divs.
- Form labels are associated; errors are linked with `aria-describedby`; required
  fields are marked in text, not color alone.
- Tables use `scope="col"`, a caption or `aria-label`, and `aria-sort` on
  sortable headers.
- Status is never communicated by color alone; the badge always contains text.
- `prefers-reduced-motion` removes transitions.
- Icon buttons have accessible names; icons are not the only label for a
  primary action.

## Localization

- UI language: **Indonesian**. Code identifiers and commits remain English.
- Locale: `id-ID`; timezone `Asia/Jakarta`.
- Currency: `Rp` prefix, dot thousands, comma decimals. Tables show full values
  (`Rp 12.850.000`); summary cards may abbreviate (`Rp 12,85 M`) with the full
  value in a title/tooltip.
- Dates: display `02 Nov 2026`; inputs and API use `YYYY-MM-DD`.
- Negative amounts: parentheses in ledgers and financial reports
  (`(Rp 1.250.000)`); minus sign in inline diffs.
- Text direction: **LTR only**; RTL is out of scope for v1.
- Allow 30–40% expansion for translated labels; do not fix button widths to
  Indonesian string lengths.

## Assumptions To Confirm During FND-007

- Desktop-only for v1; no mobile or tablet layout.
- Light mode only; dark mode is out of scope.
- Print uses the browser's print pipeline with a dedicated A4 stylesheet; a
  server-side PDF service is not required for v1.
- The 12 staff roles are the only accounts; customers and suppliers never log in.
- The app is used on a LAN/office connection; no offline mode.

## Out of Scope

- Customer, supplier, or employee self-service portals.
- Mobile app, tablet layout, dark mode.
- Multi-company or multi-currency.
- e-Faktur / tax authority integration.
- E-signature and document scanning.
- Real-time collaboration, presence, or chat.
- Marketing pages beyond the login screen.
