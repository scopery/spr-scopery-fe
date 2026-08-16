/**
 * Presigned file transfer — upload/download via temporary URLs.
 * Never persists the URL; cleans up after success/failure/expiry.
 */

export interface PresignedUploadParams {
  uploadUrl: string
  file: Blob | File
  contentType?: string
  signal?: AbortSignal
  onProgress?: (percent: number) => void
}

export interface PresignedDownloadParams {
  downloadUrl: string
  fileName?: string
  signal?: AbortSignal
}

export class PresignedTransferError extends Error {
  constructor(
    message: string,
    readonly code: 'EXPIRED' | 'NETWORK' | 'ABORTED' | 'HTTP' | 'UNKNOWN',
    readonly status?: number
  ) {
    super(message)
    this.name = 'PresignedTransferError'
  }
}

function isLikelyExpired(status: number, url: string): boolean {
  if (status === 403 || status === 401) return true
  try {
    const u = new URL(url)
    const expires = u.searchParams.get('Expires') ?? u.searchParams.get('X-Amz-Expires')
    if (expires && Number(expires) > 0 && Number(expires) < Date.now() / 1000) return true
  } catch {
    // ignore
  }
  return false
}

/**
 * PUT file to a presigned upload URL with optional progress via XHR.
 */
export function uploadToPresignedUrl(params: PresignedUploadParams): Promise<void> {
  const { uploadUrl, file, contentType, signal, onProgress } = params

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    if (contentType) xhr.setRequestHeader('Content-Type', contentType)

    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable || !onProgress) return
      onProgress(Math.round((ev.loaded / ev.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      const code = isLikelyExpired(xhr.status, uploadUrl) ? 'EXPIRED' : 'HTTP'
      reject(
        new PresignedTransferError(
          `Upload failed: HTTP ${xhr.status}`,
          code,
          xhr.status
        )
      )
    }

    xhr.onerror = () => {
      reject(new PresignedTransferError('Upload network error', 'NETWORK'))
    }

    xhr.onabort = () => {
      reject(new PresignedTransferError('Upload aborted', 'ABORTED'))
    }

    if (signal) {
      if (signal.aborted) {
        reject(new PresignedTransferError('Upload aborted', 'ABORTED'))
        return
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true })
    }

    xhr.send(file)
  })
}

/**
 * GET from a presigned download URL and trigger a browser download.
 */
export async function downloadFromPresignedUrl(
  params: PresignedDownloadParams
): Promise<void> {
  const { downloadUrl, fileName, signal } = params

  let res: Response
  try {
    res = await fetch(downloadUrl, { method: 'GET', signal })
  } catch (err) {
    if (signal?.aborted) {
      throw new PresignedTransferError('Download aborted', 'ABORTED')
    }
    throw new PresignedTransferError('Download network error', 'NETWORK')
  }

  if (!res.ok) {
    const code = isLikelyExpired(res.status, downloadUrl) ? 'EXPIRED' : 'HTTP'
    throw new PresignedTransferError(
      `Download failed: HTTP ${res.status}`,
      code,
      res.status
    )
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = fileName ?? 'download'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export interface PresignedObjectTicket {
  uploadUrl: string
  objectKey: string
  expiresAt?: string
}

/**
 * Shared 3-step object upload: request a signed URL, PUT the file to storage, then confirm.
 * Callers only supply the two BE steps — MinIO PUT stays here.
 */
export async function uploadViaPresignedObject<TResult>(params: {
  file: Blob | File
  contentType?: string
  requestUploadUrl: (contentType: string) => Promise<PresignedObjectTicket>
  confirmUpload: (objectKey: string) => Promise<TResult>
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}): Promise<TResult> {
  const contentType =
    params.contentType ||
    (params.file instanceof File && params.file.type) ||
    'application/octet-stream'
  const ticket = await params.requestUploadUrl(contentType)
  await uploadToPresignedUrl({
    uploadUrl: ticket.uploadUrl,
    file: params.file,
    contentType,
    onProgress: params.onProgress,
    signal: params.signal,
  })
  return params.confirmUpload(ticket.objectKey)
}

export const presignedFileTransfer = {
  upload: uploadToPresignedUrl,
  download: downloadFromPresignedUrl,
  uploadObject: uploadViaPresignedObject,
}
