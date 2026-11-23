# Lionmesh SIA — Design System

Status: **Draft v0.1** · 2026-11-17
Owner: Tech Lead
Source artifact: Figma **“DESAIN UI SIA (Copy)”** — file key `Np8oosi3jZuSuoaQGbf5sb`
Implementation item: `FND-007` (shared UI kit). This folder does **not** add backlog items.

> **Snapshot.** The source file was rebuilt on 2026-11-23 as **“SIA Liomesh
> (Copy)”** (`VS9PagBMlKi2McPPfCdsRV`, 371 screens). The locked values below are
> still the v0.1 values, and the shipped UI kit in `src/app/globals.css` matches
> them. Where the v2 file disagrees — 220px sidebar, `#E67E00` accent, new ink
> and grey values — the contradiction is measured in `FIGMA_V2_DELTAS.md` and is
> **not** adopted until the tech lead decides. Do not take a value from the v2
> file without that decision.

## What this is

The design authority for the internal accounting information system of
PT Lionmesh Prima Tbk. It formalises the visual world that already exists in
Figma, replaces ad-hoc values with tokens, and defines the shell, components,
and interaction rules that every cycle (Pendapatan, Pengeluaran, Produksi,
Penggajian) must share.

The system is derived from the existing Figma file, not invented over it. Where
the file is inconsistent, the dominant value becomes the default and the old
value is recorded as an anti-pattern with a migration note.

## The v2 source file

| | |
|---|---|
| File | **“SIA Liomesh (Copy)”** — `VS9PagBMlKi2McPPfCdsRV` |
| Pages | `01 · Prototipe SIA`, `02 · Komponen` |
| Screens | 371 frames, 1440×960 (Accounting 1440×1132) |
| Notes | 174 `Catatan / <ID>` and 38 `Ringkasan / <section>` frames |
| Styles | 17 paint + 5 text (`SIA v2 / …`), 0 effect, 0 variables |

The v1 artifact (`Np8oosi3jZuSuoaQGbf5sb`) is retired; `FIGMA_AUDIT.md` keeps its
measurements for history.

## Locked decisions

| Decision | Value | Why |
|---|---|---|
| Medium | Web — desktop browser, Next.js 16 | Internal app; no native or mobile client |
| Target viewport | 1280 minimum · 1440 design target · 1440 max content | Office laptops are 1366×768; the module shell already fits 1280 |
| App shell | Fixed **200px** sidebar · content starts at x=232 · 32px page padding | The module screens already use this and fit; the 288px hub shell overflows 608px |
| Primary accent | `#ED8B00` with **ink text** `#1C2530` | 6.11:1, keeps the brand orange, passes WCAG AA |
| Type family | **Inter** only, tabular numerals for money | Already dominant (5,628 of ~6,000 text nodes); one family for Operate mode |
| Color strategy | Restrained: neutral surfaces + one accent | 60/30/10; orange reserved for primary actions and active state |
| Mode | **Operate**, light only | Internal staff, repetitive data entry, daylight office |
| Density | 48px table rows · 36px controls · 44px icon targets | High data density without losing touch safety |
| Status colors | Text + color, never color alone | WCAG 2.2 AA, color-blind safe |
| Responsive scope | Desktop only, 1280–1440; below 1280 keeps min-width and scrolls | No mobile redesign in v1 |

## Files

| File | Purpose |
|---|---|
| `INVENTORY.md` | Index of all 371 v2 screens: node id, size, backlog item, export filename |
| `inventory/*.md` | The same index split per cycle (umum, penggajian, pendapatan, pengeluaran, produksi) |
| `FIGMA_V2_DELTAS.md` | Every place the v2 file disagrees with the locked values, and what is undecided |
| `DESIGN_BRIEF.md` | Intent, users, principles, aesthetic direction, scope |
| `INFORMATION_ARCHITECTURE.md` | Sitemap, navigation, page hierarchy, flows, glossary, URLs |
| `DESIGN_TOKENS.md` | Semantic color, typography, spacing, radius, shadow, layout, motion, data-display rules, anti-patterns |
| `LAYOUTS.md` | One shell, page patterns, 12-column composition, wireframes, responsive rules, slicing checklist |
| `DESIGN_DIRECTION.md` | Chosen visual direction, alternatives considered, why |
| `COMPONENTS.md` | Component inventory with anatomy, variants, states, accessibility |
| `FIGMA_AUDIT.md` | Measured audit of the source file: coverage, contrast, duplicates, gaps (v1 sections 1–6, v2 sections 7–9) |
| `screenshots/` | 17 v2 sample PNGs for visual reference, contact sheet, export rules |

## How to use

1. Read `DESIGN_BRIEF.md` for intent and constraints.
2. Find the screen in `INVENTORY.md` (or `inventory/<cycle>.md`); it names the backlog item.
3. Take values from `DESIGN_TOKENS.md`; never invent a hex, size, or spacing.
4. Compose the screen from `LAYOUTS.md`; use the pattern, not a one-off layout.
5. Build it from `COMPONENTS.md`; do not create one-off variants.
6. Follow `INFORMATION_ARCHITECTURE.md` for routes, navigation, and naming.
7. Check `FIGMA_V2_DELTAS.md` before writing a value down; if the delta is undecided, stop and ask the tech lead.
8. Use `screenshots/` only for visual reference; the raw Figma values are not normative.

## Hard rule

No source code lives in this folder. `FND-007` implements the tokens and
components. After the first implemented screen ships, the codebase becomes the
source of truth for token values; this folder remains the rationale and the
specification.
