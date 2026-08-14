import { apiClient } from '@/shared/lib/apiClient'
import { type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import { SCREEN_SPEC_ENDPOINTS as EP } from './endpoints'
import {
  mapComponentDetail,
  mapComponentOption,
  mapDataEntityField,
  mapEventItem,
  mapProcessItem,
  mapScreenFieldDetail,
  mapScreenMode,
} from './screen-spec.api'
import type {
  AddScreenSpecDocScreenBody,
  ScreenFullSpec,
  ScreenFullSpecField,
  ScreenFullSpecSection,
  ScreenSpecDoc,
  ScreenSpecDocFullSpec,
  ScreenSpecDocFullSpecScreen,
  ScreenSpecDocRevision,
  ScreenSpecDocScreenRef,
  UpsertScreenSpecDocBody,
  UpsertScreenSpecDocRevisionBody,
} from '../../domain/model/screen-spec-doc'
import {
  SCREEN_IMPORT_FULL_MAX_ITEMS,
  type ScreenImportItem,
} from '../../domain/model/screen-spec-import'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function str(value: unknown): string | null {
  if (value == null) return null
  return String(value)
}

function num(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function list(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: unknown[] }).items
  }
  return []
}

export function mapScreenSpecDoc(raw: unknown): ScreenSpecDoc {
  const r = asRecord(raw)
  const screensRaw = r.screens ?? r.screenRefs ?? r.screen_refs
  return {
    id: String(r.id ?? ''),
    documentCode: String(r.documentCode ?? r.document_code ?? ''),
    documentName: String(r.documentName ?? r.document_name ?? ''),
    projectName: str(r.projectName ?? r.project_name),
    systemName: str(r.systemName ?? r.system_name),
    phaseName: str(r.phaseName ?? r.phase_name),
    language: str(r.language),
    overview: str(r.overview),
    figmaUrl: str(r.figmaUrl ?? r.figma_url),
    status: String(r.status ?? 'ACTIVE'),
    screens: Array.isArray(screensRaw) ? screensRaw.map(mapScreenRef) : undefined,
  }
}

function mapScreenRef(raw: unknown): ScreenSpecDocScreenRef {
  const r = asRecord(raw)
  const screen = asRecord(r.screen)
  return {
    screenId: String(r.screenId ?? r.screen_id ?? screen.id ?? ''),
    displayOrder: num(r.displayOrder ?? r.display_order),
    note: str(r.note),
    code: str(r.code ?? screen.code),
    name: str(r.name ?? screen.name),
    routePath: str(r.routePath ?? r.route_path ?? screen.routePath ?? screen.route_path),
  }
}

export function mapScreenSpecDocRevision(raw: unknown): ScreenSpecDocRevision {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    revisionNo: String(r.revisionNo ?? r.revision_no ?? ''),
    targetSheetName: str(r.targetSheetName ?? r.target_sheet_name),
    details: str(r.details),
    personInCharge: str(r.personInCharge ?? r.person_in_charge),
    color: str(r.color),
    changedAt: str(r.changedAt ?? r.changed_at),
    displayOrder: num(r.displayOrder ?? r.display_order),
  }
}

function mapSection(raw: unknown): ScreenFullSpecSection {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    description: str(r.description),
    displayOrder: num(r.displayOrder ?? r.display_order),
    status: str(r.status) ?? undefined,
  }
}

function mapFullSpecField(raw: unknown): ScreenFullSpecField {
  const r = asRecord(raw)
  const base = mapScreenFieldDetail(raw)
  const componentRaw = r.component
  const dataFieldRaw = r.dataField ?? r.data_field
  const dataFieldRec = asRecord(dataFieldRaw)
  const componentRec = asRecord(componentRaw)
  const optionsRaw = componentRec.options
  return {
    ...base,
    component: componentRaw
      ? {
          ...mapComponentDetail(componentRaw),
          options: Array.isArray(optionsRaw) ? optionsRaw.map(mapComponentOption) : null,
        }
      : null,
    dataField: dataFieldRaw
      ? {
          ...mapDataEntityField(dataFieldRaw),
          tableName: str(
            dataFieldRec.tableName ?? dataFieldRec.table_name ?? dataFieldRec.entityName ?? dataFieldRec.entity_name
          ),
          entityName: str(dataFieldRec.entityName ?? dataFieldRec.entity_name),
        }
      : null,
  }
}

export function mapScreenFullSpec(raw: unknown): ScreenFullSpec {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    code: String(r.code ?? ''),
    name: String(r.name ?? ''),
    routePath: str(r.routePath ?? r.route_path),
    status: String(r.status ?? 'ACTIVE'),
    modes: list(r.modes).map(mapScreenMode),
    sections: list(r.sections).map(mapSection),
    fields: list(r.fields).map(mapFullSpecField),
    processItems: list(r.processItems ?? r.process_items).map(mapProcessItem),
    eventItems: list(r.eventItems ?? r.event_items).map(mapEventItem),
  }
}

