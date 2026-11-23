<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines — Lionmesh SIA

## Project Overview

Internal accounting information system (SIA) for PT Lionmesh Prima Tbk. One Next.js 16 App Router application, one Supabase/PostgreSQL project, four business cycles built in parallel: **Pendapatan, Pengeluaran, Produksi, Penggajian**. Four beginner teams work with AI agents; the tech lead owns the shared foundation. This is a production system: money and stock must stay correct, not merely render.

The repository is the source of truth. No feature exists outside the backlog.

## Setup Commands

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local     # once; fill Supabase URL + publishable key
pnpm db:setup                  # Docker must be running; applies migrations, resets
pnpm db:seed                   # only after a reset
pnpm dev                       # http://localhost:3000
pnpm verify                    # lint + typecheck + arch:check + build
```

Supporting commands: `pnpm db:reset`, `pnpm db:stop`, `pnpm check:migrations`, `pnpm lint`, `pnpm typecheck`, `pnpm arch:check`, `pnpm build`.

`pnpm build` reads Supabase environment variables. CI injects placeholders; locally use `.env.local` copied from `.env.example`. Never hardcode values to make the build pass.

## Read This First: Which Cycle Am I In?

Every task starts with a backlog item ID. The prefix tells you the cycle, the folder, and the routes you may touch.

| Prefix | Cycle | Module folder | Routes | Epic file |
|---|---|---|---|---|
| `FND-###` | Foundation (tech lead) | `src/core/*`, `src/components/ui/*`, `supabase/*` | `/pengaturan` | `EPIC-FND.md` |
| `PD-###` | Pendapatan | `src/modules/pendapatan/` | `/pendapatan/**` | `EPIC-PD.md` |
| `PG-###` | Pengeluaran | `src/modules/pengeluaran/` | `/pengeluaran/**` | `EPIC-PG.md` |
| `PR-###` | Produksi | `src/modules/produksi/` | `/produksi/**` | `EPIC-PR.md` |
| `GJ-###` | Penggajian | `src/modules/penggajian/` | `/penggajian/**` | `EPIC-GJ.md` |
| `C-###` | Core lintas siklus | `src/core/*` | `/laporan`, `/pengaturan` | `EPIC-CORE.md` |
| `INT-###` | Integration | cross-cutting | all | `EPIC-INT.md` |

`docs/product/backlog.md` is the index. `docs/product/items/<ID>-<slug>/` is the item package. If the ID is not in the backlog, **stop** — the task does not exist yet.

| Question | Authoritative file |
|---|---|
| What should it do? | `01-requirement.md` |
| How is it proven? | `02-acceptance-criteria.md` |
| May I start? | `03-readiness-review.md` + status in `backlog.md` |
| How should it be built? | `04-design-contract.md` + `ARCH-001` |
| What was measured? | `05-evidence.md` |
| Why was this decided? | `docs/product/decisions.md` |
| How should it look? | `docs/design/README.md` |
| Where are the boundaries? | `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` |

## Task Intake Protocol

Run this before the first edit and report the result to the user.

1. **Name the item.** Confirm the ID exists in `docs/product/backlog.md`.
2. **Check status and dependencies.** The item must be `ready` or `in progress`. Every `depends on` item must be `done`. Do not start an `idea` item.
3. **Check the foundation gate.** No module item may start before `FND-001`–`FND-006` are `done`. `FND-007` (UI kit) and `FND-008` (seed) may finish in parallel; an item that adds a new UI primitive waits for `FND-007` (see `docs/product/backlog.md`).
4. **Read the package in order:** `00` → `01` → `02` → `03` → `04`. `05` is written at the end.
5. **State the plan before coding:** item ID, cycle, files to touch, core services to call, and the AC you will prove.
6. **Touch only your cycle's folders.** `src/modules/<cycle>/` plus its routes in `src/app/(app)/<cycle>/`.
7. **Stop on missing inputs.** If the item needs a rule that is not written (COA, role matrix, threshold, numbering format), stop and ask; do not invent it.

Report format (fill before writing code):

```text
Item: PD-001
Cycle: Pendapatan
Allowed paths: src/modules/pendapatan/pelanggan/**, src/app/(app)/pendapatan/pelanggan/**
Core services: dokumen (numbering), ledger (none for master data)
AC to prove: AC-01, AC-03
```

## Non-negotiables

