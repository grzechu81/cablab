import { useMemo } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Panel3D } from './Panel3D'
import { panelsBounds } from './panelBox'
import type { CabinetGeometry, CabinetInput, Vec3 } from '../domain/types'

interface Cabinet3DProps {
  cabinet: CabinetInput
  geometry: CabinetGeometry
  worldPos: Vec3
  selected: boolean
  showDimensions: boolean
  onSelect: (id: string) => void
  onMove: (id: string, position: Vec3) => void
  onDragStart: () => void
  onDragEnd: () => void
}

export function Cabinet3D({
  cabinet,
  geometry,
  worldPos,
  selected,
  showDimensions,
  onSelect,
  onMove,
  onDragStart,
  onDragEnd,
}: Cabinet3DProps) {
  const camera = useThree((state) => state.camera)
  const domElement = useThree((state) => state.gl.domElement)

  const bounds = useMemo(() => panelsBounds(geometry.panels), [geometry.panels])
  const boxSize: [number, number, number] = [
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
  ]
  const boxCenter: [number, number, number] = [
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  ]

  const beginDrag = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    onSelect(cabinet.id)

    const useDepth = event.nativeEvent.ctrlKey || event.nativeEvent.metaKey
    const origin = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z)
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      useDepth ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1),
      origin,
    )

    const grab = event.ray.intersectPlane(plane, new THREE.Vector3())
    if (!grab) return
    const grabOffset = grab.sub(origin)
    const start: Vec3 = { ...worldPos }
    const raycaster = new THREE.Raycaster()

    const onPointerMove = (moveEvent: PointerEvent) => {
      const rect = domElement.getBoundingClientRect()
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((moveEvent.clientX - rect.left) / rect.width) * 2 - 1,
          -((moveEvent.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      )
      const hit = raycaster.ray.intersectPlane(plane, new THREE.Vector3())
      if (!hit) return
      hit.sub(grabOffset)

      onMove(
        cabinet.id,
        useDepth
          ? { x: start.x, y: start.y, z: hit.z }
          : { x: hit.x, y: hit.y, z: start.z },
      )
    }

    const finish = () => {
      window.removeEventListener('pointermove', onPointerMove)
      onDragEnd()
    }

    onDragStart()
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', finish, { once: true })
  }

  return (
    <group position={[worldPos.x, worldPos.y, worldPos.z]} onPointerDown={beginDrag}>
      {geometry.panels.map((panel) => (
        <Panel3D key={panel.id} panel={panel} highlight={selected} />
      ))}

      {selected ? (
        <mesh position={boxCenter}>
          <boxGeometry args={boxSize} />
          <meshBasicMaterial visible={false} />
          <Edges color="#2f6bff" />
        </mesh>
      ) : null}

      {showDimensions ? (
        <Html
          position={[boxCenter[0], bounds.max[1] + 70, boxCenter[2]]}
          center
          distanceFactor={1600}
          zIndexRange={[10, 0]}
        >
          <span className="scene-label">
            {cabinet.width} × {cabinet.height} × {cabinet.depth}
          </span>
        </Html>
      ) : null}
    </group>
  )
}
