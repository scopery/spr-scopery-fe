/** Spec Pack (internal) = Specification Package — analysis handoff / phiếu yêu cầu packet. */

import { SpecPackProductName } from './spec-pack.labels'

export { SpecPackProductName } from './spec-pack.labels'

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

/** Named reading section — order of groups + order of requirements inside each group. */
export interface SpecPackGroup {
  id: string
  name: string
  description?: string | null
  requirements: SpecPackRequirementRef[]
}

export interface SpecPack {
  id: string
  projectId: string
  workspaceId: string
  title: string
  note?: string | null
  status: SpecPackStatus
  /** Flattened refs (derived from groups) — kept for list summaries / legacy. */
  requirements: SpecPackRequirementRef[]
  /** Ordered groups; source of truth for reading order. */
  groups: SpecPackGroup[]
  createdAt: string
  updatedAt: string
  exportedAt?: string | null
}

export interface CreateSpecPackInput {
  title: string
  note?: string | null
  /** Prefer groups. If omitted, `requirements` become one default group. */
  groups?: SpecPackGroup[]
  requirements?: SpecPackRequirementRef[]
}

export function newSpecPackGroupId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `spg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function flattenSpecPackRequirements(
  groups: SpecPackGroup[]
): SpecPackRequirementRef[] {
  return groups.flatMap((g) => g.requirements)
}

export function defaultSpecPackGroup(
  requirements: SpecPackRequirementRef[] = []
): SpecPackGroup {
  return {
    id: newSpecPackGroupId(),
    name: 'General',
    description: null,
    requirements,
  }
}

/** Normalize legacy packs (no groups) and keep requirements in sync with groups. */
export function normalizeSpecPack(raw: SpecPack): SpecPack {
  const groups =
    Array.isArray(raw.groups) && raw.groups.length > 0
      ? raw.groups.map((g) => ({
          id: g.id || newSpecPackGroupId(),
          name: (g.name || 'Untitled group').trim() || 'Untitled group',
          description: g.description?.trim() || null,
          requirements: Array.isArray(g.requirements) ? g.requirements : [],
        }))
      : [defaultSpecPackGroup(Array.isArray(raw.requirements) ? raw.requirements : [])]

  return {
    ...raw,
    groups,
    requirements: flattenSpecPackRequirements(groups),
  }
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
  return `${SpecPackProductName.singular} · ${requirementCount} req · ${stamp}`
}
