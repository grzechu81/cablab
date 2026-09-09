import { useCallback, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from '@react-three/drei'
import { Cabinet3D } from './Cabinet3D'
import { resolveCabinetPositions } from './layout'
import { cabinetBox } from './collision'
import { useProjectStore } from '../state/store'
import { useUiStore } from '../state/uiStore'
import { selectProjectGeometries } from '../state/selectors'
import type { Vec3 } from '../domain/types'

export function SceneCanvas() {
  const cabinets = useProjectStore((s) => s.project.cabinets)
  const settings = useProjectStore((s) => s.project.settings)
  const updateCabinet = useProjectStore((s) => s.updateCabinet)

  const selectedId = useUiStore((s) => s.selectedCabinetId)
  const select = useUiStore((s) => s.select)

  const [dragging, setDragging] = useState(false)

  const geometries = selectProjectGeometries(cabinets, settings)
  const positions = useMemo(() => resolveCabinetPositions(cabinets), [cabinets])

  // World envelopes of every cabinet, for drag collision / snapping.
  const cabinetBoxes = useMemo(
    () => cabinets.map((c) => ({ id: c.id, box: cabinetBox(c, positions[c.id]) })),
    [cabinets, positions],
  )

  const handleMove = useCallback(
    (id: string, position: Vec3) => {
      updateCabinet(id, { position, positionMode: 'manual' })
    },
    [updateCabinet],
  )

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [1050, 950, -1550], fov: 45, near: 1, far: 40000 }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={['#eeece7']} />
      <ambientLight intensity={0.75} />
      <hemisphereLight intensity={0.35} groundColor="#b9b0a0" />
      <directionalLight position={[900, 2200, -1400]} intensity={1.4} />

      <Grid
        args={[20000, 20000]}
        cellSize={100}
        cellThickness={0.6}
        cellColor="#d6d1c4"
        sectionSize={500}
        sectionThickness={1}
        sectionColor="#b3ac9b"
        fadeDistance={9000}
        fadeStrength={1.5}
        infiniteGrid
      />

      {cabinets.map((cabinet, index) => (
        <Cabinet3D
          key={cabinet.id}
          cabinet={cabinet}
          geometry={geometries[index]}
          worldPos={positions[cabinet.id]}
          cabinetBoxes={cabinetBoxes}
          selected={cabinet.id === selectedId}
          showDimensions={settings.showDimensions}
          onSelect={select}
          onMove={handleMove}
          onDragStart={() => setDragging(true)}
          onDragEnd={() => setDragging(false)}
        />
      ))}

      <OrbitControls
        makeDefault
        enabled={!dragging}
        target={[600, 360, 0]}
        maxPolarAngle={Math.PI / 2}
      />

      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport axisColors={['#d1344a', '#2f9e44', '#2563eb']} labelColor="#1f2933" />
      </GizmoHelper>
    </Canvas>
  )
}
