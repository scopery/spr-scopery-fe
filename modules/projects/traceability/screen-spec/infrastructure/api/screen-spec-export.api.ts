import { apiClient } from '@/shared/lib/apiClient'
import { listScreenFields, listScreenSections, listScreens } from '../../../api/traceability.api'
import type { RegistryScreenField, RegistryScreenSection } from '../../../model/application-registry'
import type { ScreenMode } from '../../domain/model/screen-spec'
import type { ScreenFullSpec, ScreenFullSpecField, ScreenSpecDocFullSpec } from '../../domain/model/screen-spec-doc'
import { SCREEN_SPEC_ENDPOINTS as EP } from './endpoints'
import {
  getScreenFullSpec,
  getScreenSpecDoc,
  getScreenSpecDocFullSpec,
  listSpecDocRevisions,
  mapFullSpecField,
  mapScreenFullSpec,
} from './spec-doc.api'
import {
  pickValidationsWithRuleCodes,
  resolveValidationRuleCodes,
} from '../../domain/rules/screen-spec-excel.rules'
import {
  getScreenFieldDetail,
  listEventItems,
  listFieldModeConfigs,
  listFieldValidations,
  listProcessItems,
  listScreenModes,
  listValidationRuleTypes,
} from './screen-spec.api'

function mergeModesByCode(fromSpec: ScreenMode[], fromList: ScreenMode[]): ScreenMode[] {
  const byCode = new Map<string, ScreenMode>()
  for (const mode of [...fromSpec, ...fromList]) {
    const code = String(mode.modeCode ?? '').trim().toUpperCase()
    if (!code || byCode.has(code)) continue
    byCode.set(code, { ...mode, modeCode: code })
  }
  return [...byCode.values()].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
}

function fieldFromList(field: RegistryScreenField): ScreenFullSpecField {
  return {
    id: field.id,
    screenId: field.screenId,
    sectionId: field.sectionId ?? null,
    fieldKey: field.fieldKey,
    label: field.label,
    fieldType: field.fieldType,
    description: field.description ?? null,
    required: field.required ?? null,
    displayOrder: field.displayOrder ?? null,
    maxLength: null,
    remark: null,
    componentId: field.componentId ?? null,
    dataEntityFieldId: field.dataEntityFieldId ?? null,
    componentFieldId: field.componentFieldId ?? null,
    modeConfigs: [],
    validations: [],
    component: null,
    dataField: null,
  }
}

function sectionFromList(section: RegistryScreenSection) {
  return {
    id: section.id,
    name: section.name,
    description: section.description ?? null,
    displayOrder: section.displayOrder ?? null,
    status: section.status,
  }
}

async function loadFieldForExport(
  workspaceId: string,
  screenId: string,
  field: ScreenFullSpecField
): Promise<ScreenFullSpecField> {
  const [detailRaw, configs, validations] = await Promise.all([
    apiClient.get<unknown>(EP.screenField(workspaceId, screenId, field.id)).catch(() => null),
    field.modeConfigs.length > 0
      ? Promise.resolve({ items: field.modeConfigs })
      : listFieldModeConfigs(workspaceId, screenId, field.id).catch(() => ({ items: [] })),
    listFieldValidations(workspaceId, screenId, field.id).catch(() => ({ items: [] })),
  ])
  const detail = detailRaw ? mapFullSpecField(detailRaw) : null
  const fallback = await (detail
    ? Promise.resolve(null)
    : getScreenFieldDetail(workspaceId, screenId, field.id).catch(() => null))
  return {
    ...field,
    ...(fallback ?? {}),
    ...(detail ?? {}),
    id: field.id,
    sectionId: detail?.sectionId ?? fallback?.sectionId ?? field.sectionId,
    modeConfigs:
      (detail?.modeConfigs.length ? detail.modeConfigs : null) ??
      (configs.items.length ? configs.items : field.modeConfigs),
    validations: pickValidationsWithRuleCodes(
      field.validations,
      detail?.validations ?? [],
      validations.items
    ),
    component: detail?.component ?? field.component,
    dataField: detail?.dataField ?? field.dataField,
    maxLength: detail?.maxLength ?? fallback?.maxLength ?? field.maxLength,
    required: detail?.required ?? fallback?.required ?? field.required,
  }
}

