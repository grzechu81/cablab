/**
 * CabLab calculation engine.
 *
 * Pure functions — no React, no three.js, no DOM. Turns a raw `CabinetInput`
 * into real panel dimensions and a hardware estimate, following the formulas in
 * `docs/03-calculation-engine.md` (Approach A: procedural, per-join-type).
 *
 * Coordinate frame (cabinet-local): origin at the front-bottom-left corner,
 * +X to the right, +Y up, +Z toward the back. `Panel.position` is the
 * minimum-corner of the panel's axis-aligned bounding box.
 *
 * Panel (width, height, thickness) → cabinet-axis mapping:
 *
 *   role                     | width | height | thickness
 *   -------------------------|-------|--------|----------
 *   top / bottom / shelf     |   X   |   Z    |    Y
 *   left-side / right-side   |   Z   |   Y    |    X
 *   back / door              |   X   |   Y    |    Z
 *
 * Where the spec is silent, the choice is marked `PROVISIONAL` below.
 */

import type {
  CabinetInput,
  CabinetGeometry,
  EdgeBanding,
  HardwareCount,
  Panel,
  PanelRole,
  Project,
  ProjectHardware,
  ProjectSettings,
} from './types'

/**
 * Door leaf height (mm) at or above which a leaf gets 3 hinges instead of 2.
 * `docs/05-decisions-log.md` lists the exact threshold as still TBD; keep it a
 * named constant so there is a single place to change it.
 */
export const HINGE_HEIGHT_THRESHOLD_MM = 1200

/** PROVISIONAL — the hanger hardware model is still a bare boolean in the spec. */
export const HANGERS_PER_CABINET = 2

/** Shelf pins per pin-mounted (non-structural) shelf. */
export const PINS_PER_SHELF = 4

/** Panel-to-panel joints in the base box (top+bottom into left+right). */
export const BASE_BOX_JOINTS = 4

// -------------------------------------------------------------------------

function resolveBoardThickness(
  input: CabinetInput,
  settings: ProjectSettings,
): number {
  return input.boardThickness || settings.defaultBoardThickness
}

/**
 * Distance from the cabinet back face to the front face of the back panel.
 * Used to keep shelves clear of the back. 0 when the cabinet has no back.
 */
function backOffset(input: CabinetInput, settings: ProjectSettings): number {
  if (!input.back.enabled) return 0
  return settings.grooveOffsetFromBack + input.back.hdfThickness
}

/**
 * Inner cavity of the carcass — see `docs/03-calculation-engine.md`.
 *
 * `innerWidth`  = width minus the two side-panel thicknesses (shelves sit here).
 * `innerHeight` = height minus the top and bottom panels (both join types put
 *                 full-thickness horizontal panels there).
 * `innerDepth`  = full depth; the back panel's clearance is applied per-formula,
 *                 not folded in here (the spec gives no `innerDepth` formula).
 */
export function computeInnerCavity(
  input: CabinetInput,
  settings: ProjectSettings,
): { innerWidth: number; innerHeight: number; innerDepth: number } {
  const bt = resolveBoardThickness(input, settings)
  return {
    innerWidth: input.width - 2 * bt,
    innerHeight: input.height - 2 * bt,
    innerDepth: input.depth,
  }
}

// -------------------------------------------------------------------------

const NO_BANDING: EdgeBanding = {
  top: false,
  left: false,
  right: false,
  bottom: false,
}

/**
 * PROVISIONAL — the spec does not define edge-banding rules. Default: band the
 * single front-facing (visible) edge of each carcass panel, all four edges of a
 * door, nothing on the hidden back panel.
 */
function edgeBandingFor(role: PanelRole): EdgeBanding {
  switch (role) {
    case 'door':
      return { top: true, left: true, right: true, bottom: true }
    case 'back':
      return { ...NO_BANDING }
    case 'left-side':
    case 'right-side':
      // width axis = Z, front (Z=0) is the width-min edge
      return { ...NO_BANDING, left: true }
    default:
      // top / bottom / shelf: height axis = Z, front (Z=0) is the height-min edge
      return { ...NO_BANDING, bottom: true }
  }
}

function panel(
  cabinetId: string,
  idSuffix: string,
  role: PanelRole,
  width: number,
  height: number,
  thickness: number,
  position: { x: number; y: number; z: number },
): Panel {
  return {
    id: `${cabinetId}:${idSuffix}`,
    cabinetId,
    role,
    width,
    height,
    thickness,
    position,
    edgeBanding: edgeBandingFor(role),
  }
}

// -------------------------------------------------------------------------

function carcassPanels(input: CabinetInput, bt: number): Panel[] {
  const { id, width: W, height: H, depth: D } = input

  if (input.joinType === 'top-first') {
    // Top & bottom span the full width; sides fit between them.
    const sideHeight = H - 2 * bt
    return [
      panel(id, 'top', 'top', W, D, bt, { x: 0, y: H - bt, z: 0 }),
      panel(id, 'bottom', 'bottom', W, D, bt, { x: 0, y: 0, z: 0 }),
      panel(id, 'left-side', 'left-side', D, sideHeight, bt, {
        x: 0,
        y: bt,
        z: 0,
      }),
      panel(id, 'right-side', 'right-side', D, sideHeight, bt, {
        x: W - bt,
        y: bt,
        z: 0,
      }),
    ]
  }

  // side-first: sides span the full height; top & bottom fit between them.
  const horizWidth = W - 2 * bt
  return [
    panel(id, 'top', 'top', horizWidth, D, bt, { x: bt, y: H - bt, z: 0 }),
    panel(id, 'bottom', 'bottom', horizWidth, D, bt, { x: bt, y: 0, z: 0 }),
    panel(id, 'left-side', 'left-side', D, H, bt, { x: 0, y: 0, z: 0 }),
    panel(id, 'right-side', 'right-side', D, H, bt, { x: W - bt, y: 0, z: 0 }),
  ]
}

