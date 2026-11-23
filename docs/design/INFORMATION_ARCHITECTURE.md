# Information Architecture: Lionmesh SIA

> **Snapshot v0.1 (2026-11-17).** The Figma source was rebuilt on 2026-11-23
> ("SIA Liomesh (Copy)", key `VS9PagBMlKi2McPPfCdsRV`, 371 screens). Values below
> are still the locked v0.1 values. Differences between this document and the v2
> file are listed in `FIGMA_V2_DELTAS.md`; do not silently adopt either side.

## Site Map

```
/login
/lupa-kata-sandi

/                                   Dashboard Umum
/laporan                            Laporan lintas siklus
/pengaturan                         Pengaturan (peran, COA, pajak, penomoran)

/pendapatan                         Hub Siklus Pendapatan
  /pelanggan                        Data Pelanggan
  /pesanan                          Pesanan Pelanggan
  /pesanan/[nomor]                  Detail Pesanan
  /verifikasi                       Verifikasi Pesanan
  /ketersediaan                     Ketersediaan Barang
  /pengiriman                       Pengiriman
  /faktur                           Faktur Penjualan
  /piutang                          Piutang Pelanggan
  /pembayaran                       Pembayaran Pelanggan
  /jurnal                           Jurnal Penjualan dan Kas
  /laporan                          Laporan Pendapatan

/pengeluaran                        Hub Siklus Pengeluaran
  /pemasok                          Data Pemasok
  /permintaan                       Permintaan Pembelian
  /po                               Purchase Order
  /penerimaan                       Penerimaan Barang
  /faktur                           Faktur Pemasok
  /pembayaran                       Pembayaran Pemasok
  /laporan                          Laporan Pembelian dan Utang

/produksi                           Hub Siklus Produksi
  /perencanaan                      Rencana Produksi
  /perintah                         Perintah Produksi (SPK)
  /bahan                            Permintaan Bahan
  /penerimaan                       Penerimaan Bahan
  /pemakaian                        Pemakaian Bahan
  /hasil                            Hasil Produksi
  /qc                               Pemeriksaan Kualitas
  /biaya                            Biaya dan Persediaan
  /laporan                          Laporan Produksi

/penggajian                         Hub Siklus Penggajian
  /karyawan                         Data Karyawan
  /presensi                         Presensi dan Lembur
  /rekap                            Rekap Absensi
  /periode                          Periode Gaji
  /hitung                           Hitung Gaji
  /daftar-gaji                      Daftar Gaji
  /pembayaran                       Pembayaran Gaji
  /laporan                          Laporan Penggajian
```

Routes are proposed; module owners may adjust a slug, but the hierarchy and the
navigation model below are fixed. No screen may live outside its cycle’s branch.

## Usage Assumptions

- **80% of time:** the cycle list and detail screens (orders, POs, SPKs, payroll
  runs), not the dashboard. The dashboard is a launch pad and a follow-up
  surface; it must not become the only way to reach work.
- **Entry points:** login → dashboard; a direct link to a cycle; a document
  number in the URL from a shared link or a printed document.
- **Maximum depth:** two levels below a cycle (hub → list → detail). A third
  level is a dialog or a tab, not another page.
- **Growing content:** documents grow every month. Lists are paginated and
  filterable; history is append-only; nothing is deleted.

## Navigation Model

**Primary (sidebar, always visible)**

1. Dashboard Umum
2. Siklus Pendapatan
3. Siklus Pengeluaran
4. Siklus Produksi
5. Siklus Penggajian
6. Laporan

**Secondary (inside the sidebar, under the active cycle)**

A contextual group with up to eight items, e.g. `MODUL PRODUKSI` →
Perencanaan & bahan, Pembelian & penerimaan, Produksi & kualitas, Biaya &
laporan. The group appears only when the user is inside that cycle; it does not
replace the primary items.

**Utility (sidebar footer)**

