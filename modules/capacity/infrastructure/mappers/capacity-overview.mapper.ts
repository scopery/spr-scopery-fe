import type {
  CapacityAttentionItem,
  CapacityOverview,
  CapacityPeriodBucket,
  OverAllocationItem,
} from '../../domain/model/capacity-overview'
import type { SyncFromMembersResult } from '../../domain/model/resource-profile'
import type { ResourceProfile } from '../../domain/model/resource-profile'

function num(value: unknown): number | null {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

/**
 * Overview DTO is partially documented — normalize common field aliases.
 */
export function mapCapacityOverview(
  raw: Record<string, unknown>,
  workspaceId: string,
  fromDate: string,
  toDate: string
): CapacityOverview {
  const periodsRaw = raw.periods ?? raw.periodBuckets ?? raw.dailyEntries
  const periods: CapacityPeriodBucket[] = Array.isArray(periodsRaw)
    ? periodsRaw.map((p) => {
        const row = p as Record<string, unknown>
        const available = num(row.availableHours ?? row.workingHours) ?? 0
        const focused = num(row.focusedHours) ?? 0
        const allocated = num(row.allocatedHours) ?? 0
        return {
          period: str(row.period ?? row.date) ?? '—',
          availableHours: available,
          focusedHours: focused,
          allocatedHours: allocated,
          surplusHours: available - allocated,
          status: str(row.status) ?? undefined,
        }
      })
    : []

  const attentionRaw = raw.attention ?? raw.attentionItems ?? raw.alerts
  const attention: CapacityAttentionItem[] = Array.isArray(attentionRaw)
    ? attentionRaw.map((a, i) => {
        const row = a as Record<string, unknown>
        const severityRaw = str(row.severity)?.toLowerCase()
        const severity =
          severityRaw === 'critical' || severityRaw === 'warning' || severityRaw === 'info'
            ? severityRaw
            : 'info'
        return {
          id: str(row.id) ?? `attention-${i}`,
          severity,
          label: str(row.label ?? row.message ?? row.type) ?? 'Attention item',
          count: num(row.count) ?? undefined,
        }
      })
    : []

  return {
    workspaceId: str(raw.workspaceId) ?? workspaceId,
    fromDate: str(raw.fromDate) ?? fromDate,
    toDate: str(raw.toDate) ?? toDate,
    availableCapacityHours: num(
      raw.availableCapacityHours ?? raw.totalWorkingHours ?? raw.availableHours
    ),
    focusedCapacityHours: num(raw.focusedCapacityHours ?? raw.totalFocusedHours ?? raw.focusedHours),
    allocatedHours: num(
      raw.allocatedHours ?? raw.totalProjectAllocatedHours ?? raw.totalAllocatedHours
    ),
    remainingCapacityHours: num(raw.remainingCapacityHours ?? raw.remainingHours),
    overAllocatedResourceCount: num(
      raw.overAllocatedResourceCount ?? raw.overAllocatedCount
    ),
    utilizationPercent: num(raw.utilizationPercent),
    periods,
    attention,
  }
}

export function mapOverAllocationItem(raw: Record<string, unknown>): OverAllocationItem {
  return {
    resourceProfileId: str(raw.resourceProfileId),
    resourceDisplayName: str(raw.resourceDisplayName ?? raw.displayName ?? raw.resourceName),
    userId: str(raw.userId),
    projectId: str(raw.projectId),
    projectName: str(raw.projectName),
    allocatedPercent: num(raw.allocatedPercent ?? raw.allocationPercent),
    allocatedHours: num(raw.allocatedHours),
    availableHours: num(raw.availableHours),
    utilizationPercent: num(raw.utilizationPercent),
    fromDate: str(raw.fromDate),
    toDate: str(raw.toDate),
  }
}

export function mapSyncFromMembersResult(raw: unknown): SyncFromMembersResult {
  if (Array.isArray(raw)) {
    return {
      createdCount: raw.length,
      skippedCount: 0,
      errorCount: 0,
      created: raw as ResourceProfile[],
    }
  }
  const body = (raw ?? {}) as Record<string, unknown>
  const createdList = Array.isArray(body.created)
    ? (body.created as ResourceProfile[])
    : Array.isArray(body.createdProfiles)
      ? (body.createdProfiles as ResourceProfile[])
      : undefined
  const errors = Array.isArray(body.errors)
    ? (body.errors as SyncFromMembersResult['errors'])
    : undefined

  return {
    createdCount:
      num(body.createdCount) ??
      (createdList?.length ?? 0),
    skippedCount: num(body.skippedCount ?? body.skipped) ?? 0,
    errorCount: num(body.errorCount) ?? (errors?.length ?? 0),
    created: createdList,
    errors,
  }
}
