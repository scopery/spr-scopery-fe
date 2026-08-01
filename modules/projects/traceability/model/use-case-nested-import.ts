import type {
  AddFlowStepBody,
  AddSupportingFunctionBody,
  AddUseCaseAcceptanceCriterionBody,
  AddUseCaseBusinessRuleBody,
  AddUseCaseConditionBody,
  CreateUseCaseFlowBody,
  UseCaseFlow,
} from './use-case'

/** One nested-parts payload for an existing Use Case (detail → Import). */
export interface UseCaseNestedImportPayload {
  flows?: UseCaseNestedFlowImport[]
  conditions?: UseCaseNestedConditionImport[]
  businessRules?: UseCaseNestedRuleImport[]
  acceptanceCriteria?: UseCaseNestedCriterionImport[]
  supportingFunctions?: UseCaseNestedSupportingFunctionImport[]
}

export interface UseCaseNestedFlowImport {
  flowType: string
  name?: string | null
  conditionText?: string | null
  steps?: UseCaseNestedStepImport[]
}

export interface UseCaseNestedStepImport {
  stepType: string
  content?: string | null
  contentJson?: string | null
  displayOrder?: number
}

export interface UseCaseNestedConditionImport {
  conditionType: string
  content: string
  displayOrder?: number
}

export interface UseCaseNestedRuleImport {
  ruleCode: string
  description: string
  displayOrder?: number
}

export interface UseCaseNestedCriterionImport {
  title: string
  givenText?: string | null
  whenText?: string | null
  thenText?: string | null
  displayOrder?: number
}

export interface UseCaseNestedSupportingFunctionImport {
  functionId: string
}

export interface UseCaseNestedImportMutations {
  createFlow: (body: CreateUseCaseFlowBody) => Promise<UseCaseFlow | undefined>
  addStep: (flowId: string, body: AddFlowStepBody) => Promise<void>
  addCondition: (body: AddUseCaseConditionBody) => Promise<void>
  addRule: (body: AddUseCaseBusinessRuleBody) => Promise<void>
  addCriterion: (body: AddUseCaseAcceptanceCriterionBody) => Promise<void>
  addSupportingFunction: (body: AddSupportingFunctionBody) => Promise<void>
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return fallback
}

/**
 * Accepts:
 * - `{ "items": [ { flows, … } ] }` (guide sample shape)
 * - `{ flows, conditions, … }` (single payload)
 * - `{ "items": [ … ] }` with multiple payloads → only first is applied on detail Import
 */
export function parseUseCaseNestedImportJson(text: string): UseCaseNestedImportPayload | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  const root = asRecord(parsed)
  if (!root) return null

  if (Array.isArray(root.items) && root.items.length > 0) {
    const first = asRecord(root.items[0])
    if (!first) return null
    return mapRecordToPayload(first)
  }

  return mapRecordToPayload(root)
}

function mapRecordToPayload(raw: Record<string, unknown>): UseCaseNestedImportPayload {
  const flowsRaw = Array.isArray(raw.flows) ? raw.flows : []
  const conditionsRaw = Array.isArray(raw.conditions) ? raw.conditions : []
  const rulesRaw = Array.isArray(raw.businessRules) ? raw.businessRules : []
  const criteriaRaw = Array.isArray(raw.acceptanceCriteria) ? raw.acceptanceCriteria : []
  const supportingRaw = Array.isArray(raw.supportingFunctions) ? raw.supportingFunctions : []

  return {
    flows: flowsRaw
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item) => {
        const stepsRaw = Array.isArray(item.steps) ? item.steps : []
        return {
          flowType: asString(item.flowType),
          name: asString(item.name) || null,
          conditionText: asString(item.conditionText) || null,
          steps: stepsRaw
            .map((step) => asRecord(step))
            .filter((step): step is Record<string, unknown> => Boolean(step))
            .map((step, index) => ({
              stepType: asString(step.stepType),
              content: asString(step.content) || null,
              contentJson: asString(step.contentJson) || null,
              displayOrder: asNumber(step.displayOrder, index),
            })),
        }
      })
      .filter((flow) => flow.flowType),
    conditions: conditionsRaw
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item, index) => ({
        conditionType: asString(item.conditionType),
        content: asString(item.content),
        displayOrder: asNumber(item.displayOrder, index),
      }))
      .filter((item) => item.conditionType && item.content),
    businessRules: rulesRaw
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item, index) => ({
        ruleCode: asString(item.ruleCode),
        description: asString(item.description),
        displayOrder: asNumber(item.displayOrder, index),
      }))
      .filter((item) => item.ruleCode && item.description),
    acceptanceCriteria: criteriaRaw
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item, index) => ({
        title: asString(item.title),
        givenText: asString(item.givenText) || null,
        whenText: asString(item.whenText) || null,
        thenText: asString(item.thenText) || null,
        displayOrder: asNumber(item.displayOrder, index),
      }))
      .filter((item) => item.title),
    supportingFunctions: supportingRaw
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item) => ({ functionId: asString(item.functionId) }))
      .filter((item) => item.functionId),
  }
}

export function countUseCaseNestedImportParts(payload: UseCaseNestedImportPayload): number {
  const stepCount = (payload.flows ?? []).reduce((sum, flow) => sum + (flow.steps?.length ?? 0), 0)
  return (
    (payload.flows?.length ?? 0) +
    stepCount +
    (payload.conditions?.length ?? 0) +
    (payload.businessRules?.length ?? 0) +
    (payload.acceptanceCriteria?.length ?? 0) +
    (payload.supportingFunctions?.length ?? 0)
  )
}

/**
 * Applies nested parts via existing per-entity APIs (no BE nested bulk).
 * Caller should refetch once after this returns.
 */
export async function applyUseCaseNestedImport(
  payload: UseCaseNestedImportPayload,
  mutations: UseCaseNestedImportMutations,
  options?: { skipReloadBetween?: boolean }
): Promise<{ createdParts: number }> {
  void options
  let createdParts = 0

  for (const flow of payload.flows ?? []) {
    const created = await mutations.createFlow({
      flowType: flow.flowType,
      name: flow.name ?? null,
      conditionText: flow.conditionText ?? null,
    })
    createdParts += 1
    const flowId = created?.id
    if (!flowId) continue

    for (const [index, step] of (flow.steps ?? []).entries()) {
      if (!step.stepType) continue
      const contentJson = step.contentJson ?? step.content ?? null
      await mutations.addStep(flowId, {
        stepType: step.stepType,
        contentJson,
        displayOrder: step.displayOrder ?? index,
      })
      createdParts += 1
    }
  }

  for (const [index, condition] of (payload.conditions ?? []).entries()) {
    await mutations.addCondition({
      conditionType: condition.conditionType,
      content: condition.content,
      displayOrder: condition.displayOrder ?? index,
    })
    createdParts += 1
  }

  for (const [index, rule] of (payload.businessRules ?? []).entries()) {
    await mutations.addRule({
      ruleCode: rule.ruleCode,
      description: rule.description,
      displayOrder: rule.displayOrder ?? index,
    })
    createdParts += 1
  }

  for (const [index, criterion] of (payload.acceptanceCriteria ?? []).entries()) {
    await mutations.addCriterion({
      title: criterion.title,
      givenText: criterion.givenText ?? null,
      whenText: criterion.whenText ?? null,
      thenText: criterion.thenText ?? null,
      displayOrder: criterion.displayOrder ?? index,
    })
    createdParts += 1
  }

  for (const supporting of payload.supportingFunctions ?? []) {
    await mutations.addSupportingFunction({ functionId: supporting.functionId })
    createdParts += 1
  }

  return { createdParts }
}
