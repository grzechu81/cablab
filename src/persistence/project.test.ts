import { describe, expect, it } from 'vitest'
import {
  applyMigrations,
  CURRENT_SCHEMA_VERSION,
  migrateProject,
  parseProject,
  ProjectParseError,
  ProjectSchema,
  serializeProject,
} from './project'
import type { Project } from '../domain/types'

function makeProject(): Project {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: {
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
    },
    cabinets: [
      {
        id: 'cab-1',
        name: 'Base unit',
        width: 600,
        height: 720,
        depth: 400,
        joinType: 'top-first',
        boardThickness: 18,
        shelves: [
          { id: 's1', frontOffset: 0, heightOffset: 300, structural: false },
          { id: 's2', frontOffset: 20, heightOffset: 500, structural: true },
        ],
        doors: { config: 'double', overlayType: 'full-overlay' },
        back: { enabled: true, hdfThickness: 3 },
        hanger: { enabled: false },
        position: { x: 0, y: 0, z: 0 },
        positionMode: 'auto',
      },
    ],
  }
}

describe('serializeProject / parseProject', () => {
  it('round-trips a project unchanged', () => {
    const project = makeProject()
    expect(parseProject(serializeProject(project))).toEqual(project)
  })

  it('writes pretty JSON with the current schema version', () => {
    const json = serializeProject(makeProject())
    expect(json).toContain('\n  ')
    expect(JSON.parse(json).schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('strips unknown top-level keys on the way out', () => {
    const project = { ...makeProject(), sneaky: 'value' } as Project
    expect(JSON.parse(serializeProject(project))).not.toHaveProperty('sneaky')
  })

  it('accepts (and strips) an unknown key in an incoming file', () => {
    const raw = JSON.parse(serializeProject(makeProject()))
    raw.cabinets[0].futureField = 42
    const loaded = parseProject(JSON.stringify(raw))
    expect(loaded.cabinets[0]).not.toHaveProperty('futureField')
  })

  it('fills a missing defaultShelfFrontOffset with its default (added after v1)', () => {
    const raw = JSON.parse(serializeProject(makeProject()))
    delete raw.settings.defaultShelfFrontOffset
    expect(parseProject(JSON.stringify(raw)).settings.defaultShelfFrontOffset).toBe(20)
  })
})

describe('parseProject — error codes', () => {
  it('rejects non-JSON', () => {
    expect(() => parseProject('not json')).toThrow(
      expect.objectContaining({ code: 'invalid-json' }),
    )
  })

  it.each(['null', '42', '"x"', '[]'])('rejects the non-object %s', (json) => {
    try {
      parseProject(json)
      throw new Error('expected parseProject to throw')
    } catch (err) {
      expect(err).toBeInstanceOf(ProjectParseError)
      expect((err as ProjectParseError).code).toBe('not-an-object')
    }
  })

  it.each(['{}', '{"schemaVersion":1}', '{"schemaVersion":1,"cabinets":[]}'])(
    'rejects the incomplete project %s',
    (json) => {
      expect(() => parseProject(json)).toThrow(
        expect.objectContaining({ code: 'validation' }),
      )
    },
  )

  it('rejects a wrong field type and names the path', () => {
    const raw = JSON.parse(serializeProject(makeProject()))
    raw.cabinets[0].width = '600'
    try {
      parseProject(JSON.stringify(raw))
      throw new Error('expected parseProject to throw')
    } catch (err) {
      expect((err as ProjectParseError).code).toBe('validation')
      expect((err as ProjectParseError).message).toMatch(/width/)
    }
  })

  it('rejects an unknown schemaVersion', () => {
    const raw = JSON.parse(serializeProject(makeProject()))
    raw.schemaVersion = 999
    expect(() => parseProject(JSON.stringify(raw))).toThrow(
      expect.objectContaining({ code: 'validation' }),
    )
  })
})

describe('migrations', () => {
  it('passes a current-version project through untouched', () => {
    const project = makeProject()
    expect(migrateProject(project)).toEqual(project)
  })

  it('runs synthetic steps in order until the data is current', () => {
    const steps = {
      1: (v0: unknown) => ({ ...(v0 as object), schemaVersion: 1, a: true }),
      2: (v1: unknown) => ({ ...(v1 as object), schemaVersion: 2, b: true }),
    }
    const out = applyMigrations({ schemaVersion: 0 }, steps) as Record<string, unknown>
    expect(out).toEqual({ schemaVersion: 2, a: true, b: true })
  })

  it('treats a missing schemaVersion as version 0', () => {
    const steps = { 1: (v: unknown) => ({ ...(v as object), schemaVersion: 1 }) }
    expect(applyMigrations({}, steps)).toEqual({ schemaVersion: 1 })
  })

  it('the real migrations map is empty at v1', () => {
    const raw = JSON.parse(serializeProject(makeProject()))
    expect(applyMigrations(raw)).toEqual(raw)
  })
})

describe('ProjectSchema', () => {
  it('validates a well-formed project', () => {
    expect(ProjectSchema.safeParse(makeProject()).success).toBe(true)
  })
})
