import type { MappingEvalMetrics } from './mapping-eval.rules'
import type { MappingRelationType as MappingRelationTypeValue } from './mapping-suggestions'

const STORAGE_KEY = 'scopery.ai-mapping.eval.history.v1'
const MAX_ENTRIES = 30

export interface MappingEvalSnapshot {
  id: string
  projectId: string
  runId: string
  relationType: MappingRelationTypeValue | string
  promptKey: string | null
  promptVersion: number | null
  capturedAt: string
  metrics: Pick<
    MappingEvalMetrics,
    | 'suggestionCount'
    | 'reviewedCount'
    | 'acceptedCount'
    | 'rejectedCount'
    | 'acceptanceRate'
    | 'highPrecision'
    | 'mediumPrecision'
    | 'lowPrecision'
    | 'noMatchShare'
    | 'staleShare'
    | 'tokensPerAccepted'
    | 'gateReadyForAutoMap'
  > & {
    inputTokens: number | null
    outputTokens: number | null
  }
}

function readAll(): MappingEvalSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as MappingEvalSnapshot[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(entries: MappingEvalSnapshot[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {
    // quota
  }
}

export function listMappingEvalSnapshots(projectId: string): MappingEvalSnapshot[] {
  return readAll()
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))
}

export function saveMappingEvalSnapshot(
  projectId: string,
  runId: string,
  relationType: MappingRelationTypeValue | string,
  metrics: MappingEvalMetrics
): MappingEvalSnapshot {
  const entry: MappingEvalSnapshot = {
    id: `${runId}:${Date.now()}`,
    projectId,
    runId,
    relationType,
    promptKey: metrics.promptKey,
    promptVersion: metrics.promptVersion,
    capturedAt: new Date().toISOString(),
    metrics: {
      suggestionCount: metrics.suggestionCount,
      reviewedCount: metrics.reviewedCount,
      acceptedCount: metrics.acceptedCount,
      rejectedCount: metrics.rejectedCount,
      acceptanceRate: metrics.acceptanceRate,
      highPrecision: metrics.highPrecision,
      mediumPrecision: metrics.mediumPrecision,
      lowPrecision: metrics.lowPrecision,
      noMatchShare: metrics.noMatchShare,
      staleShare: metrics.staleShare,
      tokensPerAccepted: metrics.tokensPerAccepted,
      gateReadyForAutoMap: metrics.gateReadyForAutoMap,
      inputTokens: metrics.tokens?.inputTokens ?? null,
      outputTokens: metrics.tokens?.outputTokens ?? null,
    },
  }
  const next = [entry, ...readAll().filter((e) => !(e.runId === runId && e.projectId === projectId))]
  writeAll(next)
  return entry
}

export function clearMappingEvalSnapshots(projectId?: string) {
  if (!projectId) {
    writeAll([])
    return
  }
  writeAll(readAll().filter((e) => e.projectId !== projectId))
}
