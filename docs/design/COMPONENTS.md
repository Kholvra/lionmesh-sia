# Components: Lionmesh SIA

One component per job. Variants are props, not copies. Every component uses the
tokens in `DESIGN_TOKENS.md`; no raw hex or arbitrary pixel values.

Status legend: **Exists** (in Figma and usable), **Modify** (in Figma but
inconsistent), **New** (not in Figma).

---

## 1. AppShell — Modify

**Purpose:** The frame around every authenticated screen. Owns the sidebar, the
work area, and the page scroll.

**Anatomy**
- Fixed sidebar, 200px.
- Work area: starts at x=232 (32px gap), max content 1440, 32px page padding.
- Optional right rail inside the work area, not outside it.

**Rules**
- One shell for all cycles. No second shell for hubs or payroll.
- The sidebar does not collapse in v1.
- The work area scrolls; the sidebar stays fixed.
- At ≥1600, the content is centred inside the work area.
- Below 1280, keep a 1280 min-width and allow horizontal scroll; do not reflow
  into a mobile layout.

**Accessibility**
- `<nav>` landmark for the sidebar, `<main>` for the work area.
- Skip link “Lewati ke konten” as the first focusable element.

---

## 2. Sidebar — Modify

**Purpose:** Primary and contextual navigation.

**Anatomy**
- Brand block: `Lionmesh` wordmark, `SISTEM INFORMASI AKUNTANSI` caption.
- Primary menu: Dashboard, four cycles, Laporan.
- Contextual group (only inside a cycle): up to eight items, label in
  `text-caption` uppercase.
- Footer: user name, role, company, `Keluar dari SIA`.

**Variants**
- Item: default, hover, active, focus.
- Group: collapsed (not in v1) / expanded.

**Sizes**
- Width 200px; item height 40px; icon 16px; label `text-body-sm` 13/20.
- Horizontal padding 12px; icon-to-label gap 8px.

**Rules**
- Active item: `brand-500` background, `ink-900` text, 8px radius.
- Hover: `sidebar-hover` background, white text.
- Default: `sidebar-text`; group labels: `sidebar-muted`.
- The active cycle stays highlighted on every child screen.
- Never more than one active item.

**Accessibility**
- `<nav aria-label="Navigasi utama">`.
- `aria-current="page"` on the active item.
- Focus ring uses `brand-500` on the dark surface.

---

## 3. PageHeader — Exists

**Purpose:** Orientation and the single primary action.

**Anatomy**
- Breadcrumb (optional on root).
- Title, 20/28/700.
- Subtitle or actor line, 13/20 muted (“Aktor: Penjualan”).
- Actions, right-aligned: one primary, secondary as ghost or menu.

**Rules**
- 32px below the header before content.
- Title never wraps beyond two lines at 1280.
- One primary action per screen. If there are two, one is wrong.
- Document number may sit beside the title as `text-body-sm` tabular.

**Accessibility**
- `<h1>` once per page.
- The primary action is a real button, not a link styled as one.

---

## 4. Breadcrumb — Exists

**Purpose:** Show location and allow upward navigation.

**Anatomy**
- `Siklus / Layar`, separator `/`, current page not linked.

**Rules**
- 12/16, muted; current page `text-secondary`.
- Maximum three levels.
- Truncate long document numbers in the middle, never the cycle name.

**Accessibility**
- `<nav aria-label="Breadcrumb">` with an ordered list.
- `aria-current="page"` on the last item.

---

## 5. Button — Exists

**Purpose:** Trigger an action.

**Variants**
| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `brand-500` | `ink-900` | none | The one main action |
| Secondary | white | `ink-800` | `border-input` | Cancel, alternative |
| Ghost | transparent | `ink-800` | none | Low-emphasis actions |
| Danger | white | `#B42318` | `#FECDCA` | Destructive, usually in a dialog |
| Link | transparent | `brand-700` | none | Inline navigation |

**Sizes**
| Size | Height | Padding x | Text | Icon |
|---|---|---|---|---|
| sm | 32 | 12 | 12/16 600 | 14 |
| md | 36 | 16 | 14/20 600 | 16 |
| lg | 40 | 20 | 14/20 600 | 16 |

**States**
- Default, hover (`brand-600` for primary; `ink-50` for secondary), active
  (pressed with a 1px `brand-700` inset border), focus (2px ring), disabled
  (`ink-50` bg, `ink-300` text), loading (spinner + label, width locked).

