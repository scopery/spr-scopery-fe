import * as catalogApi from '@/modules/projects/traceability/api/functional-catalog.api'
import * as useCaseApi from '@/modules/projects/traceability/api/use-case.api'
import * as requirementsApi from '../api/requirements.api'
import * as rtApi from '@/modules/projects/traceability/api/requirement-traceability.api'
import * as appApi from '@/modules/projects/traceability/api/traceability.api'
import {
  flowContentToPlainText,
  parseFlowContent,
} from '@/modules/projects/traceability/model/flow-mention'
import type { TracePreviewObject } from '@/modules/projects/traceability/model/requirement-traceability'
import type { FunctionalItem } from '@/modules/projects/traceability/model/functional-catalog'
import type { UseCase, UseCaseDetail } from '@/modules/projects/traceability/model/use-case'
import { TraceLinkType } from '@/modules/quality/domain/enums/quality.enum'
import type { SpecPack } from './spec-pack'
import {
  SpecPackCacheKeys,
  SpecPackCacheTtl,
  cachedFetch,
  getCachedSpecPackPreview,
  setCachedSpecPackPreview,
  type LabelMapsSnapshot,
} from './spec-pack-preview.cache'
import type {
  SpecPackPreviewDocument,
  SpecPackPreviewFunctionBlock,
  SpecPackPreviewItem,
  SpecPackPreviewRequirementChapter,
  SpecPackPreviewUseCase,
} from './spec-pack-preview'

type FnRef = { id: string; code?: string | null; name: string }

type HydrateCtx = {
  workspaceId: string
  projectId: string
  forceEntities: boolean
  labels: LabelMapsSnapshot | null
  reqToFns: Map<string, FnRef[]> | null
  /** Requirement → functions from TraceLink COVERS (UI link panel) */
  coversReqToFns: Map<string, FnRef[]> | null
}

function fetchOpts(ctx: HydrateCtx) {
  return { force: ctx.forceEntities }
}

function stepPlainText(contentJson: string | null | undefined): string {
  if (!contentJson?.trim()) return ''
  return flowContentToPlainText(parseFlowContent(contentJson)).trim()
}

function mapUseCaseDetail(detail: UseCaseDetail): SpecPackPreviewUseCase {
  const o = detail.overview
  return {
    id: o.id,
    key: o.key,
    name: o.name,
    goal: o.goal ?? null,
    primaryActorName: o.primaryActorName ?? null,
    triggerText: o.triggerText ?? null,
    conditions: (detail.conditions ?? []).map((c) => ({
      type: c.conditionType,
      content: c.content,
    })),
    businessRules: (detail.businessRules ?? []).map((r) => ({
      code: r.ruleCode,
      description: r.description,
    })),
    acceptanceCriteria: (detail.acceptanceCriteria ?? []).map((a) => ({
      title: a.title,
      givenText: a.givenText ?? null,
      whenText: a.whenText ?? null,
      thenText: a.thenText ?? null,
    })),
    flows: (detail.flows ?? []).map((f) => ({
      flowType: f.flowType,
      name: f.name ?? null,
      conditionText: f.conditionText ?? null,
      steps: [...(f.steps ?? [])]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((s) => ({
          stepType: s.stepType,
          text: stepPlainText(s.contentJson),
        })),
    })),
  }
}

function getUseCaseDetailCached(ctx: HydrateCtx, useCaseId: string): Promise<UseCaseDetail> {
  return cachedFetch(
    SpecPackCacheKeys.useCase(ctx.projectId, useCaseId),
    SpecPackCacheTtl.entity,
    () => useCaseApi.getUseCaseDetail(ctx.projectId, useCaseId),
    fetchOpts(ctx)
  )
}

function getFunctionalItemCached(ctx: HydrateCtx, functionId: string): Promise<FunctionalItem> {
  return cachedFetch(
    SpecPackCacheKeys.functionalItem(ctx.projectId, functionId),
    SpecPackCacheTtl.entity,
    () => catalogApi.getFunctionalItem(ctx.projectId, functionId),
    fetchOpts(ctx)
  )
}

function listUseCasesByFunctionCached(ctx: HydrateCtx, functionId: string): Promise<UseCase[]> {
  return cachedFetch(
    SpecPackCacheKeys.useCasesByFunction(ctx.projectId, functionId),
    SpecPackCacheTtl.entity,
    () => useCaseApi.listUseCasesByFunction(ctx.projectId, functionId),
    fetchOpts(ctx)
  )
}

