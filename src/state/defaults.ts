/**
 * Initial state factories — the shapes a fresh project / cabinet start from.
 *
 * Numeric defaults come straight from `docs/02-domain-model.md`. These live in
 * `src/state/` rather than `src/domain/` because they are store concerns and one
 * of them (`name`) is user-facing text.
 */

import { CURRENT_SCHEMA_VERSION } from '../persistence/project'
import { t } from '../i18n'
import type { CabinetInput, Project, ProjectSettings } from '../domain/types'

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
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

/** The single source of non-determinism in the state layer. */
export function newId(): string {
  return crypto.randomUUID()
}

/**
 * A new cabinet: 600×720×400, top-first, grooved back, no doors or shelves.
 * `boardThickness: 0` makes it track `ProjectSettings.defaultBoardThickness`
 * (the engine falls back on a falsy thickness).
 */
export function createDefaultCabinet(
  overrides: Partial<CabinetInput> = {},
): CabinetInput {
  return {
    id: newId(),
    name: t('cabinet.defaultName'),
    width: 600,
    height: 720,
    depth: 400,
    joinType: 'top-first',
    boardThickness: 0,
    shelves: [],
    doors: { config: 'none', overlayType: 'full-overlay' },
    back: { enabled: true, hdfThickness: 3 },
    hanger: { enabled: false },
    position: { x: 0, y: 0, z: 0 },
    positionMode: 'auto',
    ...overrides,
  }
}

/** A new, empty project. Every call returns fresh nested objects. */
export function createDefaultProject(): Project {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: { ...DEFAULT_PROJECT_SETTINGS },
    cabinets: [],
  }
}
