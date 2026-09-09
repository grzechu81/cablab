/**
 * Maps a computed `Panel` (role-relative width/height/thickness + min-corner
 * position) to an axis-aligned box in the cabinet-local frame that the 3D scene
 * can render directly.
 *
 * Axis mapping (from `src/domain/geometry.ts`):
 *
 *   role                     | width | height | thickness
 *   top / bottom / shelf     |   X   |   Z    |    Y
 *   left-side / right-side   |   Z   |   Y    |    X
 *   back / door              |   X   |   Y    |    Z
 */

import type { Panel, PanelRole } from '../domain/types'

export interface PanelBox {
  /** Extents along local X, Y, Z (mm). */
  size: [number, number, number]
  /** Box centre in the cabinet-local frame (mm) — the mesh position. */
  center: [number, number, number]
}

const THICKNESS_AXIS: Record<PanelRole, 'x' | 'y' | 'z'> = {
  top: 'y',
  bottom: 'y',
  shelf: 'y',
  'left-side': 'x',
  'right-side': 'x',
  back: 'z',
  door: 'z',
}

export function panelBox(panel: Panel): PanelBox {
  const { width, height, thickness, position } = panel

  let size: [number, number, number]
  switch (THICKNESS_AXIS[panel.role]) {
    case 'y':
      size = [width, thickness, height]
      break
    case 'x':
      size = [thickness, height, width]
      break
    default:
      size = [width, height, thickness]
  }

  return {
    size,
    center: [
      position.x + size[0] / 2,
      position.y + size[1] / 2,
      position.z + size[2] / 2,
    ],
  }
}

export interface Bounds {
  min: [number, number, number]
  max: [number, number, number]
}

/** Overall bounding box of a cabinet's panels, in the cabinet-local frame. */
export function panelsBounds(panels: Panel[]): Bounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity]
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]

  for (const panel of panels) {
    const { size, center } = panelBox(panel)
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], center[axis] - size[axis] / 2)
      max[axis] = Math.max(max[axis], center[axis] + size[axis] / 2)
    }
  }

  return { min, max }
}
