/**
 * Derived views of the project — geometry, cut list, hardware totals.
 *
 * The store holds only raw `Project` data (`docs/01-architecture.md`: "derive,
 * don't store"). These selectors recompute from it, memoized so React callers
 * get stable references while the relevant inputs are unchanged.
 *
 * Intended call sites:
 *
 *   useProjectStore((s) => selectCabinetGeometry(cabinet, s.project.settings))
 *   useProjectStore((s) => selectCutoutList(s.project.cabinets, s.project.settings))
 */

import { buildCutoutList } from '../domain/cutout'
import {
  computeCabinetGeometry,
  computeProjectHardwareFromGeometries,
} from '../domain/geometry'
import type {
  CabinetGeometry,
  CabinetInput,
  CutoutListEntry,
  ProjectHardware,
  ProjectSettings,
} from '../domain/types'
import { memoizeByRefs } from './memo'

/**
 * Per-cabinet geometry cache, keyed on the `CabinetInput` object identity. Store
 * actions replace edited cabinets immutably, so an unchanged cabinet keeps its
 * reference (cache hit) and an edited one is a new object (recompute just that
 * cabinet). Entries for removed cabinets become unreachable and are GC'd.
 */
const geometryCache = new WeakMap<
  CabinetInput,
  { settings: ProjectSettings; geometry: CabinetGeometry }
>()

export function selectCabinetGeometry(
  cabinet: CabinetInput,
  settings: ProjectSettings,
): CabinetGeometry {
  const hit = geometryCache.get(cabinet)
  if (hit && hit.settings === settings) return hit.geometry

  const geometry = computeCabinetGeometry(cabinet, settings)
  geometryCache.set(cabinet, { settings, geometry })
  return geometry
}

export const selectProjectGeometries = memoizeByRefs(
  (cabinets: CabinetInput[], settings: ProjectSettings): CabinetGeometry[] =>
    cabinets.map((cabinet) => selectCabinetGeometry(cabinet, settings)),
)

export const selectCutoutList = memoizeByRefs(
  (cabinets: CabinetInput[], settings: ProjectSettings): CutoutListEntry[] =>
    buildCutoutList(
      selectProjectGeometries(cabinets, settings),
      Object.fromEntries(cabinets.map((cabinet) => [cabinet.id, cabinet.name])),
    ),
)

export const selectProjectHardware = memoizeByRefs(
  (cabinets: CabinetInput[], settings: ProjectSettings): ProjectHardware =>
    computeProjectHardwareFromGeometries(
      selectProjectGeometries(cabinets, settings),
      settings.screwWasteMarginPercent,
    ),
)
