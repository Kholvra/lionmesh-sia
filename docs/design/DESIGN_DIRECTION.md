# Design Direction: Lionmesh SIA

## Decision

**Chosen: Industrial Ledger.**

> **Snapshot.** The Figma source was rebuilt on 2026-11-23 as “SIA Liomesh
> (Copy)” (`VS9PagBMlKi2McPPfCdsRV`, 371 screens). The values below are still the
> locked v0.1 values and match the shipped UI kit. Every disagreement in the v2
> file is measured in `FIGMA_V2_DELTAS.md`; none of it is adopted until the tech
> lead decides.

A steel ledger for a steel-mesh factory: an ink-navy frame, a single safety-
orange signal, white paper surfaces, and numbers aligned like a ledger book.

The direction is not invented from a mood board. It is the visual world the
Figma file already establishes, tightened into a system. The alternative
directions below were considered and rejected for named reasons; they remain
documented so future surfaces do not re-litigate the choice by taste.

## Why This Direction

- **Operate mode rewards familiarity.** Staff use this for hours a day. A
  conventional shell (sidebar, page header, table) lowers training cost. The
  differentiation lives in the palette, the density, and the document model —
  not in novel navigation.
- **The brand is already industrial.** Lionmesh manufactures steel mesh. Navy
  and safety orange belong to that world; SaaS blue does not.
- **The source artifact exists.** The Figma file already uses this palette and
  layout across three pages. A redesign would discard real work and break the
  four groups’ reference.
- **Numbers are the product.** Tabular numerals, right alignment, and quiet
  surfaces serve the ledger better than decorative cards or gradients.

## The Direction

| Aspect | Decision |
|---|---|
| Thesis | “A steel ledger: calm frame, one signal, aligned numbers.” |
| Palette | Ink navy `#1C2530`, safety orange `#ED8B00`, cloud `#F7F9FC`, white surfaces, AA-safe status tints |
| Type | Inter, seven sizes, tabular numerals; no display face |
| Materials | Flat surfaces, 1px hairlines, subtle shadows only for overlays; no gradients, glass, or glows |
| First viewport | Dashboard: four cycle cards, one orange primary action, a table of items needing follow-up |
| Interaction | State transitions only: hover, focus, open/close, status change. No entrance choreography |
| Density | 48px rows, 36px controls, 12/13/14px text in tables |
| Risk | The shell is category-conventional; without the industrial palette and ledger typography it could read as a generic admin template |

The risk is real and is managed deliberately: the structure stays familiar, but
the visual vocabulary (navy frame, safety orange, steel-grid rhythm, tabular
figures) and the document/status model carry the identity.

## Alternatives Considered

### 1. Mill Floor

**Thesis:** A control panel on the factory floor — high contrast, safety yellow
and black, larger type, bold status blocks.

| Aspect | Decision |
|---|---|
| Palette | Black `#111`, safety yellow `#F5C400`, white, red for stop |
| Type | Inter or Archivo, 16px base, heavy weights |
| Materials | Flat, stencil-like labels, thick dividers |
| First viewport | A shop-floor board: production lines, tonnage, stoppages |
| Interaction | Large tap targets, alarm-like status changes |
| Risk | Aggressive for finance and executive users; fatiguing over an eight-hour desk day; poor fit for ledgers and reports |

**Rejected because:** it optimises for the shop floor, while most screens are
used by accounting, purchasing, and management at a desk. It would also require
rebuilding the existing Figma file.

### 2. Quiet Ledger

**Thesis:** A paper ledger — warm white, ink, one dark accent, editorial calm.

| Aspect | Decision |
|---|---|
| Palette | Paper `#FAF8F3`, ink `#1A1A1A`, oxblood `#7A2E2E`, muted green |
| Type | A humanist serif for headings, Inter for UI |
| Materials | Hairlines, no shadows, generous margins |
| First viewport | A report cover: period, summary, one table |
| Interaction | Quiet, almost no motion |
| Risk | Loses the industrial brand; serif headings slow scanning in dense tables; conflicts with the existing navy/orange Figma |

**Rejected because:** it reads as an editorial finance product, not a factory
system. It also abandons the visual work already approved by the team.

### 3. Category Standard

**Thesis:** The default SaaS admin: blue accent, rounded cards, gradient hero,
icon-in-a-rounded-square for every feature.

| Aspect | Decision |
|---|---|
| Palette | Blue `#2563EB`, slate neutrals, white |
| Type | Inter, 14px base |
| Materials | Soft shadows, 16px radius, gradient accents |
| First viewport | “Welcome back” + KPI cards + a chart |
| Interaction | Subtle entrance animations on every page |
| Risk | Interchangeable with any dashboard; fails the product-slop test; no connection to steel or accounting |

**Rejected because:** it is the category default. If someone can guess the
aesthetic from “internal admin app”, the direction has failed.

## Commit Rules

- Every atom — sidebar, buttons, inputs, tables, badges, dialogs — uses the
  Industrial Ledger vocabulary. A stock blue button is a lapse.
- Orange is reserved for primary action and active state. It is not a chart
  color, a heading color, or a decorative fill.
- No nested cards, no kicker/eyebrow labels above headings, no gradient text,
  no emoji as icons.
- The first viewport of a hub is a thesis: the cycle’s numbers, its state, and
  the next action — not a mood.
- When aesthetics and accessibility conflict, accessibility wins. The white-on-
  orange button is the canonical example: the brand survives, the text color
  changes.

## What Would Make A Polished Result Feel Wrong

- A playful illustration or mascot on an accounting screen.
- A marketing-style hero on the dashboard.
- Glassmorphism, blurred panels, or colored glows.
- More than one accent competing with orange.
- A table that hides the numbers behind cards.
- Animation that delays data entry.

## When To Revisit

Re-roll only on named factual grounds: a new brand guideline, a new device
class (e.g. warehouse tablets), or a measured usability failure. “I’m bored of
navy” is not a reason. After two re-rolls, ask what quality is missing before
changing the direction again.
