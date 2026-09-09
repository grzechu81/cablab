# CabLab — Project Overview

## What it is

A web application for designing simple, self-built cabinets. The user is a hobbyist
(not a professional carpenter) who wants to:

- Define a cabinet body by width, height, depth
- Choose how the body panels are joined (top-first or side-first)
- Auto-add shelves, sized correctly from cabinet dimensions and offsets
- Add doors (single/double), sized correctly from cabinet dimensions and offsets
- Get an estimated hardware count (hinges, screws)
- See a readable cutout (cut list) for every panel in the project
- Save/load a project as a JSON file
- Arrange multiple cabinets in a 3D scene

## Scope decisions for v1

These were explicitly decided during initial design discussion — see
`05-decisions-log.md` for the reasoning behind each:

| Decision | Choice |
|---|---|
| Backend | None — fully client-side, static app |
| Hosting | Static hosting (Netlify / Vercel / GitHub Pages) |
| Frontend framework | React |
| Offline / installable (PWA) | Not needed — normal web page |
| Typical project size | Small, ~5–20 cabinets |
| Drawers | **Deferred** — not in v1 |
| Corner / non-rectangular cabinets | **Deferred** — not in v1 |
| Cut list export | Human-readable only (screen / print) — no CNC/DXF export in v1 |

## Non-functional requirements

- **Unit tests** covering the calculation engine (see `03-calculation-engine.md`)
  to catch regressions as features are added.
- **Light, professional visual design.**
- **i18n-ready**: all user-visible strings live in a separate strings file/module
  from day one, even though only one language ships initially.

## How to use these docs on a fresh machine

Read in this order:

1. `00-overview.md` (this file) — what we're building and why
2. `01-architecture.md` — system diagram, layers, tech stack
3. `02-domain-model.md` — the data shapes (CabinetInput, Panel, Hardware, CutoutList)
4. `03-calculation-engine.md` — how panel dimensions and hardware counts are derived
5. `04-persistence-schema.md` — the save/load JSON format and versioning approach
6. `05-decisions-log.md` — decisions made so far, and open questions still to resolve

Nothing here is final/frozen — these are working docs meant to let a second-machine
setup (or a future session) pick up exactly where the design conversation left off.
