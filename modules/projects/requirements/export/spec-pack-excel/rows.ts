import type {
  SpecPackPreviewDocument,
  SpecPackPreviewFunctionBlock,
  SpecPackPreviewRequirementChapter,
  SpecPackPreviewSection,
} from '../../model/spec-pack-preview'
import { formatSpecPackDate } from '../../model/spec-pack'

export type SpecPackExcelRequirementRow = {
  groupNo: number
  groupName: string
  chapterNo: number
  requirementId: string
  code: string
  title: string
  type: string
  priority: string
  description: string
  functionCount: number
  loadError: string
}

export type SpecPackExcelFunctionRow = {
  groupName: string
  chapterNo: number
  requirementCode: string
  fnIndex: string
  functionId: string
  code: string
  name: string
  type: string
  priority: string
  status: string
  module: string
  description: string
  acceptanceCriteria: string
  businessRules: string
  createdAt: string
  updatedAt: string
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

function resolveSections(doc: SpecPackPreviewDocument): SpecPackPreviewSection[] {
  if (doc.sections?.length) return doc.sections
  return [
    {
      group: { id: 'legacy', name: 'Requirements', description: null },
      chapters: doc.chapters,
    },
  ]
}

export function flattenSpecPackForExcel(doc: SpecPackPreviewDocument): {
  sections: SpecPackPreviewSection[]
  requirementRows: SpecPackExcelRequirementRow[]
  functionRows: SpecPackExcelFunctionRow[]
  linkRows: SpecPackExcelLinkRow[]
  useCaseRows: SpecPackExcelUseCaseRow[]
  functionCount: number
} {
  const sections = resolveSections(doc)
  const requirementRows: SpecPackExcelRequirementRow[] = []
  const functionRows: SpecPackExcelFunctionRow[] = []
  const linkRows: SpecPackExcelLinkRow[] = []
  const useCaseRows: SpecPackExcelUseCaseRow[] = []

  let chapterNo = 0
  let functionCount = 0

  sections.forEach((section, sIndex) => {
    section.chapters.forEach((chapter) => {
      chapterNo += 1
      pushChapter(
        section,
        sIndex + 1,
        chapterNo,
        chapter,
        requirementRows,
        functionRows,
        linkRows,
        useCaseRows
      )
      functionCount += chapter.functions.length
    })
  })

  return {
    sections,
    requirementRows,
    functionRows,
    linkRows,
    useCaseRows,
    functionCount,
  }
}

function pushChapter(
  section: SpecPackPreviewSection,
  groupNo: number,
  chapterNo: number,
  chapter: SpecPackPreviewRequirementChapter,
  requirementRows: SpecPackExcelRequirementRow[],
  functionRows: SpecPackExcelFunctionRow[],
  linkRows: SpecPackExcelLinkRow[],
  useCaseRows: SpecPackExcelUseCaseRow[]
): void {
  const req = chapter.requirement
  requirementRows.push({
    groupNo,
    groupName: section.group.name,
    chapterNo,
    requirementId: req.id,
    code: req.code,
    title: req.title,
    type: req.requirementType ?? '',
    priority: req.priority ?? '',
    description: req.description ?? '',
    functionCount: chapter.functions.length,
    loadError: chapter.loadError ?? '',
  })

  chapter.functions.forEach((block, fnIdx) => {
    const fn = block.function
    const fnIndex = `${chapterNo}.${fnIdx + 1}`
    functionRows.push({
      groupName: section.group.name,
      chapterNo,
      requirementCode: req.code,
      fnIndex,
      functionId: fn.id,
      code: fn.code ?? '',
      name: fn.name,
      type: fn.type ?? '',
      priority: fn.priority ?? '',
      status: fn.status ?? '',
      module: block.module?.name ?? '',
      description: fn.description ?? '',
      acceptanceCriteria: (fn.acceptanceCriteria ?? []).join('\n'),
      businessRules: (fn.businessRules ?? [])
        .map((r) =>
          joinLines([
            [r.code, r.title].filter(Boolean).join(' — '),
            r.description,
            r.severity ? `Severity: ${r.severity}` : null,
            r.status ? `Status: ${r.status}` : null,
          ])
        )
        .join('\n\n'),
      createdAt: fn.createdAt ? formatSpecPackDate(fn.createdAt) : '',
      updatedAt: fn.updatedAt ? formatSpecPackDate(fn.updatedAt) : '',
    })

    const pushLinks = (
      type: string,
      items: SpecPackPreviewFunctionBlock['screens']
    ) => {
      for (const item of items) {
        linkRows.push({
          requirementCode: req.code,
          functionCode: fn.code ?? '',
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
        functionCode: fn.code ?? '',
        useCaseKey: uc.key,
        useCaseName: uc.name,
        goal: uc.goal ?? '',
        primaryActor: uc.primaryActorName ?? '',
        trigger: uc.triggerText ?? '',
        conditions: uc.conditions
          .map((c) => `[${c.type}] ${c.content}`)
          .join('\n'),
        businessRules: uc.businessRules
          .map((r) => `${r.code}: ${r.description}`)
          .join('\n'),
        acceptanceCriteria: formatAcList(uc.acceptanceCriteria),
        flows: formatFlows(uc.flows),
      })
    }
  })
}
