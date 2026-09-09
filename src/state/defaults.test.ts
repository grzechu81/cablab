import { describe, expect, it } from 'vitest'
import {
  createDefaultCabinet,
  createDefaultProject,
  DEFAULT_PROJECT_SETTINGS,
} from './defaults'
import { t } from '../i18n'
import {
  CabinetInputSchema,
  CURRENT_SCHEMA_VERSION,
  ProjectSchema,
} from '../persistence/project'

describe('DEFAULT_PROJECT_SETTINGS', () => {
  it('matches docs/02-domain-model.md', () => {
    expect(DEFAULT_PROJECT_SETTINGS).toEqual({
      showDimensions: true,
      defaultBoardThickness: 18,
      doorEdgeMargin: 2.5,
      doorCenterGap: 3,
      grooveWidth: 3,
      grooveDepth: 8,
      grooveOffsetFromBack: 10,
      screwsPerJoint: 2,
      screwWasteMarginPercent: 0.15,
    })
  })
})

describe('createDefaultProject', () => {
  it('is an empty, current-version project that passes the schema', () => {
    const project = createDefaultProject()
    expect(project.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(project.cabinets).toEqual([])
    expect(ProjectSchema.safeParse(project).success).toBe(true)
  })

  it('does not share the settings object between calls', () => {
    expect(createDefaultProject().settings).not.toBe(createDefaultProject().settings)
  })
})

describe('createDefaultCabinet', () => {
  it('produces a schema-valid cabinet with the localized default name', () => {
    const cabinet = createDefaultCabinet()
    expect(cabinet.name).toBe(t('cabinet.defaultName'))
    expect(cabinet.boardThickness).toBe(0)
    expect(CabinetInputSchema.safeParse(cabinet).success).toBe(true)
  })

  it('gives each cabinet a distinct id', () => {
    expect(createDefaultCabinet().id).not.toBe(createDefaultCabinet().id)
  })

  it('applies overrides', () => {
    const cabinet = createDefaultCabinet({ width: 800, id: 'fixed' })
    expect(cabinet).toMatchObject({ width: 800, id: 'fixed' })
  })
})
