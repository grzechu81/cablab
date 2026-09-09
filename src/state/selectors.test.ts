import { describe, expect, it } from 'vitest'
import {
  selectCabinetGeometry,
  selectCutoutList,
  selectProjectGeometries,
  selectProjectHardware,
} from './selectors'
import { computeCabinetGeometry, computeProjectHardware } from '../domain/geometry'
import { DEFAULT_PROJECT_SETTINGS } from './defaults'
import type { CabinetInput, ProjectSettings } from '../domain/types'

const SETTINGS = DEFAULT_PROJECT_SETTINGS

function cabinet(overrides: Partial<CabinetInput> = {}): CabinetInput {
  return {
    id: 'c1',
    name: 'Cabinet',
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

describe('selectCabinetGeometry', () => {
  it('returns a cached reference for the same (cabinet, settings)', () => {
    const c = cabinet()
    const first = selectCabinetGeometry(c, SETTINGS)
    expect(selectCabinetGeometry(c, SETTINGS)).toBe(first)
    expect(first).toEqual(computeCabinetGeometry(c, SETTINGS))
  })

  it('recomputes when the settings object identity changes', () => {
    const c = cabinet()
    const first = selectCabinetGeometry(c, SETTINGS)
    const sameValues: ProjectSettings = { ...SETTINGS }
    expect(selectCabinetGeometry(c, sameValues)).not.toBe(first)
  })
})

describe('selectProjectGeometries', () => {
  it('is a stable reference while inputs are unchanged', () => {
    const cabinets = [cabinet({ id: 'a' }), cabinet({ id: 'b' })]
    const first = selectProjectGeometries(cabinets, SETTINGS)
    expect(selectProjectGeometries(cabinets, SETTINGS)).toBe(first)
  })

  it('reuses untouched cabinet geometry after one cabinet is replaced', () => {
    const a = cabinet({ id: 'a' })
    const b = cabinet({ id: 'b' })
    const first = selectProjectGeometries([a, b], SETTINGS)

    const bEdited = { ...b, height: 800 }
    const next = selectProjectGeometries([a, bEdited], SETTINGS)

    expect(next).not.toBe(first)
    expect(next[0]).toBe(first[0]) // 'a' geometry reused
    expect(next[1]).not.toBe(first[1])
  })
})

describe('selectCutoutList', () => {
  it('is stable while unchanged and recomputes after a rename', () => {
    const cabinets = [cabinet({ id: 'a', name: 'Old' })]
    const first = selectCutoutList(cabinets, SETTINGS)
    expect(selectCutoutList(cabinets, SETTINGS)).toBe(first)

    const renamed = [{ ...cabinets[0], name: 'New' }]
    const next = selectCutoutList(renamed, SETTINGS)
    expect(next).not.toBe(first)
    expect(next.every((row) => row.cabinetName === 'New')).toBe(true)
  })
})

describe('selectProjectHardware', () => {
  it('matches computeProjectHardware for the same cabinets', () => {
    const cabinets = [
      cabinet({ id: 'a', doors: { config: 'single', overlayType: 'full-overlay' } }),
      cabinet({
        id: 'b',
        shelves: [{ id: 's', frontOffset: 0, heightOffset: 300, structural: true }],
      }),
    ]
    expect(selectProjectHardware(cabinets, SETTINGS)).toEqual(
      computeProjectHardware({ schemaVersion: 1, settings: SETTINGS, cabinets }),
    )
  })
})
