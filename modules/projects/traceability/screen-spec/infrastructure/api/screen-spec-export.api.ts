import { apiClient } from '@/shared/lib/apiClient'
import { listScreenFields, listScreenSections } from '../../../api/traceability.api'
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
  getScreenFieldDetail,
  listEventItems,
  listFieldModeConfigs,
  listFieldValidations,
  listProcessItems,
  listScreenModes,
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

function needsFieldEnrichment(field: ScreenFullSpecField): boolean {
  if (field.modeConfigs.length === 0) return true
  if (field.dataEntityFieldId && !field.dataField) return true
  if (field.maxLength == null) return true
  return false
}

async function loadFieldForExport(
  workspaceId: string,
  screenId: string,
  field: ScreenFullSpecField
): Promise<ScreenFullSpecField> {
  if (!needsFieldEnrichment(field)) return field
  const [detailRaw, configs, validations] = await Promise.all([
    apiClient.get<unknown>(EP.screenField(workspaceId, screenId, field.id)).catch(() => null),
    field.modeConfigs.length > 0
      ? Promise.resolve({ items: field.modeConfigs })
      : listFieldModeConfigs(workspaceId, screenId, field.id).catch(() => ({ items: [] })),
    field.validations.length > 0
      ? Promise.resolve({ items: field.validations })
      : listFieldValidations(workspaceId, screenId, field.id).catch(() => ({ items: [] })),
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
    validations:
      (detail?.validations.length ? detail.validations : null) ??
      (validations.items.length ? validations.items : field.validations),
    component: detail?.component ?? field.component,
    dataField: detail?.dataField ?? field.dataField,
    maxLength: detail?.maxLength ?? fallback?.maxLength ?? field.maxLength,
    required: detail?.required ?? fallback?.required ?? field.required,
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
  return {
    ...merged,
    fields: await Promise.all(
      merged.fields.map((field) => loadFieldForExport(workspaceId, merged.id || screenId, field))
    ),
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