**Rules**
- Radius 8. One primary per screen.
- Icon + label gap 8; icon-only buttons are `IconButton`.
- Loading keeps the label visible; never a spinner alone.
- Destructive actions name the consequence in the dialog, not the button label.

**Accessibility**
- 36px height is acceptable for mouse; 44px minimum for icon-only.
- Focus visible on all variants.
- Disabled is not a substitute for validation.

---

## 6. IconButton — New

**Purpose:** A compact action with an icon only (close, search, row menu).

**Anatomy:** 44×44 hit area, 20px icon, 8px radius, transparent background.

**Variants:** ghost, subtle (`ink-50` background), danger.

**Rules**
- Must have an accessible name (`aria-label`).
- Never the only way to perform a primary action.
- Tooltip on hover for unfamiliar icons.

---

## 7. Input — Modify

**Purpose:** Single-line text, number, currency, or date entry.

**Anatomy**
- Label (via `FormField`), control, optional prefix/suffix, help or error.
- Height 36; padding 0 12; radius 8; border 1px `border-input`.
- Text 14/20; placeholder `ink-400`; entered text `ink-800`.

**Variants**
- Text, number, currency, date, password (with reveal), search (via
  `SearchInput`).
- Prefix: `Rp` as a fixed addon, not inside the value.
- Suffix: unit (`kg`, `ton`), read-only.

**States**
- Default, hover (border `ink-400`), focus (2px ring, border `ink-900`),
  filled, error (border danger, message below), disabled (`ink-50` bg),
  read-only (no border, `ink-50` bg).

**Rules**
- Labels above, never placeholders as labels.
- Numbers: right-aligned, tabular; currency without decimals unless needed.
- Dates: text input with a calendar picker; display `YYYY-MM-DD` in the field.
- Do not use a slider for precise values.
- Max width 640 for long text; short fields use the 2-column grid.

**Accessibility**
- Label associated with `for`/`id`.
- Error linked with `aria-describedby`; `aria-invalid` when invalid.
- Required marked with `*` and `required`.

---

## 8. Select — Modify

**Purpose:** Choose one value from a constrained list.

**Variants**
- Native select for 2–15 options.
- Combobox with search for >15 options (customers, suppliers, products,
  accounts).
- Multi-select is not in v1; use checkboxes in a list for bulk selection.

**Anatomy**
- Height 36; padding 0 12; chevron 16 on the right; menu with `shadow-md`,
  radius 8, max-height 320, 8px padding.
- Option height 36; selected option `brand-50` with a check.

**Rules**
- Never free text where the domain is constrained.
- The selected value is visible without opening the menu.
- A long list opens with the search focused.
- Empty state inside the menu: “Tidak ada hasil”.

**Accessibility**
- Native select is preferred for simplicity and screen readers.
- Combobox: `role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-activedescendant`; arrow keys move, Enter selects, Esc closes.

---

## 9. Checkbox And Radio — Modify

**Purpose:** Selection (checkbox) and mutually exclusive choice (radio).

**Anatomy:** 18px control, 4px radius (checkbox), 44px row height, label 14/20,
8px gap.

**States:** unchecked, checked, indeterminate (checkbox only), hover, focus,
disabled, error.

**Rules**
- Checkbox for multiple selection; radio for 2–4 exclusive options.
- A radio cannot be unselected; provide a neutral option or a “Hapus pilihan”
  action when the field is optional.
- Select-all uses the indeterminate state when children are partial.
- Toggle is not a checkbox; do not use it for form submission.

**Accessibility**
- Native input element, visible label, 44px hit area.
- Group with `<fieldset>` and `<legend>`.

---

## 10. FormField — Modify

**Purpose:** The wrapper that makes labels, help, and errors consistent.

**Anatomy**
- Label 12/16 600, required `*` in danger.
- Control.
- Help 12/16 `ink-400`, or error 12/16 danger with an icon.
- Gap: 8px label→control; 8px control→help.

**Rules**
- Error replaces help; never show both.
- Error copy names the problem and the recovery: “Tanggal dibutuhkan wajib
  diisi. Pilih tanggal sebelum menyimpan.”
- Required fields are marked; optional fields are not labelled “opsional”
  unless most fields are optional.
- Group related fields with a section heading 16/24 600.

**Accessibility**
- `aria-describedby` points to help or error.
- The first invalid field receives focus on submit.

---

## 11. SearchInput — Exists

**Purpose:** Filter a table or list.

**Anatomy:** 36px height, search icon 16 left, clear button 16 right, input
padding 36 left / 32 right.

