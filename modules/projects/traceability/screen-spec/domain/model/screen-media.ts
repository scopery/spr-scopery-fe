export interface PresignedUploadUrlResponse {
  uploadUrl: string
  objectKey: string
  expiresAt?: string
}

export interface RequestPresignedUploadUrlBody {
  contentType: string
}

export interface ConfirmPresignedUploadBody {
  objectKey: string
}

export interface ScreenMockupConfirmResult {
  screenId: string
  mockupObjectKey: string
  mockupUrl: string
}

export interface ComponentScreenshotConfirmResult {
  appComponentId: string
  screenshotObjectKey: string
  screenshotUrl: string
}
