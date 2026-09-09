/**
 * Save-file format: parsing, validation, versioning.
 *
 * A project is a single JSON file the user downloads / uploads — no backend
 * (see `docs/04-persistence-schema.md`). This module is pure (no DOM): the
 * browser download / file-read glue lives in `./projectFile.ts` so this part
 * stays unit-testable.
 *
 * Every saved file carries a `schemaVersion`. When the `Project` shape changes,
 * bump `CURRENT_SCHEMA_VERSION` and add a migration step — old files then keep
 * loading.
 */

import { z } from 'zod'
import type { Project } from '../domain/types'

export const CURRENT_SCHEMA_VERSION = 1

// --- schema (mirrors src/domain/types.ts) --------------------------------

const Vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

export const ShelfInputSchema = z.object({
  id: z.string(),
  frontOffset: z.number(),
  heightOffset: z.number(),
  structural: z.boolean(),
})

export const ProjectSettingsSchema = z.object({
  showDimensions: z.boolean(),
  defaultBoardThickness: z.number(),
  // Added after v1 shipped — `.default` keeps older save files loading without a
  // schemaVersion bump (see docs/04-persistence-schema.md).
  defaultShelfFrontOffset: z.number().default(20),
  doorEdgeMargin: z.number(),
  doorCenterGap: z.number(),
  grooveWidth: z.number(),
  grooveDepth: z.number(),
  grooveOffsetFromBack: z.number(),
  screwsPerJoint: z.number(),
  screwWasteMarginPercent: z.number(),
})

export const CabinetInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  width: z.number(),
  height: z.number(),
  depth: z.number(),
  joinType: z.enum(['top-first', 'side-first']),
  boardThickness: z.number(),
  shelves: z.array(ShelfInputSchema),
  doors: z.object({
    config: z.enum(['none', 'single', 'double']),
    overlayType: z.enum(['full-overlay', 'half-overlay', 'inset']),
    // Added after v1 — `.default` keeps older save files loading (see docs/04).
    seeThrough: z.boolean().default(false),
  }),
  back: z.object({
    enabled: z.boolean(),
    hdfThickness: z.number(),
  }),
  hanger: z.object({
    enabled: z.boolean(),
  }),
  position: Vec3Schema,
  positionMode: z.enum(['auto', 'manual']),
})

export const ProjectSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  settings: ProjectSettingsSchema,
  cabinets: z.array(CabinetInputSchema),
})

// Compile-time guard: the schema must stay assignable to the hand-written type.
// (One direction only — the schema's `schemaVersion: 1` literal is a valid `number`.)
type SchemaProject = z.infer<typeof ProjectSchema>
const _schemaMatchesType: (p: SchemaProject) => Project = (p) => p
void _schemaMatchesType

// --- migrations ---------------------------------------------------------

/**
 * One entry per version bump: `migrations[n]` upgrades a `(n-1)` file to `n`.
 * Empty until the first breaking change — the pattern is in place from day one.
 *
 * Example for a future v2:
 *
 *   2: (v1) => {
 *     const p = v1 as Record<string, unknown>
 *     return { ...p, schemaVersion: 2, newField: defaultValue }
 *   },
 */
export const migrations: Record<number, (old: unknown) => unknown> = {}

/**
 * Run the ordered migration steps until the data reaches the current version.
 * `steps` is injectable so the loop can be tested before any real migration exists.
 */
export function applyMigrations(
  raw: Record<string, unknown>,
  steps: Record<number, (old: unknown) => unknown> = migrations,
): unknown {
  let data: unknown = raw
  let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0

  while (steps[version + 1]) {
    data = steps[version + 1](data)
    version += 1
  }

  return data
}

// --- parse / serialize -------------------------------------------------

export type ProjectParseErrorCode = 'invalid-json' | 'not-an-object' | 'validation'

/** A load failure with a `code` the UI can map to a localized message. */
export class ProjectParseError extends Error {
  code: ProjectParseErrorCode

  constructor(code: ProjectParseErrorCode, message: string) {
    super(message)
    this.name = 'ProjectParseError'
    this.code = code
  }
}

/**
 * Migrate a parsed value to the current schema and validate it. Throws
 * `ProjectParseError` (never a raw ZodError) on any problem.
 */
export function migrateProject(raw: unknown): Project {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new ProjectParseError('not-an-object', 'This file is not a CabLab project.')
  }

  const migrated = applyMigrations(raw as Record<string, unknown>)
  const result = ProjectSchema.safeParse(migrated)

  if (!result.success) {
    throw new ProjectParseError('validation', z.prettifyError(result.error))
  }

  return result.data
}

/** Parse a save-file string into a validated `Project`. */
export function parseProject(json: string): Project {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new ProjectParseError('invalid-json', 'This file is not valid JSON.')
  }
  return migrateProject(raw)
}

/** Serialize a project to a pretty-printed save-file string. */
export function serializeProject(project: Project): string {
  const clean = ProjectSchema.parse({
    ...project,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  })
  return JSON.stringify(clean, null, 2)
}
