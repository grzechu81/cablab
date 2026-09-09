import { useMemo } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Panel3D } from './Panel3D'
import { panelsBounds } from './panelBox'
import { resolveCabinetDrag, type Axis, type Box } from './collision'
import type { CabinetGeometry, CabinetInput, Vec3 } from '../domain/types'

interface Cabinet3DProps {
  cabinet: CabinetInput
  geometry: CabinetGeometry
  worldPos: Vec3
  /** World envelopes of every cabinet (this one included — filtered out on drag). */
  cabinetBoxes: { id: string; box: Box }[]
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
  cabinetBoxes,
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

    // Default drag slides the cabinet across the floor (X/Z); Ctrl/Cmd lifts it (Y).
    const lift = event.nativeEvent.altKey || event.nativeEvent.metaKey
    const axes: Axis[] = lift ? ['y'] : ['x', 'z']
    const neighbours = cabinetBoxes
      .filter((entry) => entry.id !== cabinet.id)
      .map((entry) => entry.box)
    const origin = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z)

    // Floor plane for X/Z; for lifting, a vertical plane facing the camera so
    // the pick ray always meets it (a fixed plane goes edge-on at some angles).
    let planeNormal: THREE.Vector3
    if (lift) {
      planeNormal = camera.position.clone().sub(origin).setY(0)
      if (planeNormal.lengthSq() < 1e-6) planeNormal.set(0, 0, 1)
      planeNormal.normalize()
    } else {
      planeNormal = new THREE.Vector3(0, 1, 0)
    }
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, origin)

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

      const proposed = lift
        ? { x: start.x, y: hit.y, z: start.z }
        : { x: hit.x, y: start.y, z: hit.z }

      // Ignore a grazing-angle hit that lands absurdly far from the cabinet.
      if (
        Math.abs(proposed.x - start.x) > 1e5 ||
        Math.abs(proposed.y - start.y) > 1e5 ||
        Math.abs(proposed.z - start.z) > 1e5
      ) {
        return
      }

      onMove(
        cabinet.id,
        resolveCabinetDrag({ cabinet, from: start, proposed, neighbours, axes }),
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