async function loadLabelMaps(ctx: HydrateCtx): Promise<LabelMapsSnapshot> {
  return cachedFetch(
    SpecPackCacheKeys.labels(ctx.workspaceId),
    SpecPackCacheTtl.label,
    async () => {
      const screens = new Map<string, SpecPackPreviewItem>()
      const apis = new Map<string, SpecPackPreviewItem>()
      const communications = new Map<string, SpecPackPreviewItem>()
      try {
        const apps = await appApi.listApplications(ctx.workspaceId)
        await Promise.all(
          apps.items.slice(0, 12).map(async (app) => {
            const [scr, api, comm] = await Promise.all([
              appApi.listScreens(ctx.workspaceId, app.id).catch(() => ({ items: [] })),
              appApi.listApiEndpoints(ctx.workspaceId, app.id).catch(() => ({ items: [] })),
              appApi
                .listCommunicationSpecs(ctx.workspaceId, app.id)
                .catch(() => ({ items: [] })),
            ])
            for (const s of scr.items) {
              screens.set(s.id, {
                id: s.id,
                code: s.code,
                name: s.name,
                secondary: s.routePath ?? null,
              })
            }
            for (const a of api.items) {
              apis.set(a.id, {
                id: a.id,
                code: a.method,
                name: a.pathPattern || a.name || a.id,
                secondary: a.name ?? null,
              })
            }
            for (const c of comm.items) {
              communications.set(c.id, {
                id: c.id,
                code: c.code,
                name: c.name,
                secondary: c.triggerKey ?? null,
              })
            }
          })
        )
      } catch {
        // optional
      }
      return { screens, apis, communications }
    },
    fetchOpts(ctx)
  )
}

async function ensureLabelMaps(ctx: HydrateCtx): Promise<LabelMapsSnapshot> {
  if (ctx.labels) return ctx.labels
  ctx.labels = await loadLabelMaps(ctx)
  return ctx.labels
}

async function loadUseCasePreview(
  ctx: HydrateCtx,
  useCaseId: string,
  fallback?: { key?: string; name?: string }
): Promise<SpecPackPreviewUseCase> {
  try {
    const detail = await getUseCaseDetailCached(ctx, useCaseId)
    return mapUseCaseDetail(detail)
  } catch {
    return {
      id: useCaseId,
      key: fallback?.key || useCaseId.slice(0, 8),
      name: fallback?.name || 'Use Case',
      conditions: [],
      businessRules: [],
      acceptanceCriteria: [],
      flows: [],
    }
  }
}

async function ensureReqFunctionIndex(ctx: HydrateCtx): Promise<void> {
  if (ctx.reqToFns) return
  ctx.reqToFns = await cachedFetch(
    SpecPackCacheKeys.reqFnIndex(ctx.projectId),
    SpecPackCacheTtl.index,
    async () => {
      const map = new Map<string, FnRef[]>()
      try {
        const listed = await cachedFetch(
          SpecPackCacheKeys.functionalItems(ctx.projectId),
          SpecPackCacheTtl.entity,
          () => catalogApi.listFunctionalItems(ctx.projectId),
          fetchOpts(ctx)
        )
        await Promise.all(
          listed.items.map(async (fi) => {
            try {
              const reqIds = await cachedFetch(
                SpecPackCacheKeys.functionReqs(ctx.projectId, fi.id),
                SpecPackCacheTtl.entity,
                () => useCaseApi.getFunctionRequirements(ctx.projectId, fi.id),
                fetchOpts(ctx)
              )
              for (const reqId of reqIds) {
                const list = map.get(reqId) ?? []
                list.push({ id: fi.id, code: fi.code, name: fi.title })
                map.set(reqId, list)
              }
            } catch {
              // skip
            }
          })
        )
      } catch {
        // skip
      }
      return map
    },
    fetchOpts(ctx)
  )
}

/** Link panel writes TraceLink COVERS; Spec Pack / coverage historically read junction only. */
async function ensureCoversReqFunctionIndex(ctx: HydrateCtx): Promise<void> {
  if (ctx.coversReqToFns) return
  ctx.coversReqToFns = await cachedFetch(
    SpecPackCacheKeys.coversReqFnIndex(ctx.projectId),
    SpecPackCacheTtl.index,
    async () => {
      const map = new Map<string, FnRef[]>()
      try {
        const res = await appApi.listTraceLinks(ctx.projectId, {
          linkType: TraceLinkType.Covers,
          sourceType: 'REQUIREMENT',
          targetType: 'FUNCTIONAL_ITEM',
          limit: 500,
        })
        for (const link of res.items) {
          if (
            link.sourceType.toUpperCase() !== 'REQUIREMENT' ||
            link.targetType.toUpperCase() !== 'FUNCTIONAL_ITEM' ||
            link.linkType.toUpperCase() !== TraceLinkType.Covers
          ) {
            continue
          }
          const list = map.get(link.sourceId) ?? []
          if (list.some((f) => f.id === link.targetId)) continue
          list.push({
            id: link.targetId,
            code: link.targetCode ?? null,
            name: link.targetTitle || link.targetCode || link.targetId,
          })
          map.set(link.sourceId, list)
        }
      } catch {
        // optional
      }
      return map
    },
    fetchOpts(ctx)
  )
}