**Rules**
- Debounce 300ms; search on Enter is optional.
- The clear button appears only when there is a value.
- Placeholder names the scope: “Cari nomor atau pelanggan”.
- The empty state echoes the query.

**Accessibility**
- `type="search"`, label via `aria-label` or a visible label.
- Clear button has an accessible name.

---

## 12. Tabs — Exists

**Purpose:** Switch between equal sibling views of the same data.

**Anatomy:** 40px height, label 14/20 600, 24px gap, 2px active underline in
`brand-500`.

**Variants:** underline (default), pill (only for filters, not navigation).

**Rules**
- Tabs do not nest. If a second level is needed, use a filter or a segmented
  control.
- The active tab is reflected in the URL.
- Counts in tabs are optional and use `text-caption`.

**Accessibility**
- `role="tablist"`, `role="tab"`, `aria-selected`, arrow-key navigation.
- The panel is labelled by the tab.

---

## 13. Badge — Exists

**Purpose:** A read-only status or category label.

**Anatomy:** 12/16 600, padding 4/8, radius 4, optional 6px dot.

**Variants:** success, warning, danger, info, neutral.

**Rules**
- Always contains text; color is reinforcement.
- Use the status pairs from `DESIGN_TOKENS.md`; no other combinations.
- A pill (`radius-full`) is reserved for counts, not statuses.
- One badge per row cell; if two statuses matter, the row is wrong.

**Accessibility**
- Text is readable at 12px; contrast is at least 4.5:1.
- Do not rely on the dot alone.

---

## 14. StatCard — Exists

**Purpose:** A single summary figure on a hub or dashboard.

**Anatomy**
- White surface, 1px `border-subtle`, 12px radius, 20px padding.
- Label 12/16 600 muted.
- Value 24/32 700 tabular.
- Delta or context 13/20.
- Optional status badge top-right.
- Optional footer link “Buka siklus →” 13/20 600 `brand-700`.

**Rules**
- Three cards per row at 1280; 4-column grid each.
- One number per card. If there are two, split the card.
- Full value in a tooltip when abbreviated.
- No gradients, no icons as decoration; an icon is allowed only if it identifies
  the cycle.

---

## 15. DataTable — Exists

**Purpose:** The primary data surface.

**Anatomy**
- Header: 40px, `bg-subtle`, `text-caption` uppercase, sticky.
- Rows: 48px, 1px `border-subtle`, hover `bg-subtle`, selected `bg-selected`.
- Cells: 12px vertical / 16px horizontal padding.
- Columns: text left, numbers right, status/actions right.
- Footer: range + pagination.

**Variants**
- Default, compact (40px rows, for dense reports), selectable (checkbox column).
- Sortable headers (one column at a time in v1).

**States**
- Loading: five skeleton rows.
- Empty: `EmptyState` inside the table body.
- Error: one row with the message and `Coba lagi`.
- Partial: a banner above the table when some data could not load.

**Rules**
- Maximum 10 columns at 1280; beyond that, hide low-priority columns or use a
  detail view.
- No nested cards inside cells.
- Row click opens the detail; the first cell is also a link.
- Actions: one visible `Lihat`, the rest in a row menu.
- Numbers use `Money` or tabular formatting.
- Sticky header on scroll; no horizontal scroll for the primary table at 1280.

**Accessibility**
- `<table>` with `<caption>` or `aria-label`.
- `scope="col"`, `aria-sort` on sortable headers.
- Row menu is a button with `aria-haspopup="menu"`.
- Keyboard: arrow keys move between cells only if the table is a grid; otherwise
  Tab reaches the row actions.

---

## 16. Pagination — Exists

**Purpose:** Move through a large result set.

**Anatomy:** range text (“Menampilkan 1–25 dari 240”), page size select
(25/50/100), previous/next buttons, current page.

**Rules**
- Server-side pagination; never render all rows.
- Previous/next disabled at the ends.
- The range uses the same number format as the table.
- Filters reset to page 1.

**Accessibility**
- `<nav aria-label="Pagination">`.
- Current page has `aria-current="page"`.
- Buttons have accessible names, not just chevrons.

---

## 17. Dialog — Exists

**Purpose:** A decision that needs focus.

**Variants**
- Confirm: 480px, title 16/24 600, body 14/20, footer with `Batal` and the
  action.
- Form: 640px, scrollable body, sticky footer.
- Destructive: same anatomy, primary becomes danger; the body names the
  consequence.