function backPanel(
  input: CabinetInput,
  settings: ProjectSettings,
  bt: number,
): Panel | null {
  if (!input.back.enabled) return null

  const { innerWidth, innerHeight } = computeInnerCavity(input, settings)
  const hdf = input.back.hdfThickness

  return panel(
    input.id,
    'back',
    'back',
    innerWidth + 2 * settings.grooveDepth, // extends into the groove on both sides
    innerHeight,
    hdf,
    {
      x: bt - settings.grooveDepth,
      y: bt,
      z: input.depth - settings.grooveOffsetFromBack - hdf,
    },
  )
}

function shelfPanels(
  input: CabinetInput,
  settings: ProjectSettings,
  bt: number,
): Panel[] {
  if (input.shelves.length === 0) return []

  const { innerWidth } = computeInnerCavity(input, settings)
  const clearBack = backOffset(input, settings)

  return input.shelves.map((shelf) => {
    const shelfDepth = input.depth - clearBack - shelf.frontOffset
    return panel(input.id, `shelf:${shelf.id}`, 'shelf', innerWidth, shelfDepth, bt, {
      x: bt,
      y: shelf.heightOffset,
      z: shelf.frontOffset,
    })
  })
}

function doorPanels(input: CabinetInput, settings: ProjectSettings, bt: number): Panel[] {
  const { config, overlayType } = input.doors
  if (config === 'none') return []

  if (overlayType !== 'full-overlay') {
    // Only full-overlay has a settled formula in v1 — docs/03 + docs/05.
    throw new Error(
      `Door overlayType "${overlayType}" has no sizing formula yet (v1 supports full-overlay only)`,
    )
  }

  const { width: W, height: H } = input
  const margin = settings.doorEdgeMargin
  const doorHeight = H - 2 * margin
  const doorThickness = bt // PROVISIONAL: no dedicated door-thickness setting yet
  const zFront = -doorThickness // door sits in front of the front face (Z=0)

  if (config === 'single') {
    return [
      panel(input.id, 'door', 'door', W - 2 * margin, doorHeight, doorThickness, {
        x: margin,
        y: margin,
        z: zFront,
      }),
    ]
  }

  // double
  const totalDoorWidth = W - 2 * margin
  const leafWidth = (totalDoorWidth - settings.doorCenterGap) / 2
  return [
    panel(input.id, 'door:left', 'door', leafWidth, doorHeight, doorThickness, {
      x: margin,
      y: margin,
      z: zFront,
    }),
    panel(input.id, 'door:right', 'door', leafWidth, doorHeight, doorThickness, {
      x: margin + leafWidth + settings.doorCenterGap,
      y: margin,
      z: zFront,
    }),
  ]
}

// -------------------------------------------------------------------------

function hingesPerLeaf(leafHeight: number): number {
  return leafHeight >= HINGE_HEIGHT_THRESHOLD_MM ? 3 : 2
}

function computeHardware(
  input: CabinetInput,
  settings: ProjectSettings,
  doors: Panel[],
): HardwareCount {
  const structuralShelves = input.shelves.filter((s) => s.structural).length
  const pinMountedShelves = input.shelves.length - structuralShelves

  const joints = BASE_BOX_JOINTS + 2 * structuralShelves

  const hinges = doors.reduce((sum, leaf) => sum + hingesPerLeaf(leaf.height), 0)

  return {
    hinges,
    screws: joints * settings.screwsPerJoint,
    shelfPins: pinMountedShelves * PINS_PER_SHELF,
    hangers: input.hanger.enabled ? HANGERS_PER_CABINET : 0,
  }
}

// -------------------------------------------------------------------------

/**
 * Derive the full geometry (panels + hardware) for a single cabinet from its
 * raw input. Pure and deterministic: same input → same output, byte for byte.
 */
export function computeCabinetGeometry(
  input: CabinetInput,
  settings: ProjectSettings,
): CabinetGeometry {
  const bt = resolveBoardThickness(input, settings)

  const carcass = carcassPanels(input, bt)
  const back = backPanel(input, settings, bt)
  const shelves = shelfPanels(input, settings, bt)
  const doors = doorPanels(input, settings, bt)

  const panels: Panel[] = [
    ...carcass,
    ...(back ? [back] : []),
    ...shelves,
    ...doors,
  ]

  return {
    cabinetId: input.id,
    panels,
    hardware: computeHardware(input, settings, doors),
  }
}

/**
 * Project-level hardware totals. Hinges / shelf pins / hangers are a plain sum
 * of the per-cabinet figures; screws are summed and then a waste margin is
 * applied once, at the project level — `docs/03-calculation-engine.md`.
 */
export function computeProjectHardware(project: Project): ProjectHardware {
  const totals = project.cabinets.reduce(
    (acc, cabinet) => {
      const { hardware } = computeCabinetGeometry(cabinet, project.settings)
      acc.hinges += hardware.hinges
      acc.shelfPins += hardware.shelfPins
      acc.hangers += hardware.hangers
      acc.screws += hardware.screws
      return acc
    },
    { hinges: 0, shelfPins: 0, hangers: 0, screws: 0 },
  )

  return {
    ...totals,
    screwsWithMargin: Math.ceil(
      totals.screws * (1 + project.settings.screwWasteMarginPercent),
    ),
  }
}