async function resolveFunctionIdsForRequirement(
  ctx: HydrateCtx,
  requirementId: string,
  detailFns: TracePreviewObject[],
  detailUseCases: TracePreviewObject[],
  functionalItemId?: string | null
): Promise<FnRef[]> {
  const byId = new Map<string, FnRef>()

  for (const fn of detailFns) {
    byId.set(fn.id, { id: fn.id, code: fn.code, name: fn.name || fn.code || fn.id })
  }

  if (functionalItemId && !byId.has(functionalItemId)) {
    byId.set(functionalItemId, { id: functionalItemId, name: functionalItemId })
  }

  // Always merge TraceLink COVERS (UI link panel source of truth for many projects)
  await ensureCoversReqFunctionIndex(ctx)
  for (const fn of ctx.coversReqToFns?.get(requirementId) ?? []) {
    if (!byId.has(fn.id)) byId.set(fn.id, fn)
  }

  if (byId.size === 0 && detailUseCases.length > 0) {
    await Promise.all(
      detailUseCases.map(async (uc) => {
        try {
          const d = await getUseCaseDetailCached(ctx, uc.id)
          const pf = d.overview.primaryFunctionId
          if (!pf || byId.has(pf)) return
          byId.set(pf, {
            id: pf,
            name: d.overview.primaryFunctionName || pf,
          })
        } catch {
          // skip
        }
      })
    )
  }

  if (byId.size === 0) {
    await ensureReqFunctionIndex(ctx)
    for (const fn of ctx.reqToFns?.get(requirementId) ?? []) {
      byId.set(fn.id, fn)
    }
  }

  return [...byId.values()]
}

async function buildFunctionBlock(
  ctx: HydrateCtx,
  fnRef: { id: string; code?: string | null; name: string },
  preferredUcIds: string[] | null
): Promise<SpecPackPreviewFunctionBlock> {
  let description: string | null = null
  let priority: string | null = null
  let code = fnRef.code ?? null
  let name = fnRef.name
  let module: SpecPackPreviewItem | null = null

  try {
    const detail = await getFunctionalItemCached(ctx, fnRef.id)
    description = detail.description ?? null
    priority = detail.priority ?? null
    code = detail.code
    name = detail.title
    if (detail.moduleId) {
      module = { id: detail.moduleId, name: detail.moduleId, secondary: 'Module' }
    }
  } catch {
    // keep ref
  }

  let ucIds = preferredUcIds
  if (!ucIds?.length) {
    try {
      const listed = await listUseCasesByFunctionCached(ctx, fnRef.id)
      ucIds = listed.map((u) => u.id)
    } catch {
      ucIds = []
    }
  }

  const [useCases, linkBundle] = await Promise.all([
    Promise.all(ucIds.map((id) => loadUseCasePreview(ctx, id))),
    (async () => {
      const labels = await ensureLabelMaps(ctx)
      const [scrLinks, apiLinks, commLinks] = await Promise.all([
        cachedFetch(
          SpecPackCacheKeys.functionScreens(ctx.projectId, fnRef.id),
          SpecPackCacheTtl.entity,
          () =>
            catalogApi.listFunctionScreens(ctx.projectId, fnRef.id).catch(() => ({ items: [] })),
          fetchOpts(ctx)
        ),
        cachedFetch(
          SpecPackCacheKeys.functionApis(ctx.projectId, fnRef.id),
          SpecPackCacheTtl.entity,
          () =>
            catalogApi
              .listFunctionApiEndpoints(ctx.projectId, fnRef.id)
              .catch(() => ({ items: [] })),
          fetchOpts(ctx)
        ),
        cachedFetch(
          SpecPackCacheKeys.functionComms(ctx.projectId, fnRef.id),
          SpecPackCacheTtl.entity,
          () =>
            catalogApi
              .listFunctionCommunications(ctx.projectId, fnRef.id)
              .catch(() => ({ items: [] })),
          fetchOpts(ctx)
        ),
      ])
      return { labels, scrLinks, apiLinks, commLinks }
    })(),
  ])

  const { labels, scrLinks, apiLinks, commLinks } = linkBundle

  return {
    function: { id: fnRef.id, code, name, description, priority },
    module,
    useCases,
    screens: scrLinks.items.map(
      (l) =>
        labels.screens.get(l.screenId) ?? {
          id: l.screenId,
          name: 'Screen',
          secondary: l.screenId.slice(0, 8),
        }
    ),
    apis: apiLinks.items.map(
      (l) =>
        labels.apis.get(l.apiEndpointId) ?? {
          id: l.apiEndpointId,
          name: 'API',
          secondary: l.apiEndpointId.slice(0, 8),
        }
    ),
    components: [],
    entities: [],
    communications: commLinks.items.map(
      (l) =>
        labels.communications.get(l.communicationId) ?? {
          id: l.communicationId,
          name: 'Communication',
          secondary: l.communicationId.slice(0, 8),
        }
    ),
  }
}

