/** Spec Pack = phiếu yêu cầu / analysis handoff packet (Phase 1: client-persisted). */

export const SpecPackStatus = {
  Draft: 'DRAFT',
  Ready: 'READY',
  Exported: 'EXPORTED',
} as const
export type SpecPackStatus = (typeof SpecPackStatus)[keyof typeof SpecPackStatus]

export interface SpecPackRequirementRef {
  id: string
  code: string
  title: string
  requirementType?: string | null
}

export interface SpecPack {
  id: string
  projectId: string
  workspaceId: string
  title: string
  note?: string | null
  status: SpecPackStatus
  requirements: SpecPackRequirementRef[]
  createdAt: string
  updatedAt: string
  exportedAt?: string | null
}

export interface CreateSpecPackInput {
  title: string
  note?: string | null
  requirements: SpecPackRequirementRef[]
}

export function formatSpecPackDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function defaultSpecPackTitle(requirementCount: number): string {
  const stamp = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `Spec Pack · ${requirementCount} req · ${stamp}`
}
