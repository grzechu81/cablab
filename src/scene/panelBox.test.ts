import { describe, expect, it } from 'vitest'
import { panelBox, panelsBounds } from './panelBox'
import { computeCabinetGeometry } from '../domain/geometry'
import { resolveCabinetPositions } from './layout'
import type { CabinetInput, Panel, ProjectSettings } from '../domain/types'

const SETTINGS: ProjectSettings = {
  showDimensions: true,
  defaultBoardThickness: 18,
  defaultShelfFrontOffset: 20,
  doorEdgeMargin: 2.5,
  doorCenterGap: 3,
  grooveWidth: 3,
  grooveDepth: 8,
  grooveOffsetFromBack: 10,
  screwsPerJoint: 2,
  screwWasteMarginPercent: 0.15,
}

function makeCabinet(overrides: Partial<CabinetInput> = {}): CabinetInput {
  return {
    id: 'c',
    name: 'C',
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

const panel = (role: Panel['role'], over: Partial<Panel> = {}): Panel => ({
  id: 'p',
  cabinetId: 'c',
  role,
  width: 100,
  height: 200,
  thickness: 18,
  position: { x: 0, y: 0, z: 0 },
  edgeBanding: { top: false, left: false, right: false, bottom: false },
  ...over,
})

describe('panelBox — axis mapping', () => {
  it('lays a top/bottom/shelf panel flat (thickness on Y)', () => {
    expect(panelBox(panel('top')).size).toEqual([100, 18, 200])
  })

  it('stands a side panel up (thickness on X, width along Z)', () => {
    expect(panelBox(panel('left-side')).size).toEqual([18, 200, 100])
  })

  it('leaves a back/door panel upright (thickness on Z)', () => {
    expect(panelBox(panel('door')).size).toEqual([100, 200, 18])
  })

  it('centres the box at position + half-size', () => {
    const box = panelBox(panel('door', { position: { x: 10, y: 20, z: -18 } }))
    expect(box.center).toEqual([10 + 50, 20 + 100, -18 + 9])
  })
})

describe('panelsBounds', () => {
  it('spans a top-first cabinet from the origin to its outer dimensions', () => {
    const geo = computeCabinetGeometry(makeCabinet(), SETTINGS)
    const { min, max } = panelsBounds(geo.panels)
    expect(min).toEqual([0, 0, 0])
    expect(max).toEqual([600, 720, 400])
  })

  it('includes a door that sits in front of the front face (negative Z)', () => {
    const geo = computeCabinetGeometry(
      makeCabinet({ doors: { config: 'single', overlayType: 'full-overlay' } }),
      SETTINGS,
    )
    expect(panelsBounds(geo.panels).min[2]).toBe(-18)
  })
})

describe('resolveCabinetPositions', () => {
  it('lays out auto cabinets left to right with a gap', () => {
    const positions = resolveCabinetPositions([
      makeCabinet({ id: 'a', width: 600 }),
      makeCabinet({ id: 'b', width: 400 }),
      makeCabinet({ id: 'c', width: 800 }),
    ])
    expect(positions.a).toEqual({ x: 0, y: 0, z: 0 })
    expect(positions.b).toEqual({ x: 640, y: 0, z: 0 })
    expect(positions.c).toEqual({ x: 1080, y: 0, z: 0 })
  })

  it('uses the stored position for manual cabinets and does not advance the cursor', () => {
    const positions = resolveCabinetPositions([
      makeCabinet({ id: 'a', width: 600, positionMode: 'manual', position: { x: 5000, y: 0, z: 100 } }),
      makeCabinet({ id: 'b', width: 400 }),
    ])
    expect(positions.a).toEqual({ x: 5000, y: 0, z: 100 })
    expect(positions.b).toEqual({ x: 0, y: 0, z: 0 })
  })
})