async function buildChapter(
  ctx: HydrateCtx,
  requirementId: string,
  fallback: {
    code: string
    title: string
    requirementType?: string | null
    description?: string | null
    functionalItemId?: string | null
  }
): Promise<SpecPackPreviewRequirementChapter> {
  try {
    const detail = await cachedFetch(
      SpecPackCacheKeys.trace(ctx.projectId, requirementId),
      SpecPackCacheTtl.entity,
      () => rtApi.getRequirementTraceDetail(ctx.projectId, requirementId),
      fetchOpts(ctx)
    )

    const chainUcByFn = new Map<string, string[]>()
    if (detail.coverageChain?.length) {
      for (const node of detail.coverageChain) {
        chainUcByFn.set(
          node.function.id,
          node.useCases.map((u) => u.useCase.id)
        )
      }
    }

    const fnRefs = await resolveFunctionIdsForRequirement(
      ctx,
      requirementId,
      detail.functions?.length
        ? detail.functions
        : (detail.coverageChain ?? []).map((n) => n.function),
      detail.useCases ?? [],
      fallback.functionalItemId
    )

    const functions = await Promise.all(
      fnRefs.map((fn) => buildFunctionBlock(ctx, fn, chainUcByFn.get(fn.id) ?? null))
    )

    return {
      requirement: {
        id: requirementId,
        code: detail.requirement.code || fallback.code,
        title: detail.requirement.title || fallback.title,
        requirementType: detail.requirement.requirementType ?? fallback.requirementType,
        priority: detail.requirement.priority ?? null,
        description: fallback.description ?? null,
      },
      functions,
      loadError: null,
    }
  } catch (err) {
    return {
      requirement: {
        id: requirementId,
        code: fallback.code,
        title: fallback.title,
        requirementType: fallback.requirementType,
        description: fallback.description ?? null,
      },
      functions: [],
      loadError: err instanceof Error ? err.message : 'Failed to load requirement packet',
    }
  }
}

export type BuildSpecPackPreviewOptions = {
  /** Rebuild document even if doc cache is fresh */
  force?: boolean
  /** Also bypass entity/catalog TTL caches */
  bypassEntityCache?: boolean
}

/** Build the shared preview document used by UI + DOC export. */
export async function buildSpecPackPreviewDocument(
  workspaceId: string,
  pack: SpecPack,
  opts?: BuildSpecPackPreviewOptions
): Promise<SpecPackPreviewDocument> {
  if (!opts?.force && !opts?.bypassEntityCache) {
    const cached = getCachedSpecPackPreview(pack)
    if (cached && !cached.stale) return cached.doc
  }

  const ctx: HydrateCtx = {
    workspaceId,
    projectId: pack.projectId,
    forceEntities: Boolean(opts?.bypassEntityCache),
    labels: null,
    reqToFns: null,
    coversReqToFns: null,
  }

  const reqList = await cachedFetch(
    SpecPackCacheKeys.requirements(workspaceId, pack.projectId),
    SpecPackCacheTtl.entity,
    () =>
      requirementsApi.listRequirements(workspaceId, pack.projectId).catch(() => ({ items: [] })),
    fetchOpts(ctx)
  )
  const reqById = new Map(reqList.items.map((r) => [r.id, r]))

  const chapters = await Promise.all(
    pack.requirements.map((ref) => {
      const row = reqById.get(ref.id)
      return buildChapter(ctx, ref.id, {
        code: ref.code,
        title: ref.title,
        requirementType: ref.requirementType,
        description: row?.description ?? null,
        functionalItemId: row?.functionalItemId ?? null,
      })
    })
  )

  const doc: SpecPackPreviewDocument = {
    packId: pack.id,
    title: pack.title,
    note: pack.note,
    projectId: pack.projectId,
    createdAt: pack.createdAt,
    generatedAt: new Date().toISOString(),
    chapters,
  }

  setCachedSpecPackPreview(pack, doc)
  return doc
}
