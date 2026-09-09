import { useMemo } from 'react'
import { panelBox } from './panelBox'
import type { Panel, PanelRole } from '../domain/types'

const ROLE_COLOR: Record<PanelRole, string> = {
  top: '#d9bd91',
  bottom: '#d9bd91',
  'left-side': '#cdae7f',
  'right-side': '#cdae7f',
  shelf: '#e3cda6',
  back: '#b9a482',
  door: '#c79a63',
}

interface Panel3DProps {
  panel: Panel
  highlight: boolean
  /** When true, doors render semi-transparent so the interior stays visible. */
  seeThroughDoors: boolean
}

export function Panel3D({ panel, highlight, seeThroughDoors }: Panel3DProps) {
  const { size, center } = useMemo(() => panelBox(panel), [panel])

  const glass = panel.role === 'door' && seeThroughDoors

  return (
    <mesh position={center} renderOrder={glass ? 1 : 0}>
      <boxGeometry args={size} />
      {/* Remount the material when the glass mode flips — toggling `transparent`
          on a live material doesn't recompile its shader (stays opaque). */}
      <meshStandardMaterial
        key={glass ? 'glass' : 'solid'}
        color={ROLE_COLOR[panel.role]}
        emissive={highlight ? '#2f8378' : '#000000'}
        emissiveIntensity={highlight ? 0.32 : 0}
        roughness={0.75}
        metalness={0}
        transparent={glass}
        opacity={glass ? 0.42 : 1}
        depthWrite={!glass}
      />
    </mesh>
  )
}
