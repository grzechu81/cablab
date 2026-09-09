/**
 * Cut list — turns computed geometry into the human-readable "what to cut" table.
 *
 * Pure and framework-free, like the rest of `src/domain/`. Operates on
 * already-computed `CabinetGeometry` objects; it does no cabinet math itself.
 *
 * Identical panels within one cabinet are collapsed into a single row with a
 * `quantity`. Panels in *different* cabinets are never merged, even when
 * identical — each cabinet's cut list stands on its own.
 */

import type {
  CabinetGeometry,
  CutoutListEntry,
  EdgeBanding,
  Panel,
  PanelRole,
} from './types'

/** Construction order — carcass, then internals, then doors. */
const ROLE_RANK: Record<PanelRole, number> = {
  top: 0,
  bottom: 1,
  'left-side': 2,
  'right-side': 3,
  shelf: 4,
  back: 5,
  door: 6,
}

/** Fixed edge order for `edgeBandedEdges` and the grouping key. */
const EDGE_ORDER: (keyof EdgeBanding)[] = ['top', 'left', 'right', 'bottom']

/** 0.01 mm — far below any woodworking tolerance, and stable against float noise. */
function mm(value: number): string {
  return value.toFixed(2)
}

function bandedEdges(banding: EdgeBanding): string[] {
  return EDGE_ORDER.filter((edge) => banding[edge])
}

function groupKey(cabinetId: string, panel: Panel): string {
  const bits = EDGE_ORDER.map((edge) => (panel.edgeBanding[edge] ? '1' : '0')).join('')
  return [
    cabinetId,
    panel.role,
    `${mm(panel.width)}x${mm(panel.height)}x${mm(panel.thickness)}`,
    bits,
  ].join('|')
}

interface Row {
  cabinetOrder: number
  entry: CutoutListEntry
}

function compareRows(a: Row, b: Row): number {
  if (a.cabinetOrder !== b.cabinetOrder) return a.cabinetOrder - b.cabinetOrder

  const roleDelta = ROLE_RANK[a.entry.panelRole] - ROLE_RANK[b.entry.panelRole]
  if (roleDelta !== 0) return roleDelta

  if (a.entry.width !== b.entry.width) return b.entry.width - a.entry.width
  if (a.entry.height !== b.entry.height) return b.entry.height - a.entry.height
  if (a.entry.thickness !== b.entry.thickness) return b.entry.thickness - a.entry.thickness

  return a.entry.edgeBandedEdges.join(',').localeCompare(b.entry.edgeBandedEdges.join(','))
}

/**
 * Build the project-wide cut list.
 *
 * @param geometries  computed geometry per cabinet, in project (sidebar) order
 * @param cabinetNames  cabinetId → display name; a missing id falls back to the id
 */
export function buildCutoutList(
  geometries: CabinetGeometry[],
  cabinetNames: Record<string, string>,
): CutoutListEntry[] {
  const rows = new Map<string, Row>()

  geometries.forEach((geometry, cabinetOrder) => {
    const cabinetName = cabinetNames[geometry.cabinetId] ?? geometry.cabinetId

    for (const panel of geometry.panels) {
      const key = groupKey(geometry.cabinetId, panel)
      const existing = rows.get(key)

      if (existing) {
        existing.entry.quantity += 1
        continue
      }

      rows.set(key, {
        cabinetOrder,
        entry: {
          cabinetName,
          panelRole: panel.role,
          width: panel.width,
          height: panel.height,
          thickness: panel.thickness,
          edgeBandedEdges: bandedEdges(panel.edgeBanding),
          quantity: 1,
        },
      })
    }
  })

  return Array.from(rows.values())
    .sort(compareRows)
    .map((row) => row.entry)
}
