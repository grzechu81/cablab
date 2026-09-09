import { useRef, useState } from 'react'
import { t } from '../i18n'
import { useProjectStore } from '../state/store'
import { useUiStore } from '../state/uiStore'
import { downloadProject, readProjectFile } from '../persistence/projectFile'
import { ProjectParseError } from '../persistence/project'

export function Sidebar() {
  const cabinets = useProjectStore((s) => s.project.cabinets)
  const addCabinet = useProjectStore((s) => s.addCabinet)
  const newProject = useProjectStore((s) => s.newProject)
  const replaceProject = useProjectStore((s) => s.replaceProject)

  const selectedId = useUiStore((s) => s.selectedCabinetId)
  const select = useUiStore((s) => s.select)
  const openModal = useUiStore((s) => s.openModal)

  const fileInput = useRef<HTMLInputElement>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleAdd = () => {
    setLoadError(null)
    select(addCabinet())
  }

  const handleNew = () => {
    setLoadError(null)
    newProject()
    select(null)
  }

  const handleSave = () => {
    downloadProject(useProjectStore.getState().project)
  }

  const handleLoad = async (file: File) => {
    setLoadError(null)
    try {
      replaceProject(await readProjectFile(file))
      select(null)
    } catch (error) {
      setLoadError(
        error instanceof ProjectParseError
          ? error.message
          : String(error),
      )
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <h1>{t('app.title')}</h1>
        <p>{t('app.tagline')}</p>
      </div>

      <div className="sidebar__toolbar">
        <button type="button" className="btn" onClick={handleNew}>
          {t('actions.newProject')}
        </button>
        <button type="button" className="btn" onClick={handleSave}>
          {t('actions.save')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => fileInput.current?.click()}
        >
          {t('actions.load')}
        </button>
        <button type="button" className="btn" onClick={() => openModal('settings')}>
          {t('actions.settings')}
        </button>
        <button type="button" className="btn" onClick={() => openModal('cutList')}>
          {t('actions.cutList')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleLoad(file)
            event.target.value = ''
          }}
        />
      </div>

      {loadError ? (
        <p className="sidebar__error" role="alert">
          {t('persistence.loadFailedTitle')}: {loadError}
        </p>
      ) : null}

      <div className="sidebar__section">
        <div className="sidebar__section-head">
          <span>{t('sidebar.cabinets')}</span>
          <button type="button" className="btn btn--small" onClick={handleAdd}>
            + {t('actions.addCabinet')}
          </button>
        </div>

        {cabinets.length === 0 ? (
          <p className="sidebar__empty">{t('sidebar.empty')}</p>
        ) : (
          <ul className="cabinet-list">
            {cabinets.map((cabinet) => (
              <li key={cabinet.id}>
                <button
                  type="button"
                  className={
                    cabinet.id === selectedId
                      ? 'cabinet-list__item cabinet-list__item--active'
                      : 'cabinet-list__item'
                  }
                  onClick={() => select(cabinet.id)}
                >
                  <span className="cabinet-list__name">{cabinet.name}</span>
                  <span className="cabinet-list__dims">
                    {cabinet.width} × {cabinet.height} × {cabinet.depth}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
