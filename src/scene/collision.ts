/**
 * Keeps dragged cabinets from overlapping, and snaps their faces together.
 *
 * Pure. The scene calls `resolveCabinetDrag` on every pointer move with the
 * cabinet's would-be position and a list of the other cabinets' boxes, and gets
 * back a corrected position: snapped to nearby faces, then pushed out of any
 * remaining overlap.
 *
 * Everything works on a cabinet's nominal W×H×D envelope (front-bottom-left
 * origin — see `src/domain/geometry.ts`). Door overhang and the back-panel
 * groove are deliberately ignored so cabinets can sit flush.
 */

import type { CabinetInput, Vec3 } from '../domain/types'

export type Axis = 'x' | 'y' | 'z'

export interface Box {
  min: Vec3
  max: Vec3
}

/** Faces closer together than this snap flush or aligned (mm). */
export const SNAP_DISTANCE_MM = 30

const AXES: Axis[] = ['x', 'y', 'z']
const EPS = 1e-4

type Sized = Pick<CabinetInput, 'width' | 'height' | 'depth'>

const AXIS_SIZE: Record<Axis, keyof Sized> = {
  x: 'width',
  y: 'height',
  z: 'depth',
}

/** World-space envelope of a cabinet whose local origin sits at `position`. */
export function cabinetBox(cabinet: Sized, position: Vec3): Box {
  return {
    min: { x: position.x, y: position.y, z: position.z },
    max: {
      x: position.x + cabinet.width,
      y: position.y + cabinet.height,
      z: position.z + cabinet.depth,
    },
  }
}

/** Signed gap between two boxes on one axis: `< 0` is overlap depth, `> 0` is separation. */
function gap(a: Box, b: Box, axis: Axis): number {
  return Math.max(a.min[axis] - b.max[axis], b.min[axis] - a.max[axis])
}

/** True when the boxes overlap on every axis (a real 3D intersection). */
export function overlaps(a: Box, b: Box): boolean {
  return AXES.every((axis) => gap(a, b, axis) < -EPS)
}

interface ResolveParams {
  cabinet: Sized
  /** Position at the start of the drag — the anchor non-drag axes stay at. */
  from: Vec3
  /** Position the raw pointer drag would put the cabinet at. */
  proposed: Vec3
  /** World envelopes of every *other* cabinet. */
  neighbours: Box[]
  /** Axes this drag may change: `['x', 'y']` normally, `['z']` with Ctrl held. */
  axes: Axis[]
  snapDistance?: number
}

/** Snap the proposed position to nearby cabinet faces, then resolve overlaps. */
export function resolveCabinetDrag({
  cabinet,
  from,
  proposed,
  neighbours,
  axes,
  snapDistance = SNAP_DISTANCE_MM,
}: ResolveParams): Vec3 {
  const result: Vec3 = { x: proposed.x, y: proposed.y, z: proposed.z }
  for (const axis of AXES) {
    if (!axes.includes(axis)) result[axis] = from[axis]
  }

  for (const axis of axes) {
    const snapped = snapAxis(axis, cabinet, result, neighbours, snapDistance)
    if (snapped !== null) result[axis] = snapped
  }

  // Soft-snap to the ground plane when dragging vertically.
  if (axes.includes('y') && result.y > 0 && result.y <= snapDistance) {
    result.y = 0
  }

  separate(cabinet, result, neighbours, axes)

  // Hard floor: cabinets never sink below the ground.
  if (axes.includes('y')) result.y = Math.max(0, result.y)

  return result
}

function snapAxis(
  axis: Axis,
  cabinet: Sized,
  position: Vec3,
  neighbours: Box[],
  snapDistance: number,
): number | null {
  const span = cabinet[AXIS_SIZE[axis]]
  const box = cabinetBox(cabinet, position)
  const perpendicular = AXES.filter((other) => other !== axis)

  let bestTarget: number | null = null
  let bestDelta = snapDistance + EPS

  for (const neighbour of neighbours) {
    // Only snap to a neighbour we are actually beside.
    if (perpendicular.some((other) => gap(box, neighbour, other) > snapDistance)) {
      continue
    }

    const targets = [
      neighbour.max[axis], // our near face → its far face (flush)
      neighbour.min[axis] - span, // our far face → its near face (flush)
      neighbour.min[axis], // near faces aligned  (front-to-front)
      neighbour.max[axis] - span, // far faces aligned   (back-to-back)
    ]

    for (const target of targets) {
      const delta = Math.abs(target - position[axis])
      if (delta >= bestDelta) continue
      // Reject a snap that would bury the cabinet inside this neighbour.
      const moved = cabinetBox(cabinet, { ...position, [axis]: target })
      if (overlaps(moved, neighbour)) continue

      bestDelta = delta
      bestTarget = target
    }
  }

  return bestTarget
}

/** Push `position` (mutated) out of every neighbour it still overlaps. */
function separate(
  cabinet: Sized,
  position: Vec3,
  neighbours: Box[],
  axes: Axis[],
): void {
  for (let pass = 0; pass < 4; pass += 1) {
    let moved = false

    for (const neighbour of neighbours) {
      const box = cabinetBox(cabinet, position)
      if (!overlaps(box, neighbour)) continue

      // Resolve along the drag axis with the shallowest penetration.
      let axis: Axis | null = null
      let shallowest = Infinity
      for (const candidate of axes) {
        const penetration = -gap(box, neighbour, candidate)
        if (penetration < shallowest) {
          shallowest = penetration
          axis = candidate
        }
      }
      if (axis === null) continue

      const centre = (box.min[axis] + box.max[axis]) / 2
      const neighbourCentre = (neighbour.min[axis] + neighbour.max[axis]) / 2
      position[axis] += centre < neighbourCentre
        ? -(shallowest + EPS)
        : shallowest + EPS
      moved = true
    }

    if (!moved) return
  }
}
