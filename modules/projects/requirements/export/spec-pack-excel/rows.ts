import type {
  SpecPackPreviewDocument,
  SpecPackPreviewFunctionBlock,
  SpecPackPreviewFunctionDetail,
  SpecPackPreviewRequirementChapter,
  SpecPackPreviewSection,
  SpecPackPreviewUseCase,
} from '../../model/spec-pack-preview'
import { formatSpecPackDate } from '../../model/spec-pack'

export type SpecPackExcelRequirementRow = {
  group: string
  code: string
  title: string
  requirementType: string
  priority: string
  description: string
}

export type SpecPackExcelFunctionRow = {
  functionCode: string
  title: string
  description: string
  priority: string
  type: string
}

export type SpecPackExcelReqFnLinkRow = {
  requirementCode: string
  requirementTitle: string
  functionCode: string
  functionTitle: string
}

export type SpecPackExcelFnAcRow = {
  functionCode: string
  acNo: number
  criterion: string
}

export type SpecPackExcelFnBrRow = {
  functionCode: string
  ruleCode: string
  ruleTitle: string
  severity: string
  description: string
}

export type SpecPackExcelUseCaseRow = {
  useCaseKey: string
  name: string
  goal: string
  primaryActor: string
  trigger: string
}

export type SpecPackExcelFnUcLinkRow = {
  functionCode: string
  functionTitle: string
  useCaseKey: string
  useCaseName: string
}

export type SpecPackExcelUcConditionRow = {
  useCaseKey: string
  sequence: number
  conditionType: string
  content: string
}

export type SpecPackExcelUcFlowRow = {
  useCaseKey: string
  flowNo: number
  flowType: string
  flowName: string
  conditionText: string
}

export type SpecPackExcelUcFlowStepRow = {
  useCaseKey: string
  flowNo: number
  stepNo: number
  stepType: string
  content: string
}

export type SpecPackExcelUcBrRow = {
  useCaseKey: string
  ruleCode: string
  description: string
}

export type SpecPackExcelUcAcRow = {
  useCaseKey: string
  acNo: number
  title: string
  given: string
  when: string
  then: string
}

export type SpecPackExcelTechnicalRow = {
  group: string
  groupId: string
  requirementCode: string
  requirementId: string
  functionCode: string
  functionId: string
  functionStatus: string
  module: string
  moduleId: string
  useCaseKey: string
  useCaseId: string
  createdAt: string
  updatedAt: string
  loadError: string
  packId: string
  projectId: string
  packNote: string
}

export type SpecPackExcelSummaryStats = {
  title: string
  generatedAt: string
  requirementCount: number
  uniqueFunctionCount: number
  useCaseCount: number
  reqFnLinkCount: number
  fnUcLinkCount: number
  byGroup: Array<{ label: string; count: number }>
  byPriority: Array<{ label: string; count: number }>
  byType: Array<{ label: string; count: number }>
}

