import { t } from '../i18n'
import { useProjectStore } from '../state/store'

/** Placeholder for the react-three-fiber scene added in a later phase. */
export function SceneView() {
  const count = useProjectStore((s) => s.project.cabinets.length)

  return (
    <main className="scene">
      <div className="scene__placeholder">
        <p className="scene__title">{t('scene.placeholder')}</p>
        <p className="scene__meta">{t('scene.selectedCount', { count })}</p>
      </div>
    </main>
  )
}
