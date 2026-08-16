import { apiClient } from '@/shared/lib/apiClient'
import { uploadViaPresignedObject } from '@/shared/lib/presignedFileTransfer'
import { SCREEN_SPEC_ENDPOINTS as EP } from './endpoints'
import type {
  ComponentScreenshotConfirmResult,
  ConfirmPresignedUploadBody,
  PresignedUploadUrlResponse,
  RequestPresignedUploadUrlBody,
  ScreenMockupConfirmResult,
} from '../../domain/model/screen-media'

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function str(value: unknown): string {
  return value == null ? '' : String(value)
}

export function mapPresignedUploadUrl(raw: unknown): PresignedUploadUrlResponse {
  const r = asRecord(raw)
  return {
    uploadUrl: str(r.uploadUrl ?? r.upload_url),
    objectKey: str(r.objectKey ?? r.object_key),
    expiresAt: str(r.expiresAt ?? r.expires_at) || undefined,
  }
}

export function mapScreenMockupConfirm(raw: unknown): ScreenMockupConfirmResult {
  const r = asRecord(raw)
  return {
    screenId: str(r.screenId ?? r.screen_id),
    mockupObjectKey: str(r.mockupObjectKey ?? r.mockup_object_key),
    mockupUrl: str(r.mockupUrl ?? r.mockup_url),
  }
}

export function mapComponentScreenshotConfirm(raw: unknown): ComponentScreenshotConfirmResult {
  const r = asRecord(raw)
  return {
    appComponentId: str(r.appComponentId ?? r.app_component_id ?? r.componentId ?? r.component_id),
    screenshotObjectKey: str(r.screenshotObjectKey ?? r.screenshot_object_key),
    screenshotUrl: str(r.screenshotUrl ?? r.screenshot_url),
  }
}

export async function requestScreenMockupUploadUrl(
  workspaceId: string,
  screenId: string,
  body: RequestPresignedUploadUrlBody
): Promise<PresignedUploadUrlResponse> {
  const res = await apiClient.post<unknown>(EP.screenMockupUploadUrl(workspaceId, screenId), body)
  return mapPresignedUploadUrl(res)
}

export async function confirmScreenMockupUpload(
  workspaceId: string,
  screenId: string,
  body: ConfirmPresignedUploadBody
): Promise<ScreenMockupConfirmResult> {
  const res = await apiClient.post<unknown>(EP.screenMockupConfirm(workspaceId, screenId), body)
  return mapScreenMockupConfirm(res)
}

export async function requestComponentScreenshotUploadUrl(
  workspaceId: string,
  componentId: string,
  body: RequestPresignedUploadUrlBody
): Promise<PresignedUploadUrlResponse> {
  const res = await apiClient.post<unknown>(
    EP.componentScreenshotUploadUrl(workspaceId, componentId),
    body
  )
  return mapPresignedUploadUrl(res)
}

export async function confirmComponentScreenshotUpload(
  workspaceId: string,
  componentId: string,
  body: ConfirmPresignedUploadBody
): Promise<ComponentScreenshotConfirmResult> {
  const res = await apiClient.post<unknown>(
    EP.componentScreenshotConfirm(workspaceId, componentId),
    body
  )
  return mapComponentScreenshotConfirm(res)
}

export async function uploadScreenMockup(
  workspaceId: string,
  screenId: string,
  file: File,
  opts?: { onProgress?: (percent: number) => void; signal?: AbortSignal }
): Promise<ScreenMockupConfirmResult> {
  return uploadViaPresignedObject({
    file,
    contentType: file.type,
    requestUploadUrl: (contentType) =>
      requestScreenMockupUploadUrl(workspaceId, screenId, { contentType }),
    confirmUpload: (objectKey) => confirmScreenMockupUpload(workspaceId, screenId, { objectKey }),
    onProgress: opts?.onProgress,
    signal: opts?.signal,
  })
}

export async function uploadComponentScreenshot(
  workspaceId: string,
  componentId: string,
  file: File,
  opts?: { onProgress?: (percent: number) => void; signal?: AbortSignal }
): Promise<ComponentScreenshotConfirmResult> {
  return uploadViaPresignedObject({
    file,
    contentType: file.type,
    requestUploadUrl: (contentType) =>
      requestComponentScreenshotUploadUrl(workspaceId, componentId, { contentType }),
    confirmUpload: (objectKey) =>
      confirmComponentScreenshotUpload(workspaceId, componentId, { objectKey }),
    onProgress: opts?.onProgress,
    signal: opts?.signal,
  })
}
