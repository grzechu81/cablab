import { describe, expect, it } from 'vitest'
import { buildCutoutList } from './cutout'
import { computeCabinetGeometry } from './geometry'
import type { CabinetInput, ProjectSettings } from './types'

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

function makeCabinet(overrides: Partial<CabinetInput> = {}): CabinetInput {
  return {
    id: 'cab-1',
    name: 'Cabinet 1',
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

function shelf(id: string, frontOffset: number, heightOffset: number, structural = false) {
  return { id, frontOffset, heightOffset, structural }
}

function cutList(cabinets: CabinetInput[]) {
  return buildCutoutList(
    cabinets.map((c) => computeCabinetGeometry(c, SETTINGS)),
    Object.fromEntries(cabinets.map((c) => [c.id, c.name])),
  )
}

describe('buildCutoutList — grouping', () => {
  it('collapses two shelves that differ only in heightOffset into one row', () => {
    const list = cutList([
      makeCabinet({
        shelves: [shelf('a', 0, 240), shelf('b', 0, 480)],
      }),
    ])
    const shelves = list.filter((e) => e.panelRole === 'shelf')
    expect(shelves).toHaveLength(1)
    expect(shelves[0].quantity).toBe(2)
  })

  it('keeps shelves with different frontOffset as separate rows', () => {
    const list = cutList([
      makeCabinet({
        shelves: [shelf('a', 0, 240), shelf('b', 40, 480)],
      }),
    ])
    expect(list.filter((e) => e.panelRole === 'shelf')).toHaveLength(2)
  })

  it('collapses the two leaves of a double door', () => {
    const list = cutList([
      makeCabinet({ doors: { config: 'double', overlayType: 'full-overlay' } }),
    ])
    const doors = list.filter((e) => e.panelRole === 'door')
    expect(doors).toHaveLength(1)
    expect(doors[0]).toMatchObject({
      quantity: 2,
      width: 296,
      height: 715,
      thickness: 18,
      edgeBandedEdges: ['top', 'left', 'right', 'bottom'],
    })
  })

  it('does NOT merge left-side and right-side even when dimensions match', () => {
    const list = cutList([makeCabinet()])
    const sides = list.filter((e) => e.panelRole.endsWith('-side'))
    expect(sides).toHaveLength(2)
    expect(sides.every((e) => e.quantity === 1)).toBe(true)
  })

  it('never merges identical panels across different cabinets', () => {
    const list = cutList([
      makeCabinet({ id: 'a', name: 'Left' }),
      makeCabinet({ id: 'b', name: 'Right' }),
    ])
    const tops = list.filter((e) => e.panelRole === 'top')
    expect(tops).toHaveLength(2)
    expect(tops.map((e) => e.cabinetName).sort()).toEqual(['Left', 'Right'])
    expect(tops.every((e) => e.quantity === 1)).toBe(true)
  })
})

describe('buildCutoutList — edgeBandedEdges', () => {
  it('flattens EdgeBanding in the fixed top/left/right/bottom order', () => {
    const list = cutList([
      makeCabinet({
        back: { enabled: true, hdfThickness: 3 },
        doors: { config: 'single', overlayType: 'full-overlay' },
      }),
    ])
    const by = (role: string) => list.find((e) => e.panelRole === role)!
    expect(by('door').edgeBandedEdges).toEqual(['top', 'left', 'right', 'bottom'])
    expect(by('top').edgeBandedEdges).toEqual(['bottom'])
    expect(by('left-side').edgeBandedEdges).toEqual(['left'])
    expect(by('back').edgeBandedEdges).toEqual([])
  })
})

describe('buildCutoutList — names & ordering', () => {
  it('falls back to the cabinet id when no name is provided', () => {
    const list = buildCutoutList(
      [computeCabinetGeometry(makeCabinet({ id: 'cab-x' }), SETTINGS)],
      {},
    )
    expect(list.every((e) => e.cabinetName === 'cab-x')).toBe(true)
  })

  it('orders by cabinet, then construction role rank', () => {
    const list = cutList([
      makeCabinet({
        id: 'a',
        name: 'A',
        back: { enabled: true, hdfThickness: 3 },
        doors: { config: 'single', overlayType: 'full-overlay' },
        shelves: [shelf('s', 0, 300)],
      }),
      makeCabinet({ id: 'b', name: 'B' }),
    ])
    expect(list.map((e) => `${e.cabinetName}:${e.panelRole}`)).toEqual([
      'A:top',
      'A:bottom',
      'A:left-side',
      'A:right-side',
      'A:shelf',
      'A:back',
      'A:door',
      'B:top',
      'B:bottom',
      'B:left-side',
      'B:right-side',
    ])
  })

  it('is deterministic', () => {
    const cabinets = [makeCabinet({ shelves: [shelf('s', 10, 300)] })]
    expect(cutList(cabinets)).toEqual(cutList(cabinets))
  })

  it('returns [] for no geometries', () => {
    expect(buildCutoutList([], {})).toEqual([])
  })
})