**Rules**
- Use a dialog for consequential, critical, or urgent decisions. Inline errors
  for everything else.
- Overlay `rgba(20,27,36,0.55)`.
- Header has a close icon; Esc closes non-destructive dialogs.
- Footer: cancel left, primary right. One primary.
- Never stack dialogs.

**Accessibility**
- Focus trap; focus the first field or the least destructive action.
- `role="dialog"`, `aria-modal="true"`, labelled by the title.
- Return focus to the trigger on close.

---

## 18. Toast — New

**Purpose:** Confirm a completed action without blocking the next one.

**Anatomy:** 360px, white, 1px border, `shadow-md`, radius 8, padding 12/16,
status icon, title 13/20 600, optional body 12/16, close.

**Variants:** success, warning, danger, info.

**Rules**
- Auto-dismiss after 4s; pause on hover/focus.
- One toast at a time; a new one replaces the old.
- Do not use a toast for an error that needs a decision; use a dialog or inline
  error.
- Copy is brief and past tense: “Pesanan disimpan.”

**Accessibility**
- `role="status"` for success/info, `role="alert"` for danger.
- Do not steal focus.

---

## 19. EmptyState — New

**Purpose:** Explain why a surface is empty and what to do next.

**Anatomy:** Centered, max 360px, 40px line icon, title 16/24 600, body 13/20
muted, one action.

**Variants**
- First use: “Belum ada pesanan” + “Buat pesanan pertama” + primary action.
- No results: “Tidak ada hasil untuk ‘baja’” + clear filter.
- No permission: “Akun Anda tidak memiliki akses ke siklus ini” + contact IT.
- Error: “Data gagal dimuat” + `Coba lagi`.

**Rules**
- Every empty state has a title, a reason, and a next step; no “OK”.
- Do not use illustration on data surfaces; an icon is enough.

---

## 20. ProcessStepper — Exists

**Purpose:** Show where a document is in its lifecycle.

**Anatomy:** Horizontal; 24px circle, number or check, label 13/20, 1px
connector.

**States**
- Completed: success background, check, label `ink-800`.
- Current: `brand-500` background, `ink-900` number, label 600.
- Upcoming: `ink-50` background, `ink-400` number, label muted.
- Rejected: danger dot/label on the step where it stopped.

**Rules**
- Three to five steps; more belongs in a timeline.
- Completed and current steps are links; upcoming steps are not.
- One stepper per page, directly under the header.

**Accessibility**
- `<ol>` with `aria-current="step"` on the current step.
- Do not rely on color; the number/check and label carry the state.

---

## 21. StatusTimeline — New

**Purpose:** The audit history of a document.

**Anatomy:** Vertical 1px line, 8px dot, status 13/20 600, actor + time 12/16
muted, optional note 13/20.

**Rules**
- Newest first; the current status is at the top.
- Every entry names the actor and the time.
- Rejections include the reason.
- The timeline is read-only.

**Accessibility**
- `<ol>`; each entry is a list item with a heading.
- Time uses `<time datetime="...">`.

---

## 22. Money — New

**Purpose:** One formatting component for all currency values.

**Variants**
- Full: `Rp 12.850.000` (tables, documents).
- Compact: `Rp 12,85 M` (stat cards; full value in a tooltip).
- Negative: `(Rp 1.250.000)` in ledgers; `-Rp 250.000` in diffs.
- Input: raw number with an `Rp` addon; no formatting inside the field.

**Rules**
- Use `Intl.NumberFormat('id-ID')`; never hand-format.
- Right-aligned in tables; tabular numerals.
- Do not mix compact and full in the same column.
- Zero is `Rp 0`; empty is `—`, not `Rp 0`.

---

## 23. PrintLayout — New

**Purpose:** A4 output for invoices, delivery notes, purchase orders, and
payslips.

**Anatomy**
- A4 210×297mm, 12mm margins.
- Header: logo 24mm, company name, address, document title.
- Meta block: document number, date, counterparty, term.
- Body table: 8–10 columns, 12/16, black on white.
- Footer: page `x / y`, generated timestamp, signature blocks.

**Rules**
- Black on white; no background fills except a 4% gray table header.
- Numbers right-aligned, tabular.
- The document number is repeated in the footer.
- Print CSS hides navigation, actions, and toasts.
- A4 only; no Letter.

**Accessibility**
- Print output is also a readable PDF: headings in order, table headers marked.
- Do not encode meaning in color; use text.
