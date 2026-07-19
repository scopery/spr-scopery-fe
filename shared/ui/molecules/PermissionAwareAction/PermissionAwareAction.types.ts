import type { ReactNode } from 'react'

export const PermissionActionState = {
  Allowed: 'allowed',
  Disabled: 'disabled',
  Hidden: 'hidden',
  Elevated: 'elevated',
  Reauth: 'reauth',
} as const

export type PermissionActionState =
  (typeof PermissionActionState)[keyof typeof PermissionActionState]

export interface PermissionAwareActionProps {
  state: PermissionActionState
  /** Reason shown when disabled / elevated / reauth. */
  reason?: string
  children: ReactNode
  className?: string
}
