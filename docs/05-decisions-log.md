# CabLab — Decisions Log

Lightweight ADR-style log. Add an entry whenever a real decision gets made so
future-you (or a second machine) doesn't have to re-derive the reasoning.

## Decided

| # | Decision | Reasoning |
|---|---|---|
| 1 | No backend — fully client-side | Small personal-use scope (5–20 cabinets/project), no need for accounts or sync |
| 2 | Static hosting (Netlify/Vercel/GitHub Pages) | No server needed at all |
| 3 | React (TypeScript) | Stated preference |
| 4 | No PWA / offline support in v1 | Normal web page is sufficient for the use case |
| 5 | Drawers deferred, not in v1 | Keep v1 scope to doors/shelves; avoids touching data model for slides/box construction prematurely |
| 6 | Corner / non-rectangular cabinets deferred | Same reasoning as drawers |
| 7 | Cut list export: human-readable only, no CNC/DXF | Not needed for current use case |
| 8 | Calculation engine: procedural (Approach A), not constraint-based (Approach B) | Only 2 join types, no drawers/corners planned — direct formulas are simpler to write, test, and hand-verify; avoids solving a scaling problem that doesn't exist yet |
| 9 | State holds raw `CabinetInput` only; `CabinetGeometry` always derived, never persisted | Prevents cut list / 3D view from drifting out of sync with actual settings |
| 10 | Schema versioning (`schemaVersion` + migration functions) from day one | Cheap to add now, painful to retrofit after the first breaking save-file change |
| 11 | Door overlay default: `full-overlay` | Matches real workshop practice — doors sit slightly smaller than the corpus with a small edge margin |
| 12 | Door edge margin (door-to-cabinet-edge, ~2-3mm) is a **global project setting**, not per-cabinet | It's a consistent workshop habit, not something that varies cabinet to cabinet |
| 13 | Double-door center gap is a **separate** global setting from the edge margin | The two gaps serve different purposes (edge reveal vs. clearance between leaves) and don't need to match |
| 14 | Back panel: groove-mounted only in v1, lip-mounted deferred | Matches actual build practice; avoids modeling two mounting methods before either is needed |
| 15 | Back-panel groove routed into side panels only, not top/bottom | Matches actual build practice |
| 16 | Groove width / depth / offset-from-back are **global project settings**, not per-cabinet | Reflect a consistent workshop setup (router bit, jig) rather than something that varies cabinet to cabinet |
| 17 | Cabinet local coordinate origin: front-bottom-left corner, Z increasing toward the back | Most measurements (door margin, shelf front-offset, hinges) are naturally front-referenced; only the back panel needs a `depth - offset` calc under this convention. Internal-only, safe to revisit later. |
| 18 | State management: Zustand | Selector-based subscriptions avoid unnecessary re-renders during 3D drag interactions (unlike naive Context usage); less ceremony than Context+useReducer for this app's scope; already validated in a working PoC; common pairing with react-three-fiber |
| 19 | Screw count: `(4 + 2×structuralShelves) × screwsPerJoint` per cabinet, summed project-wide, +waste margin (default 15%) | Matches real assembly practice (2 screws per panel joint, base box has 4 joints); simple enough to match the spec's "more or less" precision goal; `screwsPerJoint` and margin are global settings |
| 20 | Shelves become a list (`ShelfInput[]`), not an aggregate count | Needed to support a per-shelf structural flag rather than a single cabinet-wide setting |
| 21 | Shelf mounting default: pin-mounted (adjustable); `structural: true` is an opt-in per-shelf flag | Matches actual build practice — pin-mounted is the common case, structural is the exception |
| 22 | `ShelfInput.heightOffset` — explicit per-shelf vertical position (mm to the underside, from the cabinet's outer bottom) | The engine needs a real vertical position per shelf; measuring to the underside from Y=0 mirrors `frontOffset`'s "from the front face" convention |
| 23 | `backOffset` (shelf-to-back clearance) = `grooveOffsetFromBack + hdfThickness` when a back is present, else 0 | The shelf-depth formula referenced `backOffset` without defining it; this stops the shelf exactly at the back panel's front face |
| 24 | `computeCabinetGeometry(input, settings)` takes `ProjectSettings` as a second argument | Door margins, groove dims and screw params live in `ProjectSettings`, not `CabinetInput` — the single-arg signature in the architecture sketch was incomplete |
| 25 | Cut list grouping is **per-cabinet**: identical panels in different cabinets stay separate rows | Each cabinet's cut list should stand on its own for shop use; merging across cabinets would lose the "which cabinet" column |
| 26 | Save-file validation **strips** unknown keys rather than rejecting them (zod default, not `.strict()`) | A file written by a slightly newer minor build still loads; missing/mistyped required fields still fail loudly, which is what corrupt-file detection needs |
| 27 | Persistence split into a pure module (`persistence/project.ts`) + thin DOM glue (`persistence/projectFile.ts`) | Keeps parse/validate/migrate unit-testable in Node; the download/upload plumbing has nothing worth testing |
| 28 | Store holds raw `Project` only; geometry/cut-list/hardware come from memoized selectors (`state/selectors.ts`) | Direct application of decision #9; per-cabinet geometry cached by `CabinetInput` identity, which works because store actions replace edited cabinets immutably |
| 29 | New cabinets default to `back.enabled: true` (grooved HDF back, 3 mm) | A back panel is the common real-world case; matches decision #14 |
| 30 | 3D drag: default slides on the **floor plane (X/Z)**, Ctrl/Cmd lifts (Y) — reverses the earlier "X/Y free, Z with Ctrl" sketch | A vertical X/Y drag plane goes edge-on to the pick ray at top-down camera angles (cabinet flew to infinity), and X/Z is the natural axis set for arranging cabinets and for front-to-back face snapping. Implemented with per-drag-axis collision + snapping in `src/scene/collision.ts` |
| 31 | Deploy: GitHub Pages via a GitHub Actions workflow on push to `main`; git repo re-rooted at the project folder | Matches decision #2 (static hosting); Actions flow needs no `gh-pages` branch; `vite.config.ts` `base` must equal the repo name (`cablab`). Full runbook in `06-deployment.md` |
| 32 | `ProjectSettings.defaultShelfFrontOffset` (20 mm) — seeds a new shelf's `frontOffset`; added via zod `.default(20)`, no `schemaVersion` bump | The old default of 0 mm (shelf flush with the front) is rarely what you want; 20 mm matches typical practice. A defaulted additive field is backward/forward compatible without a migration — see `04-persistence-schema.md` |
| 33 | `doors.seeThrough` (per-cabinet, default false) — doors render solid; the checkbox makes them semi-transparent in the 3D view | Solid doors are the honest default (that's how the cabinet looks); see-through is an on-demand aid for checking the interior. Per-cabinet, not global, so you can x-ray one unit at a time. View-only — the engine and cut list ignore it. Additive, `z.boolean().default(false)`, no schema bump |

## Open / TBD

These need a decision before the relevant part of the calculation engine or
data model can be finalized:

- **Half-overlay and inset door formulas** — only `full-overlay` (the default)
  has a settled sizing formula so far; the other two overlay types remain
  unimplemented until actually needed.
- **Hanger hardware spec** — currently just a boolean in `CabinetInput`; needs
  a real model once specific hanger types are decided.
- **Hinge count threshold** — height at which a door gets 3 hinges instead of 2;
  should be a configurable constant once decided, not hardcoded.
- **Project settings** — spec says "TBD: other global project settings" beyond
  dimension visibility and default board thickness; revisit as needs surface.

## How to use this log

When you (or a future session) resume work: read this file first after the
overview. Anything in "Decided" is settled and shouldn't be relitigated without
a good reason. Anything in "Open / TBD" is fair game and should be resolved
(and moved to "Decided") before the part of the app it affects gets built.
