import { ScreenMediaMessages } from '../messages/screen-media.messages'

export const SCREEN_MEDIA_MAX_BYTES = 5 * 1024 * 1024

export const SCREEN_MEDIA_CONTENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const

export type ScreenMediaContentType = (typeof SCREEN_MEDIA_CONTENT_TYPES)[number]

export function isAllowedScreenMediaType(contentType: string): contentType is ScreenMediaContentType {
  return (SCREEN_MEDIA_CONTENT_TYPES as readonly string[]).includes(contentType)
}

export function validateScreenMediaFile(file: File): string | null {
  if (file.size > SCREEN_MEDIA_MAX_BYTES) return ScreenMediaMessages.FILE_TOO_LARGE
  if (!isAllowedScreenMediaType(file.type)) return ScreenMediaMessages.INVALID_TYPE
  return null
}
