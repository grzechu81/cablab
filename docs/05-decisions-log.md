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