- User identity: name, role, company.
- `Keluar dari SIA` with a confirmation dialog.
- Help link (`Hubungi IT`) on auth screens only.

**Breadcrumb (page header)**

`Siklus / Layar` on module screens; `Dashboard` on the root. The breadcrumb is
navigation, not decoration: each segment is a link.

**No global top bar.** Page-level actions live in the page header. A global
search is not in v1; table search is local to each list.

## Content Hierarchy

### Hub (cycle landing)

1. Breadcrumb + page title + one-line purpose.
2. Three stat cards: volume, value, and the item that needs attention.
3. Process stepper (3–4 steps) linking to the next working screen.
4. Main table with tabs, search, status badges, row actions.
5. Right rail `Tindak lanjut`: approvals and overdue items.
6. System note (period, last sync) at the bottom.

### List

1. Page title + primary action (`+ Pesanan Baru`).
2. Tabs for status groups (`Semua`, `Perlu Verifikasi`).
3. Search and filters (period, status, counterparty).
4. Data table: 8–10 columns maximum; numbers right-aligned; status as a badge.
5. Pagination with range and page size.

### Form (create/edit)

1. Page title + actor line (“Aktor: Penjualan”).
2. Form sections with short, verb-led headings.
3. Two-column grid for short fields; one column for long text and line items.
4. Inline help under the field; errors replace help, never both.
5. Sticky footer: `Batal` (secondary) and `Simpan` (primary).

### Detail

1. Title + document number + status badge.
2. Summary strip: counterparty, date, total, term.
3. Tabs: `Rincian`, `Riwayat`, `Jurnal` (if posted).
4. Primary action depends on state (verify, approve, receive, post, pay).
5. Status timeline in the right rail on wide screens, below on narrow.

### Report

1. Title + period selector + `Ekspor` / `Cetak`.
2. Summary row (3–4 figures).
3. Table or chart; table first, chart optional.
4. Footnote: source, period, generated at.

## User Flows

### Pendapatan

```
Pesanan (Menunggu verifikasi)
  → Verifikasi ──┬─→ Siap produksi → Ketersediaan → Pengiriman
                 └─→ Ditolak (reason required)
Pengiriman → Faktur → Piutang → Pembayaran → Jurnal
```

Decision points:
- Credit limit: if the customer is over the limit, block and offer a supervisor
  override with a reason.
- Stock availability: if stock is short, route to production; do not silently
  promise a delivery date.
- Invoice: only delivered quantities can be invoiced.

### Pengeluaran

```
Permintaan Pembelian (Diajukan)
  → Persetujuan ──┬─→ Disetujui → PO → Penerimaan → Faktur Pemasok
                  └─→ Ditolak (reason required)
Faktur Pemasok → Pencocokan 3-way → Pembayaran → Jurnal
```

Decision points:
- Approval threshold: below the threshold, the supervisor approves; above it,
  management approves.
- Supplier term: mandatory; no PO without a term.
- 3-way match: quantity/price tolerance is per supplier; a mismatch blocks
  payment until resolved.

### Produksi

```
Rencana Produksi → Kebutuhan Bahan → Permintaan Bahan → Persetujuan Pembelian
→ PO → Penerimaan Bahan → Pemakaian Bahan → Hasil Produksi
→ Pemeriksaan Kualitas ──┬─→ Diterima → Penerimaan Barang Jadi
                         └─→ Ditolak (tolerance rules)
→ Biaya dan Persediaan → Jurnal
```

Decision points:
- BOM: one level, versioned; a production order pins a version.
- Reject tolerance: within tolerance → rework; above → reject with reason.
- Overhead: predetermined DLH rate; the variance is reported, not hidden.

### Penggajian

```
Data Karyawan → Periode Gaji → Presensi dan Lembur → Rekap Absensi
→ Hitung Gaji → Daftar Gaji → Pembayaran → Slip Gaji + Jurnal
```

Decision points:
- Rate tables: versioned; a closed period never changes when a rate changes.
- Attendance: valid vs. needs correction; corrections are logged.
- Payment: approved payroll only; the bank file and the journal are produced
  from the same run.