function mapDocFullSpecScreen(raw: unknown): ScreenSpecDocFullSpecScreen {
  const r = asRecord(raw)
  const screenRaw = r.screen ?? r
  return {
    displayOrder: num(r.displayOrder ?? r.display_order),
    note: str(r.note),
    screen: mapScreenFullSpec(screenRaw),
  }
}

export function mapScreenSpecDocFullSpec(raw: unknown): ScreenSpecDocFullSpec {
  const r = asRecord(raw)
  const doc = mapScreenSpecDoc(raw)
  return {
    ...doc,
    revisions: list(r.revisions).map(mapScreenSpecDocRevision),
    screens: list(r.screens).map(mapDocFullSpecScreen),
  }
}

export async function listScreenSpecDocs(workspaceId: string): Promise<{ items: ScreenSpecDoc[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.screenSpecDocs(workspaceId))
  return { items: normalizeItemList(res).items.map(mapScreenSpecDoc) }
}

export async function getScreenSpecDoc(workspaceId: string, docId: string): Promise<ScreenSpecDoc> {
  const res = await apiClient.get<unknown>(EP.screenSpecDoc(workspaceId, docId))
  return mapScreenSpecDoc(res)
}

export async function createScreenSpecDoc(
  workspaceId: string,
  body: UpsertScreenSpecDocBody
): Promise<ScreenSpecDoc> {
  const res = await apiClient.post<unknown>(EP.screenSpecDocs(workspaceId), body)
  return mapScreenSpecDoc(res)
}

export async function updateScreenSpecDoc(
  workspaceId: string,
  docId: string,
  body: UpsertScreenSpecDocBody
): Promise<ScreenSpecDoc> {
  const res = await apiClient.put<unknown>(EP.screenSpecDoc(workspaceId, docId), body)
  return mapScreenSpecDoc(res)
}

export async function deleteScreenSpecDoc(workspaceId: string, docId: string): Promise<void> {
  await apiClient.delete<void>(EP.screenSpecDoc(workspaceId, docId), { parseJson: false })
}

export async function addScreenToSpecDoc(
  workspaceId: string,
  docId: string,
  body: AddScreenSpecDocScreenBody
): Promise<ScreenSpecDoc> {
  const res = await apiClient.put<unknown>(EP.screenSpecDocScreens(workspaceId, docId), body)
  return mapScreenSpecDoc(res)
}

export async function removeScreenFromSpecDoc(
  workspaceId: string,
  docId: string,
  screenId: string
): Promise<void> {
  await apiClient.delete<void>(EP.screenSpecDocScreen(workspaceId, docId, screenId), { parseJson: false })
}

export async function listSpecDocRevisions(
  workspaceId: string,
  docId: string
): Promise<{ items: ScreenSpecDocRevision[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(EP.screenSpecDocRevisions(workspaceId, docId))
  return { items: normalizeItemList(res).items.map(mapScreenSpecDocRevision) }
}

export async function createSpecDocRevision(
  workspaceId: string,
  docId: string,
  body: UpsertScreenSpecDocRevisionBody
): Promise<ScreenSpecDocRevision> {
  const res = await apiClient.post<unknown>(EP.screenSpecDocRevisions(workspaceId, docId), body)
  return mapScreenSpecDocRevision(res)
}

export async function updateSpecDocRevision(
  workspaceId: string,
  docId: string,
  revisionId: string,
  body: UpsertScreenSpecDocRevisionBody
): Promise<ScreenSpecDocRevision> {
  const res = await apiClient.put<unknown>(EP.screenSpecDocRevision(workspaceId, docId, revisionId), body)
  return mapScreenSpecDocRevision(res)
}

export async function deleteSpecDocRevision(
  workspaceId: string,
  docId: string,
  revisionId: string
): Promise<void> {
  await apiClient.delete<void>(EP.screenSpecDocRevision(workspaceId, docId, revisionId), {
    parseJson: false,
  })
}

export async function getScreenSpecDocFullSpec(
  workspaceId: string,
  docId: string
): Promise<ScreenSpecDocFullSpec> {
  const res = await apiClient.get<unknown>(EP.screenSpecDocFullSpec(workspaceId, docId))
  return mapScreenSpecDocFullSpec(res)
}

export async function getScreenFullSpec(workspaceId: string, screenId: string): Promise<ScreenFullSpec> {
  const res = await apiClient.get<unknown>(EP.screenFullSpec(workspaceId, screenId))
  return mapScreenFullSpec(res)
}

export async function importFullScreens(
  workspaceId: string,
  applicationId: string,
  items: ScreenImportItem[]
): Promise<BulkJobResponse> {
  if (items.length < 1) throw new Error('At least one item is required')
  if (items.length > SCREEN_IMPORT_FULL_MAX_ITEMS) {
    throw new Error(`Maximum ${SCREEN_IMPORT_FULL_MAX_ITEMS} screens per import-full request`)
  }
  return apiClient.post<BulkJobResponse>(
    EP.screensImportFull(workspaceId, applicationId),
    { items },
    { skipGlobalLoading: true }
  )
}
