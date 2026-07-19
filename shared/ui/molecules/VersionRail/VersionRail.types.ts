import type { ReactNode } from 'react'
import type { BadgeTone } from '../../atoms/Badge'

export type VersionRailItemStatus = 'draft' | 'active' | 'archived' | 'current' | string

export interface VersionRailItem {
  id: string
  label: string
  statusLabel?: string
  statusTone?: BadgeTone
  /** Marks the currently selected / current version. */
  current?: boolean
  timestamp?: string
  meta?: ReactNode
  disabled?: boolean
}

export interface VersionRailProps {
  items: VersionRailItem[]
  selectedId?: string | null
  onSelect?: (id: string) => void
  className?: string
  'aria-label'?: string
  /** Optional actions rendered below the selected item. */
  actions?: ReactNode
}
