/**
 * The app store. Holds the raw `Project` — nothing derived (see
 * `docs/01-architecture.md` and decision #9). Geometry, cut list and hardware
 * totals come from `./selectors.ts`, recomputed from this state.
 *
 * Every action does explicit immutable replacement (no immer): a new `project`,
 * a new `cabinets` array, and for edits a brand-new cabinet object. The
 * selector memoization in `./selectors.ts` depends on untouched cabinets
 * keeping their references — don't regress that.
 */

import { create } from 'zustand'
import type { CabinetInput, Project, ProjectSettings } from '../domain/types'
import { createDefaultCabinet, createDefaultProject } from './defaults'

export interface ProjectStore {
  project: Project

  /** Append a new cabinet; returns its id. */
  addCabinet: (overrides?: Partial<CabinetInput>) => string
  /** Shallow-merge `patch` into the named cabinet. Unknown id is a no-op. */
  updateCabinet: (id: string, patch: Partial<CabinetInput>) => void
  removeCabinet: (id: string) => void
  renameCabinet: (id: string, name: string) => void
  updateSettings: (patch: Partial<ProjectSettings>) => void
  /** Replace the whole project — used when loading a save file. */
  replaceProject: (project: Project) => void
  /** Discard everything and start fresh. */
  newProject: () => void
}

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  project: createDefaultProject(),

  addCabinet: (overrides) => {
    const cabinet = createDefaultCabinet(overrides)
    set((state) => ({
      project: {
        ...state.project,
        cabinets: [...state.project.cabinets, cabinet],
      },
    }))
    return cabinet.id
  },

  updateCabinet: (id, patch) => {
    set((state) => {
      if (!state.project.cabinets.some((c) => c.id === id)) return state
      return {
        project: {
          ...state.project,
          cabinets: state.project.cabinets.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        },
      }
    })
  },

  removeCabinet: (id) => {
    set((state) => ({
      project: {
        ...state.project,
        cabinets: state.project.cabinets.filter((c) => c.id !== id),
      },
    }))
  },

  renameCabinet: (id, name) => {
    get().updateCabinet(id, { name })
  },

  updateSettings: (patch) => {
    set((state) => ({
      project: {
        ...state.project,
        settings: { ...state.project.settings, ...patch },
      },
    }))
  },

  replaceProject: (project) => {
    set({ project })
  },

  newProject: () => {
    set({ project: createDefaultProject() })
  },
}))
