/**
 * Where each cabinet sits in world space.
 *
 * `positionMode: 'manual'` cabinets use their stored `position` (set when the
 * user drags them in the 3D view). `'auto'` cabinets are laid out left to right
 * along +X in project order, so a freshly added cabinet doesn't stack on top of
 * the previous one. Derived, never stored.
 */

import type { CabinetInput, Vec3 } from '../domain/types'

export const AUTO_LAYOUT_GAP_MM = 40

type Placeable = Pick<CabinetInput, 'id' | 'width' | 'position' | 'positionMode'>

export function resolveCabinetPositions(
  cabinets: Placeable[],
): Record<string, Vec3> {
  const positions: Record<string, Vec3> = {}
  let cursorX = 0

  for (const cabinet of cabinets) {
    if (cabinet.positionMode === 'manual') {
      positions[cabinet.id] = { ...cabinet.position }
      continue
    }

    positions[cabinet.id] = { x: cursorX, y: 0, z: 0 }
    cursorX += cabinet.width + AUTO_LAYOUT_GAP_MM
  }

  return positions
}
