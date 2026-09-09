# CabLab — Domain Model

All dimensions in millimeters unless noted. These are TypeScript-shaped sketches
to align on fields — exact types can be refined once coding starts.

## CabinetInput (raw, user-set — this is what gets persisted)

```ts
type JoinType = 'top-first' | 'side-first';
type DoorConfig = 'none' | 'single' | 'double';
type PositionMode = 'auto' | 'manual';

interface ShelfInput {
  id: string;
  frontOffset: number;  // mm from cabinet front
  structural: boolean;  // default: false — pin-mounted (adjustable, the default).
                         // true = screwed to both sides ("structural"); contributes
                         // to the screw count instead of the shelf-pin count.
}

interface CabinetInput {
  id: string;
  name: string;

  width: number;
  height: number;
  depth: number;

  joinType: JoinType;
  boardThickness: number; // falls back to ProjectSettings.defaultBoardThickness

  shelves: ShelfInput[];

  doors: {
    config: DoorConfig;
    overlayType: 'full-overlay' | 'half-overlay' | 'inset'; // default: 'full-overlay'
    // margins/gaps are NOT per-cabinet — see ProjectSettings.doorEdgeMargin / doorCenterGap
  };

  back: {
    enabled: boolean;
    hdfThickness: number;
    // groove is routed into the two side panels only (v1) — width/depth/offset
    // are global settings, see ProjectSettings.grooveWidth / grooveDepth / grooveOffsetFromBack.
    // Lip-mounted back (no groove) is deferred to a future version.
  };

  hanger: {
    enabled: boolean;
    // TBD: hanger type/spec once we pick real hardware to model
  };

  position: { x: number; y: number; z: number };
  positionMode: PositionMode; // 'auto' = follow auto-placement rule, 'manual' = user has dragged it
}
```

## ProjectSettings

```ts
interface ProjectSettings {
  showDimensions: boolean;
  defaultBoardThickness: number; // default 18mm
  doorEdgeMargin: number;  // default ~2.5mm — gap between door and cabinet outer edge (full-overlay)
  doorCenterGap: number;   // default ~3mm — gap between the two leaves of a double door
  grooveWidth: number;     // default 3mm — width of the routed back-panel groove
  grooveDepth: number;     // default 8mm — how deep the groove is cut into the side panel
  grooveOffsetFromBack: number; // default e.g. 10mm — distance from the panel's back edge to the groove
  screwsPerJoint: number;       // default 2 — screws used per panel-to-panel structural joint
  screwWasteMarginPercent: number; // default 0.15 (15%) — added on top of the raw screw count
  // TBD: other global settings as they come up
}
```

## Panel (derived — output of the calculation engine)

```ts
interface Panel {
  id: string;
  cabinetId: string;
  role: 'top' | 'bottom' | 'left-side' | 'right-side' | 'shelf' | 'back' | 'door';
  width: number;
  height: number;
  thickness: number;
  position: { x: number; y: number; z: number }; // relative to cabinet origin
  rotation?: { x: number; y: number; z: number };
  edgeBanding: {
    top: boolean; left: boolean; right: boolean; bottom: boolean;
  };
}
```

## HardwareCount (derived)

```ts
interface HardwareCount {
  hinges: number;
  screws: number;
  shelfPins: number;
  hangers: number;
}
```

## CabinetGeometry (derived — full output for one cabinet)

```ts
interface CabinetGeometry {
  cabinetId: string;
  panels: Panel[];
  hardware: HardwareCount;
}
```

## CutoutListEntry (derived — for the readable cutout list view)

```ts
interface CutoutListEntry {
  cabinetName: string;
  panelRole: string;
  width: number;
  height: number;
  thickness: number;
  edgeBandedEdges: string[]; // e.g. ['top', 'left']
  quantity: number;
}
```

## Project (top-level save/load shape)

```ts
interface Project {
  schemaVersion: number; // see 04-persistence-schema.md
  settings: ProjectSettings;
  cabinets: CabinetInput[];
}
```

## Open fields marked TBD

- Half-overlay and inset door sizing formulas are still undefined — only
  full-overlay (the default) has a settled formula so far. See
  `03-calculation-engine.md`.
- Hanger spec — currently just a boolean; needs a real hardware model once we
  decide which hanger types to support.
