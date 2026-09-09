import { describe, expect, it } from 'vitest'
import {
  computeCabinetGeometry,
  computeInnerCavity,
  computeProjectHardware,
  HINGE_HEIGHT_THRESHOLD_MM,
} from './geometry'
import type {
  CabinetGeometry,
  CabinetInput,
  PanelRole,
  Project,
  ProjectSettings,
  ShelfInput,
} from './types'

// --- fixtures ------------------------------------------------------------

const SETTINGS: ProjectSettings = {
  showDimensions: true,
  defaultBoardThickness: 18,
  doorEdgeMargin: 2.5,
  doorCenterGap: 3,
  grooveWidth: 3,
  grooveDepth: 8,
  grooveOffsetFromBack: 10,
  screwsPerJoint: 2,
  screwWasteMarginPercent: 0.15,
}

/** 600 × 720 × 400, 18 mm board, top-first, nothing added. */
function makeCabinet(overrides: Partial<CabinetInput> = {}): CabinetInput {
  return {
    id: 'cab-1',
    name: 'Test cabinet',
    width: 600,
    height: 720,
    depth: 400,
    joinType: 'top-first',
    boardThickness: 18,
    shelves: [],
    doors: { config: 'none', overlayType: 'full-overlay' },
    back: { enabled: false, hdfThickness: 3 },
    hanger: { enabled: false },
    position: { x: 0, y: 0, z: 0 },
    positionMode: 'auto',
    ...overrides,
  }
}

function makeShelf(overrides: Partial<ShelfInput> = {}): ShelfInput {
  return { id: 's', frontOffset: 0, heightOffset: 300, structural: false, ...overrides }
}

function panelByRole(geo: CabinetGeometry, role: PanelRole) {
  const found = geo.panels.filter((p) => p.role === role)
  if (found.length === 0) throw new Error(`no panel with role ${role}`)
  return found[0]
}

function panelsByRole(geo: CabinetGeometry, role: PanelRole) {
  return geo.panels.filter((p) => p.role === role)
}

function dims(p: { width: number; height: number; thickness: number }) {
  return { width: p.width, height: p.height, thickness: p.thickness }
}

// --- carcass panels -----------------------------------------------------

describe('computeCabinetGeometry — carcass panels', () => {
  interface Case {
    name: string
    input: CabinetInput
    expected: Partial<
      Record<
        PanelRole,
        {
          width: number
          height: number
          thickness: number
          position: { x: number; y: number; z: number }
        }
      >
    >
  }

  const cases: Case[] = [
    {
      name: 'top-first 600×720×400 — top/bottom span full width, sides fit between',
      input: makeCabinet({ joinType: 'top-first' }),
      expected: {
        top: { width: 600, height: 400, thickness: 18, position: { x: 0, y: 702, z: 0 } },
        bottom: { width: 600, height: 400, thickness: 18, position: { x: 0, y: 0, z: 0 } },
        'left-side': { width: 400, height: 684, thickness: 18, position: { x: 0, y: 18, z: 0 } },
        'right-side': { width: 400, height: 684, thickness: 18, position: { x: 582, y: 18, z: 0 } },
      },
    },
    {
      name: 'side-first 600×720×400 — sides span full height, top/bottom fit between',
      input: makeCabinet({ joinType: 'side-first' }),
      expected: {
        top: { width: 564, height: 400, thickness: 18, position: { x: 18, y: 702, z: 0 } },
        bottom: { width: 564, height: 400, thickness: 18, position: { x: 18, y: 0, z: 0 } },
        'left-side': { width: 400, height: 720, thickness: 18, position: { x: 0, y: 0, z: 0 } },
        'right-side': { width: 400, height: 720, thickness: 18, position: { x: 582, y: 0, z: 0 } },
      },
    },
    {
      name: 'thicker board (25 mm), top-first — side height shrinks by 2× thickness',
      input: makeCabinet({ joinType: 'top-first', boardThickness: 25 }),
      expected: {
        top: { width: 600, height: 400, thickness: 25, position: { x: 0, y: 695, z: 0 } },
        'left-side': { width: 400, height: 670, thickness: 25, position: { x: 0, y: 25, z: 0 } },
      },
    },
    {
      name: 'boardThickness 0 falls back to ProjectSettings.defaultBoardThickness',
      input: makeCabinet({ joinType: 'top-first', boardThickness: 0 }),
      expected: {
        'left-side': { width: 400, height: 684, thickness: 18, position: { x: 0, y: 18, z: 0 } },
      },
    },
  ]

  it.each(cases)('$name', ({ input, expected }) => {
    const geo = computeCabinetGeometry(input, SETTINGS)
    for (const [role, want] of Object.entries(expected)) {
      const p = panelByRole(geo, role as PanelRole)
      expect({ ...dims(p), position: p.position }).toEqual({
        width: want.width,
        height: want.height,
        thickness: want.thickness,
        position: want.position,
      })
    }
  })

  it('emits exactly the four carcass panels when nothing else is configured', () => {
    const geo = computeCabinetGeometry(makeCabinet(), SETTINGS)
    expect(geo.panels.map((p) => p.role)).toEqual([
      'top',
      'bottom',
      'left-side',
      'right-side',
    ])
    expect(geo.cabinetId).toBe('cab-1')
  })

  it('is deterministic — same input produces a deep-equal result', () => {
    const input = makeCabinet({ shelves: [makeShelf({ id: 's1', frontOffset: 20 })] })
    expect(computeCabinetGeometry(input, SETTINGS)).toEqual(
      computeCabinetGeometry(input, SETTINGS),
    )
  })
})

