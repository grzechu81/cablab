/**
 * Browser glue for the save-file flow — the only part of persistence that
 * touches the DOM. Kept apart from `./project.ts` so the parsing / validation
 * logic stays pure and unit-testable.
 */

import type { Project } from '../domain/types'
import { parseProject, serializeProject } from './project'

/** Trigger a download of the project as a `.json` file. */
export function downloadProject(
  project: Project,
  filename = 'cablab-project.json',
): void {
  const blob = new Blob([serializeProject(project)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

/**
 * Read and validate a user-picked file. Rejects with `ProjectParseError` if the
 * file is not a loadable CabLab project.
 */
export async function readProjectFile(file: File): Promise<Project> {
  return parseProject(await file.text())
}
