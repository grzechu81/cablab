# CabLab

Client-side-only React + TypeScript web app for designing simple self-built
cabinets: enter a body (W×H×D), pick a panel join, add doors / shelves / a back,
get real panel dimensions, a hardware estimate, a printable cut list, and a 3D
scene of the project. No backend; a project saves/loads as one JSON file.

**Read `docs/` before non-trivial work** — `00-overview` → `01-architecture` →
`02-domain-model` → `03-calculation-engine` → `04-persistence-schema` →
`05-decisions-log` → `06-deployment`. The docs are the design source of truth.

## Commands

| | |
|---|---|
| `npm run dev` | Vite dev server on `:5173` |
| `npm test` | `vitest run` (one-shot) |
| `npm run test:watch` | `vitest` watch |
| `npm run lint` | **oxlint** (not eslint) — config `.oxlintrc.json` |
| `npm run build` | `tsc -b && vite build` |

Before finishing a change, run `npm test`, `npx tsc -b`, and `npm run lint` — all
must be clean (zero oxlint warnings too).

## Deploy

Pushing to `main` publishes to GitHub Pages at
<https://grzechu81.github.io/cablab/> via `.github/workflows/deploy.yml`. The
Pages base path lives in `vite.config.ts` (`base: '/cablab/'` on `build` +
`preview`) and must match the repo name. Full runbook + gotchas in
`docs/06-deployment.md`.

## Architecture — derive, don't store

The Zustand store (`src/state/store.ts`) holds the **raw `Project` only**. Panel
geometry, the cut list, and hardware totals are always recomputed from it via
memoized selectors (`src/state/selectors.ts`) — never stored, never persisted.
This keeps the cut list / 3D view from drifting out of sync with the settings.

## Layer layout

| Dir | Rule |
|---|---|
| `src/domain/` | Pure calc engine + types. **Zero dependencies** — no zod, react, three, or DOM. Heaviest test coverage in the project. |
| `src/persistence/` | zod `ProjectSchema` + `schemaVersion` migration ladder + parse/serialize. `project.ts` is pure; `projectFile.ts` is the only DOM glue. |
| `src/state/` | Zustand store, memoized selectors, default factories. Also `uiStore.ts` for transient selection/modal state (never persisted). |
| `src/i18n/` | Every user-visible string lives in `en.ts`. Use the typed `t('a.b.c', params?)` — **never inline display text** anywhere else. |
| `src/ui/` | Presentation only. Reads the store, writes user edits back through store actions. Computes nothing. |
| `src/scene/` | react-three-fiber. Consumes `CabinetGeometry`; does no cabinet math. Lazy-loaded so three.js stays out of the initial bundle. |

## Conventions

- No semicolons, single quotes, 2-space indent, trailing commas.
- `import type { … }` for type-only imports (`verbatimModuleSyntax`).
- No `any` — oxlint flags it; use `unknown` and narrow.
- Tests colocated as `*.test.ts`, table-driven with `it.each`.
- Store actions do explicit immutable replacement (no immer): edited cabinet =
  new object, untouched cabinets keep their reference — the selector cache
  depends on this.

## Geometry coordinate frame

Cabinet-local origin = front-bottom-left. +X right, +Y up, +Z toward the back.
`Panel.position` is the min-corner of the panel's AABB. `src/scene/panelBox.ts`
maps a panel's role-relative width/height/thickness onto these axes.

## Decisions & open questions

`docs/05-decisions-log.md` lists settled decisions (don't relitigate) and open
TBDs. Where the engine had to fill a spec gap, the choice is marked
`PROVISIONAL` in code. Still open: half-overlay / inset door formulas (only
full-overlay is implemented — the others **throw**), hanger hardware model
(currently a flat 2/cabinet), the hinge-count height threshold, edge-banding
rules.

## Status

Built and deployed: calc engine, cut list, persistence, i18n, store + selectors,
UI shell (sidebar / property panel / settings + cut-list modals), 3D scene —
drag slides a cabinet on the floor (X/Z), Ctrl/Cmd lifts it (Y), with face
snapping + no-overlap collision (`src/scene/collision.ts`). Live on GitHub Pages.
Not yet: component tests (`@testing-library/react` + jsdom not set up), the
deferred v1 items above.
