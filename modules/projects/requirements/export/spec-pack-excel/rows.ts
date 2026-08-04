import type {
  SpecPackPreviewDocument,
  SpecPackPreviewFunctionBlock,
  SpecPackPreviewRequirementChapter,
  SpecPackPreviewSection,
} from '../../model/spec-pack-preview'
import { formatSpecPackDate } from '../../model/spec-pack'

/** One requirement per row — primary business reading surface. */
export type SpecPackExcelScopeRow = {
  group: string
  area: string
  reqCode: string
  requirement: string
  description: string
  priority: string
  type: string
  status: string
}

/** One acceptance criterion per row. */
export type SpecPackExcelAcRow = {
  group: string
  reqCode: string
  requirement: string
  acNo: string
  criterion: string
  functionCode: string
}

/** One business rule per row. */
export type SpecPackExcelBrRow = {
  group: string
  reqCode: string
  brCode: string
  businessRule: string
  detail: string
  priority: string
  status: string
  functionCode: string
}

/** Metadata / IDs — not for stakeholder reading. */
export type SpecPackExcelTechnicalRow = {
  group: string
  reqCode: string
  requirementTitle: string
  requirementId: string
  functionCode: string
  functionName: string
  functionId: string
  module: string
  type: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
  loadError: string
  packId: string
  projectId: string
  groupId: string
}

export type SpecPackExcelDashboardStats = {
  title: string
  generatedAt: string
  requirementCount: number
  functionCount: number
  acceptanceCriteriaCount: number
  businessRulesCount: number
  byGroup: Array<{ label: string; count: number }>
  byPriority: Array<{ label: string; count: number }>
  byType: Array<{ label: string; count: number }>
}

export type SpecPackExcelFlat = {
  sections: SpecPackPreviewSection[]
  scopeRows: SpecPackExcelScopeRow[]
  acRows: SpecPackExcelAcRow[]
  brRows: SpecPackExcelBrRow[]
  technicalRows: SpecPackExcelTechnicalRow[]
  dashboard: SpecPackExcelDashboardStats
  linkRows: SpecPackExcelLinkRow[]
  useCaseRows: SpecPackExcelUseCaseRow[]
}

export type SpecPackExcelLinkRow = {
  requirementCode: string
  functionCode: string
  functionName: string
  artifactType: string
  code: string
  name: string
  secondary: string
}

export type SpecPackExcelUseCaseRow = {
  requirementCode: string
  functionCode: string
  useCaseKey: string
  useCaseName: string
  goal: string
  primaryActor: string
  trigger: string
  conditions: string
  businessRules: string
  acceptanceCriteria: string
  flows: string
}

function joinLines(parts: Array<string | null | undefined>): string {
  return parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join('\n')
}

function formatAcList(
  items: Array<{
    title: string
    givenText?: string | null
    whenText?: string | null
    thenText?: string | null
  }>
): string {
  return items
    .map((ac, i) => {
      const bits = [
        `${i + 1}. ${ac.title}`,
        ac.givenText ? `Given: ${ac.givenText}` : null,
        ac.whenText ? `When: ${ac.whenText}` : null,
        ac.thenText ? `Then: ${ac.thenText}` : null,
      ]
      return joinLines(bits)
    })
    .filter(Boolean)
    .join('\n\n')
}

function formatFlows(
  flows: SpecPackPreviewFunctionBlock['useCases'][number]['flows']
): string {
  return flows
    .map((f) => {
      const head = [f.flowType, f.name].filter(Boolean).join(' · ')
      const steps = f.steps
        .map((s, i) => `${i + 1}. [${s.stepType}] ${s.text}`)
        .join('\n')
      return joinLines([head, f.conditionText, steps])
    })
    .filter(Boolean)
    .join('\n\n')
}

function formatUseCaseCriterion(ac: {
  title: string
  givenText?: string | null
  whenText?: string | null
  thenText?: string | null
}): string {
  return joinLines([
    ac.title,
    ac.givenText ? `Given: ${ac.givenText}` : null,
    ac.whenText ? `When: ${ac.whenText}` : null,
    ac.thenText ? `Then: ${ac.thenText}` : null,
  ])
}

function uniqueJoin(values: Array<string | null | undefined>): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of values) {
    const v = (raw ?? '').trim()
    if (!v || seen.has(v)) continue
    seen.add(v)
    out.push(v)
  }
  return out.join(', ')
}