export async function loadExportScreenCatalog(
  workspaceId: string,
  applicationId: string | null | undefined
): Promise<Array<{ id: string; code: string; name: string }>> {
  if (!applicationId) return []
  try {
    const res = await listScreens(workspaceId, applicationId)
    return res.items.map((screen) => ({
      id: screen.id,
      code: screen.code,
      name: screen.name,
      mockupUrl: screen.mockupUrl ?? null,
    }))
  } catch {
    return []
  }
}

export async function loadScreenFullSpecForExport(
  workspaceId: string,
  screenId: string,
  seed?: ScreenFullSpec | null
): Promise<ScreenFullSpec> {
  const [spec, modes, sections, fields, processes, events] = await Promise.all([
    seed && (seed.fields.length > 0 || seed.sections.length > 0 || seed.processItems.length > 0)
      ? Promise.resolve(seed)
      : getScreenFullSpec(workspaceId, screenId).catch(() => seed ?? mapScreenFullSpec({ id: screenId })),
    listScreenModes(workspaceId, screenId).catch(() => ({ items: [] })),
    listScreenSections(workspaceId, screenId).catch(() => ({ items: [] })),
    listScreenFields(workspaceId, screenId).catch(() => ({ items: [] })),
    listProcessItems(workspaceId, screenId).catch(() => ({ items: [] })),
    listEventItems(workspaceId, screenId).catch(() => ({ items: [] })),
  ])

  const base = spec ?? mapScreenFullSpec({ id: screenId })
  const merged: ScreenFullSpec = {
    ...base,
    id: base.id || screenId,
    modes: mergeModesByCode(base.modes, modes.items),
    sections: base.sections.length > 0 ? base.sections : sections.items.map(sectionFromList),
    fields: base.fields.length > 0 ? base.fields : fields.items.map(fieldFromList),
    processItems: base.processItems.length > 0 ? base.processItems : processes.items,
    eventItems: base.eventItems.length > 0 ? base.eventItems : events.items,
  }

  if (merged.fields.length === 0) return merged
  const [enrichedFields, ruleTypes] = await Promise.all([
    Promise.all(
      merged.fields.map((field) => loadFieldForExport(workspaceId, merged.id || screenId, field))
    ),
    listValidationRuleTypes(workspaceId).catch(() => ({ items: [] })),
  ])
  return {
    ...merged,
    fields: enrichedFields.map((field) => ({
      ...field,
      validations: resolveValidationRuleCodes(field.validations, ruleTypes.items),
    })),
  }
}

export async function loadScreenSpecDocFullSpecForExport(
  workspaceId: string,
  docId: string
): Promise<ScreenSpecDocFullSpec> {
  const doc = await getScreenSpecDocFullSpec(workspaceId, docId)
  let entries = doc.screens
  if (entries.length === 0) {
    const meta = await getScreenSpecDoc(workspaceId, docId).catch(() => null)
    entries = (meta?.screens ?? []).map((ref) => ({
      screenId: ref.screenId,
      displayOrder: ref.displayOrder,
      note: ref.note,
      screen: mapScreenFullSpec({
        id: ref.screenId,
        code: ref.code,
        name: ref.name,
        routePath: ref.routePath,
      }),
    }))
  }

  const [screens, revisions] = await Promise.all([
    Promise.all(
      entries.map(async (entry) => {
        const screenId = entry.screen.id || entry.screenId || ''
        if (!screenId) return entry
        return {
          ...entry,
          screenId,
          screen: await loadScreenFullSpecForExport(workspaceId, screenId, entry.screen),
        }
      })
    ),
    doc.revisions.length > 0
      ? Promise.resolve(doc.revisions)
      : listSpecDocRevisions(workspaceId, docId)
          .then((res) => res.items)
          .catch(() => doc.revisions),
  ])

  return { ...doc, screens, revisions }
}
