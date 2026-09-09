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
}

export function Panel3D({ panel, highlight }: Panel3DProps) {
  const { size, center } = useMemo(() => panelBox(panel), [panel])

  // Doors render see-through so the cabinet interior stays visible behind them.
  const isDoor = panel.role === 'door'

  return (
    <mesh position={center} renderOrder={isDoor ? 1 : 0}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={ROLE_COLOR[panel.role]}
        emissive={highlight ? '#2f6bff' : '#000000'}
        emissiveIntensity={highlight ? 0.22 : 0}
        roughness={0.75}
        metalness={0}
        transparent={isDoor}
        opacity={isDoor ? 0.5 : 1}
        depthWrite={!isDoor}
      />
    </mesh>
  )
}