export type SpecPackExcelFlat = {
  summary: SpecPackExcelSummaryStats
  requirements: SpecPackExcelRequirementRow[]
  functions: SpecPackExcelFunctionRow[]
  reqFnLinks: SpecPackExcelReqFnLinkRow[]
  fnAcceptanceCriteria: SpecPackExcelFnAcRow[]
  fnBusinessRules: SpecPackExcelFnBrRow[]
  useCases: SpecPackExcelUseCaseRow[]
  fnUcLinks: SpecPackExcelFnUcLinkRow[]
  ucConditions: SpecPackExcelUcConditionRow[]
  ucFlows: SpecPackExcelUcFlowRow[]
  ucFlowSteps: SpecPackExcelUcFlowStepRow[]
  ucBusinessRules: SpecPackExcelUcBrRow[]
  ucAcceptanceCriteria: SpecPackExcelUcAcRow[]
  technical: SpecPackExcelTechnicalRow[]
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

/** Prefer business code; fall back to id so uncoded functions still dedupe. */
function functionKey(fn: SpecPackPreviewFunctionDetail): string {
  const code = (fn.code ?? '').trim()
  return code || fn.id
}

function functionDisplayCode(fn: SpecPackPreviewFunctionDetail): string {
  return (fn.code ?? '').trim() || fn.id
}

function useCaseKeyOf(uc: SpecPackPreviewUseCase): string {
  return (uc.key ?? '').trim() || uc.id
}

export function flattenSpecPackForExcel(doc: SpecPackPreviewDocument): SpecPackExcelFlat {
  const sections = resolveSections(doc)

  const requirements: SpecPackExcelRequirementRow[] = []
  const functions: SpecPackExcelFunctionRow[] = []
  const reqFnLinks: SpecPackExcelReqFnLinkRow[] = []
  const fnAcceptanceCriteria: SpecPackExcelFnAcRow[] = []
  const fnBusinessRules: SpecPackExcelFnBrRow[] = []
  const useCases: SpecPackExcelUseCaseRow[] = []
  const fnUcLinks: SpecPackExcelFnUcLinkRow[] = []
  const ucConditions: SpecPackExcelUcConditionRow[] = []
  const ucFlows: SpecPackExcelUcFlowRow[] = []
  const ucFlowSteps: SpecPackExcelUcFlowStepRow[] = []
  const ucBusinessRules: SpecPackExcelUcBrRow[] = []
  const ucAcceptanceCriteria: SpecPackExcelUcAcRow[] = []
  const technical: SpecPackExcelTechnicalRow[] = []

  const seenFunctions = new Set<string>()
  const seenReqFnLinks = new Set<string>()
  const seenUseCases = new Set<string>()
  const seenFnUcLinks = new Set<string>()

  for (const section of sections) {
    for (const chapter of section.chapters) {
      pushRequirementChapter(
        doc,
        section,
        chapter,
        {
          requirements,
          functions,
          reqFnLinks,
          fnAcceptanceCriteria,
          fnBusinessRules,
          useCases,
          fnUcLinks,
          ucConditions,
          ucFlows,
          ucFlowSteps,
          ucBusinessRules,
          ucAcceptanceCriteria,
          technical,
        },
        { seenFunctions, seenReqFnLinks, seenUseCases, seenFnUcLinks }
      )
    }
  }

  return {
    summary: {
      title: doc.title,
      generatedAt: formatSpecPackDate(doc.generatedAt),
      requirementCount: requirements.length,
      uniqueFunctionCount: functions.length,
      useCaseCount: useCases.length,
      reqFnLinkCount: reqFnLinks.length,
      fnUcLinkCount: fnUcLinks.length,
      byGroup: countBy(requirements.map((r) => r.group)),
      byPriority: countBy(requirements.map((r) => r.priority)),
      byType: countBy(requirements.map((r) => r.requirementType)),
    },
    requirements,
    functions,
    reqFnLinks,
    fnAcceptanceCriteria,
    fnBusinessRules,
    useCases,
    fnUcLinks,
    ucConditions,
    ucFlows,
    ucFlowSteps,
    ucBusinessRules,
    ucAcceptanceCriteria,
    technical,
  }
}

type Accumulators = {
  requirements: SpecPackExcelRequirementRow[]
  functions: SpecPackExcelFunctionRow[]
  reqFnLinks: SpecPackExcelReqFnLinkRow[]
  fnAcceptanceCriteria: SpecPackExcelFnAcRow[]
  fnBusinessRules: SpecPackExcelFnBrRow[]
  useCases: SpecPackExcelUseCaseRow[]
  fnUcLinks: SpecPackExcelFnUcLinkRow[]
  ucConditions: SpecPackExcelUcConditionRow[]
  ucFlows: SpecPackExcelUcFlowRow[]
  ucFlowSteps: SpecPackExcelUcFlowStepRow[]
  ucBusinessRules: SpecPackExcelUcBrRow[]
  ucAcceptanceCriteria: SpecPackExcelUcAcRow[]
  technical: SpecPackExcelTechnicalRow[]
}

type Seen = {
  seenFunctions: Set<string>
  seenReqFnLinks: Set<string>
  seenUseCases: Set<string>
  seenFnUcLinks: Set<string>
}

function pushRequirementChapter(
  doc: SpecPackPreviewDocument,
  section: SpecPackPreviewSection,
  chapter: SpecPackPreviewRequirementChapter,
  acc: Accumulators,
  seen: Seen
): void {
  const req = chapter.requirement
  const groupName = section.group.name

  acc.requirements.push({
    group: groupName,
    code: req.code,
    title: req.title,
    requirementType: req.requirementType ?? '',
    priority: req.priority ?? '',
    description: req.description ?? '',
  })

  if (chapter.functions.length === 0) {
    acc.technical.push({
      group: groupName,
      groupId: section.group.id,
      requirementCode: req.code,
      requirementId: req.id,
      functionCode: '',
      functionId: '',
      functionStatus: '',
      module: '',
      moduleId: '',
      useCaseKey: '',
      useCaseId: '',
      createdAt: '',
      updatedAt: '',
      loadError: chapter.loadError ?? '',
      packId: doc.packId,
      projectId: doc.projectId,
      packNote: doc.note ?? '',
    })
    return
  }

  for (const block of chapter.functions) {
    pushFunctionUnderRequirement(doc, section, chapter, block, acc, seen)
  }
}

function pushFunctionUnderRequirement(
  doc: SpecPackPreviewDocument,
  section: SpecPackPreviewSection,
  chapter: SpecPackPreviewRequirementChapter,
  block: SpecPackPreviewFunctionBlock,
  acc: Accumulators,
  seen: Seen
): void {
  const req = chapter.requirement
  const fn = block.function
  const fnKey = functionKey(fn)
  const fnCode = functionDisplayCode(fn)
  const isNewFunction = !seen.seenFunctions.has(fnKey)

  if (isNewFunction) {
    seen.seenFunctions.add(fnKey)
    acc.functions.push({
      functionCode: fnCode,
      title: fn.name,
      description: fn.description ?? '',
      priority: fn.priority ?? '',
      type: fn.type ?? '',
    })

    let acNo = 0
    for (const text of fn.acceptanceCriteria ?? []) {
      const criterion = text.trim()
      if (!criterion) continue
      acNo += 1
      acc.fnAcceptanceCriteria.push({
        functionCode: fnCode,
        acNo,
        criterion,
      })
    }

    for (const rule of fn.businessRules ?? []) {
      acc.fnBusinessRules.push({
        functionCode: fnCode,
        ruleCode: rule.code || '',
        ruleTitle: rule.title || '',
        severity: rule.severity ?? '',
        description: rule.description ?? '',
      })
    }
  }

  const linkKey = `${req.code}::${fnKey}`
  if (!seen.seenReqFnLinks.has(linkKey)) {
    seen.seenReqFnLinks.add(linkKey)
    acc.reqFnLinks.push({
      requirementCode: req.code,
      requirementTitle: req.title,
      functionCode: fnCode,
      functionTitle: fn.name,
    })
  }

  for (const uc of block.useCases) {
    pushUseCase(fnCode, fn.name, uc, acc, seen)
  }

  acc.technical.push({
    group: section.group.name,
    groupId: section.group.id,
    requirementCode: req.code,
    requirementId: req.id,
    functionCode: fnCode,
    functionId: fn.id,
    functionStatus: fn.status ?? '',
    module: block.module?.name ?? '',
    moduleId: fn.moduleId ?? block.module?.id ?? '',
    useCaseKey: '',
    useCaseId: '',
    createdAt: fn.createdAt ? formatSpecPackDate(fn.createdAt) : '',
    updatedAt: fn.updatedAt ? formatSpecPackDate(fn.updatedAt) : '',
    loadError: chapter.loadError ?? '',
    packId: doc.packId,
    projectId: doc.projectId,
    packNote: doc.note ?? '',
  })
}

function pushUseCase(
  functionCode: string,
  functionTitle: string,
  uc: SpecPackPreviewUseCase,
  acc: Accumulators,
  seen: Seen
): void {
  const ucKey = useCaseKeyOf(uc)
  const isNewUc = !seen.seenUseCases.has(ucKey)

  if (isNewUc) {
    seen.seenUseCases.add(ucKey)
    acc.useCases.push({
      useCaseKey: ucKey,
      name: uc.name,
      goal: uc.goal ?? '',
      primaryActor: uc.primaryActorName ?? '',
      trigger: uc.triggerText ?? '',
    })

    uc.conditions.forEach((c, i) => {
      acc.ucConditions.push({
        useCaseKey: ucKey,
        sequence: i + 1,
        conditionType: c.type,
        content: c.content,
      })
    })

    uc.flows.forEach((flow, flowIdx) => {
      const flowNo = flowIdx + 1
      acc.ucFlows.push({
        useCaseKey: ucKey,
        flowNo,
        flowType: flow.flowType,
        flowName: flow.name ?? '',
        conditionText: flow.conditionText ?? '',
      })
      flow.steps.forEach((step, stepIdx) => {
        acc.ucFlowSteps.push({
          useCaseKey: ucKey,
          flowNo,
          stepNo: stepIdx + 1,
          stepType: step.stepType,
          content: step.text,
        })
      })
    })

    for (const rule of uc.businessRules) {
      acc.ucBusinessRules.push({
        useCaseKey: ucKey,
        ruleCode: rule.code,
        description: rule.description,
      })
    }

    uc.acceptanceCriteria.forEach((ac, i) => {
      acc.ucAcceptanceCriteria.push({
        useCaseKey: ucKey,
        acNo: i + 1,
        title: ac.title,
        given: ac.givenText ?? '',
        when: ac.whenText ?? '',
        then: ac.thenText ?? '',
      })
    })
  }

  const fnUcKey = `${functionCode}::${ucKey}`
  if (!seen.seenFnUcLinks.has(fnUcKey)) {
    seen.seenFnUcLinks.add(fnUcKey)
    acc.fnUcLinks.push({
      functionCode,
      functionTitle,
      useCaseKey: ucKey,
      useCaseName: uc.name,
    })
  }
}
