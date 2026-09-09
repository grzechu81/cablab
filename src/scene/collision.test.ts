import { describe, expect, it } from 'vitest'
import {
  cabinetBox,
  overlaps,
  resolveCabinetDrag,
  SNAP_DISTANCE_MM,
  type Axis,
  type Box,
} from './collision'
import type { Vec3 } from '../domain/types'

const SIZE = { width: 600, height: 720, depth: 400 }

/** Neighbour A: 600×720×400 at the origin. */
const A: Box = cabinetBox(SIZE, { x: 0, y: 0, z: 0 })

/** Default drag: slide across the floor (X/Z). */
function resolve(
  proposed: Vec3,
  opts: {
    from?: Vec3
    neighbours?: Box[]
    axes?: Axis[]
    cabinet?: { width: number; height: number; depth: number }
  } = {},
) {
  return resolveCabinetDrag({
    cabinet: opts.cabinet ?? SIZE,
    from: opts.from ?? { x: 5000, y: 0, z: 5000 },
    proposed,
    neighbours: opts.neighbours ?? [A],
    axes: opts.axes ?? ['x', 'z'],
  })
}

describe('cabinetBox / overlaps', () => {
  it('builds a world envelope from the front-bottom-left origin', () => {
    expect(cabinetBox(SIZE, { x: 100, y: 0, z: 50 })).toEqual({
      min: { x: 100, y: 0, z: 50 },
      max: { x: 700, y: 720, z: 450 },
    })
  })

  it('detects a real 3D intersection but not a flush touch', () => {
    expect(overlaps(A, cabinetBox(SIZE, { x: 300, y: 0, z: 0 }))).toBe(true)
    expect(overlaps(A, cabinetBox(SIZE, { x: 600, y: 0, z: 0 }))).toBe(false)
  })
})

describe('resolveCabinetDrag — snapping', () => {
  it('snaps a side face flush against a neighbour when within range', () => {
    expect(resolve({ x: 600 + SNAP_DISTANCE_MM - 5, y: 0, z: 0 }).x).toBe(600)
  })

  it('snaps the far face flush when approaching from the other side', () => {
    // far face (x + 600) → A.min.x (0)  ⇒  position.x → -600
    expect(
      resolve({ x: -600 + 8, y: 0, z: 0 }, { from: { x: -5000, y: 0, z: 5000 } }).x,
    ).toBe(-600)
  })

  it('does not snap when the gap exceeds the snap distance', () => {
    const x = 600 + SNAP_DISTANCE_MM + 20
    expect(resolve({ x, y: 0, z: 0 }).x).toBe(x)
  })

  it('does not snap to a neighbour far away on a perpendicular axis', () => {
    const z = 590
    expect(resolve({ x: 5000, y: 0, z }, { axes: ['z'] }).z).toBe(z)
  })

  it('aligns front faces (front-to-front) when nudging a shallower cabinet beside a neighbour', () => {
    const shallow = { width: 600, height: 720, depth: 300 }
    const result = resolveCabinetDrag({
      cabinet: shallow,
      from: { x: 600, y: 0, z: 20 },
      proposed: { x: 600, y: 0, z: 8 },
      neighbours: [A],
      axes: ['x', 'z'],
    })
    expect(result.z).toBe(0) // front face aligned with A's front
  })

  it('aligns back faces (back-to-back) when the far faces are close', () => {
    const shallow = { width: 600, height: 720, depth: 300 }
    const result = resolveCabinetDrag({
      cabinet: shallow,
      from: { x: 600, y: 0, z: 80 },
      proposed: { x: 600, y: 0, z: 105 },
      neighbours: [A],
      axes: ['x', 'z'],
    })
    expect(result.z).toBe(100) // 100 + 300 == 400 == A's back face
  })

  it('rejects an alignment snap that would bury the cabinet inside the neighbour', () => {
    // B shares A's x/y footprint; a front-to-front snap would fully overlap.
    const result = resolveCabinetDrag({
      cabinet: SIZE,
      from: { x: 0, y: 0, z: 410 },
      proposed: { x: 0, y: 0, z: 10 },
      neighbours: [A],
      axes: ['z'],
    })
    expect(overlaps(cabinetBox(SIZE, result), A)).toBe(false)
    expect(result.z).toBeCloseTo(400, 2) // pushed flush behind A instead
  })
})

describe('resolveCabinetDrag — collision', () => {
  it('pushes a cabinet dragged deep into a neighbour back out to flush', () => {
    const result = resolve({ x: 300, y: 0, z: 0 })
    expect(result.x).toBeCloseTo(600, 2)
    expect(overlaps(cabinetBox(SIZE, result), A)).toBe(false)
  })

  it('resolves along the drag axis with the shallowest penetration', () => {
    // shallow x overlap (10), deep z overlap (100) ⇒ resolve on x
    const result = resolve({ x: 590, y: 0, z: 300 })
    expect(result.x).toBeCloseTo(600, 2)
    expect(result.z).toBe(300)
  })

  it('resolves against a chain of neighbours', () => {
    const D = cabinetBox(SIZE, { x: 600, y: 0, z: 0 }) // flush right of A
    const result = resolve({ x: 200, y: 0, z: 0 }, { neighbours: [A, D] })
    expect(overlaps(cabinetBox(SIZE, result), A)).toBe(false)
    expect(overlaps(cabinetBox(SIZE, result), D)).toBe(false)
  })

  it('leaves a valid position untouched', () => {
    const result = resolve({ x: 900, y: 0, z: 900 })
    expect(result).toEqual({ x: 900, y: 0, z: 900 })
  })
})

describe('resolveCabinetDrag — axes & ground', () => {
  it('never changes an axis outside the drag set', () => {
    const result = resolveCabinetDrag({
      cabinet: SIZE,
      from: { x: 10, y: 20, z: 50 },
      proposed: { x: 999, y: 999, z: 999 },
      neighbours: [],
      axes: ['y'],
    })
    expect(result).toEqual({ x: 10, y: 999, z: 50 })
  })

  it('soft-snaps to the ground plane when lifting near it', () => {
    const result = resolveCabinetDrag({
      cabinet: SIZE,
      from: { x: 0, y: 400, z: 0 },
      proposed: { x: 0, y: 15, z: 0 },
      neighbours: [],
      axes: ['y'],
    })
    expect(result.y).toBe(0)
  })

  it('clamps the cabinet to the floor when lifting', () => {
    const result = resolveCabinetDrag({
      cabinet: SIZE,
      from: { x: 0, y: 0, z: 0 },
      proposed: { x: 0, y: -120, z: 0 },
      neighbours: [],
      axes: ['y'],
    })
    expect(result.y).toBe(0)
  })

  it('leaves a deliberate raised position alone', () => {
    const result = resolveCabinetDrag({
      cabinet: SIZE,
      from: { x: 0, y: 0, z: 0 },
      proposed: { x: 0, y: 1400, z: 0 },
      neighbours: [],
      axes: ['y'],
    })
    expect(result.y).toBe(1400)
  })
})