// --- back panel --------------------------------------------------------

describe('computeCabinetGeometry — back panel', () => {
  it('is absent when back.enabled is false', () => {
    const geo = computeCabinetGeometry(makeCabinet({ back: { enabled: false, hdfThickness: 3 } }), SETTINGS)
    expect(panelsByRole(geo, 'back')).toHaveLength(0)
  })

  it.each([
    {
      name: 'hdf 3 mm, groove depth 8, offset-from-back 10',
      settings: SETTINGS,
      hdf: 3,
      // innerWidth 564, innerHeight 684
      expected: {
        width: 564 + 2 * 8, // 580 — extends into the groove on both sides
        height: 684,
        thickness: 3,
        position: { x: 18 - 8, y: 18, z: 400 - 10 - 3 }, // { 10, 18, 387 }
      },
    },
    {
      name: 'hdf 6 mm — z position shifts forward by the extra thickness',
      settings: SETTINGS,
      hdf: 6,
      expected: {
        width: 580,
        height: 684,
        thickness: 6,
        position: { x: 10, y: 18, z: 400 - 10 - 6 }, // { 10, 18, 384 }
      },
    },
  ])('$name', ({ settings, hdf, expected }) => {
    const geo = computeCabinetGeometry(
      makeCabinet({ back: { enabled: true, hdfThickness: hdf } }),
      settings,
    )
    const back = panelByRole(geo, 'back')
    expect({ ...dims(back), position: back.position }).toEqual({
      width: expected.width,
      height: expected.height,
      thickness: expected.thickness,
      position: expected.position,
    })
  })
})

// --- shelves ----------------------------------------------------------

describe('computeCabinetGeometry — shelves', () => {
  it('sizes each shelf from the cabinet; frontOffset drives depth, heightOffset drives Y', () => {
    const geo = computeCabinetGeometry(
      makeCabinet({
        shelves: [
          makeShelf({ id: 'a', frontOffset: 0, heightOffset: 240 }),
          makeShelf({ id: 'b', frontOffset: 40, heightOffset: 480 }),
        ],
      }),
      SETTINGS,
    )
    const [a, b] = panelsByRole(geo, 'shelf')
    // width = innerWidth = 600 - 2*18; depth = depth - backOffset - frontOffset
    expect(dims(a)).toEqual({ width: 564, height: 400, thickness: 18 })
    expect(dims(b)).toEqual({ width: 564, height: 360, thickness: 18 })
    // x = board thickness, y = heightOffset (underside of shelf), z = frontOffset
    expect(a.position).toEqual({ x: 18, y: 240, z: 0 })
    expect(b.position).toEqual({ x: 18, y: 480, z: 40 })
  })

  it('subtracts the back-panel clearance from shelf depth when a back is present', () => {
    const geo = computeCabinetGeometry(
      makeCabinet({
        back: { enabled: true, hdfThickness: 3 },
        shelves: [makeShelf({ id: 'a', frontOffset: 0 })],
      }),
      SETTINGS,
    )
    // depth - (grooveOffsetFromBack + hdf) - frontOffset = 400 - 13 - 0
    expect(panelByRole(geo, 'shelf').height).toBe(387)
  })

  it('ids are stable and derived from the cabinet and shelf ids', () => {
    const geo = computeCabinetGeometry(
      makeCabinet({ shelves: [makeShelf({ id: 'mid' })] }),
      SETTINGS,
    )
    expect(panelByRole(geo, 'shelf').id).toBe('cab-1:shelf:mid')
  })
})

