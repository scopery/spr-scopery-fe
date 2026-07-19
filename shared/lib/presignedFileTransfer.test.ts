import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  PresignedTransferError,
  uploadToPresignedUrl,
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
})
