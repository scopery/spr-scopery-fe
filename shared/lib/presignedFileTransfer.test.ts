import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  PresignedTransferError,
  uploadToPresignedUrl,
  uploadViaPresignedObject,
} from '@/shared/lib/presignedFileTransfer'

describe('presignedFileTransfer', () => {
  const originalXHR = global.XMLHttpRequest

  afterEach(() => {
    global.XMLHttpRequest = originalXHR
  })

  it('resolves on 200 upload', async () => {
    class MockXHR {
      status = 200
      upload = { onprogress: null as ((ev: ProgressEvent) => void) | null }
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      onabort: (() => void) | null = null
      open = vi.fn()
      setRequestHeader = vi.fn()
      send = vi.fn(function (this: MockXHR) {
        queueMicrotask(() => this.onload?.())
      })
    }
    // @ts-expect-error mock
    global.XMLHttpRequest = MockXHR

    await expect(
      uploadToPresignedUrl({
        uploadUrl: 'https://storage.example/upload',
        file: new Blob(['hi']),
        contentType: 'text/plain',
      })
    ).resolves.toBeUndefined()
  })

  it('rejects as EXPIRED on 403', async () => {
    class MockXHR {
      status = 403
      upload = { onprogress: null }
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      onabort: (() => void) | null = null
      open = vi.fn()
      setRequestHeader = vi.fn()
      send = vi.fn(function (this: MockXHR) {
        queueMicrotask(() => this.onload?.())
      })
    }
    // @ts-expect-error mock
    global.XMLHttpRequest = MockXHR

    await expect(
      uploadToPresignedUrl({
        uploadUrl: 'https://storage.example/upload',
        file: new Blob(['hi']),
      })
    ).rejects.toMatchObject({ code: 'EXPIRED' } satisfies Partial<PresignedTransferError>)
  })

  it('runs request → PUT → confirm in order', async () => {
    const steps: string[] = []
    class MockXHR {
      status = 200
      upload = { onprogress: null }
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      onabort: (() => void) | null = null
      open = vi.fn()
      setRequestHeader = vi.fn()
      send = vi.fn(function (this: MockXHR) {
        steps.push('put')
        queueMicrotask(() => this.onload?.())
      })
    }
    // @ts-expect-error mock
    global.XMLHttpRequest = MockXHR

    const result = await uploadViaPresignedObject({
      file: new File(['hi'], 'a.png', { type: 'image/png' }),
      requestUploadUrl: async (contentType) => {
        steps.push(`request:${contentType}`)
        return { uploadUrl: 'https://minio.example/put', objectKey: 'screens/a.png' }
      },
      confirmUpload: async (objectKey) => {
        steps.push(`confirm:${objectKey}`)
        return { mockupUrl: 'https://cdn.example/a.png' }
      },
    })

    expect(steps).toEqual(['request:image/png', 'put', 'confirm:screens/a.png'])
    expect(result.mockupUrl).toBe('https://cdn.example/a.png')
  })
})