## Naming Conventions

One word everywhere. UI labels, routes, reports, and journal descriptions use the
same term.

| Concept | Use | Do not use |
|---|---|---|
| Revenue cycle | **Pendapatan** | Penjualan (as the cycle name) |
| Expenditure cycle | **Pengeluaran** | Pembelian (as the cycle name) |
| Production cycle | **Produksi** | Manufaktur |
| Payroll cycle | **Penggajian** | Payroll (in UI) |
| Customer order | **Pesanan** | Order, Sales Order |
| Delivery note | **Surat Jalan** | DO, Delivery Order |
| Sales invoice | **Faktur Penjualan** | Invoice |
| Supplier invoice | **Faktur Pemasok** | Tagihan |
| Purchase request | **Permintaan Pembelian** | PR (in UI) |
| Purchase order | **Purchase Order (PO)** | PO (first mention spelled out) |
| Goods receipt | **Penerimaan Barang** | GRN (in UI) |
| Work order | **Perintah Produksi (SPK)** | SPK only on first mention |
| Bill of materials | **Kebutuhan Bahan** | BOM (in UI) |
| Accounts receivable | **Piutang** | AR |
| Accounts payable | **Utang** | AP |
| General ledger | **Buku Besar** | GL |
| Journal entry | **Jurnal** | Journal |
| Chart of accounts | **Daftar Akun (COA)** | COA only |
| Stock movement | **Mutasi Stok** | Pergerakan stok |
| Stock balance | **Saldo Stok** | Persediaan (for the balance) |
| Moving average | **Harga Rata-rata** | Average cost |
| Payroll slip | **Slip Gaji** | Payslip |
| Period close | **Tutup Periode** | Closing |

Capitalisation: sentence case for page titles and buttons (`Simpan`, not
`SIMPAN`); uppercase only for table headers and small section labels.

## Component Reuse Map

| Page type | Shell | Header | Stat cards | Stepper | Table | Split form | Right rail | Dialog | Toast |
|---|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | — | — |
| Cycle hub | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — |
| List | ✓ | ✓ | — | — | ✓ | — | — | ✓ | ✓ |
| Form | ✓ | ✓ | — | — | — | ✓ | — | ✓ | ✓ |
| Detail | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ | ✓ |
| Report | ✓ | ✓ | ✓ | — | ✓ | — | — | — | — |
| Auth | — | — | — | — | — | ✓ | — | — | ✓ |

One component per row; variants are props, not copies. No screen builds its own
button, input, badge, or table.

## Content Growth Plan

- **Tables:** server-side pagination, default 25 rows, options 25/50/100. Never
  render an unbounded list.
- **Search:** debounced 300ms; searches document number, counterparty, and
  product name. Results are capped; the empty state names the query.
- **Filters:** period, status, counterparty, and (where relevant) warehouse or
  production line. Filters live in query parameters.
- **Archive:** documents are never deleted; status filters and a date range
  expose older records. Audit history is append-only.
- **Exports:** CSV for tables up to 5,000 rows; larger exports are queued and
  delivered as a file, not held in the browser.
- **Reports:** default to the current month; the period selector supports month,
  quarter, and custom range.
- **Document numbers:** monotonic per type and year; the number is immutable
  after posting.

## URL Strategy

- Lowercase, kebab-case, Indonesian slugs: `/pendapatan/daftar-gaji` is wrong
  (that belongs to `/penggajian`), `/penggajian/daftar-gaji` is right.
- Document detail uses the document number, which is unique and stable:
  `/pendapatan/pesanan/SO-1026-0186`.
- Filters and pagination are query parameters: `?status=menunggu&page=2`.
- No trailing slash. No verbs in paths (`/approve` is an action, not a page).
- Auth routes are the only routes outside the app shell.
- A route that does not exist returns the nearest list with a toast, not a
  blank page.
