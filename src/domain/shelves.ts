/**
 * Shelf-authoring helpers — pure, no framework deps.
 *
 * When the user adds a shelf the UI seeds every shelf's `heightOffset` from
 * `evenShelfHeightOffsets` so the set starts out evenly spaced in the cabinet's
 * inner cavity. The values are ordinary numbers the user can edit afterwards.
 */

/**
 * `heightOffset` (mm to each shelf's underside, from the cabinet's outer bottom)
 * for `count` shelves spread evenly through the inner cavity, with equal gaps
 * above the bottom panel and below the top panel.
 */
export function evenShelfHeightOffsets(
  count: number,
  cabinetHeight: number,
  boardThickness: number,
): number[] {
  if (count <= 0) return []

  // Range the underside can occupy: on the bottom panel … just under the top panel.
  const low = boardThickness
  const high = cabinetHeight - 2 * boardThickness
  const span = Math.max(0, high - low)

  return Array.from({ length: count }, (_, index) =>
    Math.round(low + (span * (index + 1)) / (count + 1)),
  )
}