function countBy(labels: string[]): Array<{ label: string; count: number }> {
  const map = new Map<string, number>()
  for (const raw of labels) {
    const label = raw.trim() || '(unset)'
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

function resolveSections(doc: SpecPackPreviewDocument): SpecPackPreviewSection[] {
  if (doc.sections?.length) return doc.sections
  return [
    {
      group: { id: 'legacy', name: 'Requirements', description: null },
      chapters: doc.chapters,
    },
  ]
}

function primaryArea(blocks: SpecPackPreviewFunctionBlock[]): string {
  return uniqueJoin(blocks.map((b) => b.module?.name))
}

function primaryStatus(blocks: SpecPackPreviewFunctionBlock[]): string {
  return uniqueJoin(blocks.map((b) => b.function.status))
}

export function flattenSpecPackForExcel(doc: SpecPackPreviewDocument): SpecPackExcelFlat {
  const sections = resolveSections(doc)
  const scopeRows: SpecPackExcelScopeRow[] = []
  const acRows: SpecPackExcelAcRow[] = []
  const brRows: SpecPackExcelBrRow[] = []
  const technicalRows: SpecPackExcelTechnicalRow[] = []
  const linkRows: SpecPackExcelLinkRow[] = []
  const useCaseRows: SpecPackExcelUseCaseRow[] = []

  let functionCount = 0

  for (const section of sections) {
    for (const chapter of section.chapters) {
      pushChapter(
        doc,
        section,
        chapter,
        scopeRows,
        acRows,
        brRows,
        technicalRows,
        linkRows,
        useCaseRows
      )
      functionCount += chapter.functions.length
    }
  }

  return {
    sections,
    scopeRows,
    acRows,
    brRows,
    technicalRows,
    linkRows,
    useCaseRows,
    dashboard: {
      title: doc.title,
      generatedAt: formatSpecPackDate(doc.generatedAt),
      requirementCount: scopeRows.length,
      functionCount,
      acceptanceCriteriaCount: acRows.length,
      businessRulesCount: brRows.length,
      byGroup: countBy(scopeRows.map((r) => r.group)),
      byPriority: countBy(scopeRows.map((r) => r.priority)),
      byType: countBy(scopeRows.map((r) => r.type)),
    },
  }
}

function pushChapter(
  doc: SpecPackPreviewDocument,
  section: SpecPackPreviewSection,
  chapter: SpecPackPreviewRequirementChapter,
  scopeRows: SpecPackExcelScopeRow[],
  acRows: SpecPackExcelAcRow[],
  brRows: SpecPackExcelBrRow[],
  technicalRows: SpecPackExcelTechnicalRow[],
  linkRows: SpecPackExcelLinkRow[],
  useCaseRows: SpecPackExcelUseCaseRow[]
): void {
  const req = chapter.requirement
  const groupName = section.group.name

  scopeRows.push({
    group: groupName,
    area: primaryArea(chapter.functions),
    reqCode: req.code,
    requirement: req.title,
    description: req.description ?? '',
    priority: req.priority ?? '',
    type: req.requirementType ?? '',
    status: primaryStatus(chapter.functions),
  })

  let acCounter = 0

  if (chapter.functions.length === 0) {
    technicalRows.push({
      group: groupName,
      reqCode: req.code,
      requirementTitle: req.title,
      requirementId: req.id,
      functionCode: '',
      functionName: '',
      functionId: '',
      module: '',
      type: req.requirementType ?? '',
      priority: req.priority ?? '',
      status: '',
      createdAt: '',
      updatedAt: '',
      loadError: chapter.loadError ?? '',
      packId: doc.packId,
      projectId: doc.projectId,
      groupId: section.group.id,
    })
  }

  chapter.functions.forEach((block) => {
    const fn = block.function
    const fnCode = fn.code ?? ''

    for (const text of fn.acceptanceCriteria ?? []) {
      const criterion = text.trim()
      if (!criterion) continue
      acCounter += 1
      acRows.push({
        group: groupName,
        reqCode: req.code,
        requirement: req.title,
        acNo: String(acCounter),
        criterion,
        functionCode: fnCode,
      })
    }

    for (const uc of block.useCases) {
      for (const ac of uc.acceptanceCriteria) {
        const criterion = formatUseCaseCriterion(ac)
        if (!criterion) continue
        acCounter += 1
        acRows.push({
          group: groupName,
          reqCode: req.code,
          requirement: req.title,
          acNo: String(acCounter),
          criterion,
          functionCode: fnCode,
        })
      }
    }

    for (const rule of fn.businessRules ?? []) {
      brRows.push({
        group: groupName,
        reqCode: req.code,
        brCode: rule.code || '',
        businessRule: rule.title || rule.code || 'Rule',
        detail: rule.description ?? '',
        priority: rule.severity ?? fn.priority ?? '',
        status: rule.status ?? '',
        functionCode: fnCode,
      })
    }

    technicalRows.push({
      group: groupName,
      reqCode: req.code,
      requirementTitle: req.title,
      requirementId: req.id,
      functionCode: fnCode,
      functionName: fn.name,
      functionId: fn.id,
      module: block.module?.name ?? '',
      type: fn.type ?? req.requirementType ?? '',
      priority: fn.priority ?? req.priority ?? '',
      status: fn.status ?? '',
      createdAt: fn.createdAt ? formatSpecPackDate(fn.createdAt) : '',
      updatedAt: fn.updatedAt ? formatSpecPackDate(fn.updatedAt) : '',
      loadError: chapter.loadError ?? '',
      packId: doc.packId,
      projectId: doc.projectId,
      groupId: section.group.id,
    })

    const pushLinks = (
      type: string,
      items: SpecPackPreviewFunctionBlock['screens']
    ) => {
      for (const item of items) {
        linkRows.push({
          requirementCode: req.code,
          functionCode: fnCode,
          functionName: fn.name,
          artifactType: type,
          code: item.code ?? '',
          name: item.name,
          secondary: item.secondary ?? '',
        })
      }
    }

    pushLinks('module', block.module ? [block.module] : [])
    pushLinks('screen', block.screens)
    pushLinks('api', block.apis)
    pushLinks('component', block.components)
    pushLinks('entity', block.entities)
    pushLinks('communication', block.communications)

    for (const uc of block.useCases) {
      useCaseRows.push({
        requirementCode: req.code,
        functionCode: fnCode,
        useCaseKey: uc.key,
        useCaseName: uc.name,
        goal: uc.goal ?? '',
        primaryActor: uc.primaryActorName ?? '',
        trigger: uc.triggerText ?? '',
        conditions: uc.conditions.map((c) => `[${c.type}] ${c.content}`).join('\n'),
        businessRules: uc.businessRules
          .map((r) => `${r.code}: ${r.description}`)
          .join('\n'),
        acceptanceCriteria: formatAcList(uc.acceptanceCriteria),
        flows: formatFlows(uc.flows),
      })
    }
  })
}
