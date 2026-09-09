# CabLab — Calculation Engine

This is the highest-risk, highest-value part of the app: it turns a
`CabinetInput` into real panel dimensions someone will cut wood to. Bugs here
cost material, not just screen glitches.

## Chosen approach: procedural, per-join-type functions

Two options were considered:

- **A — Procedural, per-join-type functions.** One function per join type,
  computing panel dimensions with explicit formulas. Easy to read, easy to
  hand-verify against a tape measure, easy to unit test with exact
  input→output assertions. Doesn't scale infinitely well as features multiply,
  but with only 2 join types and no drawers/corner cabinets planned, that
  ceiling is far away.
- **B — Declarative constraint model.** Cabinet as a set of named reference
  planes; panels defined as "spans between plane A and plane B, offset by X."
  Scales better to many cabinet types, but adds a layer of indirection that
  makes debugging and testing less direct — solving a scaling problem we don't
  currently have.

**Decision: Approach A**, for v1. Reasoning: exactly two join types, no drawers
or corner cabinets on the roadmap, and direct formulas are easier to write
precise unit tests against (which is an explicit non-functional requirement).

To keep the door open for future extension without a rewrite, factor out a
shared inner-cavity helper both join-type functions call:

```ts
function computeInnerCavity(input: CabinetInput): {
  innerWidth: number;
  innerHeight: number;
  innerDepth: number;
}
```

## Join type formulas (sketch — verify against real measurements before shipping)

### top-first
Top and bottom panels span the full cabinet width; side panels fit between them.

```
topPanel.width    = width
topPanel.depth     = depth
bottomPanel        = same as topPanel

sidePanel.height   = height - 2 * boardThickness
sidePanel.depth    = depth
```

### side-first
Side panels span the full cabinet height; top and bottom fit between them.

```
sidePanel.height   = height
sidePanel.depth     = depth

topPanel.width      = width - 2 * boardThickness
topPanel.depth       = depth
bottomPanel          = same as topPanel
```

## Shelves

Each shelf in `CabinetInput.shelves` is computed independently (its own
`frontOffset`), though `width`/`thickness` only depend on the cabinet, not
the individual shelf:

```
shelf.width  = innerWidth  (i.e. width minus two side-panel thicknesses,
               regardless of join type — shelves always sit inside the side panels)
shelf.depth  = depth - backOffset - shelf.frontOffset
shelf.thickness = boardThickness (or a dedicated shelf thickness, if we
               decide to support that as a separate setting)
```

Mounting (`structural: true/false`) doesn't affect these dimensions — it only
affects hardware (see below) and, later, the 3D model (drilled pin holes vs.
screw holes into the side panels).

## Coordinate system convention

Local origin for each cabinet is its **front-bottom-left corner**:

- **X = 0** at the left side, increasing to the right
- **Y = 0** at the bottom, increasing upward
- **Z = 0** at the **front** face, increasing toward the back (Z = depth at the back face)

This is an internal convention only — it's not exposed in the save file or UI,
so it's safe to revisit later without breaking anything. It was chosen because
most measurements in this app (door margins, shelf front-offset, hinge
placement) are naturally front-referenced; keeping the origin at the front
means those values are used directly, and the back panel is the only piece
that needs a `depth - offset` style calculation.

## Doors

Default `overlayType` is `'full-overlay'` — the door face covers the cabinet's
front edges, with a small reveal margin between the door and the cabinet's
outer edges. Margins are **global project settings**, not per-cabinet
(`ProjectSettings.doorEdgeMargin`, `ProjectSettings.doorCenterGap` — see
`02-domain-model.md`), since in practice they're a consistent workshop habit
rather than something that varies cabinet to cabinet.

```
// full-overlay (default)
singleDoor.width  = width  - 2 * doorEdgeMargin
singleDoor.height = height - 2 * doorEdgeMargin

doubleDoor:
  totalDoorWidth  = width - 2 * doorEdgeMargin
  leaf.width      = (totalDoorWidth - doorCenterGap) / 2
  leaf.height     = height - 2 * doorEdgeMargin   // same for both leaves
```

`half-overlay` and `inset` formulas are still TBD — not needed yet since
full-overlay is the only default in use, but will need their own formulas
(and likely their own margin concepts) before either is selectable.

## Back panel (HDF)

Groove is routed only into the two side panels (left/right) — the back panel
rests within the top/bottom cavity height without being grooved into them.
Lip-mounted backs (no groove) are deferred to a future version. Groove
dimensions are **global project settings**
(`ProjectSettings.grooveWidth` / `grooveDepth` / `grooveOffsetFromBack` —
see `02-domain-model.md`), since they reflect a consistent workshop setup
rather than something that varies cabinet to cabinet.

```
back.width     = innerWidth + 2 * grooveDepth   // extends into the groove on both side panels
back.height    = innerHeight                     // no groove on top/bottom; fits within that cavity height
back.thickness = hdfThickness                     // should be <= grooveWidth for a snug fit

back.position.z = depth - grooveOffsetFromBack - hdfThickness
  // Z=0 is the cabinet's front face (see "Coordinate system convention" above)
```

`grooveWidth` isn't used in the width/height formulas above — it mainly matters
for (a) validating that `hdfThickness` actually fits the groove, and (b)
rendering the routed groove visually in the 3D view, if that level of detail
is ever added.

## Hardware estimation

- **Hinges:** typically 2 per door leaf under ~1200mm height, 3 above — exact
  height threshold TBD, should be a configurable constant, not hardcoded.
- **Screws** (panel-to-panel structural joints only — hinge-mounting screws are
  covered separately, no double-counting):

  ```
  jointsPerCabinet = 4                          // top+bottom to left+right side (base box)
                    + 2 * structuralShelfCount   // each structural shelf joins to both sides

  cabinetScrews    = jointsPerCabinet * screwsPerJoint   // screwsPerJoint default: 2

  totalScrews          = sum(cabinetScrews across all cabinets in the project)
  totalScrewsWithMargin = ceil(totalScrews * (1 + screwWasteMarginPercent))  // default margin: 15%
  ```

  `screwsPerJoint` and `screwWasteMarginPercent` are global settings (see
  `02-domain-model.md`). Note the total is a **project-level** figure (summed
  across cabinets, one shopping-list number), unlike hinges/shelf-pins which
  are naturally per-cabinet — worth keeping that distinction in mind when
  building the "Equipment" section of the cutout list view.

  `structuralShelfCount` = `cabinet.shelves.filter(s => s.structural).length`
  — a direct count from each shelf's own flag (see `02-domain-model.md`).
- **Shelf pins:** 4 per shelf, but only for **non-structural** (pin-mounted,
  the default) shelves — `cabinet.shelves.filter(s => !s.structural).length * 4`.
  Structural shelves get screws (counted above) instead of pins.

## Testing strategy

The calculation engine should have the heaviest test coverage in the project,
since it's pure and framework-free:

- Table-driven unit tests: fixed `CabinetInput` → exact expected `Panel[]` and
  `HardwareCount`, hand-verified against real measurements.
- Edge cases: minimum/maximum realistic dimensions, zero shelves, no door,
  back disabled.
- Regression tests added whenever a formula bug is found in real use.