// --- doors ----------------------------------------------------------

describe('computeCabinetGeometry — doors (full-overlay)', () => {
  it('no door panels when config is none', () => {
    expect(panelsByRole(computeCabinetGeometry(makeCabinet(), SETTINGS), 'door')).toHaveLength(0)
  })

  it('single door: width/height inset by the edge margin on every side', () => {
    const geo = computeCabinetGeometry(
      makeCabinet({ doors: { config: 'single', overlayType: 'full-overlay' } }),
      SETTINGS,
    )
    const door = panelByRole(geo, 'door')
    expect(dims(door)).toEqual({ width: 595, height: 715, thickness: 18 })
    expect(door.position).toEqual({ x: 2.5, y: 2.5, z: -18 })
  })

  it('double door: two equal leaves split by the center gap', () => {
    const geo = computeCabinetGeometry(
      makeCabinet({ doors: { config: 'double', overlayType: 'full-overlay' } }),
      SETTINGS,
    )
    const [left, right] = panelsByRole(geo, 'door')
    // (595 - 3) / 2 = 296
    expect(dims(left)).toEqual({ width: 296, height: 715, thickness: 18 })
    expect(dims(right)).toEqual({ width: 296, height: 715, thickness: 18 })
    expect(left.position).toEqual({ x: 2.5, y: 2.5, z: -18 })
    expect(right.position).toEqual({ x: 2.5 + 296 + 3, y: 2.5, z: -18 })
  })

  it.each(['half-overlay', 'inset'] as const)(
    'throws for the not-yet-specified overlay type %s',
    (overlayType) => {
      expect(() =>
        computeCabinetGeometry(
          makeCabinet({ doors: { config: 'single', overlayType } }),
          SETTINGS,
        ),
      ).toThrow(/full-overlay only/)
    },
  )
})

// --- hardware -------------------------------------------------------

describe('computeCabinetGeometry — hardware count', () => {
  interface Case {
    name: string
    input: Partial<CabinetInput>
    expected: { hinges: number; screws: number; shelfPins: number; hangers: number }
  }

  const cases: Case[] = [
    {
      name: 'bare box — 4 joints × 2 screws/joint, no hinges/pins/hangers',
      input: {},
      expected: { hinges: 0, screws: 8, shelfPins: 0, hangers: 0 },
    },
    {
      name: 'three pin-mounted shelves — 4 pins each, joint count unchanged',
      input: {
        shelves: [
          makeShelf({ id: 'a' }),
          makeShelf({ id: 'b' }),
          makeShelf({ id: 'c' }),
        ],
      },
      expected: { hinges: 0, screws: 8, shelfPins: 12, hangers: 0 },
    },
    {
      name: 'two structural shelves — +2 joints each, no pins',
      input: {
        shelves: [
          makeShelf({ id: 'a', structural: true }),
          makeShelf({ id: 'b', structural: true }),
        ],
      },
      expected: { hinges: 0, screws: (4 + 2 * 2) * 2, shelfPins: 0, hangers: 0 },
    },
    {
      name: 'mixed shelves — structural adds joints, pin-mounted adds pins',
      input: {
        shelves: [
          makeShelf({ id: 'a', structural: true }),
          makeShelf({ id: 'b', structural: false }),
        ],
      },
      expected: { hinges: 0, screws: (4 + 2) * 2, shelfPins: 4, hangers: 0 },
    },
    {
      name: 'single door under the hinge-height threshold — 2 hinges',
      input: { doors: { config: 'single', overlayType: 'full-overlay' } },
      expected: { hinges: 2, screws: 8, shelfPins: 0, hangers: 0 },
    },
    {
      name: 'double door under the threshold — 2 hinges per leaf',
      input: { doors: { config: 'double', overlayType: 'full-overlay' } },
      expected: { hinges: 4, screws: 8, shelfPins: 0, hangers: 0 },
    },
    {
      name: 'tall single door at/above the threshold — 3 hinges',
      input: {
        height: HINGE_HEIGHT_THRESHOLD_MM + 2 * SETTINGS.doorEdgeMargin,
        doors: { config: 'single', overlayType: 'full-overlay' },
      },
      expected: { hinges: 3, screws: 8, shelfPins: 0, hangers: 0 },
    },
    {
      name: 'hanger enabled',
      input: { hanger: { enabled: true } },
      expected: { hinges: 0, screws: 8, shelfPins: 0, hangers: 2 },
    },
  ]

  it.each(cases)('$name', ({ input, expected }) => {
    const geo = computeCabinetGeometry(makeCabinet(input), SETTINGS)
    expect(geo.hardware).toEqual(expected)
  })
})

