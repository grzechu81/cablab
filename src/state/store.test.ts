import { beforeEach, describe, expect, it } from 'vitest'
import { useProjectStore } from './store'
import { createDefaultProject } from './defaults'

const reset = () => useProjectStore.setState({ project: createDefaultProject() })
const store = () => useProjectStore.getState()

beforeEach(reset)

describe('useProjectStore', () => {
  it('starts from an empty default project', () => {
    expect(store().project.cabinets).toEqual([])
    expect(Object.keys(store().project).sort()).toEqual([
      'cabinets',
      'schemaVersion',
      'settings',
    ])
  })

  it('addCabinet appends and returns the new id, with fresh references', () => {
    const before = store().project
    const id = store().addCabinet()

    expect(store().project.cabinets.map((c) => c.id)).toEqual([id])
    expect(store().project).not.toBe(before)
    expect(store().project.cabinets).not.toBe(before.cabinets)
  })

  it('addCabinet applies overrides', () => {
    store().addCabinet({ width: 900 })
    expect(store().project.cabinets[0].width).toBe(900)
  })

  it('updateCabinet replaces only the target, keeping siblings by reference', () => {
    const a = store().addCabinet()
    const b = store().addCabinet()
    const [, bBefore] = store().project.cabinets

    store().updateCabinet(a, { height: 800 })
    const [aAfter, bAfter] = store().project.cabinets

    expect(aAfter.height).toBe(800)
    expect(bAfter).toBe(bBefore)
    expect(b).toBe(bAfter.id)
  })

  it('updateCabinet with an unknown id leaves the state untouched', () => {
    store().addCabinet()
    const before = store().project
    store().updateCabinet('nope', { width: 1 })
    expect(store().project).toBe(before)
  })

  it('removeCabinet drops the target and keeps siblings by reference', () => {
    const a = store().addCabinet()
    store().addCabinet()
    const bBefore = store().project.cabinets[1]

    store().removeCabinet(a)

    expect(store().project.cabinets).toHaveLength(1)
    expect(store().project.cabinets[0]).toBe(bBefore)
  })

  it('renameCabinet sets the name', () => {
    const id = store().addCabinet()
    store().renameCabinet(id, 'Kitchen base')
    expect(store().project.cabinets[0].name).toBe('Kitchen base')
  })

  it('updateSettings replaces settings but not the cabinets array', () => {
    store().addCabinet()
    const cabinetsBefore = store().project.cabinets
    const settingsBefore = store().project.settings

    store().updateSettings({ defaultBoardThickness: 25 })

    expect(store().project.settings).not.toBe(settingsBefore)
    expect(store().project.settings.defaultBoardThickness).toBe(25)
    expect(store().project.cabinets).toBe(cabinetsBefore)
  })

  it('replaceProject swaps the whole project', () => {
    const loaded = createDefaultProject()
    loaded.cabinets.push({
      id: 'loaded',
      name: 'From file',
      width: 500,
      height: 500,
      depth: 300,
      joinType: 'side-first',
      boardThickness: 18,
      shelves: [],
      doors: { config: 'none', overlayType: 'full-overlay' },
      back: { enabled: false, hdfThickness: 3 },
      hanger: { enabled: false },
      position: { x: 0, y: 0, z: 0 },
      positionMode: 'auto',
    })

    store().replaceProject(loaded)
    expect(store().project).toBe(loaded)
  })

  it('newProject resets to a fresh empty project', () => {
    store().addCabinet()
    const before = store().project
    store().newProject()
    expect(store().project).not.toBe(before)
    expect(store().project.cabinets).toEqual([])
  })
})