1. **One item, one branch, one cycle.** Never mix two backlog items or two cycles in one change.
2. **Never import across cycles.** `src/modules/pendapatan/**` must not import `src/modules/pengeluaran/**` (or any other cycle). Shared logic belongs in `src/core/`.
3. **Never write core-owned tables directly.** Journal rows, stock balances, document numbers, document status, and status history are written only by `src/core/*`. Call the service.
4. **Never create, renumber, or edit a migration.** Module teams submit DDL proposals; the tech lead assigns the number and merges.
5. **Never invent a business rule.** Missing account, threshold, role, or format means stop, not guess.
6. **Never hardcode a design value.** No raw hex, px, font size, or radius in components; use the tokens from `docs/design/DESIGN_TOKENS.md`.
7. **Never take identity from the client.** The actor comes from the Supabase session on the server, never from a hidden field or payload.
8. **Every write action validates on the server** with a schema before it reaches a service.
9. **No new dependency without tech lead approval.** Do not add a form, table, date, or state library because it is convenient.
10. **`pnpm verify` must pass before a PR.** If it fails, fix it; never disable the check.

## Language & Style

### Language split

The product speaks Indonesian; the engineering layer speaks English. Keep them apart instead of translating back and forth.

- **Chat replies:** Indonesian.
- **Code structure, technical identifiers, comments, commit messages, branch names, PR titles:** English.
- **UI copy, validation messages, report labels:** Indonesian.
- **Domain nouns in code (types, functions, tables, columns):** the canonical term from the glossary below. Never introduce a synonym.

Wrong:

```ts
type Customer = { id: string; name: string };        // “customer” is not the canonical term
const res = await supabase.from("customers")...      // table does not exist
```

Correct:

```ts
type Pelanggan = { id: string; nama: string };
const { data } = await supabase.from("pelanggan").select("id, nama");
```

### Canonical terminology

`FND-002` owns the actual table and column list. This table fixes the vocabulary every team must use; do not rename a term because a translation feels nicer.

**Identifier vs table name.** A canonical identifier is what code, types, functions, and UI labels use. A physical table name is fixed by the migration that creates it and is never renamed to match the vocabulary (`D-61`). Where the two differ, the note names the table.

| Concept | Canonical identifier | Note |
|---|---|---|
| Pelanggan | `pelanggan` | not `customer` |
| Pemasok | `pemasok` | not `supplier` |
| Pesanan pelanggan | `pesanan` | not `sales_order` |
| Permintaan pembelian | `permintaan_pembelian` | |
| Purchase order | `purchase_order` | table name is `po` (`C-013`, `D-61`) |
| Penerimaan barang | `penerimaan_barang` | table name is `penerimaan` (`C-013`, `D-61`) |
| Faktur | `faktur` | qualified by cycle when needed: `faktur_penjualan` |
| Piutang / utang | `piutang` / `utang` | |
| Pembayaran | `pembayaran` | the customer side only |
| Pembayaran pemasok | `pembayaran_pemasok` | table name is `pembayaran_supplier` (`PG-009`, `D-61`) |
| Invoice pemasok | `invoice_pemasok` | table name is `invoice_supplier` (`PG-008`, `D-61`) |
| Retur | `retur` | |
| Jurnal | `jurnal` | the approved API stays `postJournal()` |
| Buku besar | `buku_besar` | |
| Akun / COA | `akun` | |
| Saldo stok | `saldo_stok` | invariant name in `ARCH-001` |
| Mutasi stok | `mutasi_stok` | invariant name in `ARCH-001` |
| Harga rata-rata | `harga_rata` | |
| Gudang / produk / bahan | `gudang` / `produk` / `bahan` | |
| Bill of materials | `bill_of_materials` | UI may say “BOM” |
| Perintah produksi (SPK) | `perintah_produksi` | |
| Hasil produksi / QC | `hasil_produksi` / `quality_check` | |
| Karyawan / presensi / lembur | `karyawan` / `presensi` / `lembur` | |
| Periode gaji / slip gaji | `periode_gaji` / `slip_gaji` | |
| Pengadaan | `pengadaan` | core domain folder keeps this name |
| Nomor dokumen / status / riwayat | `nomor_dokumen` / `status` / `riwayat_status` | |
| Periode akuntansi | `periode_akuntansi` | |
| Konfigurasi pajak | `konfigurasi_pajak` | versioned master |

If a term is missing, use the exact wording of the backlog item and its requirement document. Do not create a second name.

### Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Route segment | kebab-case Indonesian | `app/(app)/pendapatan/pesanan/[nomor]/page.tsx` |
| Module folder | canonical cycle and feature nouns | `modules/pendapatan/pelanggan/` |
| Component file | kebab-case | `pelanggan-form.tsx` |
| Component export | PascalCase, named export | `export function PelangganForm()` |
| Server action file | `actions.ts` | one file per feature |
| Action function | English verb + canonical noun | `createPelanggan`, `verifyPesanan` |
| Query function | `get*` / `list*` + canonical noun | `listPesanan`, `getSaldoStok` |
| Zod schema | `<feature>Schema` | `pelangganSchema` |
| Types | PascalCase | `Pesanan`, `HasilProduksi` |
| Database table/column | snake_case canonical term | `mutasi_stok`, `jatuh_tempo` |
| Constant | SCREAMING_SNAKE_CASE | `MAKS_BARIS_HALAMAN` |
| Hook | `use` + PascalCase | `useFilterPesanan` |

Default exports only where Next.js requires them (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`). Everything else uses named exports.

Imports use the `@/` alias; no `../../../` chains. Put `import type` for type-only imports. Order: external packages, then `@/`, then relative.

### Code style

- TypeScript `strict` is on. `any` is a defect; use `unknown` at boundaries and narrow it with a schema.
- Keep files under ~400 lines and functions under ~60 lines. Split by feature, not by file type.
- No `console.log` in committed code. Errors go through the result object or the server log.
- Comments explain **why**, not what. English only.
- Never import a server module into a client component. Keep server code out of `"use client"` import graphs; the `server-only` guard package is not installed yet.
- Use `Result` shape for actions: `{ ok: true; data } | { ok: false; message }`. Create `src/lib/result.ts` once, when the first action lands; do not redefine the shape per feature.

## Architecture Rules

Layer direction is one-way:

```text
app/ (routing)  →  modules/<cycle>/  →  core/  →  lib/
                        ↘  components/ui  ↙
```

- `src/core/**` must not import `src/modules/**` or any React component.
- `src/modules/<x>/**` must not import `src/modules/<y>/**` for `x ≠ y`.
- `src/modules/**` must not read another module's tables, not even through raw SQL. Use a core query or a core read model.
- `src/lib/**` is a leaf: it imports nothing from `core`, `modules`, `app`, or `components`.
- `src/components/ui/**` is presentational: no domain imports, no Supabase, no business rules.
- `src/app/**` stays thin: read route params, guard the session, render the module screen. No business logic and no direct table writes in a page.
- Database access is server-only. `lib/supabase/client.ts` is only for client components; `lib/supabase/server.ts` is only for server code.
- Core owns four things: `inventory` (stock movements and balances), `ledger` (COA and `postJournal()`), `dokumen` (numbering, status, history), `pengadaan` (procurement tables and status rules). When in doubt, call core; do not duplicate.

## Architecture Enforcement

- Human source: `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`.
- Executable subset: `.dependency-cruiser.cjs`, run with `pnpm arch:check` locally and in CI.
- Enforced by machine: `ARCH-01` (no cross-module import), `ARCH-02` (core does not import modules), `ARCH-07` (unique migration numbers).
- Enforced by review only: `ARCH-03`–`ARCH-06`, `ARCH-08`, `ARCH-09`. Passing dependency-cruiser does not prove these.
- Guardrails pack: not configured. Do not invent a new boundary because this section is short; the contract is the source.
- If a rule blocks a legitimate change, stop and escalate. Never disable, weaken, or exclude a rule to make a PR green.

## Design Rules

The design authority is `docs/design/`. Read it before building any screen, in this order: `README.md` → `DESIGN_TOKENS.md` → `LAYOUTS.md` → `COMPONENTS.md` → `INFORMATION_ARCHITECTURE.md`.

Fixed values:

- **Shell:** one shell, fixed **200px** sidebar, content starts at x=232, 32px page padding.
- **Width:** 1280 minimum, 1440 design target, 1440 max content. Below 1280 keep the min-width and scroll; do not invent a mobile layout.
- **Grid:** 12 columns, 24px gutter. Content is 1016 wide at 1280, 1176 at 1440.
- **Density:** table rows 48px, controls 36px, icon targets 44px.
- **Type:** Inter only; money uses tabular numerals.
- **Color:** tokens only. Primary `#ED8B00` with ink text `#1C2530`; app background `#F7F9FC`. Never a raw hex in a component.
- **Status:** text plus color, never color alone.
- **Patterns:** choose a page pattern from `LAYOUTS.md`; do not invent a one-off layout.
- **Components:** compose from `src/components/ui/`. A new primitive is `FND-007` work, not a feature branch.
- **States:** every screen implements loading, empty, error, and unauthorized. A blank table is not an empty state.
- **Forms:** labels above the field; a placeholder is an example, never a label.
- **Screenshots:** `docs/design/screenshots/` is visual reference only. The Figma file is not normative and must not be edited.

If a screen needs a value that is not in `DESIGN_TOKENS.md`, either the value is wrong or the token set is incomplete. Stop and ask; do not hardcode it.

## Project Structure

Directories marked *(target)* do not exist yet; create them only when the item that owns them starts.

```text
src/
├── app/
│   ├── (auth)/                  # login, forgot password; no app shell
│   ├── (app)/                   # target: shell + guarded pages
│   │   ├── layout.tsx           # session guard, 200px sidebar
│   │   ├── page.tsx             # Dashboard Umum
│   │   ├── laporan/
│   │   ├── pengaturan/
│   │   └── <cycle>/**           # Indonesian route slugs
│   └── auth/callback/route.ts
├── modules/                     # target: one folder per cycle
│   └── <cycle>/<feature>/
│       ├── screen.tsx
│       ├── actions.ts
│       ├── queries.ts
│       ├── schema.ts
│       └── components/
├── core/                        # target: inventory, ledger, dokumen, pengadaan
│   └── <service>/{index,service,queries,types}.ts
├── components/
│   ├── ui/                      # FND-007 primitives
│   └── shell/                   # target: Sidebar, Topbar, ActionBar
└── lib/
    ├── supabase/{client,server,proxy,env}.ts
    ├── auth/                    # target: requireSesi, requirePeran
    ├── format/                  # target: number.ts, date.ts
    └── result.ts                # target: shared action result
```

| Path | Responsibility | Placement rule |
|---|---|---|
| `src/app/(auth)/` | Sign-in and recovery screens | No shell, no module import beyond the auth form |
| `src/app/(app)/<cycle>/` | Routing, params, session guard | A `page.tsx` may only guard and render a module screen |
| `src/modules/<cycle>/<feature>/` | One feature end to end | If two cycles need it, it belongs in core |
| `src/core/<service>/` | Shared truth and invariants | Tech lead owns; modules consume through `index.ts` |
| `src/components/ui/` | Token-driven primitives | No domain terms, no data fetching |
| `src/components/shell/` | Sidebar, topbar, action bar | Layout only; navigation data comes from the shell config |
| `src/lib/` | Infrastructure and utilities | Must not import from `core`, `modules`, or `app` |
| `supabase/migrations/` | Numbered DDL | Tech lead only; one concern per file |
| `scripts/` | Local tooling | Plain Node scripts; no app imports |
| `docs/product/items/<ID>/` | Requirement, AC, contract, evidence | Never edit another team's item package |

## Project Structure Principles

1. **Organize by domain, not by type.** A feature lives together in `modules/<cycle>/<feature>/`; do not scatter its form into `components/`, its fetch into `hooks/`, and its rules into `utils/`.
2. **One cycle, one root.** All cycle code lives under `src/modules/<cycle>/`; all shared truth under `src/core/`.
3. **One responsibility per directory.** Do not add an unrelated file to an existing folder just because the folder exists.
4. **Shared code has one home.** A helper used by two cycles moves to `src/core/` or `src/lib/`, never copied.
5. **Layer direction is one-way.** UI → module → core → lib. Lower layers never import upward.
6. **Entry points are thin.** `page.tsx` guards and renders; actions validate and delegate; services decide.
7. **Keep files small.** Split at ~400 lines or ~60 lines per function, whichever comes first.
8. **Colocate what changes together.** Feature components live in the feature folder; primitives live in `components/ui`.
9. **No build artifacts in git.** `.next/`, `node_modules/`, logs, `*.tsbuildinfo`, and Supabase temp folders stay ignored.
10. **Fix the structure, do not work around it.** If the map is wrong, propose a change; do not smuggle code into the wrong layer “temporarily”.

## Quality Gates (SSOT / DRY / KISS / SOLID / YAGNI)

1. **SSOT — one owner per fact.** A constant, type, parser, status list, or account mapping exists once. Cross-cycle facts live in `core`; import them, never duplicate them “to keep in sync”.
2. **DRY — 2x extract, 3x build.** The same block twice means extract now; three times means the abstraction is missing.
3. **KISS — small files, flat logic.** File over ~400 lines or function over ~60 lines gets split. One function, one job.
4. **SOLID — injectable I/O.** Pass the Supabase client, clock, and ID generator as parameters with defaults so the logic is testable without a real database.
5. **YAGNI — no consumers, no code.** Do not build a factory, abstraction, or dependency interface before a second consumer exists.
6. **Tests prove behavior.** When a test runner exists, assert the observable effect. A test that only checks “did not throw” is not a test.
7. **Retry prove-first.** Before retrying a side-effecting action (posting, payment, stock movement), prove it did not already happen. If unsure, report uncertain; do not retry blindly.
8. **Search before you write.** Grep for an existing component, helper, type, or service before creating a new one. Extend the owner instead of duplicating.
9. **Same-commit hygiene.** Remove dead code and update the docs (including the item package) in the same PR that changes the facts.

## Testing Instructions

There is **no test runner configured yet**. Do not add Jest, Vitest, or Playwright on your own.

Until a runner exists:

- Prove each acceptance criterion with a repeatable command or a written UI step.
- Record the command, a short output summary, the date, and the environment in `docs/product/items/<ID>/05-evidence.md`.
- Run `pnpm verify` and keep the output.
- For UI items, attach a screenshot at 1280 wide.
- Never claim an AC passes without evidence; “works on my machine” is not evidence.

The first item that introduces core logic (`FND-005` inventory or `FND-006` ledger) adds the test runner with tech lead approval. `INT-002` adds the end-to-end suite.

## Operational Notes

- **Toolchain:** Node 24, pnpm 10.18.3 (`packageManager`), Next.js 16.4.6 pinned, React 19.3, Tailwind v4.
- **Next.js 16:** read `node_modules/next/dist/docs/` before using an unfamiliar API. `src/proxy.ts` is the Next 16 replacement for middleware.
- **Local database:** Supabase CLI runs in Docker. `pnpm db:setup` starts it and resets; `pnpm db:reset` wipes it. The reset guard refuses any non-local host.
- **Seed:** `pnpm db:seed` refuses to run when `_seed_meta` already has rows. Reset first; do not delete rows by hand.
- **Migrations:** files are `supabase/migrations/NNNN_nama.sql`. `pnpm check:migrations` rejects duplicate numbers and bad names before touching the database.
- **Build:** needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. CI injects placeholders; local builds use `.env.local`.
- **Starter content:** `src/app/page.tsx` is bootstrap demo content, not the product. Do not extend it; the dashboard replaces it when the shell lands.
- **AGENTS.md top block:** `next dev` rewrites it. Leave it in place and commit it as-is.
- **Figma:** the design file is read-only reference. Never write to it without explicit tech lead approval. Exported screenshots live in `docs/design/screenshots/`.

## Key Workflows

### Start a new item

1. Find the ID in `docs/product/backlog.md`; confirm status and dependencies (Task Intake Protocol).
2. Read the item package `00`–`04`.
3. Create the branch from the latest `main`: `<item-id>-<slug>` (for example `pd-001-pelanggan`).
4. Write the plan report and get confirmation when a requirement is ambiguous.
5. Implement in small commits; run `pnpm verify` before each commit that claims completion.

### Build a screen

1. Find the closest existing screen and follow its pattern.
2. Create the route file under `src/app/(app)/<cycle>/<slug>/page.tsx`; keep it thin.
3. Build the screen in `src/modules/<cycle>/<feature>/screen.tsx`.
4. Read data in `queries.ts` (server-only); never query another cycle's tables.
5. Compose with primitives from `src/components/ui/` and the patterns in `docs/design/LAYOUTS.md`.
6. Implement loading, empty, error, and unauthorized states; the empty state is not optional.
7. Verify at 1280px; attach a screenshot to the PR.

### Add a server action

1. Define the schema in `schema.ts` with a clear Indonesian message per field.
2. Read the actor from the session (`requireSesi` / `requirePeran`); never accept `actor_id` from the client.
3. Parse and validate the input; reject before touching core.
4. Call the owning core service for journal, stock, numbering, or status changes.
5. Revalidate the affected path and return the shared `Result` shape.
6. Test the rejection path, not only the happy path.

### Propose a schema change

1. Write the DDL as `docs/product/items/<ID>/06-ddl-proposal.sql`; do not put it in `supabase/migrations/`.
2. Explain the tables, columns, constraints, indexes, and RLS intent in the item package.
3. Ask the tech lead to assign the number and merge; then rebase your branch.
4. Never edit an applied migration. Fix forward with a new one.

### Finish an item

1. Run every acceptance criterion and record the evidence in `05-evidence.md`.
2. Run `pnpm verify`.
3. Update `docs/product/backlog.md`: status `done` and the date.
4. Update the requirement or contract if the implementation deviated, with the reason.
5. Open a PR titled `<ITEM-ID>: <outcome>` with the AC checklist and evidence links.

## Boundaries

Do not touch without explicit tech lead approval:

- `supabase/migrations/**` — numbers and applied migrations.
- `.github/workflows/**` and `package.json` dependencies.
- `src/core/**` — until the tech lead declares a service stable for module use.
- `src/components/ui/**` — owned by `FND-007`.
- `docs/design/**` — tokens and layouts.
- `docs/product/decisions.md`, `docs/architecture/**`, and other teams' item packages.
- The Figma file; exports are enough.
- `.env*`, keys, tokens, and any credential.

Never commit secrets. Never print a token in chat, logs, or a PR.

## Git Workflow

- Branch from `main`: `<item-id>-<slug>`, lowercase, for example `pd-001-pelanggan`.
- One item per branch and per PR. Do not mix a fix for another cycle.
- Rebase on `origin/main` before opening or updating a PR; no merge commits from local.
- Commits: `type: message` in English, no scope. Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.
- One logical change per commit. The message explains why, not which files changed.
- Never push directly to `main`. Open a PR and wait for tech lead review.
- Never force-push a branch that someone else is reviewing; never push another person's branch.
- PR title: `<ITEM-ID>: <outcome>`. Body: what changed, AC checklist with evidence, screenshots for UI, risks, and anything intentionally left out.
- Update `backlog.md` and `05-evidence.md` in the same PR.

## Definition of Done

An item is done only when all of these are true:

- The behavior is reachable from the UI, not only from a script.
- Invalid input is rejected with a readable Indonesian message.
- Every status change writes `riwayat_status` through core.
- Money and stock effects appear in the related report.
- Journal entries go through `postJournal()` and balance.
- Stock movements update `saldo_stok` in the same transaction.
- Posted documents cannot be edited silently.
- A locked period rejects new transactions with a clear message.
- `pnpm verify` passes; no new `any` without a written reason; no `console.log` or dummy data.
- Migrations are numbered and old migrations are untouched.
- Every AC has recorded evidence.
- `backlog.md` is updated.
- The PR is reviewed and merged by the tech lead.

The full policy is `docs/product/policies/definition-of-done.md`.

## Known Missing Inputs

These decisions do not exist yet. If your item needs one, stop and ask; do not fill the gap with a plausible default.

- Chart of accounts (COA) and the debit/credit mapping per transaction.
- The 12-role × action permission matrix.
- Approval thresholds by document type and value.
- Document numbering format per document type.
- Period-close rules and the correction path after close.
- Report formats and column definitions.
- Number and date formatting for UI and print.
- Print layouts (invoice, purchase order, payslip).
- Deployment target and production configuration.
- Demo seed data per cycle.

## Communication

- Reply in Indonesian; keep code, comments, and commit messages in English.
- Be concrete: name the file, the command, and the evidence.
- Ask before guessing a business rule. One precise question beats a wrong implementation.
- Show command output when claiming something passes; do not summarize success without proof.
- When blocked, use this format:

```text
STOP: <what is missing>
Need: <the decision or input required>
Affects: <item, files, or AC>
Options: <A / B, with the trade-off>
```

## Principles

1. **The backlog is the contract.** Work that is not in an item does not ship.
2. **One concept, one name.** Synonyms are bugs waiting to happen.
3. **Core owns truth.** Modules own screens and workflows, not balances or journals.
4. **Prove, do not claim.** Evidence beats confidence.
5. **Smallest correct change.** Fix the item, not the neighbourhood.

## Things to Avoid

- Copying a component or query from another cycle instead of moving the shared part into core.
- Writing `saldo_stok`, journal rows, document numbers, or status history from a module.
- Adding a table or column because the UI needs a place to store it, without a schema proposal.
- Putting business logic in `page.tsx` or `"use client"` components.
- Translating canonical terms (`pelanggan` → `customer`, `faktur` → `invoice`) in code.
- Using raw hex, arbitrary spacing, or a second font in a component.
- Adding `any`, `@ts-ignore`, or an ESLint disable to silence a real error.
- Inventing an approval flow, account code, or tax rate that the requirement does not state.
- Committing `.env`, service keys, tokens, or Supabase temp folders.
- Force-pushing, merging your own PR, or pushing to `main`.
