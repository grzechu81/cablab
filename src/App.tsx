import { useUiStore } from './state/uiStore'
import { Sidebar } from './ui/Sidebar'
import { SceneView } from './ui/SceneView'
import { PropertyPanel } from './ui/PropertyPanel'
import { ProjectSettingsModal } from './ui/ProjectSettingsModal'
import { CutListModal } from './ui/CutListModal'

export default function App() {
  const activeModal = useUiStore((s) => s.activeModal)

  return (
    <div className="app">
      <Sidebar />
      <SceneView />
      <PropertyPanel />

      {activeModal === 'settings' ? <ProjectSettingsModal /> : null}
      {activeModal === 'cutList' ? <CutListModal /> : null}
    </div>
  )
}
