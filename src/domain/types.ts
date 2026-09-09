/**
 * CabLab domain model.
 *
 * Shapes mirror `docs/02-domain-model.md`. All dimensions are millimetres.
 *
 * `CabinetInput` / `ProjectSettings` / `Project` are the *raw, user-set* data
 * that gets persisted. Everything below the `// --- derived ---` line is the
 * output of the calculation engine (`computeCabinetGeometry`) and is never
 * stored — see `docs/01-architecture.md` ("derive, don't store").
 */

export type JoinType = 'top-first' | 'side-first'
export type DoorConfig = 'none' | 'single' | 'double'
export type OverlayType = 'full-overlay' | 'half-overlay' | 'inset'
export type PositionMode = 'auto' | 'manual'

export interface ShelfInput {
  id: string
  /** mm from the cabinet front face */
  frontOffset: number
  /** mm from the cabinet bottom (outer, Y=0) to the underside of the shelf */
  heightOffset: number
  /**
   * false (default) = pin-mounted / adjustable → contributes to `shelfPins`.
   * true = screwed to both side panels ("structural") → contributes to `screws`.
   */
  structural: boolean
}

export interface CabinetInput {
  id: string
  name: string

  width: number
  height: number
  depth: number

  joinType: JoinType
  /** Falls back to `ProjectSettings.defaultBoardThickness` when 0 / undefined. */
  boardThickness: number

  shelves: ShelfInput[]

  doors: {
    config: DoorConfig
    overlayType: OverlayType
    /** Render the doors semi-transparent so the interior stays visible (view only). */
    seeThrough: boolean
  }

  back: {
    enabled: boolean
    hdfThickness: number
  }

  hanger: {
    enabled: boolean
  }

  position: Vec3
  positionMode: PositionMode
}

export interface ProjectSettings {
  showDimensions: boolean
  defaultBoardThickness: number
  /** `frontOffset` (mm) seeded into a newly added shelf. */
  defaultShelfFrontOffset: number
  /** Gap between a full-overlay door and the cabinet outer edge. */
  doorEdgeMargin: number
  /** Gap between the two leaves of a double door. */
  doorCenterGap: number
  /** Width of the routed back-panel groove. */
  grooveWidth: number
  /** How deep the groove is cut into each side panel. */
  grooveDepth: number
  /** Distance from a side panel's back edge to the groove. */
  grooveOffsetFromBack: number
  /** Screws per panel-to-panel structural joint. */
  screwsPerJoint: number
  /** Added on top of the raw project screw count, e.g. 0.15 = +15%. */
  screwWasteMarginPercent: number
}

export interface Project {
  schemaVersion: number
  settings: ProjectSettings
  cabinets: CabinetInput[]
}

// --- derived ---------------------------------------------------------------

export interface Vec3 {
  x: number
  y: number
  z: number
}

export type PanelRole =
  | 'top'
  | 'bottom'
  | 'left-side'
  | 'right-side'
  | 'shelf'
  | 'back'
  | 'door'

export interface EdgeBanding {
  top: boolean
  left: boolean
  right: boolean
  bottom: boolean
}

export interface Panel {
  id: string
  cabinetId: string
  role: PanelRole
  /** First face dimension of the panel as cut (see engine docs for axis mapping). */
  width: number
  /** Second face dimension of the panel as cut. */
  height: number
  /** Material thickness. */
  thickness: number
  /**
   * Minimum-corner position of the panel's axis-aligned bounding box, in the
   * cabinet-local frame (origin = front-bottom-left, +X right, +Y up,
   * +Z toward the back — `docs/03-calculation-engine.md`).
   */
  position: Vec3
  edgeBanding: EdgeBanding
}

export interface HardwareCount {
  hinges: number
  /** Raw panel-joint screws for THIS cabinet (no waste margin). */
  screws: number
  shelfPins: number
  hangers: number
}

export interface CabinetGeometry {
  cabinetId: string
  panels: Panel[]
  hardware: HardwareCount
}

/**
 * One row of the human-readable cut list. Identical panels (same cabinet, role,
 * dimensions and edge-banding) are collapsed into a single entry with a
 * `quantity` — see `buildCutoutList` in `./cutout.ts`.
 */
export interface CutoutListEntry {
  cabinetName: string
  panelRole: PanelRole
  width: number
  height: number
  thickness: number
  /**
   * Which edges get banded, by the length they run: `W` per banded edge whose
   * length is the panel width (top / bottom), `H` per edge whose length is the
   * panel height (left / right), W's first. e.g. `'WWHH'` = all four edges,
   * `'W'` = one long edge, `''` = none.
   */
  edgeBanding: string
  quantity: number
}

export interface ProjectHardware {
  /** Sum of per-cabinet hinge counts. */
  hinges: number
  /** Sum of per-cabinet shelf-pin counts. */
  shelfPins: number
  /** Sum of per-cabinet hanger counts. */
  hangers: number
  /** Sum of raw per-cabinet screw counts. */
  screws: number
  /** `ceil(screws * (1 + screwWasteMarginPercent))` — the shopping-list number. */
  screwsWithMargin: number
}
