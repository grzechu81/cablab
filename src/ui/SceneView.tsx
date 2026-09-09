import { lazy, Suspense } from 'react'
import { t } from '../i18n'
import { useProjectStore } from '../state/store'

// Keep three.js / react-three-fiber out of the initial bundle.
const SceneCanvas = lazy(() =>
  import('../scene/SceneCanvas').then((module) => ({ default: module.SceneCanvas })),
)

export function SceneView() {
  const count = useProjectStore((s) => s.project.cabinets.length)

  return (
    <main className="scene">
      <Suspense
        fallback={<div className="scene__hint scene__hint--center">{t('scene.loading')}</div>}
      >
        <SceneCanvas />
      </Suspense>

      {count === 0 ? (
        <div className="scene__hint scene__hint--center">{t('scene.empty')}</div>
      ) : (
        <div className="scene__hint scene__hint--corner">{t('scene.dragHint')}</div>
      )}
    </main>
  )
}