// --- edge banding --------------------------------------------------

describe('computeCabinetGeometry — edge banding (provisional rules)', () => {
  it('bands the front edge of carcass panels, all edges of doors, none of the back', () => {
    const geo = computeCabinetGeometry(
      makeCabinet({
        back: { enabled: true, hdfThickness: 3 },
        doors: { config: 'single', overlayType: 'full-overlay' },
        shelves: [makeShelf({ id: 'a' })],
      }),
      SETTINGS,
    )
    expect(panelByRole(geo, 'top').edgeBanding).toEqual({ top: false, left: false, right: false, bottom: true })
    expect(panelByRole(geo, 'left-side').edgeBanding).toEqual({ top: false, left: true, right: false, bottom: false })
    expect(panelByRole(geo, 'shelf').edgeBanding).toEqual({ top: false, left: false, right: false, bottom: true })
    expect(panelByRole(geo, 'back').edgeBanding).toEqual({ top: false, left: false, right: false, bottom: false })
    expect(panelByRole(geo, 'door').edgeBanding).toEqual({ top: true, left: true, right: true, bottom: true })
  })
})

// --- computeInnerCavity ------------------------------------------

describe('computeInnerCavity', () => {
  it.each([
    { w: 600, h: 720, d: 400, bt: 18, expected: { innerWidth: 564, innerHeight: 684, innerDepth: 400 } },
    { w: 900, h: 2100, d: 560, bt: 18, expected: { innerWidth: 864, innerHeight: 2064, innerDepth: 560 } },
    { w: 400, h: 400, d: 300, bt: 25, expected: { innerWidth: 350, innerHeight: 350, innerDepth: 300 } },
  ])('$w×$h×$d @ $bt mm', ({ w, h, d, bt, expected }) => {
    expect(
      computeInnerCavity(makeCabinet({ width: w, height: h, depth: d, boardThickness: bt }), SETTINGS),
    ).toEqual(expected)
  })

  it('uses the default board thickness when the cabinet leaves it at 0', () => {
    expect(computeInnerCavity(makeCabinet({ boardThickness: 0 }), SETTINGS)).toEqual({
      innerWidth: 564,
      innerHeight: 684,
      innerDepth: 400,
    })
  })
})

// --- computeProjectHardware ------------------------------------

describe('computeProjectHardware', () => {
  function makeProject(cabinets: CabinetInput[]): Project {
    return { schemaVersion: 1, settings: SETTINGS, cabinets }
  }

  it('sums per-cabinet counts and applies the screw waste margin once, project-wide', () => {
    const project = makeProject([
      makeCabinet({ id: 'a', doors: { config: 'single', overlayType: 'full-overlay' } }),
      makeCabinet({
        id: 'b',
        shelves: [
          makeShelf({ id: 's1', structural: true }),
          makeShelf({ id: 's2', structural: false }),
        ],
      }),
    ])
    // screws: a = 8, b = (4+2)*2 = 12 → 20; ceil(20 * 1.15) = 23
    expect(computeProjectHardware(project)).toEqual({
      hinges: 2,
      shelfPins: 4,
      hangers: 0,
      screws: 20,
      screwsWithMargin: 23,
    })
  })

  it.each([
    { screws: 8, margin: 0.15, expected: 10 }, // ceil(9.2)
    { screws: 8, margin: 0, expected: 8 },
    { screws: 100, margin: 0.15, expected: 115 },
  ])('rounds ceil(screws=$screws × (1+$margin)) = $expected', ({ screws, margin, expected }) => {
    // one bare cabinet = 8 screws; scale joints via structural shelves to hit `screws`
    const jointScrews = screws / SETTINGS.screwsPerJoint
    const structuralShelves = (jointScrews - 4) / 2
    const shelves =
      structuralShelves > 0
        ? Array.from({ length: structuralShelves }, (_, i) =>
            makeShelf({ id: `s${i}`, structural: true }),
          )
        : []
    const project: Project = {
      schemaVersion: 1,
      settings: { ...SETTINGS, screwWasteMarginPercent: margin },
      cabinets: [makeCabinet({ shelves })],
    }
    const result = computeProjectHardware(project)
    expect(result.screws).toBe(screws)
    expect(result.screwsWithMargin).toBe(expected)
  })
})
